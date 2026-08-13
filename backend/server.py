from fastapi import FastAPI, APIRouter, UploadFile, File, Form, Request, Response, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse, JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import json
import base64
import asyncio
import httpx
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Environment variables
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')
TAVILY_API_KEY = os.environ.get('TAVILY_API_KEY')
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY')
VISION_PROVIDER = os.environ.get('VISION_PROVIDER', 'openrouter')
VISION_MODEL = os.environ.get('VISION_MODEL', 'google/gemma-4-31b-it:free')

# Object Storage
STORAGE_URL = "https://integrations.emergentagent.com/objstore/api/v1/storage"
APP_NAME = "hydratique"
storage_key = None

# Local filesystem storage config
UPLOAD_DIR = Path(os.environ.get('UPLOAD_DIR', './uploads'))
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== STORAGE (Local Filesystem) ====================

def init_storage():
    """No-op for local storage - directory already created above"""
    return "local"

def put_object(path: str, data: bytes, content_type: str) -> dict:
    full_path = UPLOAD_DIR / path
    full_path.parent.mkdir(parents=True, exist_ok=True)
    full_path.write_bytes(data)
    return {"path": path}

def get_object(path: str):
    full_path = UPLOAD_DIR / path
    if not full_path.exists():
        raise FileNotFoundError(f"File not found: {path}")
    # Guess content type from extension
    import mimetypes
    content_type, _ = mimetypes.guess_type(str(full_path))
    return full_path.read_bytes(), content_type or "application/octet-stream"

# ==================== AUTH HELPER ====================
async def get_current_user(request: Request):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ", 1)[1]
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session_doc = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user_doc = await db.users.find_one({"user_id": session_doc["user_id"]}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="User not found")
    return user_doc

async def require_admin(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# ==================== PYDANTIC MODELS ====================
class SessionRequest(BaseModel):
    session_id: str

class IdentifyRequest(BaseModel):
    description: Optional[str] = ""

class CheckoutRequest(BaseModel):
    pack_id: str
    origin_url: str

class DeepDiveRequest(BaseModel):
    origin_url: str

class AdminCreditsAdjust(BaseModel):
    user_id: str
    amount: int
    reason: str = "admin_adjustment"

class CSChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, str]] = []

# ==================== APP ====================
app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "HYDRA-TIQUE API", "status": "running"}

@api_router.get("/health")
async def health():
    return {"status": "ok"}

# ==================== AUTH ROUTES ====================
@api_router.post("/auth/session")
async def exchange_session(req: SessionRequest, response: Response):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": req.session_id}
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session ID")
    data = resp.json()
    email = data["email"]
    name = data.get("name", "")
    picture = data.get("picture", "")
    session_token = data["session_token"]
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        user_id = existing_user["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": name, "picture": picture, "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": name,
            "picture": picture,
            "role": "user",
            "credits_balance": 3,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        await db.credit_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user_id,
            "amount": 3,
            "reason": "welcome_bonus",
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    response.set_cookie(
        key="session_token", value=session_token,
        path="/", httponly=True, secure=True, samesite="none",
        max_age=7 * 24 * 3600
    )
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user_doc

@api_router.get("/auth/me")
async def auth_me(request: Request):
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    response.delete_cookie(key="session_token", path="/", secure=True, samesite="none")
    return {"status": "ok"}

# ==================== USER ROUTES ====================
@api_router.get("/users/credits")
async def get_credits(request: Request):
    user = await get_current_user(request)
    return {"credits_balance": user.get("credits_balance", 0)}

@api_router.get("/users/transactions")
async def get_transactions(request: Request):
    user = await get_current_user(request)
    txns = await db.credit_transactions.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    return txns

# ==================== IDENTIFICATION ROUTES ====================
@api_router.post("/identify")
async def create_identification(
    request: Request,
    background_tasks: BackgroundTasks,
    description: str = Form(""),
    images: List[UploadFile] = File(...)
):
    user = await get_current_user(request)
    # First scan is FREE - no credits required
    if len(images) > 6:
        raise HTTPException(status_code=400, detail="Maximum 6 images allowed")
    allowed_types = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    for img in images:
        if img.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {img.content_type}")
        if img.size and img.size > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")
    # Upload files to storage
    image_paths = []
    for img in images:
        data = await img.read()
        ext = img.filename.split(".")[-1] if "." in img.filename else "bin"
        storage_path = f"{APP_NAME}/uploads/{user['user_id']}/{uuid.uuid4()}.{ext}"
        try:
            put_result = put_object(storage_path, data, img.content_type or "application/octet-stream")
            image_paths.append({
                "storage_path": put_result["path"],
                "original_filename": img.filename,
                "content_type": img.content_type,
                "size": len(data)
            })
        except Exception as e:
            logger.error(f"Storage upload failed: {e}")
            image_paths.append({
                "storage_path": storage_path,
                "original_filename": img.filename,
                "content_type": img.content_type,
                "size": len(data),
                "data_base64": base64.b64encode(data).decode()
            })
    job_id = str(uuid.uuid4())
    await db.identification_jobs.insert_one({
        "job_id": job_id,
        "user_id": user["user_id"],
        "status": "pending",
        "tier": "basic",
        "description": description,
        "image_paths": image_paths,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "completed_at": None
    })
    background_tasks.add_task(process_identification_job, job_id)
    return {"job_id": job_id, "status": "pending"}

@api_router.get("/identify/{job_id}/status")
async def get_job_status(job_id: str, request: Request):
    user = await get_current_user(request)
    job = await db.identification_jobs.find_one(
        {"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"job_id": job["job_id"], "status": job["status"]}

@api_router.get("/identify/history")
async def get_identification_history(request: Request):
    user = await get_current_user(request)
    jobs = await db.identification_jobs.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    enriched = []
    for job in jobs:
        result = await db.identification_results.find_one(
            {"job_id": job["job_id"]}, {"_id": 0}
        )
        enriched.append({
            **job,
            "item_name": result.get("item_name") if result else None,
            "category": result.get("category") if result else None,
            "tier": job.get("tier", "basic"),
            "thumbnail": job["image_paths"][0]["storage_path"] if job.get("image_paths") else None
        })
    return enriched

# ==================== REPORTS ROUTES ====================

def make_basic_report(result: dict) -> dict:
    """Strip detailed info for free-tier basic reports. Show vague but accurate assessment."""
    if not result:
        return result
    # Widen the value range significantly for basic tier
    low = result.get("estimated_value_low", 0)
    high = result.get("estimated_value_high", 0)
    # Create a wider, vaguer range: round down low by ~40%, round up high by ~40%
    import math
    vague_low = max(0, int(math.floor(low * 0.6 / 100) * 100)) if low > 100 else max(0, int(low * 0.5))
    vague_high = int(math.ceil(high * 1.4 / 100) * 100) if high > 100 else int(high * 1.5)
    # Build a vague description — general terms only
    vague_desc = result.get("description", "")
    if len(vague_desc) > 150:
        vague_desc = vague_desc[:150].rsplit(' ', 1)[0] + "..."
    return {
        "id": result.get("id"),
        "job_id": result.get("job_id"),
        "tier": "basic",
        "category": result.get("category"),
        "item_name": None,  # Hidden — they don't get the specific name
        "description": vague_desc,
        "period_or_era": result.get("period_or_era"),
        "origin_or_culture": result.get("origin_or_culture"),
        "materials": result.get("materials", [])[:2],  # Show only first 2 materials
        "style_or_movement": None,  # Hidden
        "condition": result.get("condition"),
        "condition_notes": None,  # Hidden
        "authenticity_confidence": None,  # Hidden
        "authenticity_notes": None,  # Hidden
        "estimated_value_low": vague_low,
        "estimated_value_high": vague_high,
        "value_basis": "Based on preliminary assessment of similar items in this category.",
        "notable_features": [],  # Hidden
        "market_pricing": [],  # Hidden — no comparable sales
        "sell_recommendations": [],  # Hidden
        "created_at": result.get("created_at"),
        # Teaser text to entice upgrade
        "basic_summary": generate_basic_summary(result, vague_low, vague_high),
    }

def generate_basic_summary(result: dict, vague_low: int, vague_high: int) -> str:
    """Generate the teaser text shown in free tier."""
    category_names = {"art": "artwork", "antique": "antique piece", "coin": "coin", "jewelry": "jewelry piece", "other": "item"}
    cat = category_names.get(result.get("category", "other"), "item")
    era = result.get("period_or_era", "undetermined era")
    origin = result.get("origin_or_culture", "undetermined origin")
    condition = (result.get("condition") or "undetermined").replace("_", " ")
    materials = result.get("materials", [])
    mat_text = f"appears to be crafted from {materials[0]}" if materials else "material analysis available"
    return (
        f"Our initial assessment identifies this as a {cat} from {era}, "
        f"likely of {origin} origin. The piece is in {condition} condition and {mat_text}. "
        f"Estimated value falls within the ${vague_low:,} — ${vague_high:,} range. "
        f"Unlock the Deep Dive report for precise attribution, exact market valuation with recent comparable sales, "
        f"authenticity analysis, and personalized selling recommendations."
    )

@api_router.get("/reports/{job_id}")
async def get_report(job_id: str, request: Request):
    user = await get_current_user(request)
    job = await db.identification_jobs.find_one(
        {"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result = await db.identification_results.find_one(
        {"job_id": job_id}, {"_id": 0}
    )
    tier = job.get("tier", "basic")
    if tier == "deep_dive":
        # Full report — everything visible
        if result:
            result["tier"] = "deep_dive"
        return {"job": job, "result": result}
    else:
        # Basic tier — vague assessment only
        return {"job": job, "result": make_basic_report(result) if result else result}

# ==================== DEEP DIVE UPGRADE ====================
DEEP_DIVE_PRICE = 11.99

@api_router.post("/reports/{job_id}/upgrade")
async def upgrade_to_deep_dive(job_id: str, req: DeepDiveRequest, request: Request):
    user = await get_current_user(request)
    job = await db.identification_jobs.find_one(
        {"job_id": job_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.get("tier") == "deep_dive":
        raise HTTPException(status_code=400, detail="Already upgraded to Deep Dive")
    if job.get("status") != "completed":
        raise HTTPException(status_code=400, detail="Job not yet completed")
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{req.origin_url}/report/{job_id}?upgraded=true&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/report/{job_id}"
    metadata = {
        "user_id": user["user_id"],
        "job_id": job_id,
        "type": "deep_dive"
    }
    checkout_req = CheckoutSessionRequest(
        amount=float(DEEP_DIVE_PRICE),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "pack_id": "deep_dive",
        "job_id": job_id,
        "amount": DEEP_DIVE_PRICE,
        "credits": 0,
        "currency": "usd",
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/reports/{job_id}/upgrade/status/{session_id}")
async def check_upgrade_status(job_id: str, session_id: str, request: Request):
    await get_current_user(request)  # Verify auth
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if txn and status.payment_status == "paid" and txn["payment_status"] != "paid":
        # Upgrade the job to deep_dive
        await db.identification_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"tier": "deep_dive"}}
        )
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "tier": "deep_dive" if status.payment_status == "paid" else "basic"
    }

@api_router.get("/files/{path:path}")
async def serve_file(path: str, request: Request, auth: Optional[str] = None):
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ", 1)[1]
    if not session_token and auth:
        session_token = auth
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data, content_type = get_object(path)
        return Response(content=data, media_type=content_type)
    except Exception:
        raise HTTPException(status_code=404, detail="File not found")

# ==================== PAYMENTS ROUTES ====================
CREDIT_PACKS = {
    "starter": {"credits": 1, "price": 2.99, "name": "Starter"},
    "explorer": {"credits": 5, "price": 9.99, "name": "Explorer"},
    "collector": {"credits": 20, "price": 29.99, "name": "Collector"},
}

@api_router.get("/payments/packs")
async def get_credit_packs():
    return CREDIT_PACKS

@api_router.post("/payments/create-checkout")
async def create_checkout(req: CheckoutRequest, request: Request):
    user = await get_current_user(request)
    pack = CREDIT_PACKS.get(req.pack_id)
    if not pack:
        raise HTTPException(status_code=400, detail="Invalid pack")
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    success_url = f"{req.origin_url}/dashboard?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{req.origin_url}/buy-credits"
    metadata = {
        "user_id": user["user_id"],
        "pack_id": req.pack_id,
        "credits": str(pack["credits"])
    }
    checkout_req = CheckoutSessionRequest(
        amount=float(pack["price"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata
    )
    session = await stripe_checkout.create_checkout_session(checkout_req)
    await db.payment_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "session_id": session.session_id,
        "user_id": user["user_id"],
        "pack_id": req.pack_id,
        "amount": pack["price"],
        "credits": pack["credits"],
        "currency": "usd",
        "payment_status": "pending",
        "metadata": metadata,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"url": session.url, "session_id": session.session_id}

@api_router.get("/payments/status/{session_id}")
async def check_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    status = await stripe_checkout.get_checkout_status(session_id)
    txn = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
    if txn and status.payment_status == "paid" and txn["payment_status"] != "paid":
        credits = int(txn.get("credits", 0))
        await db.users.update_one(
            {"user_id": user["user_id"]},
            {"$inc": {"credits_balance": credits}}
        )
        await db.credit_transactions.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["user_id"],
            "amount": credits,
            "reason": "purchase",
            "stripe_session_id": session_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"payment_status": "paid"}}
        )
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    body = await request.body()
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    try:
        event = await stripe_checkout.handle_webhook(body, request.headers.get("Stripe-Signature"))
        if event.payment_status == "paid":
            txn = await db.payment_transactions.find_one({"session_id": event.session_id}, {"_id": 0})
            if txn and txn["payment_status"] != "paid":
                if txn.get("pack_id") == "deep_dive":
                    # Deep Dive upgrade
                    await db.identification_jobs.update_one(
                        {"job_id": txn.get("job_id")},
                        {"$set": {"tier": "deep_dive"}}
                    )
                else:
                    # Credit pack purchase
                    credits = int(txn.get("credits", 0))
                    await db.users.update_one(
                        {"user_id": txn["user_id"]},
                        {"$inc": {"credits_balance": credits}}
                    )
                    await db.credit_transactions.insert_one({
                        "id": str(uuid.uuid4()),
                        "user_id": txn["user_id"],
                        "amount": credits,
                        "reason": "purchase",
                        "stripe_session_id": event.session_id,
                        "created_at": datetime.now(timezone.utc).isoformat()
                    })
                await db.payment_transactions.update_one(
                    {"session_id": event.session_id},
                    {"$set": {"payment_status": "paid"}}
                )
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return JSONResponse(status_code=400, content={"error": str(e)})

# ==================== ADMIN ROUTES ====================
@api_router.get("/admin/stats")
async def admin_stats(request: Request):
    await require_admin(request)
    total_users = await db.users.count_documents({})
    total_jobs = await db.identification_jobs.count_documents({})
    completed_jobs = await db.identification_jobs.count_documents({"status": "completed"})
    total_revenue = 0
    paid_txns = await db.payment_transactions.find({"payment_status": "paid"}, {"_id": 0}).to_list(1000)
    for t in paid_txns:
        total_revenue += t.get("amount", 0)
    return {
        "total_users": total_users,
        "total_jobs": total_jobs,
        "completed_jobs": completed_jobs,
        "total_revenue": total_revenue,
        "paid_transactions": len(paid_txns)
    }

@api_router.get("/admin/users")
async def admin_users(request: Request):
    await require_admin(request)
    users = await db.users.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return users

@api_router.post("/admin/users/credits")
async def admin_adjust_credits(req: AdminCreditsAdjust, request: Request):
    await require_admin(request)
    await db.users.update_one(
        {"user_id": req.user_id},
        {"$inc": {"credits_balance": req.amount}}
    )
    await db.credit_transactions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": req.user_id,
        "amount": req.amount,
        "reason": req.reason,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"status": "ok"}

@api_router.get("/admin/jobs")
async def admin_jobs(request: Request):
    await require_admin(request)
    jobs = await db.identification_jobs.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    enriched = []
    for job in jobs:
        result = await db.identification_results.find_one({"job_id": job["job_id"]}, {"_id": 0})
        user = await db.users.find_one({"user_id": job["user_id"]}, {"_id": 0})
        enriched.append({
            **job,
            "item_name": result.get("item_name") if result else None,
            "user_email": user.get("email") if user else None
        })
    return enriched

@api_router.get("/admin/reports/{job_id}")
async def admin_report(job_id: str, request: Request):
    await require_admin(request)
    job = await db.identification_jobs.find_one({"job_id": job_id}, {"_id": 0})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    result = await db.identification_results.find_one({"job_id": job_id}, {"_id": 0})
    return {"job": job, "result": result}

# ==================== CS AGENT ROUTES ====================
@api_router.post("/cs-agent/chat")
async def cs_agent_chat(req: CSChatRequest, request: Request):
    user = await get_current_user(request)
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    system_msg = """You are HYDRA-TIQUE's expert customer service assistant. You help users:
- Understand how to use the platform and get the best identification results
- Learn about art, antiques, and coin collecting
- Find the best ways to sell or authenticate their items
- Troubleshoot any issues with their account or identifications
Always be warm, professional, and knowledgeable. If you don't know something, say so honestly."""
    chat = LlmChat(
        api_key=OPENROUTER_API_KEY,
        session_id=f"cs_{user['user_id']}_{uuid.uuid4().hex[:8]}",
        system_message=system_msg
    )
    chat.with_model("openrouter", VISION_MODEL)
    # Build context from conversation history
    for msg in req.conversation_history[-10:]:
        if msg.get("role") == "user":
            await chat.send_message(UserMessage(text=msg["content"]))
    response = await chat.send_message(UserMessage(text=req.message))
    return {"response": response}

# ==================== BACKGROUND TASK: IDENTIFICATION ====================
async def process_identification_job(job_id: str):
    try:
        await db.identification_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "processing"}}
        )
        job = await db.identification_jobs.find_one({"job_id": job_id}, {"_id": 0})
        if not job:
            return
        # Prepare images for vision
        from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
        image_contents = []
        for img_info in job.get("image_paths", []):
            if "data_base64" in img_info:
                image_contents.append(ImageContent(image_base64=img_info["data_base64"]))
            else:
                try:
                    data, _ = get_object(img_info["storage_path"])
                    b64 = base64.b64encode(data).decode()
                    image_contents.append(ImageContent(image_base64=b64))
                except Exception as e:
                    logger.error(f"Failed to load image {img_info['storage_path']}: {e}")
        if not image_contents:
            raise Exception("No images could be loaded")
        # Vision prompt
        vision_prompt = """You are an expert appraiser of fine art, antiques, coins, and collectibles with 30 years of experience.
Analyze the provided images carefully.
Respond ONLY with a valid JSON object matching this exact schema:
{
  "category": "art|antique|coin|jewelry|other",
  "item_name": "string",
  "description": "string - detailed physical description",
  "period_or_era": "string",
  "origin_or_culture": "string",
  "materials": ["string"],
  "style_or_movement": "string",
  "condition": "poor|fair|good|very_good|excellent|mint",
  "condition_notes": "string",
  "authenticity_confidence": 0.0-1.0,
  "authenticity_notes": "string",
  "estimated_value_range_usd": {"low": number, "high": number},
  "value_basis": "string",
  "notable_features": ["string"],
  "search_query": "string - optimized query for live pricing search"
}
Be conservative in authenticity confidence. If you cannot identify something with certainty, say so."""
        if job.get("description"):
            vision_prompt += f"\n\nAdditional context from user: {job['description']}"
        chat = LlmChat(
            api_key=OPENROUTER_API_KEY,
            session_id=f"identify_{job_id}",
            system_message="You are an expert artifact appraiser. Always respond with valid JSON only."
        )
        chat.with_model("openrouter", VISION_MODEL)
        user_msg = UserMessage(text=vision_prompt, file_contents=image_contents)
        raw_response = await chat.send_message(user_msg)
        # Parse JSON from response
        llm_result = parse_json_response(raw_response)
        # Pricing enrichment via Tavily
        market_pricing = []
        if TAVILY_API_KEY and llm_result.get("search_query"):
            try:
                market_pricing = await search_pricing(llm_result["search_query"])
            except Exception as e:
                logger.error(f"Pricing search failed: {e}")
        # Sell recommendations
        sell_recs = []
        try:
            sell_recs = await generate_sell_recommendations(llm_result)
        except Exception as e:
            logger.error(f"Sell recommendations failed: {e}")
        # Save result
        await db.identification_results.insert_one({
            "id": str(uuid.uuid4()),
            "job_id": job_id,
            "raw_llm_response": llm_result,
            "category": llm_result.get("category", "other"),
            "item_name": llm_result.get("item_name", "Unknown Item"),
            "description": llm_result.get("description", ""),
            "period_or_era": llm_result.get("period_or_era", ""),
            "origin_or_culture": llm_result.get("origin_or_culture", ""),
            "materials": llm_result.get("materials", []),
            "style_or_movement": llm_result.get("style_or_movement", ""),
            "condition": llm_result.get("condition", ""),
            "condition_notes": llm_result.get("condition_notes", ""),
            "authenticity_confidence": llm_result.get("authenticity_confidence", 0),
            "authenticity_notes": llm_result.get("authenticity_notes", ""),
            "estimated_value_low": llm_result.get("estimated_value_range_usd", {}).get("low", 0),
            "estimated_value_high": llm_result.get("estimated_value_range_usd", {}).get("high", 0),
            "value_basis": llm_result.get("value_basis", ""),
            "notable_features": llm_result.get("notable_features", []),
            "market_pricing": market_pricing,
            "sell_recommendations": sell_recs,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        await db.identification_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}}
        )
        logger.info(f"Job {job_id} completed successfully")
    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}")
        await db.identification_jobs.update_one(
            {"job_id": job_id},
            {"$set": {"status": "failed", "error": str(e)}}
        )
        # No credit refund needed — basic scan is free

def parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return {"item_name": "Unknown", "description": text, "category": "other"}

async def search_pricing(query: str) -> list:
    async with httpx.AsyncClient() as http_client:
        resp = await http_client.post(
            "https://api.tavily.com/search",
            json={
                "api_key": TAVILY_API_KEY,
                "query": query + " auction result price sold",
                "search_depth": "advanced",
                "include_domains": ["ebay.com", "christies.com", "sothebys.com", "ha.com", "liveauctioneers.com"],
                "max_results": 8
            },
            timeout=30
        )
    if resp.status_code == 200:
        data = resp.json()
        results = []
        for r in data.get("results", []):
            results.append({
                "title": r.get("title", ""),
                "url": r.get("url", ""),
                "content": r.get("content", "")[:200],
                "source": r.get("url", "").split("/")[2] if "/" in r.get("url", "") else ""
            })
        return results
    return []

async def generate_sell_recommendations(llm_result: dict) -> list:
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    item_summary = f"{llm_result.get('item_name', 'Unknown')} - {llm_result.get('description', '')[:200]}"
    low = llm_result.get("estimated_value_range_usd", {}).get("low", 0)
    high = llm_result.get("estimated_value_range_usd", {}).get("high", 0)
    condition = llm_result.get("condition", "unknown")
    category = llm_result.get("category", "other")
    prompt = f"""Given this item: {item_summary}
Estimated value: ${low}-${high}
Condition: {condition}
Category: {category}

Recommend the 4-6 best platforms to sell this item. For each, provide:
{{
  "platform": "string",
  "reason": "string",
  "seller_fees": "string",
  "avg_time_to_sell": "string",
  "url": "string",
  "suitability_score": 0-10
}}

Respond ONLY with a JSON array."""
    chat = LlmChat(
        api_key=OPENROUTER_API_KEY,
        session_id=f"sell_{uuid.uuid4().hex[:8]}",
        system_message="You are a marketplace expert. Respond only with valid JSON arrays."
    )
    chat.with_model("openrouter", VISION_MODEL)
    response = await chat.send_message(UserMessage(text=prompt))
    text = response.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [line for line in lines if not line.strip().startswith("```")]
        text = "\n".join(lines)
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        import re
        match = re.search(r'\[.*\]', text, re.DOTALL)
        if match:
            return json.loads(match.group())
        return []

# ==================== INCLUDE ROUTER & MIDDLEWARE ====================
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    try:
        init_storage()
        logger.info("Object storage initialized")
    except Exception as e:
        logger.error(f"Storage init failed: {e}")
    # Create indexes
    await db.users.create_index("user_id", unique=True)
    await db.users.create_index("email", unique=True)
    await db.user_sessions.create_index("session_token")
    await db.identification_jobs.create_index("job_id", unique=True)
    await db.identification_jobs.create_index("user_id")
    logger.info("HYDRA-TIQUE backend started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

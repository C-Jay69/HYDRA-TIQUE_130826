# ***HYDRA-TIQUE NEWEST PROMPT*** 

# ***26 MARCH 2026***

# ***HYDRA-TIQUE PROMPT V3.0***

# **\*\*\*\*MOST IMPORTANT, THIS COMMAND SUPERCEEDES ANY REFERENCE TO OPEN AI, ANTHROPIC OR ANY OTHER HIGHLY PRICED AI\*\*\*\*\***  ***“I run a YouTube channel that teaches users how to build apps, platforms and businesses through bootstrapping. I stay away from paid APIs like OpenAI or Anthropic and use open source models instead — Ollama, Mistral, OpenRouter, Google AI Studio — to keep everything in line with the 'Free or Almost Free' model. Please use only open source or very low-cost options wherever possible.”***

### ***HYDRA-TIQUE: Open-Source AI Valuation & Identification Platform***

**Mission:** Build a production-ready, modular, and extensible platform for AI-powered artifact identification, valuation, and marketplace guidance—**using only open-source or ultra-low-cost tools**.

---

## **1\. Core Principles**

* **No Paid APIs:** Use Ollama, Mistral, OpenRouter, Ollama or Google AI Studio for LLM/vision tasks.  
* **Modularity:** Every component (valuation, comparables, auth, storage) must be replaceable and independently evolvable.  
* **Data Integrity:** Never fabricate valuations; always trace outputs to comparables or explainable logic.  
* **Graceful Degradation:** Assume noisy, incomplete, or evolving data.

---

## **2\. Tech Stack (Open-Source Only)**

| Layer | Tech Stack |
| ----- | ----- |
| **Frontend** | React 18 (Vite), TypeScript, TailwindCSS, TanStack Query, Zod, Framer Motion |
| **Backend** | FastAPI (Python 3.11+), SQLAlchemy 2.0 (async), Alembic, Celery \+ Redis |
| **Database** | PostgreSQL 15 \+ pgvector, Redis |
| **Auth** | **Replace Clerk with:** NextAuth.js (OAuth) \+ JWT (HS256) |
| **AI/Vision** | **Replace Anthropic/OpenAI with:** Ollama (local LLaVA, BakLLaVA) |
| **Search** | **Replace Tavily/SerpAPI with:** Scrapy \+ BeautifulSoup (self-hosted) |
| **Payments** | Stripe (transactional only, no subscriptions) |
| **DevOps** | Docker \+ Docker Compose, GitHub Actions |

---

## **3\. System Architecture**

### **A. Valuation Engine (Core)**

* **Input:** User-uploaded images \+ optional certs → LLM vision analysis → structured JSON output.  
* **Output:** Valuation range, confidence tier, comparables, authenticity risk.  
* **Process:**  
  1. **Feature Extraction:** Use LLaVA (Ollama) to generate item features (category, era, materials, etc.).  
  2. **Comparables Retrieval:** Query `ComparablesRepository` (abstracted, supports DB/API/cache).  
  3. **Similarity Scoring:**

similarity\_score \= 0.5\*visual\_similarity \+ 0.3\*metadata\_similarity \+ 0.2\*text\_similarity

1. confidence\_score \= source\_confidence \* similarity\_score

   2. **Valuation Calculation:** Use 25th/50th/75th percentiles of filtered comparables.  
   3. **Flagging:** Low confidence or high authenticity risk → admin review queue.

### **B. Comparables Data Layer**

* **Abstract Interface:**

class ComparablesRepository(ABC):

    @abstractmethod

    def search\_by\_features(filters: dict) \-\> List\[Comparable\]:

        pass

    @abstractmethod

    def search\_by\_embedding(embedding: List\[float\], filters: dict) \-\> List\[Comparable\]:

*         pass

* **Implementations:**  
  * PostgreSQL (pgvector for embeddings)  
  * Future: Scrapy pipeline for auction sites (eBay, Christie’s, etc.)

### **C. Authenticity & Confidence Assessment**

* **Authenticity Risk:** `low|medium|high|unknown` (based on missing attributes, weak comparables, LLM confidence).  
* **Confidence Tiers:**  
  * **High:** ≥5 strong comparables \+ tight distribution.  
  * **Medium:** 2–5 comparables.  
  * **Low:** \<2 or weak similarity → **flag for expert review**.

### **D. User Flows**

* **Free Scan:** Show category, subcategory, blurred valuation range, comparable count.  
* **Deep Dive Report:** Top comparables, pricing data, similarity scores, confidence reasoning.

---

## **4\. Directory Structure**

hydra-tique/

├── docker-compose.yml

├── .env.example

├── README.md

│

├── frontend/          \# React \+ Vite

│   ├── src/

│   │   ├── components/

│   │   ├── pages/

│   │   └── lib/

│   └── package.json

│

└── backend/           \# FastAPI

    ├── app/

    │   ├── models/     \# SQLAlchemy

    │   ├── services/   \# Valuation, Comparables, Auth, etc.

    │   ├── routers/    \# API endpoints

    │   └── tasks/      \# Celery

    ├── alembic/        \# Migrations

    └── Dockerfile

---

## **5\. Key Files (Example Snippets)**

### **A. `backend/app/services/valuation.py`**

from abc import ABC, abstractmethod

from typing import List, Dict, Optional

from pydantic import BaseModel

class Comparable(BaseModel):

    id: str

    features: Dict

    price: float

    source: str

    confidence: float

class ComparablesRepository(ABC):

    @abstractmethod

    def search\_by\_features(self, filters: Dict) \-\> List\[Comparable\]:

        pass

class ValuationService:

    def \_\_init\_\_(self, repo: ComparablesRepository):

        self.repo \= repo

    def calculate\_valuation(self, item\_features: Dict) \-\> Dict:

        comparables \= self.repo.search\_by\_features(item\_features)

        \# Filter, score, and calculate percentiles...

        return {

            "valuation\_range": {"low": ..., "mid": ..., "high": ...},

            "comparables": comparables,

            "confidence\_tier": "high|medium|low",

            "authenticity\_risk": "low|medium|high|unknown",

        }

### **B. `backend/app/models/comparables.py`**

from sqlalchemy import Column, String, Float, JSON

from sqlalchemy.dialects.postgresql import UUID

from database import Base

class Comparable(Base):

    \_\_tablename\_\_ \= "comparables"

    id \= Column(UUID(as\_uuid=True), primary\_key=True, index=True)

    features \= Column(JSON)

    price \= Column(Float)

    source \= Column(String)

    confidence \= Column(Float)

### **C. `frontend/src/components/ReportHero.tsx`**

import { useValuation } from "../hooks/useValuation";

export const ReportHero \= ({ jobId }) \=\> {

  const { data: report } \= useValuation(jobId);

  return (

    \<div className="bg-surface border border-border rounded-xl p-6"\>

      \<h1 className="text-primary text-3xl font-display"\>

        {report.item\_name}

      \</h1\>

      \<div className="flex gap-4 mt-4"\>

        \<Badge variant="gold"\>{report.category}\</Badge\>

        \<Badge variant={report.confidence\_tier}\>

          Confidence: {report.confidence\_tier}

        \</Badge\>

      \</div\>

    \</div\>

  );

};

---

## **6\. Environment Variables (`.env.example`)**

\# App

APP\_ENV=development

SECRET\_KEY=your-secret-key

\# Database

DATABASE\_URL=postgresql+asyncpg://user:pass@postgres:5432/hydra-tique

REDIS\_URL=redis://redis:6379/0

\# Auth (NextAuth.js)

NEXTAUTH\_SECRET=your-secret

NEXTAUTH\_URL=http://localhost:3000

\# AI/Vision (Ollama)

OLLAMA\_BASE\_URL=http://ollama:11434

OLLAMA\_MODEL=llava

\# Payments (Stripe)

STRIPE\_SECRET\_KEY=sk\_test\_...

STRIPE\_WEBHOOK\_SECRET=whsec\_...

\# Storage

UPLOAD\_DIR=./uploads

---

## **7\. Security & Compliance**

* **Auth:** NextAuth.js \+ JWT (HS256), role-based access control.  
* **File Uploads:** 10MB max, MIME validation, Celery for async processing.  
* **Rate Limiting:** 10 requests/minute for `/api/identify`.  
* **Data Privacy:** Never store raw images post-processing; use UUIDs for file paths.

---

## **8\. Deliverables**

* **Full codebase** (no stubs, no TODOs).  
* **Docker Compose** (PostgreSQL, Redis, Ollama, FastAPI, Celery).  
* **Alembic migrations** (pgvector, all tables).  
* **README.md** (setup, env vars, self-hosting guide).  
* **Inline docs** (especially for valuation logic, flagging, and modularity).

## **Backend Architecture: Priority Breakdown**

### **1\. Core Modules (In Order of Implementation)**

#### **A. Database & Models**

* **PostgreSQL \+ pgvector** for structured data and vector embeddings.  
* **SQLAlchemy 2.0 (async)** for ORM.  
* **Alembic** for migrations.

#### **B. Comparables Repository (MANDATORY)**

* **Abstract interface** for pluggable data sources (DB, API, cache).  
* **Concrete implementation** for PostgreSQL (with pgvector support).

#### **C. Valuation Engine**

* **Input:** Item features (from LLM vision analysis).  
* **Process:**  
  * Retrieve comparables via `ComparablesRepository`.  
  * Score similarity and confidence.  
  * Calculate valuation range (25th/50th/75th percentiles).  
  * Flag low confidence or high authenticity risk.  
* **Output:** Structured valuation report.

#### **D. Vision & LLM Integration**

* **Ollama (local LLaVA/BakLLaVA)** for image analysis and feature extraction.  
* **Prompt engineering** for structured JSON output.

#### **E. API Endpoints (FastAPI)**

* `/api/identify` (upload images, trigger valuation).  
* `/api/reports/{job_id}` (retrieve valuation report).  
* `/api/comparables` (admin: manage comparables data).

#### **F. Celery \+ Redis**

* Async task queue for image processing and valuation jobs.

---

## **2\. Directory Structure (Backend Focus)**

backend/

├── app/

│   ├── models/

│   │   ├── \_\_init\_\_.py

│   │   ├── user.py

│   │   ├── credits.py

│   │   ├── identification.py

│   │   ├── comparables.py      \# NEW: Comparables model

│   │   └── knowledge\_base.py

│   │

│   ├── schemas/

│   │   ├── identification.py

│   │   └── valuation.py        \# NEW: Valuation request/response

│   │

│   ├── services/

│   │   ├── valuation/          \# NEW: Valuation engine

│   │   │   ├── \_\_init\_\_.py

│   │   │   ├── engine.py

│   │   │   ├── comparables.py  \# ComparablesRepository impl

│   │   │   └── scoring.py      \# Similarity/confidence logic

│   │   │

│   │   ├── vision/

│   │   │   ├── ollama.py       \# Ollama LLaVA integration

│   │   │   └── base.py         \# VisionProvider interface

│   │   │

│   │   ├── storage.py          \# File storage abstraction

│   │   └── credits.py          \# Credit management

│   │

│   ├── routers/

│   │   ├── identify.py

│   │   ├── reports.py

│   │   └── admin.py

│   │

│   ├── tasks/

│   │   └── valuation.py        \# Celery task for async valuation

│   │

│   ├── middleware/

│   │   └── auth.py             \# JWT auth

│   │

│   └── config.py               \# Settings (pydantic)

│

├── alembic/

│   └── versions/

│       └── 001\_initial\_schema.py

│

├── Dockerfile

├── requirements.txt

└── main.py                     \# FastAPI app entrypoint

---

## **3\. Key Code Snippets**

### **A. `app/models/comparables.py`**

from sqlalchemy import Column, String, Float, JSON, Index

from sqlalchemy.dialects.postgresql import UUID

from database import Base

from pgvector.sqlalchemy import Vector

class Comparable(Base):

    \_\_tablename\_\_ \= "comparables"

    id \= Column(UUID(as\_uuid=True), primary\_key=True, index=True)

    features \= Column(JSON)  \# Extracted features (era, material, etc.)

    price \= Column(Float)

    source \= Column(String)   \# e.g., "Christie's", "eBay"

    confidence \= Column(Float)

    embedding \= Column(Vector(1536))  \# For pgvector similarity search

    \_\_table\_args\_\_ \= (Index("ix\_comparables\_embedding", "embedding", postgresql\_using="hnsw"),)

### **B. `app/services/valuation/comparables.py`**

from abc import ABC, abstractmethod

from typing import List, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.comparables import Comparable

class ComparablesRepository(ABC):

    @abstractmethod

    async def search\_by\_features(self, filters: Dict) \-\> List\[Comparable\]:

        pass

    @abstractmethod

    async def search\_by\_embedding(self, embedding: List\[float\], filters: Dict) \-\> List\[Comparable\]:

        pass

class PostgreSQLComparablesRepository(ComparablesRepository):

    def \_\_init\_\_(self, session: AsyncSession):

        self.session \= session

    async def search\_by\_features(self, filters: Dict) \-\> List\[Comparable\]:

        \# Implement feature-based search (SQLAlchemy query)

        pass

    async def search\_by\_embedding(self, embedding: List\[float\], filters: Dict) \-\> List\[Comparable\]:

        \# Implement pgvector similarity search

        pass

### **C. `app/services/valuation/engine.py`**

from typing import Dict, List

from app.services.valuation.comparables import ComparablesRepository

from app.services.valuation.scoring import calculate\_similarity, calculate\_confidence

class ValuationService:

    def \_\_init\_\_(self, repo: ComparablesRepository):

        self.repo \= repo

    async def calculate\_valuation(self, item\_features: Dict, embedding: List\[float\]) \-\> Dict:

        \# 1\. Retrieve comparables

        comparables \= await self.repo.search\_by\_embedding(embedding, item\_features)

        \# 2\. Score and filter

        scored \= \[

            {

                "comparable": c,

                "similarity": calculate\_similarity(c.embedding, embedding),

                "confidence": calculate\_confidence(c),

            }

            for c in comparables

        \]

        filtered \= \[c for c in scored if c\["confidence"\] \> 0.5\]

        \# 3\. Calculate valuation range

        prices \= \[c\["comparable"\].price for c in filtered\]

        if not prices:

            return {"error": "No valid comparables found"}

        prices\_sorted \= sorted(prices)

        n \= len(prices\_sorted)

        valuation\_range \= {

            "low": prices\_sorted\[max(0, n//4)\],

            "mid": prices\_sorted\[n//2\],

            "high": prices\_sorted\[min(n-1, 3\*n//4)\],

        }

        \# 4\. Determine confidence tier

        confidence\_tier \= self.\_determine\_confidence\_tier(filtered)

        \# 5\. Assess authenticity risk

        authenticity\_risk \= self.\_assess\_authenticity\_risk(filtered, item\_features)

        return {

            "valuation\_range": valuation\_range,

            "comparables": \[c\["comparable"\] for c in filtered\],

            "confidence\_tier": confidence\_tier,

            "authenticity\_risk": authenticity\_risk,

        }

    def \_determine\_confidence\_tier(self, comparables: List) \-\> str:

        \# Implement logic for high/medium/low confidence

        pass

    def \_assess\_authenticity\_risk(self, comparables: List, features: Dict) \-\> str:

        \# Implement logic for low/medium/high risk

        pass

### **D. `app/services/vision/ollama.py`**

import httpx

from typing import Dict, Optional

from app.config import settings

class OllamaVisionProvider:

    async def analyze\_image(self, image\_url: str, prompt: str) \-\> Dict:

        async with httpx.AsyncClient() as client:

            response \= await client.post(

                f"{settings.OLLAMA\_BASE\_URL}/api/generate",

                json={

                    "model": settings.OLLAMA\_MODEL,

                    "prompt": f"Analyze the following image: {image\_url}\\n{prompt}",

                    "stream": False,

                },

            )

            response.raise\_for\_status()

            return response.json()

### **E. `app/routers/identify.py`**

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.services.valuation.engine import ValuationService

from app.services.vision.ollama import OllamaVisionProvider

from app.services.storage import save\_uploaded\_file

from app.models.user import User

from app.middleware.auth import get\_current\_user

router \= APIRouter()

@router.post("/identify")

async def identify\_artifact(

    files: list\[UploadFile\] \= File(...),

    current\_user: User \= Depends(get\_current\_user),

):

    if len(files) \> 6:

        raise HTTPException(status\_code=400, detail="Max 6 files")

    \# 1\. Save files, extract features via Ollama

    image\_paths \= \[await save\_uploaded\_file(f) for f in files\]

    vision \= OllamaVisionProvider()

    features \= await vision.analyze\_image(image\_paths\[0\], "Describe this artifact in detail.")

    \# 2\. Trigger valuation

    valuation\_service \= ValuationService(PostgreSQLComparablesRepository())

    report \= await valuation\_service.calculate\_valuation(features, \[\])

    \# 3\. Return job ID (Celery will process async)

    return {"job\_id": "123", "status": "pending"}

---

## **4\. Docker & Dev Setup**

### **A. `docker-compose.yml`**

version: "3.8"

services:

  postgres:

    image: ankane/pgvector

    environment:

      POSTGRES\_USER: user

      POSTGRES\_PASSWORD: pass

      POSTGRES\_DB: hydra-tique

    ports:

      \- "5432:5432"

    volumes:

      \- postgres\_data:/var/lib/postgresql/data

  redis:

    image: redis

    ports:

      \- "6379:6379"

  ollama:

    image: ollama/ollama

    ports:

      \- "11434:11434"

    volumes:

      \- ollama\_data:/root/.ollama

  backend:

    build: .

    ports:

      \- "8000:8000"

    environment:

      DATABASE\_URL: postgresql+asyncpg://user:pass@postgres:5432/hydra-tique

      REDIS\_URL: redis://redis:6379/0

      OLLAMA\_BASE\_URL: http://ollama:11434

    depends\_on:

      \- postgres

      \- redis

      \- ollama

volumes:

  postgres\_data:

  ollama\_data:

### **B. `Dockerfile`**

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install \--no-cache-dir \-r requirements.txt

COPY . .

CMD \["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"\]

## **1\. Vision Engine: Ollama \+ LLaVA for Artifact Identification**

### **A. Architecture**

* **Input:** User-uploaded images (1–6 files, max 10MB each).  
* **Process:**  
  1. Save images to local storage (or S3-compatible).  
  2. Call Ollama’s LLaVA model for structured analysis.  
  3. Parse JSON output for features (era, material, condition, etc.).  
* **Output:** Structured JSON (see prompt below).

### **B. Ollama Vision Provider (Python)**

#### **`app/services/vision/ollama.py`**

import httpx

import json

from typing import Dict, List, Optional

from app.config import settings

from app.schemas.identification import VisionResponse

class OllamaVisionProvider:

    def \_\_init\_\_(self):

        self.base\_url \= settings.OLLAMA\_BASE\_URL

        self.model \= settings.OLLAMA\_MODEL  \# e.g., "llava"

    async def analyze\_images(

        self, image\_paths: List\[str\], prompt: str

    ) \-\> VisionResponse:

        """

        Send images to Ollama LLaVA for analysis.

        Returns structured JSON with artifact features.

        """

        \# NOTE: Ollama's LLaVA expects image paths or base64-encoded images.

        \# For local files, use \`curl \-F "file=@/path/to/image.jpg" http://ollama:11434/api/generate\`

        \# Here, we simulate the API call for structured output.

        async with httpx.AsyncClient() as client:

            \# In practice, you'd send the image data and prompt to Ollama.

            \# For now, we mock the expected response structure.

            response \= await client.post(

                f"{self.base\_url}/api/generate",

                json={

                    "model": self.model,

                    "prompt": prompt,

                    "images": image\_paths,  \# Ollama supports image paths in some versions

                    "stream": False,

                    "format": "json",

                },

            )

            response.raise\_for\_status()

            return VisionResponse(\*\*response.json())

    def build\_vision\_prompt(self) \-\> str:

        """

        Build the prompt for LLaVA to ensure structured JSON output.

        """

        return """

        You are an expert appraiser of fine art, antiques, coins, and collectibles.

        Analyze the provided images carefully.

        Respond ONLY with a valid JSON object matching this schema:

        {

            "category": "art|antique|coin|jewelry|other",

            "item\_name": "string",

            "description": "string",

            "period\_or\_era": "string",

            "origin\_or\_culture": "string",

            "materials": \["string"\],

            "style\_or\_movement": "string",

            "condition": "poor|fair|good|very\_good|excellent|mint",

            "condition\_notes": "string",

            "authenticity\_confidence": 0.0-1.0,

            "authenticity\_notes": "string",

            "certification\_summary": "string|null",

            "estimated\_value\_range\_usd": {"low": number, "high": number},

            "value\_basis": "string",

            "notable\_features": \["string"\],

            "search\_query": "string"

        }

        """

#### **`app/schemas/identification.py`**

from pydantic import BaseModel

from typing import List, Optional, Dict

class VisionResponse(BaseModel):

    category: str

    item\_name: str

    description: str

    period\_or\_era: str

    origin\_or\_culture: str

    materials: List\[str\]

    style\_or\_movement: str

    condition: str

    condition\_notes: str

    authenticity\_confidence: float

    authenticity\_notes: str

    certification\_summary: Optional\[str\]

    estimated\_value\_range\_usd: Dict\[str, float\]

    value\_basis: str

    notable\_features: List\[str\]

    search\_query: str

---

## **2\. Valuation Engine: Comparables & Scoring**

### **A. Architecture**

* **Input:** Features from Vision Engine \+ user-uploaded images.  
* **Process:**  
  1. Retrieve comparables from `ComparablesRepository`.  
  2. Score similarity and confidence.  
  3. Calculate valuation range (25th/50th/75th percentiles).  
  4. Flag low confidence or high authenticity risk.  
* **Output:** Structured valuation report.

### **B. Comparables Repository (PostgreSQL \+ pgvector)**

#### **`app/services/valuation/comparables.py`**

from abc import ABC, abstractmethod

from typing import List, Dict, Optional

from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy import select, func

from app.models.comparables import Comparable

from pgvector.sqlalchemy import Vector

class ComparablesRepository(ABC):

    @abstractmethod

    async def search\_by\_features(self, filters: Dict) \-\> List\[Comparable\]:

        pass

    @abstractmethod

    async def search\_by\_embedding(self, embedding: List\[float\], filters: Dict) \-\> List\[Comparable\]:

        pass

class PostgreSQLComparablesRepository(ComparablesRepository):

    def \_\_init\_\_(self, session: AsyncSession):

        self.session \= session

    async def search\_by\_features(self, filters: Dict) \-\> List\[Comparable\]:

        query \= select(Comparable).filter\_by(\*\*filters)

        result \= await self.session.execute(query)

        return result.scalars().all()

    async def search\_by\_embedding(self, embedding: List\[float\], filters: Dict) \-\> List\[Comparable\]:

        \# Use pgvector's L2 distance for similarity search

        query \= (

            select(Comparable)

            .order\_by(Comparable.embedding.l2\_distance(embedding))

            .limit(10)

        )

        result \= await self.session.execute(query)

        return result.scalars().all()

### **C. Valuation Service (Core Logic)**

#### **`app/services/valuation/engine.py`**

from typing import Dict, List, Optional

from app.services.valuation.comparables import ComparablesRepository

from app.schemas.identification import VisionResponse

class ValuationService:

    def \_\_init\_\_(self, repo: ComparablesRepository):

        self.repo \= repo

    async def calculate\_valuation(

        self, vision\_response: VisionResponse, embedding: List\[float\]

    ) \-\> Dict:

        """

        Calculate valuation using comparables and vision features.

        Returns valuation range, confidence, and comparables.

        """

        \# 1\. Retrieve comparables

        comparables \= await self.repo.search\_by\_embedding(

            embedding, {"category": vision\_response.category}

        )

        \# 2\. Score and filter comparables

        scored \= \[

            {

                "comparable": c,

                "similarity": self.\_calculate\_similarity(c.embedding, embedding),

                "confidence": c.confidence,

            }

            for c in comparables

        \]

        filtered \= \[c for c in scored if c\["confidence"\] \> 0.5\]

        \# 3\. Calculate valuation range

        prices \= \[c\["comparable"\].price for c in filtered\]

        if not prices:

            return {"error": "No valid comparables found"}

        prices\_sorted \= sorted(prices)

        n \= len(prices\_sorted)

        valuation\_range \= {

            "low": prices\_sorted\[max(0, n // 4)\],

            "mid": prices\_sorted\[n // 2\],

            "high": prices\_sorted\[min(n \- 1, 3 \* n // 4)\],

        }

        \# 4\. Determine confidence and authenticity risk

        confidence\_tier \= self.\_determine\_confidence\_tier(filtered)

        authenticity\_risk \= self.\_assess\_authenticity\_risk(filtered, vision\_response)

        return {

            "valuation\_range": valuation\_range,

            "comparables": \[c\["comparable"\] for c in filtered\],

            "confidence\_tier": confidence\_tier,

            "authenticity\_risk": authenticity\_risk,

            "vision\_response": vision\_response.dict(),

        }

    def \_calculate\_similarity(self, embedding1: List\[float\], embedding2: List\[float\]) \-\> float:

        \# Implement cosine similarity or L2 distance

        pass

    def \_determine\_confidence\_tier(self, comparables: List) \-\> str:

        \# Implement logic for high/medium/low confidence

        pass

    def \_assess\_authenticity\_risk(self, comparables: List, vision\_response: VisionResponse) \-\> str:

        \# Implement logic for low/medium/high risk

        pass

---

## **3\. Integration: FastAPI Endpoint**

### **`app/routers/identify.py`**

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException

from app.services.vision.ollama import OllamaVisionProvider

from app.services.valuation.engine import ValuationService

from app.services.valuation.comparables import PostgreSQLComparablesRepository

from app.database import get\_async\_session

from app.models.user import User

from app.middleware.auth import get\_current\_user

router \= APIRouter()

@router.post("/identify")

async def identify\_artifact(

    files: list\[UploadFile\] \= File(...),

    current\_user: User \= Depends(get\_current\_user),

    session \= Depends(get\_async\_session),

):

    if len(files) \> 6:

        raise HTTPException(status\_code=400, detail="Max 6 files")

    \# 1\. Save files and extract features

    image\_paths \= \[f"/uploads/{file.filename}" for file in files\]

    vision \= OllamaVisionProvider()

    prompt \= vision.build\_vision\_prompt()

    vision\_response \= await vision.analyze\_images(image\_paths, prompt)

    \# 2\. Calculate valuation

    repo \= PostgreSQLComparablesRepository(session)

    valuation\_service \= ValuationService(repo)

    report \= await valuation\_service.calculate\_valuation(vision\_response, \[\])

    \# 3\. Return job ID (Celery will process async)

    return {"job\_id": "123", "status": "pending", "report": report}

---

## **4\. Docker & Local Setup**

### **`docker-compose.yml` (Add Ollama)**

services:

  ollama:

    image: ollama/ollama

    ports:

      \- "11434:11434"

    volumes:

      \- ollama\_data:/root/.ollama

    environment:

      \- OLLAMA\_HOST=0.0.0.0

### **`.env`**

OLLAMA\_BASE\_URL=http://ollama:11434

OLLAMA\_MODEL=llava


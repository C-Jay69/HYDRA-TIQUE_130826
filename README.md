# HYDRA-TIQUE — AI Artifact Identification Platform

**Free Scan + $11.99 Deep Dive** — Built for bootstrap founders using open-source / free-tier tools.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 18 (CRA) + Tailwind + Framer Motion + Phosphor Icons |
| Backend | FastAPI + MongoDB + Emergent Integrations |
| Auth | Emergent Google OAuth (session cookies) |
| AI Vision | **OpenRouter** → `google/gemma-4-31b-it:free` (free tier) |
| Pricing Search | Tavily API |
| Payments | Stripe (via Emergent Integrations) |
| Storage | Emergent Object Storage |

## Quick Start

### 1. Backend

```bash
cd backend
cp ../.env.example .env
# Edit .env with your keys
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
```

### 3. Required Environment Variables

| Variable | Source | Required |
|----------|--------|----------|
| `MONGO_URL` | MongoDB Atlas / local | Yes |
| `DB_NAME` | e.g. `hydratique` | Yes |
| `EMERGENT_LLM_KEY` | Emergent Platform | Yes (for object storage) |
| `OPENROUTER_API_KEY` | **OpenRouter** (free tier) | **Yes** — replaces Anthropic |
| `VISION_MODEL` | Default: `google/gemma-4-31b-it:free` | Optional |
| `TAVILY_API_KEY` | Tavily | Yes (pricing enrichment) |
| `STRIPE_API_KEY` | Stripe Dashboard | Yes (Deep Dive payments) |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLI / Dashboard | Yes |
| `SECRET_KEY` | Random string | Yes |

### 4. OpenRouter Setup (Free)

1. Sign up at [openrouter.ai](https://openrouter.ai)
2. Create an API key
3. The model `google/gemma-4-31b-it:free` is on the **free tier** — no credits needed
4. Add `OPENROUTER_API_KEY=sk-or-v1-...` to your `.env`

> **Why OpenRouter?** Single API, 300+ models, free tier available. Perfect for bootstrap demos.

## Features

- **Free Scan** — Upload up to 6 images, get category, era, materials, condition, wide value range
- **Deep Dive ($11.99)** — Exact ID, precise valuation, comparable sales, authenticity score, sell recs
- **Admin Dashboard** — Stats, user management, job monitoring
- **CS Agent** — AI chat widget (powered by same free model)

## Project Structure

```
HYDRA-TIQUE/
├── backend/
│   ├── server.py          # FastAPI app (all routes + background tasks)
│   ├── requirements.txt
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/         # Home, Dashboard, Identify, Report, Admin
│   │   ├── components/    # Navbar, UI primitives (Radix + Tailwind)
│   │   └── App.js         # Routes + Auth context
│   └── package.json
├── .env.example
└── README.md
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/session` | Exchange Emergent session_id for cookie |
| `GET` | `/api/auth/me` | Current user |
| `POST` | `/api/identify` | Upload images → start free identification |
| `GET` | `/api/identify/{job_id}/status` | Poll job status |
| `GET` | `/api/identify/history` | User's scan history |
| `GET` | `/api/reports/{job_id}` | Get report (basic or deep_dive) |
| `POST` | `/api/reports/{job_id}/upgrade` | Start Stripe checkout for Deep Dive |
| `GET` | `/api/reports/{job_id}/upgrade/status/{session_id}` | Poll upgrade status |
| `POST` | `/api/payments/create-checkout` | Buy credit packs (legacy) |
| `GET` | `/api/admin/stats` | Platform stats |
| `GET` | `/api/admin/users` | All users |
| `POST` | `/api/admin/users/credits` | Adjust credits |
| `GET` | `/api/admin/jobs` | All identification jobs |
| `POST` | `/api/cs-agent/chat` | Customer service AI |

## Deployment Notes

- **Backend**: Deploy to Railway, Render, Fly.io, or any container platform
- **Frontend**: Build with `npm run build`, serve via Vercel, Netlify, or Nginx
- **MongoDB**: Use Atlas (free tier) or self-hosted
- **Stripe Webhook**: Point to `https://your-domain.com/api/webhook/stripe`
- **CORS**: Set `CORS_ORIGINS` in backend `.env` to your frontend URL

## License

MIT — Build, teach, sell, scale.
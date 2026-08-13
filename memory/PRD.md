# HYDRA-TIQUE - Product Requirements Document

## Original Problem Statement
AI-Powered Art, Antique & Coin Identification Platform with FREEMIUM business model.

## Business Model (Updated)
- **Free Scan**: Every identification is free. Shows vague but accurate assessment (wide value range, general era/origin, no specific attribution)
- **Deep Dive ($11.99 per report)**: Unlocks full report — exact identification, precise valuation, comparable recent sales, authenticity analysis, best platforms to sell

## Architecture
- **Frontend**: React 18 + Tailwind CSS + Framer Motion + Phosphor Icons
- **Backend**: FastAPI (Python) + MongoDB + Emergent Integrations
- **Auth**: Emergent-managed Google OAuth
- **AI Vision**: Claude Sonnet 4.5 via Emergent LLM Key (modular, switchable)
- **Pricing Search**: Tavily API for live auction/market data
- **Payments**: Stripe via Emergent Integrations (Deep Dive upgrade)
- **Storage**: Emergent Object Storage for artifact images

## What's Been Implemented (March 30, 2026)

### Backend
- [x] Google OAuth flow (Emergent Auth)
- [x] Session-based authentication
- [x] FREE scan — no credits/payment needed for basic identification
- [x] Two-tier report system (basic vs deep_dive)
- [x] Basic tier: vague summary, wide value range, hidden specifics
- [x] Deep Dive upgrade via Stripe ($11.99 per report)
- [x] Image upload to Emergent Object Storage
- [x] AI identification via Claude Sonnet with vision
- [x] Tavily pricing enrichment (hidden in basic, shown in deep_dive)
- [x] AI sell recommendations (hidden in basic, shown in deep_dive)
- [x] Stripe checkout + webhook handling for Deep Dive
- [x] Admin APIs (stats, users, jobs)
- [x] CS Agent chat endpoint

### Frontend
- [x] Landing page — Free Scan + Deep Dive $11.99 pricing
- [x] Dark luxury theme (auction house aesthetic)
- [x] Dashboard — unlimited free scans, scan history, deep dive count
- [x] Identify page — free scan, no credit requirement
- [x] Report page — TWO-TIER EXPERIENCE:
  - Basic: vague summary, wide value range, "Unlock Deep Dive — $11.99" CTA
  - Deep Dive: full report with authenticity, comparables, sell recs
- [x] Locked sections with blur overlay for premium content
- [x] Admin dashboard, users, jobs pages

## Prioritized Backlog
### P1 (High)
- Display uploaded artifact images in reports from object storage
- PDF report export for Deep Dive reports
- CS Agent floating chat widget

### P2 (Medium)
- Admin settings page (vision provider toggle)
- User profile/account settings
- Multiple scan history with batch Deep Dive upgrades

### P3 (Nice to have)
- Image gallery/lightbox
- Mobile responsive improvements
- Rate limiting
- Email notifications for completed scans

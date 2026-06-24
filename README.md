# ProcurePilot

ProcurePilot is an AI procurement intelligence MVP. It accepts competing vendor PDF proposals/contracts, extracts procurement terms, scores vendors, and returns an executive-ready recommendation.

## Current architecture

This repository is structured as two services:

- `src/` - Vite + React frontend for the investor-demo workflow.
  - Upload page: selects multiple PDF vendor documents.
  - Dashboard: shows document coverage, staged analysis states, scoring weights, and vendor scorecards.
  - Decision page: presents the recommended vendor, confidence score, risk level, savings estimate, and executive reasoning.
- `backend/` - FastAPI service.
  - `POST /upload` accepts one or more PDF files and extracts text with `pypdf`.
  - `POST /analyze` runs deterministic mock AI extraction and the weighted decision engine.
  - `GET /result/{id}` returns a stored recommendation result.

The current AI layer is intentionally mocked so the full workflow runs without LLM credentials. The backend extracts obvious signals from PDF text and filenames, then applies the scoring model:

- Cost: 35%
- Risk: 25%
- Flexibility: 20%
- Terms: 20%

## Run locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
npm install
npm run dev
```

The frontend defaults to `http://localhost:8000` for API calls. Override with:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

# ProcurePilot

ProcurePilot is a demo FastAPI backend for AI-assisted procurement decision
intelligence. It accepts procurement documents, extracts vendor terms, scores
options, and returns a recommendation.

## What is included

- `/upload` - accepts PDF, email, or text quotation files and extracts clean text
- `/analyze` - extracts vendor name, price, contract length, renewal, penalties,
  SLA, and hidden fees
- `/result` - returns the recommended vendor, score, risk level, savings, and why

The demo uses deterministic extraction heuristics so it works locally without an
external AI API key.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Demo flow

Create three sample quotation files:

```bash
printf 'Vendor: Vendor A\nTotal price: $12,000\nContract length: 24 months\nRenewal: auto-renews annually\nPenalty: early termination fee $2,000\nSLA: 99.5%% uptime\nImplementation fee $1,000' > vendor-a.txt
printf 'Vendor: Vendor B\nTotal price: $11,500\nContract length: 36 months\nRenewal: evergreen renewal\nPenalty: cancellation fee $3,500\nSLA: 99.0%% uptime\nSupport fee $800' > vendor-b.txt
printf 'Vendor: Vendor C\nTotal price: $9,300\nContract length: 12 months\nRenewal: mutual renewal with 30 days notice\nPenalty: none\nSLA: 99.9%% uptime\nNo hidden fees' > vendor-c.txt
```

Upload and analyze:

```bash
UPLOAD_ID=$(curl -s -F "files=@vendor-a.txt" -F "files=@vendor-b.txt" -F "files=@vendor-c.txt" http://localhost:8000/upload | python -c "import json,sys; print(json.load(sys.stdin)['upload_id'])")
ANALYSIS_ID=$(curl -s -X POST http://localhost:8000/analyze -H "Content-Type: application/json" -d "{\"upload_id\":\"$UPLOAD_ID\"}" | python -c "import json,sys; print(json.load(sys.stdin)['analysis_id'])")
curl -s "http://localhost:8000/result?analysis_id=$ANALYSIS_ID"
```

Example response:

```json
{
  "winner": "Vendor C",
  "score": 93,
  "risk": "Low",
  "saving": "$5,000"
}
```

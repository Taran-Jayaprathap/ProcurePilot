from __future__ import annotations

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.ai_extraction import extract_vendor_quote
from app.decision_engine import recommend
from app.document_processing import DocumentProcessingError, process_upload
from app.models import AnalysisResult, AnalyzeRequest, UploadedDocument, UploadSession, new_id
from app.storage import store


app = FastAPI(
    title="ProcurePilot AI Backend",
    description="Demo backend for AI-assisted procurement document analysis and vendor recommendations.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/upload")
async def upload(files: list[UploadFile] = File(...)) -> dict[str, object]:
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one procurement file")

    documents: list[UploadedDocument] = []
    for file in files:
        try:
            extracted_text = await process_upload(file)
        except DocumentProcessingError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc

        documents.append(
            UploadedDocument(
                id=new_id("doc"),
                filename=file.filename or "upload",
                content_type=file.content_type,
                extracted_text=extracted_text,
                preview=extracted_text[:500],
            )
        )

    session = store.save_upload(UploadSession(id=new_id("upl"), documents=documents))
    return {
        "upload_id": session.id,
        "document_count": len(session.documents),
        "documents": [
            {
                "id": document.id,
                "filename": document.filename,
                "preview": document.preview,
            }
            for document in session.documents
        ],
    }


@app.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict[str, object]:
    upload_session = store.get_upload(request.upload_id)
    if upload_session is None:
        raise HTTPException(status_code=404, detail="Upload session not found")

    vendors = [extract_vendor_quote(document) for document in upload_session.documents]
    recommendation = recommend(vendors)
    analysis = store.save_analysis(
        AnalysisResult(
            id=new_id("ana"),
            upload_id=upload_session.id,
            vendors=vendors,
            recommendation=recommendation,
        )
    )

    return {
        "analysis_id": analysis.id,
        "upload_id": analysis.upload_id,
        "vendors": analysis.vendors,
        "recommendation": analysis.recommendation,
    }


@app.get("/result")
def result(analysis_id: str | None = Query(default=None)) -> dict[str, object]:
    analysis = store.get_analysis(analysis_id) if analysis_id else store.latest_analysis()
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis result not found")

    recommendation = analysis.recommendation
    return {
        "analysis_id": analysis.id,
        "winner": recommendation.winner,
        "score": recommendation.score,
        "risk": recommendation.risk,
        "saving": recommendation.saving,
        "confidence": recommendation.confidence,
        "why": recommendation.why,
        "rankings": recommendation.rankings,
    }


@app.get("/result/{analysis_id}")
def result_by_id(analysis_id: str) -> dict[str, object]:
    return result(analysis_id=analysis_id)

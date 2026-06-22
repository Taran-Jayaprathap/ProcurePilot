from __future__ import annotations

from app.models import AnalysisResult, UploadSession


class DemoStore:
    """In-memory store for the investor demo flow."""

    def __init__(self) -> None:
        self.uploads: dict[str, UploadSession] = {}
        self.analyses: dict[str, AnalysisResult] = {}

    def save_upload(self, upload: UploadSession) -> UploadSession:
        self.uploads[upload.id] = upload
        return upload

    def get_upload(self, upload_id: str) -> UploadSession | None:
        return self.uploads.get(upload_id)

    def save_analysis(self, analysis: AnalysisResult) -> AnalysisResult:
        self.analyses[analysis.id] = analysis
        return analysis

    def get_analysis(self, analysis_id: str) -> AnalysisResult | None:
        return self.analyses.get(analysis_id)

    def latest_analysis(self) -> AnalysisResult | None:
        if not self.analyses:
            return None
        return next(reversed(self.analyses.values()))


store = DemoStore()

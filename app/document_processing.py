from __future__ import annotations

import io
import re
from email import policy
from email.parser import BytesParser
from typing import Iterable

from fastapi import UploadFile
from pypdf import PdfReader


class DocumentProcessingError(ValueError):
    """Raised when an uploaded document cannot be converted to text."""


async def process_upload(file: UploadFile) -> str:
    """Extract clean text from a PDF, email, or text-like quotation upload."""
    raw = await file.read()
    if not raw:
        raise DocumentProcessingError(f"{file.filename or 'upload'} is empty")

    filename = (file.filename or "").lower()
    content_type = (file.content_type or "").lower()

    if filename.endswith(".pdf") or content_type == "application/pdf":
        text = _extract_pdf(raw)
    elif filename.endswith((".eml", ".msg")) or "message/" in content_type:
        text = _extract_email(raw)
    else:
        text = _decode_text(raw)

    cleaned = clean_text(text)
    if not cleaned:
        raise DocumentProcessingError(
            f"Could not extract readable procurement text from {file.filename or 'upload'}"
        )
    return cleaned


def clean_text(text: str) -> str:
    text = text.replace("\x00", " ")
    text = re.sub(r"[ \t\r\f\v]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return "\n".join(line.strip() for line in text.splitlines() if line.strip()).strip()


def _extract_pdf(raw: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(raw))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception:
        # Some investor-demo PDFs are text exports with a PDF extension. Try text decode
        # before failing so the upload flow remains forgiving.
        return _decode_text(raw)


def _extract_email(raw: bytes) -> str:
    message = BytesParser(policy=policy.default).parsebytes(raw)
    headers = [
        f"From: {message.get('from', '')}",
        f"Subject: {message.get('subject', '')}",
    ]
    bodies: list[str] = []

    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == "text/plain":
                bodies.append(_coerce_payload(part.get_payload(decode=True), part.get_content_charset()))
    else:
        bodies.append(_coerce_payload(message.get_payload(decode=True), message.get_content_charset()))

    return "\n".join(headers + [body for body in bodies if body])


def _coerce_payload(payload: bytes | str | None, charset: str | None) -> str:
    if payload is None:
        return ""
    if isinstance(payload, str):
        return payload
    return payload.decode(charset or "utf-8", errors="ignore")


def _decode_text(raw: bytes) -> str:
    for encoding in _candidate_encodings():
        try:
            return raw.decode(encoding)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def _candidate_encodings() -> Iterable[str]:
    return ("utf-8", "utf-16", "latin-1")

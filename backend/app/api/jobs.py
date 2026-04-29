from pathlib import Path

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from mimetypes import guess_type

from app.core.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE_BYTES
from app.models.job import JobStatus
from app.services.audio import create_full_audio, create_preview_audio
from app.services.jobs import (
    create_job,
    get_job,
    update_job_paths,
    update_job_status,
)
from app.services.storage import save_uploaded_file

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/upload")
async def upload_job(file: UploadFile = File(...)) -> dict[str, str]:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is missing")

    extension = Path(file.filename).suffix.lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    content = await file.read()
    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File size exceeds limit")

    stored_filename = file.filename
    input_path = save_uploaded_file(stored_filename, content)
    record = create_job(original_filename=file.filename, input_path=input_path)

    return {
        "jobId": record.job_id,
        "status": record.status.value,
    }


@router.post("/{job_id}/preview")
def start_preview(job_id: str) -> dict[str, str]:
    try:
        record = get_job(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc

    if record.status in {JobStatus.PREVIEW_PROCESSING, JobStatus.PREVIEW_READY}:
        return {
            "jobId": record.job_id,
            "status": record.status.value,
        }

    if record.status not in {JobStatus.UPLOADED}:
        raise HTTPException(status_code=400, detail="Preview cannot be started from current status")

    update_job_status(job_id, JobStatus.PREVIEW_PROCESSING)

    try:
        preview_audio = create_preview_audio(job_id, record.input_path)
        update_job_paths(
            job_id,
            preview_path=str(preview_audio.path),
            preview_waveform=preview_audio.waveform,
        )
        updated_record = update_job_status(job_id, JobStatus.PREVIEW_READY)
    except Exception as exc:
        update_job_status(job_id, JobStatus.FAILED, error=str(exc))
        raise HTTPException(status_code=500, detail=f"Preview processing failed: {exc}") from exc

    return {
        "jobId": updated_record.job_id,
        "status": updated_record.status.value,
    }


@router.post("/{job_id}/full")
def start_full(job_id: str) -> dict[str, str]:
    try:
        record = get_job(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc

    if record.status in {JobStatus.FULL_PROCESSING, JobStatus.FULL_READY}:
        return {
            "jobId": record.job_id,
            "status": record.status.value,
        }

    if record.status not in {JobStatus.PREVIEW_READY}:
        raise HTTPException(status_code=400, detail="Full processing cannot be started from current status")

    update_job_status(job_id, JobStatus.FULL_PROCESSING)

    try:
        full_audio = create_full_audio(job_id, record.input_path)
        update_job_paths(
            job_id,
            full_path=str(full_audio.path),
            full_waveform=full_audio.waveform,
        )
        updated_record = update_job_status(job_id, JobStatus.FULL_READY)
    except Exception as exc:
        update_job_status(job_id, JobStatus.FAILED, error=str(exc))
        raise HTTPException(status_code=500, detail=f"Full processing failed: {exc}") from exc

    return {
        "jobId": updated_record.job_id,
        "status": updated_record.status.value,
    }


@router.get("/{job_id}")
def get_job_status(job_id: str) -> dict[str, str | list[float] | None]:
    try:
        record = get_job(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc

    return {
        "jobId": record.job_id,
        "status": record.status.value,
        "previewUrl": f"/jobs/{job_id}/preview/file" if record.preview_path else None,
        "fullUrl": f"/jobs/{job_id}/full/file" if record.full_path else None,
        "previewWaveform": record.preview_waveform,
        "fullWaveform": record.full_waveform,
        "error": record.error,
    }


@router.get("/{job_id}/preview/file")
def get_preview_file_path(job_id: str) -> FileResponse:
    try:
        record = get_job(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc

    if not record.preview_path:
        raise HTTPException(status_code=404, detail="Preview file not found")

    preview_path = Path(record.preview_path)

    if not preview_path.exists():
        raise HTTPException(status_code=404, detail="Preview file not found")

    media_type, _ = guess_type(str(preview_path))

    original_name = Path(record.original_filename)
    preview_download_name = f"{original_name.stem}_soundfix_preview{original_name.suffix}"    

    return FileResponse(
        path=str(preview_path),
        media_type=media_type or "application/octet-stream",
        filename=preview_download_name,
    )


@router.get("/{job_id}/full/file")
def get_full_file_path(job_id: str) -> FileResponse:
    try:
        record = get_job(job_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Job not found") from exc

    if not record.full_path:
        raise HTTPException(status_code=404, detail="Full file not found")

    full_path = Path(record.full_path)

    if not full_path.exists():
        raise HTTPException(status_code=404, detail="Full file not found")

    media_type, _ = guess_type(str(full_path))

    original_name = Path(record.original_filename)
    full_download_name = f"{original_name.stem}_soundfix{original_name.suffix}"    

    return FileResponse(
        path=str(full_path),
        media_type=media_type or "application/octet-stream",
        filename=full_download_name,
    )  
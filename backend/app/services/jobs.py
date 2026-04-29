import uuid
from pathlib import Path

from app.models.job import JobRecord, JobStatus
from app.services.storage import load_job_record, save_job_record


def create_job(original_filename: str, input_path: Path) -> JobRecord:
    job_id = f"job_{uuid.uuid4()}"

    record = JobRecord(
        job_id=job_id,
        original_filename=original_filename,
        input_path=str(input_path),
        status=JobStatus.UPLOADED,
    )

    save_job_record(record)
    return record


def get_job(job_id: str) -> JobRecord:
    return load_job_record(job_id)


def update_job_status(job_id: str, status: JobStatus, error: str | None = None) -> JobRecord:
    record = load_job_record(job_id)
    record.status = status
    record.error = error
    save_job_record(record)
    return record


def update_job_paths(
    job_id: str,
    preview_path: str | None = None,
    full_path: str | None = None,
    preview_waveform: list[float] | None = None,
    full_waveform: list[float] | None = None,
) -> JobRecord:
    record = load_job_record(job_id)

    if preview_path is not None:
        record.preview_path = preview_path

    if full_path is not None:
        record.full_path = full_path

    if preview_waveform is not None:
        record.preview_waveform = preview_waveform

    if full_waveform is not None:
        record.full_waveform = full_waveform

    save_job_record(record)
    return record
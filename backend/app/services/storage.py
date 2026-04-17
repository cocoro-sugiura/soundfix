import json
from pathlib import Path

from app.core.config import FULL_DIR, INPUT_DIR, JOBS_DIR, PREVIEW_DIR
from app.models.job import JobRecord


def ensure_storage_dirs() -> None:
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)
    FULL_DIR.mkdir(parents=True, exist_ok=True)
    JOBS_DIR.mkdir(parents=True, exist_ok=True)


def save_uploaded_file(filename: str, content: bytes) -> Path:
    ensure_storage_dirs()

    file_path = INPUT_DIR / filename
    file_path.write_bytes(content)
    return file_path


def get_job_file_path(job_id: str) -> Path:
    ensure_storage_dirs()
    return JOBS_DIR / f"{job_id}.json"


def save_job_record(record: JobRecord) -> None:
    job_file_path = get_job_file_path(record.job_id)
    job_file_path.write_text(
        json.dumps(record.model_dump(), ensure_ascii=False, indent=2),
        encoding="utf-8",
    )


def load_job_record(job_id: str) -> JobRecord:
    job_file_path = get_job_file_path(job_id)
    data = json.loads(job_file_path.read_text(encoding="utf-8"))
    return JobRecord(**data)
from enum import Enum

from pydantic import BaseModel


class JobStatus(str, Enum):
    IDLE = "idle"
    UPLOADED = "uploaded"
    PREVIEW_PROCESSING = "preview_processing"
    PREVIEW_READY = "preview_ready"
    FULL_PROCESSING = "full_processing"
    FULL_READY = "full_ready"
    FAILED = "failed"


class JobRecord(BaseModel):
    job_id: str
    original_filename: str
    input_path: str
    preview_path: str | None = None
    full_path: str | None = None
    preview_waveform: list[float] | None = None
    full_waveform: list[float] | None = None
    status: JobStatus
    error: str | None = None
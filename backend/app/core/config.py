from pathlib import Path


BASE_DIR = Path(__file__).resolve().parents[2]
STORAGE_DIR = BASE_DIR / "storage"
INPUT_DIR = STORAGE_DIR / "input"
PREVIEW_DIR = STORAGE_DIR / "preview"
FULL_DIR = STORAGE_DIR / "full"
JOBS_DIR = STORAGE_DIR / "jobs"

PREVIEW_DURATION_SECONDS = 30

ALLOWED_EXTENSIONS = {
    ".wav",
    ".mp3",
    ".aiff",
    ".aif",
    ".flac",
}

MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024
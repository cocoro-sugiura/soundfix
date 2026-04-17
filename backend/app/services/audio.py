from pathlib import Path
import shutil

from app.core.config import FULL_DIR, PREVIEW_DIR


def create_preview_audio(job_id: str, input_path: str) -> Path:
    source_path = Path(input_path)
    suffix = source_path.suffix.lower()

    output_path = PREVIEW_DIR / f"{job_id}_preview{suffix}"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(source_path, output_path)
    return output_path


def create_full_audio(job_id: str, input_path: str) -> Path:
    source_path = Path(input_path)
    suffix = source_path.suffix.lower()

    output_path = FULL_DIR / f"{job_id}_full{suffix}"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    shutil.copyfile(source_path, output_path)
    return output_path
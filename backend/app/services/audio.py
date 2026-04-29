from pathlib import Path

import librosa
import numpy as np
import soundfile as sf

from app.core.config import FULL_DIR, PREVIEW_DIR

PREVIEW_DURATION_SECONDS = 60
OUTPUT_SAMPLE_RATE = 44100
OUTPUT_FORMAT = "WAV"


def _load_audio(input_path: Path) -> tuple[np.ndarray, int]:
    audio, sample_rate = librosa.load(
        input_path,
        sr=OUTPUT_SAMPLE_RATE,
        mono=False,
    )

    if audio.ndim == 1:
        audio = np.expand_dims(audio, axis=0)

    return audio, sample_rate


def _limit_preview_duration(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    max_samples = PREVIEW_DURATION_SECONDS * sample_rate
    return audio[:, :max_samples]


def _normalize_peak(audio: np.ndarray, target_peak: float = 0.95) -> np.ndarray:
    peak = np.max(np.abs(audio))

    if peak <= 0:
        return audio

    return audio / peak * target_peak


def _soft_restore_audio(audio: np.ndarray) -> np.ndarray:
    restored = _normalize_peak(audio)

    return np.clip(restored, -1.0, 1.0)


def _write_audio(output_path: Path, audio: np.ndarray, sample_rate: int) -> Path:
    output_path.parent.mkdir(parents=True, exist_ok=True)

    audio_for_write = audio.T

    sf.write(
        output_path,
        audio_for_write,
        sample_rate,
        format=OUTPUT_FORMAT,
    )

    return output_path


def create_preview_audio(job_id: str, input_path: str) -> Path:
    source_path = Path(input_path)
    output_path = PREVIEW_DIR / f"{job_id}_preview.wav"

    audio, sample_rate = _load_audio(source_path)
    preview_audio = _limit_preview_duration(audio, sample_rate)
    restored_audio = _soft_restore_audio(preview_audio)

    return _write_audio(output_path, restored_audio, sample_rate)


def create_full_audio(job_id: str, input_path: str) -> Path:
    source_path = Path(input_path)
    output_path = FULL_DIR / f"{job_id}_full.wav"

    audio, sample_rate = _load_audio(source_path)
    restored_audio = _soft_restore_audio(audio)

    return _write_audio(output_path, restored_audio, sample_rate)
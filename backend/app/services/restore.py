import os

import numpy as np

from app.services.gpu_client import restore_audio_with_gpu


RESTORE_PROVIDER_LOCAL = "local"
RESTORE_PROVIDER_MODAL = "modal"


def normalize_peak(audio: np.ndarray, target_peak: float = 0.95) -> np.ndarray:
    peak = np.max(np.abs(audio))

    if peak <= 0:
        return audio

    return audio / peak * target_peak


def restore_audio_local(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    restored = normalize_peak(audio)

    return np.clip(restored, -1.0, 1.0)


def get_restore_provider() -> str:
    return os.getenv("SOUNDFIX_RESTORE_PROVIDER", RESTORE_PROVIDER_LOCAL).lower()


def restore_audio(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    provider = get_restore_provider()

    if provider == RESTORE_PROVIDER_LOCAL:
        return restore_audio_local(audio, sample_rate)

    if provider == RESTORE_PROVIDER_MODAL:
        return restore_audio_with_gpu(audio, sample_rate)

    raise ValueError(f"Unsupported restore provider: {provider}")
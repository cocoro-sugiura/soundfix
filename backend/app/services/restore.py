import numpy as np


def normalize_peak(audio: np.ndarray, target_peak: float = 0.95) -> np.ndarray:
    peak = np.max(np.abs(audio))

    if peak <= 0:
        return audio

    return audio / peak * target_peak


def restore_audio_local(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    restored = normalize_peak(audio)

    return np.clip(restored, -1.0, 1.0)


def restore_audio(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    return restore_audio_local(audio, sample_rate)
import numpy as np


class GpuRestoreUnavailableError(RuntimeError):
    pass


def restore_audio_with_gpu(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    raise GpuRestoreUnavailableError("GPU restore is not configured yet.")
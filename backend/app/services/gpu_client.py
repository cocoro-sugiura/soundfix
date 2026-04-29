from io import BytesIO

import modal
import numpy as np
import soundfile as sf


MODAL_APP_NAME = "soundfix-gpu-worker"
MODAL_FUNCTION_NAME = "restore_audio_bytes"


def restore_audio_with_gpu(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    input_buffer = BytesIO()

    sf.write(
        input_buffer,
        audio.T,
        sample_rate,
        format="WAV",
    )

    restore_audio_function = modal.Function.from_name(
        MODAL_APP_NAME,
        MODAL_FUNCTION_NAME,
    )
    restored_audio_bytes = restore_audio_function.remote(input_buffer.getvalue())

    restored_audio, _ = sf.read(
        BytesIO(restored_audio_bytes),
        always_2d=True,
    )

    return restored_audio.astype(np.float32).T
from io import BytesIO

import numpy as np
import soundfile as sf

from modal_worker import restore_audio_bytes


def restore_audio_with_gpu(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    input_buffer = BytesIO()

    sf.write(
        input_buffer,
        audio.T,
        sample_rate,
        format="WAV",
    )

    restored_audio_bytes = restore_audio_bytes.remote(input_buffer.getvalue())

    restored_audio, _ = sf.read(
        BytesIO(restored_audio_bytes),
        always_2d=True,
    )

    return restored_audio.astype(np.float32).T
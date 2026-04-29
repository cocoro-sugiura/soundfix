from io import BytesIO

import modal
import numpy as np
import soundfile as sf

app = modal.App("soundfix-gpu-worker")

image = (
    modal.Image.debian_slim(python_version="3.12")
    .pip_install(
        "numpy==2.0.2",
        "soundfile==0.12.1",
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=600,
)
def restore_audio_bytes(audio_bytes: bytes) -> bytes:
    audio, sample_rate = sf.read(BytesIO(audio_bytes), always_2d=True)

    audio = audio.astype(np.float32).T
    peak = np.max(np.abs(audio))

    if peak > 0:
        audio = audio / peak * 0.95

    audio = np.clip(audio, -1.0, 1.0)

    output_buffer = BytesIO()
    sf.write(output_buffer, audio.T, sample_rate, format="WAV")

    return output_buffer.getvalue()
from io import BytesIO
from time import perf_counter

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
    started_at = perf_counter()
    input_size_bytes = len(audio_bytes)

    print(
        "[soundfix] restore started "
        f"input_size_bytes={input_size_bytes}",
        flush=True,
    )

    audio, sample_rate = sf.read(BytesIO(audio_bytes), always_2d=True)

    audio = audio.astype(np.float32).T
    channel_count = audio.shape[0]
    sample_count = audio.shape[1]
    duration_seconds = sample_count / sample_rate if sample_rate > 0 else 0

    print(
        "[soundfix] audio loaded "
        f"sample_rate={sample_rate} "
        f"channels={channel_count} "
        f"samples={sample_count} "
        f"duration_seconds={duration_seconds:.2f}",
        flush=True,
    )

    restore_started_at = perf_counter()

    peak = np.max(np.abs(audio))

    if peak > 0:
        audio = audio / peak * 0.95

    audio = np.clip(audio, -1.0, 1.0)

    restore_seconds = perf_counter() - restore_started_at

    output_buffer = BytesIO()
    sf.write(output_buffer, audio.T, sample_rate, format="WAV")
    output_audio_bytes = output_buffer.getvalue()

    total_seconds = perf_counter() - started_at

    print(
        "[soundfix] restore completed "
        f"restore_seconds={restore_seconds:.3f} "
        f"total_seconds={total_seconds:.3f} "
        f"output_size_bytes={len(output_audio_bytes)}",
        flush=True,
    )

    return output_audio_bytes
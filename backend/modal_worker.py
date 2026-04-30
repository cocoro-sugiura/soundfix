from io import BytesIO
from time import perf_counter

import modal
import numpy as np
import soundfile as sf

app = modal.App("soundfix-gpu-worker")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "ffmpeg",
        "git",
        "libsndfile1",
    )
    .pip_install(
        "numpy==1.26.4",
        "soundfile==0.12.1",
        "torch",
        "torchaudio",
        "torchvision",
        "librosa==0.10.2.post1",
        "scipy==1.11.4",
        "transformers==4.30.2",
        "huggingface_hub",
        "diffusers",
        "progressbar",
        "unidecode",
        "einops",
        "omegaconf",
        "phonemizer",
        "torchlibrosa",
        "ftfy",
        "pandas",
        "timm",
    )
    .run_commands(
        "git clone https://github.com/haoheliu/versatile_audio_super_resolution.git /opt/audiosr"
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=600,
)
def check_audiosr_environment() -> dict:
    started_at = perf_counter()

    result = {
        "torch_import_ok": False,
        "torch_version": None,
        "cuda_available": False,
        "cuda_device_name": None,
        "torchaudio_import_ok": False,
        "torchaudio_version": None,
        "librosa_import_ok": False,
        "librosa_version": None,
        "audiosr_import_ok": False,
        "audiosr_import_error": None,
        "elapsed_seconds": None,
    }

    try:
        import torch

        result["torch_import_ok"] = True
        result["torch_version"] = str(torch.__version__)
        result["cuda_available"] = bool(torch.cuda.is_available())

        if result["cuda_available"]:
            result["cuda_device_name"] = str(torch.cuda.get_device_name(0))
    except Exception as error:
        result["torch_import_error"] = repr(error)

    try:
        import torchaudio

        result["torchaudio_import_ok"] = True
        result["torchaudio_version"] = str(torchaudio.__version__)
    except Exception as error:
        result["torchaudio_import_error"] = repr(error)

    try:
        import librosa

        result["librosa_import_ok"] = True
        result["librosa_version"] = str(librosa.__version__)
    except Exception as error:
        result["librosa_import_error"] = repr(error)

    try:
        import sys

        if "/opt/audiosr" not in sys.path:
            sys.path.insert(0, "/opt/audiosr")

        import audiosr

        result["audiosr_import_ok"] = True
        audiosr_version = getattr(audiosr, "__version__", None)
        result["audiosr_version"] = str(audiosr_version) if audiosr_version is not None else None
    except Exception as error:
        result["audiosr_import_error"] = repr(error)

    result["elapsed_seconds"] = float(perf_counter() - started_at)

    print(
        "[soundfix] audiosr environment checked "
        f"result={result}",
        flush=True,
    )

    return result


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


@app.local_entrypoint()
def main():
    result = check_audiosr_environment.remote()
    print(result)
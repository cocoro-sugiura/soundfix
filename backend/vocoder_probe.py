from io import BytesIO
from pathlib import Path
from time import perf_counter

import modal
import numpy as np
import soundfile as sf

app = modal.App("soundfix-vocoder-probe")

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
        "librosa==0.10.2.post1",
        "scipy==1.11.4",
        "torch",
        "torchaudio",
        "torchvision",
        "huggingface_hub",
        "matplotlib",
    )
    .run_commands(
        "git clone https://github.com/NVIDIA/BigVGAN.git /opt/bigvgan"
    )
)

_BIGVGAN_MODEL = None


def _get_bigvgan_model():
    global _BIGVGAN_MODEL

    if _BIGVGAN_MODEL is not None:
        return _BIGVGAN_MODEL

    import sys
    import torch

    if "/opt/bigvgan" not in sys.path:
        sys.path.insert(0, "/opt/bigvgan")

    import json
    from huggingface_hub import hf_hub_download
    from env import AttrDict
    from bigvgan import BigVGAN

    print("[soundfix] loading BigVGAN model", flush=True)

    repo_id = "nvidia/bigvgan_v2_44khz_128band_256x"

    config_path = hf_hub_download(
        repo_id=repo_id,
        filename="config.json",
    )
    checkpoint_path = hf_hub_download(
        repo_id=repo_id,
        filename="bigvgan_generator.pt",
    )

    with open(config_path, "r", encoding="utf-8") as config_file:
        config = AttrDict(json.load(config_file))

    model = BigVGAN(config, use_cuda_kernel=False)

    checkpoint = torch.load(checkpoint_path, map_location="cpu")

    if "generator" in checkpoint:
        checkpoint = checkpoint["generator"]

    model.load_state_dict(checkpoint, strict=True)

    model.remove_weight_norm()
    model = model.eval().to("cuda" if torch.cuda.is_available() else "cpu")

    _BIGVGAN_MODEL = model

    print("[soundfix] BigVGAN model loaded", flush=True)

    return _BIGVGAN_MODEL


@app.function(
    image=image,
    gpu="L4",
    timeout=600,
)
def reconstruct_with_bigvgan_bytes(audio_bytes: bytes) -> bytes:
    started_at = perf_counter()

    import sys
    import torch
    import librosa

    if "/opt/bigvgan" not in sys.path:
        sys.path.insert(0, "/opt/bigvgan")

    from meldataset import get_mel_spectrogram

    model = _get_bigvgan_model()
    device = "cuda" if torch.cuda.is_available() else "cpu"

    audio, sample_rate = sf.read(BytesIO(audio_bytes), always_2d=True)
    audio = audio.astype(np.float32)

    if audio.shape[1] > 1:
        audio_mono = np.mean(audio, axis=1)
    else:
        audio_mono = audio[:, 0]

    target_sample_rate = int(model.h.sampling_rate)

    if sample_rate != target_sample_rate:
        audio_mono = librosa.resample(
            audio_mono,
            orig_sr=sample_rate,
            target_sr=target_sample_rate,
        )

    peak = float(np.max(np.abs(audio_mono))) if audio_mono.size > 0 else 0.0
    if peak > 0:
        audio_mono = audio_mono / peak * 0.95

    waveform = torch.FloatTensor(audio_mono).unsqueeze(0).to(device)

    mel = get_mel_spectrogram(waveform, model.h).to(device)

    with torch.inference_mode():
        generated = model(mel)

    generated = generated.squeeze().detach().cpu().numpy().astype(np.float32)

    target_samples = audio_mono.shape[0]
    if generated.shape[0] > target_samples:
        generated = generated[:target_samples]

    if generated.shape[0] < target_samples:
        generated = np.pad(
            generated,
            (0, target_samples - generated.shape[0]),
        )

    output_peak = float(np.max(np.abs(generated))) if generated.size > 0 else 0.0
    if output_peak > 0:
        generated = generated / output_peak * 0.95

    generated = np.clip(generated, -1.0, 1.0)
    output_audio = np.stack([generated, generated], axis=1)

    output_buffer = BytesIO()
    sf.write(output_buffer, output_audio, target_sample_rate, format="WAV")

    print(
        "[soundfix] BigVGAN reconstruction completed "
        f"input_sample_rate={sample_rate} "
        f"output_sample_rate={target_sample_rate} "
        f"seconds={perf_counter() - started_at:.3f} "
        f"output_size_bytes={output_buffer.tell()}",
        flush=True,
    )

    return output_buffer.getvalue()


@app.local_entrypoint()
def main(input_path: str, output_path: str = "bigvgan_reconstructed.wav"):
    input_path_obj = Path(input_path)

    with open(input_path_obj, "rb") as input_file:
        input_audio_bytes = input_file.read()

    output_audio_bytes = reconstruct_with_bigvgan_bytes.remote(input_audio_bytes)

    with open(output_path, "wb") as output_file:
        output_file.write(output_audio_bytes)

    output_audio, output_sample_rate = sf.read(BytesIO(output_audio_bytes), always_2d=True)

    print(
        {
            "output_path": output_path,
            "output_sample_rate": int(output_sample_rate),
            "output_shape": tuple(output_audio.shape),
            "output_duration_seconds": float(output_audio.shape[0] / output_sample_rate),
        }
    )
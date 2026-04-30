from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter
import shutil
import subprocess

import modal
import soundfile as sf


app = modal.App("soundfix-vmasr-probe")

MODEL_ZIP_URL = (
    "https://github.com/ghnmqdtg/VM-ASR/releases/download/v1.0.0/"
    "DualStreamInteractiveMambaUNet.zip"
)

image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.1-devel-ubuntu22.04",
        add_python="3.10",
    )
    .apt_install(
        "ffmpeg",
        "git",
        "libsndfile1",
        "wget",
        "unzip",
        "build-essential",
        "ninja-build",
    )
    .pip_install(
        "numpy==1.26.4",
        "soundfile==0.12.1",
        "librosa==0.10.2.post1",
        "scipy==1.11.4",
        "torch",
        "torchaudio",
        "torchvision",
        "einops",
        "omegaconf",
        "timm",
        "matplotlib",
        "yacs",
        "tensorboard",
        "wandb",
        "packaging",
        "ninja",
        "wheel",
        "setuptools",
    )
    .run_commands(
        "python --version",
        "nvcc --version",
        "echo CUDA_HOME=$CUDA_HOME",
        "git clone https://github.com/ghnmqdtg/VM-ASR.git /opt/vmasr",
        "pip install -r /opt/vmasr/requirements.txt",
        "cd /opt/vmasr/kernels/selective_scan && pip install . --no-build-isolation",
        f"wget -O /tmp/DualStreamInteractiveMambaUNet.zip {MODEL_ZIP_URL}",
        "mkdir -p /opt/vmasr/logs",
        "unzip -q /tmp/DualStreamInteractiveMambaUNet.zip -d /opt/vmasr/logs",
    )
)


def _find_latest_wav(root: Path) -> Path:
    wav_paths = list(root.rglob("*.wav"))

    if not wav_paths:
        raise FileNotFoundError(f"No wav output found under {root}")

    return max(wav_paths, key=lambda path: path.stat().st_mtime)


@app.function(
    image=image,
    gpu="L4",
    timeout=900,
)
def reconstruct_with_vmasr_bytes(audio_bytes: bytes) -> bytes:
    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.wav"
        output_root = temp_path / "output"

        audio, sample_rate = sf.read(BytesIO(audio_bytes), always_2d=True)
        sf.write(input_path, audio, sample_rate, format="WAV")

        command = [
            "python",
            "main.py",
            "--cfg",
            "configs/vm_asr_48k_MPD.yaml",
            "--resume",
            "logs/DualStreamInteractiveMambaUNet/48k_FullData_MPD",
            "--input",
            str(input_path),
            "--inference",
            "--output",
            str(output_root),
            "--tag",
            "soundfix_probe",
        ]

        print(
            "[soundfix] VM-ASR started "
            f"input_sample_rate={sample_rate} "
            f"input_path={input_path}",
            flush=True,
        )

        completed = subprocess.run(
            command,
            cwd="/opt/vmasr",
            check=True,
            capture_output=True,
            text=True,
        )

        if completed.stdout:
            print(completed.stdout, flush=True)

        if completed.stderr:
            print(completed.stderr, flush=True)

        output_path = _find_latest_wav(output_root)

        with open(output_path, "rb") as output_file:
            output_audio_bytes = output_file.read()

        output_audio, output_sample_rate = sf.read(
            BytesIO(output_audio_bytes),
            always_2d=True,
        )

        print(
            "[soundfix] VM-ASR completed "
            f"output_path={output_path} "
            f"output_sample_rate={output_sample_rate} "
            f"output_shape={tuple(output_audio.shape)} "
            f"seconds={perf_counter() - started_at:.3f} "
            f"output_size_bytes={len(output_audio_bytes)}",
            flush=True,
        )

        return output_audio_bytes


@app.local_entrypoint()
def main(input_path: str, output_path: str = "vmasr_reconstructed.wav"):
    input_path_obj = Path(input_path)

    with open(input_path_obj, "rb") as input_file:
        input_audio_bytes = input_file.read()

    output_audio_bytes = reconstruct_with_vmasr_bytes.remote(input_audio_bytes)

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
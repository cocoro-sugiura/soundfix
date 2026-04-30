from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter
import subprocess

import modal
import soundfile as sf


app = modal.App("soundfix-sgmse-probe")

SGMSE_EARS_WHAM_GDOWN_ID = "1t_DLLk8iPH6nj8M5wGeOP3jFPaz3i7K5"

image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.1-devel-ubuntu22.04",
        add_python="3.11",
    )
    .apt_install(
        "ffmpeg",
        "git",
        "libsndfile1",
        "sox",
        "build-essential",
        "ninja-build",
        "g++",
    )
    .env(
        {
            "CUDA_HOME": "/usr/local/cuda",
            "CC": "gcc",
            "CXX": "g++",
        }
    )
    .pip_install(
        "torch==2.3.0",
        "torchaudio==2.3.0",
        "torchvision==0.18.0",
        index_url="https://download.pytorch.org/whl/cu121",
    )
    .pip_install(
        "gdown",
        "numpy==1.26.4",
        "soundfile==0.12.1",
        "librosa==0.10.2.post1",
        "scipy==1.11.4",
        "matplotlib",
        "pytorch-lightning",
        "torch-ema",
        "wandb",
        "torchsde",
        "pesq",
        "pystoi",
        "packaging",
        "ninja",
        "wheel",
        "setuptools",
    )
    .run_commands(
        "python --version",
        "nvcc --version",
        "echo CUDA_HOME=$CUDA_HOME",
        "python -c \"import torch; print('torch', torch.__version__); print('torch cuda', torch.version.cuda)\"",
        "git clone https://github.com/sp-uhh/sgmse.git /opt/sgmse",
        "pip install -r /opt/sgmse/requirements.txt",
        f"mkdir -p /opt/sgmse/checkpoints && gdown {SGMSE_EARS_WHAM_GDOWN_ID} -O /opt/sgmse/checkpoints/ears_wham.ckpt",
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
def reconstruct_with_sgmse_bytes(audio_bytes: bytes) -> bytes:
    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        test_dir = temp_path / "test"
        noisy_dir = test_dir / "noisy"
        enhanced_dir = temp_path / "enhanced"

        noisy_dir.mkdir(parents=True, exist_ok=True)
        enhanced_dir.mkdir(parents=True, exist_ok=True)

        input_path = noisy_dir / "input.wav"

        audio, sample_rate = sf.read(BytesIO(audio_bytes), always_2d=True)
        sf.write(input_path, audio, sample_rate, format="WAV")

        command = [
            "python",
            "enhancement.py",
            "--test_dir",
            str(test_dir),
            "--enhanced_dir",
            str(enhanced_dir),
            "--ckpt",
            "/opt/sgmse/checkpoints/ears_wham.ckpt",
        ]

        print(
            "[soundfix] SGMSE started "
            f"input_sample_rate={sample_rate} "
            f"input_path={input_path}",
            flush=True,
        )

        completed = subprocess.run(
            command,
            cwd="/opt/sgmse",
            check=False,
            capture_output=True,
            text=True,
        )

        if completed.stdout:
            print(completed.stdout, flush=True)

        if completed.stderr:
            print(completed.stderr, flush=True)

        if completed.returncode != 0:
            raise RuntimeError(
                "SGMSE inference failed "
                f"returncode={completed.returncode}"
            )

        output_path = _find_latest_wav(enhanced_dir)

        with open(output_path, "rb") as output_file:
            output_audio_bytes = output_file.read()

        output_audio, output_sample_rate = sf.read(
            BytesIO(output_audio_bytes),
            always_2d=True,
        )

        print(
            "[soundfix] SGMSE completed "
            f"output_path={output_path} "
            f"output_sample_rate={output_sample_rate} "
            f"output_shape={tuple(output_audio.shape)} "
            f"seconds={perf_counter() - started_at:.3f} "
            f"output_size_bytes={len(output_audio_bytes)}",
            flush=True,
        )

        return output_audio_bytes


@app.local_entrypoint()
def main(input_path: str, output_path: str = "sgmse_reconstructed.wav"):
    input_path_obj = Path(input_path)

    with open(input_path_obj, "rb") as input_file:
        input_audio_bytes = input_file.read()

    output_audio_bytes = reconstruct_with_sgmse_bytes.remote(input_audio_bytes)

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
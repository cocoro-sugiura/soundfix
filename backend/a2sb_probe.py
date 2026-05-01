from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from time import perf_counter

import modal


app = modal.App("soundfix-a2sb-probe")

image = (
    modal.Image.from_registry(
        "nvidia/cuda:12.1.1-devel-ubuntu22.04",
        add_python="3.10",
    )
    .apt_install(
        "ffmpeg",
        "git",
        "libsndfile1",
        "sox",
    )
    .pip_install(
        "numpy==1.26.4",
        "soundfile==0.12.1",
        "scipy==1.11.4",
        "torch==2.3.0",
        "torchaudio==2.3.0",
        "torchvision==0.18.0",
        "librosa==0.10.2.post1",
        "einops",
        "omegaconf",
        "tqdm",
        "matplotlib",
        "huggingface_hub",
        "pyyaml",
        "jsonargparse[signatures]",
        "pytorch-lightning",
        "rotary-embedding-torch",
        "ssr-eval",
    )
    .run_commands(
        "git clone https://github.com/NVIDIA/diffusion-audio-restoration.git /opt/a2sb || true",
        "find /opt/a2sb -maxdepth 2 -type f | sort | head -200",
    )
)


def _run_command(command: list[str], cwd: str | None = None) -> None:
    print(
        {
            "command": command,
            "cwd": cwd,
        },
        flush=True,
    )

    completed = run(
        command,
        cwd=cwd,
        check=False,
        capture_output=True,
        text=True,
    )

    print(completed.stdout, flush=True)
    print(completed.stderr, flush=True)

    if completed.returncode != 0:
        raise RuntimeError(
            f"Command failed with code {completed.returncode}: {' '.join(command)}"
        )


@app.function(
    image=image,
    gpu="L4",
    timeout=1200,
)
def inspect_a2sb_environment() -> dict:
    started_at = perf_counter()

    repo_path = Path("/opt/a2sb")
    files = []

    if repo_path.exists():
        for path in sorted(repo_path.rglob("*")):
            if path.is_file():
                files.append(str(path.relative_to(repo_path)))

            if len(files) >= 200:
                break

    result = {
        "repo_exists": repo_path.exists(),
        "files": files,
        "elapsed_seconds": float(perf_counter() - started_at),
    }

    print(result, flush=True)

    return result


@app.function(
    image=image,
    gpu="L4",
    timeout=1800,
)
def run_a2sb_probe(input_audio_bytes: bytes) -> bytes:
    import soundfile as sf

    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.wav"
        output_path = temp_path / "a2sb_output.wav"

        input_path.write_bytes(input_audio_bytes)

        print(
            {
                "input_path": str(input_path),
                "output_path": str(output_path),
                "input_size_bytes": len(input_audio_bytes),
            },
            flush=True,
        )

        repo_path = Path("/opt/a2sb")

        if not repo_path.exists():
            raise RuntimeError("A2SB repository was not cloned to /opt/a2sb")

        command = [
            "python",
            "A2SB_upsample_api.py",
            "-f",
            str(input_path),
            "-o",
            str(output_path),
            "-n",
            "25",
        ]

        _run_command(command, cwd=str(repo_path / "inference"))

        if not output_path.exists():
            wav_outputs = sorted(temp_path.rglob("*.wav"))

            raise RuntimeError(
                "A2SB probe did not produce the expected output wav. "
                f"expected_output={str(output_path)} "
                f"temp_wavs={[str(path) for path in wav_outputs]}"
            )

        audio, sample_rate = sf.read(output_path, always_2d=True)

        print(
            {
                "output_path": str(output_path),
                "output_shape": tuple(audio.shape),
                "output_sample_rate": int(sample_rate),
                "elapsed_seconds": float(perf_counter() - started_at),
            },
            flush=True,
        )

        return output_path.read_bytes()


@app.local_entrypoint()
def main(
    input_path: str = "backend/test_acapella_ineedyourlove.mp3",
    output_path: str = "a2sb_ineedyourlove.wav",
    inspect_only: bool = False,
):
    if inspect_only:
        result = inspect_a2sb_environment.remote()
        print(result)
        return

    with open(input_path, "rb") as input_file:
        input_audio_bytes = input_file.read()

    output_audio_bytes = run_a2sb_probe.remote(input_audio_bytes)

    with open(output_path, "wb") as output_file:
        output_file.write(output_audio_bytes)

    print(f"Saved output to {output_path}")

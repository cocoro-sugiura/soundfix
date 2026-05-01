from pathlib import Path
from subprocess import run
from tempfile import TemporaryDirectory
from time import perf_counter

import modal


app = modal.App("soundfix-apollo-probe")

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
        "librosa==0.10.2.post1",
        "torch==2.3.0",
        "torchaudio==2.3.0",
        "torchvision==0.18.0",
        "huggingface_hub",
        "pyyaml",
        "tqdm",
        "ml_collections",
        "einops",
        "rotary-embedding-torch",
        "segmentation-models-pytorch",
        "timm",
        "omegaconf",
        "torchcodec",
    )
    .run_commands(
        "git clone https://github.com/ZFTurbo/Music-Source-Separation-Training.git /opt/msst || true",
        "python -m pip install -r /opt/msst/requirements.txt || true",
        "mkdir -p /opt/apollo",
        "python -c \"from huggingface_hub import snapshot_download; snapshot_download(repo_id='baicai1145/Apollo-vocal-msst', local_dir='/opt/apollo', local_dir_use_symlinks=False)\"",
        "find /opt/apollo -maxdepth 3 -type f | sort",
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
    timeout=1800,
)
def run_apollo_probe(input_audio_bytes: bytes) -> bytes:
    import librosa
    import soundfile as sf

    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_dir = temp_path / "input"
        output_dir = temp_path / "output"
        input_dir.mkdir(parents=True, exist_ok=True)
        output_dir.mkdir(parents=True, exist_ok=True)

        input_path = input_dir / "input.wav"
        input_path.write_bytes(input_audio_bytes)

        apollo_path = Path("/opt/apollo")
        msst_path = Path("/opt/msst")

        config_candidates = sorted(apollo_path.rglob("*.yaml"))
        checkpoint_candidates = sorted(apollo_path.rglob("*.ckpt"))

        if not config_candidates:
            raise RuntimeError("Apollo config yaml was not found.")

        if not checkpoint_candidates:
            raise RuntimeError("Apollo checkpoint was not found.")

        config_path = config_candidates[0]
        checkpoint_path = checkpoint_candidates[0]

        for candidate in config_candidates:
            if "config_apollo" in candidate.name:
                config_path = candidate
                break

        for candidate in checkpoint_candidates:
            if "model_apollo" in candidate.name:
                checkpoint_path = candidate
                break

        print(
            {
                "input_path": str(input_path),
                "output_dir": str(output_dir),
                "config_path": str(config_path),
                "checkpoint_path": str(checkpoint_path),
            },
            flush=True,
        )

        command = [
            "python",
            "inference.py",
            "--model_type",
            "apollo",
            "--config_path",
            str(config_path),
            "--start_check_point",
            str(checkpoint_path),
            "--input_folder",
            str(input_dir),
            "--store_dir",
            str(output_dir),
            "--device_ids",
            "0",
            "--pcm_type",
            "FLOAT",
        ]

        _run_command(command, cwd=str(msst_path))

        wav_outputs = sorted(output_dir.rglob("*.wav"))

        if not wav_outputs:
            raise RuntimeError(
                "Apollo probe did not produce a wav output. "
                f"output_files={[str(path) for path in sorted(output_dir.rglob('*'))]}"
            )

        output_path = wav_outputs[0]

        if len(wav_outputs) > 1:
            output_path = max(wav_outputs, key=lambda path: path.stat().st_size)

        audio, sample_rate = sf.read(output_path, always_2d=True)

        output_mono = audio[:, 0] if audio.ndim > 1 else audio
        output_rolloff = librosa.feature.spectral_rolloff(
            y=output_mono.astype("float32"),
            sr=sample_rate,
            roll_percent=0.99,
        )[0]

        print(
            {
                "output_path": str(output_path),
                "all_wav_outputs": [str(path) for path in wav_outputs],
                "output_shape": tuple(audio.shape),
                "output_sample_rate": int(sample_rate),
                "output_rolloff_99_mean_hz": int(output_rolloff.mean()),
                "elapsed_seconds": float(perf_counter() - started_at),
            },
            flush=True,
        )

        return output_path.read_bytes()


@app.local_entrypoint()
def main(
    input_path: str = "backend/test_acapella_ineedyourlove.mp3",
    output_path: str = "apollo_ineedyourlove.wav",
):
    with open(input_path, "rb") as input_file:
        input_audio_bytes = input_file.read()

    output_audio_bytes = run_apollo_probe.remote(input_audio_bytes)

    with open(output_path, "wb") as output_file:
        output_file.write(output_audio_bytes)

    print(f"Saved output to {output_path}")
from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

import modal


app = modal.App("soundfix-demucs-probe")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "ffmpeg",
        "git",
    )
    .pip_install(
        "demucs",
        "numpy==1.26.4",
        "soundfile==0.12.1",
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=1200,
)
def run_demucs_probe(input_audio_bytes: bytes) -> bytes:
    import subprocess
    import soundfile as sf

    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)

        input_path = temp_path / "input.wav"
        output_dir = temp_path / "output"

        input_path.write_bytes(input_audio_bytes)

        cmd = [
            "python",
            "-m",
            "demucs",
            str(input_path),
            "-o",
            str(output_dir),
        ]

        subprocess.run(cmd, check=True)

        # vocal抽出
        vocal_path = list(output_dir.rglob("vocals.wav"))[0]

        audio, sr = sf.read(vocal_path)

        print(
            {
                "vocal_path": str(vocal_path),
                "shape": audio.shape,
                "sr": sr,
                "elapsed": perf_counter() - started_at,
            }
        )

        return vocal_path.read_bytes()


@app.local_entrypoint()
def main(
    input_path: str = "backend/test_acapella_ineedyourlove.mp3",
    output_path: str = "demucs_ineedyourlove.wav",
):
    with open(input_path, "rb") as f:
        data = f.read()

    out = run_demucs_probe.remote(data)

    with open(output_path, "wb") as f:
        f.write(out)

    print("saved:", output_path)
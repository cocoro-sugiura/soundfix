from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

import modal


app = modal.App("soundfix-voicefixer-probe")

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
        "torch==2.3.0",
        "torchaudio==2.3.0",
        "torchvision==0.18.0",
        "voicefixer",
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=1200,
)
def run_voicefixer_probe(input_audio_bytes: bytes, mode: int = 0) -> bytes:
    import librosa
    import soundfile as sf
    from voicefixer import VoiceFixer

    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.wav"
        output_path = temp_path / "voicefixer_output.wav"

        input_path.write_bytes(input_audio_bytes)

        print(
            {
                "input_path": str(input_path),
                "output_path": str(output_path),
                "input_size_bytes": len(input_audio_bytes),
                "mode": int(mode),
            },
            flush=True,
        )

        voicefixer = VoiceFixer()

        voicefixer.restore(
            input=str(input_path),
            output=str(output_path),
            cuda=True,
            mode=int(mode),
        )

        if not output_path.exists():
            wav_outputs = sorted(temp_path.rglob("*.wav"))

            raise RuntimeError(
                "VoiceFixer probe did not produce the expected output wav. "
                f"expected_output={str(output_path)} "
                f"temp_wavs={[str(path) for path in wav_outputs]}"
            )

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
    output_path: str = "voicefixer_ineedyourlove.wav",
    mode: int = 0,
):
    with open(input_path, "rb") as input_file:
        input_audio_bytes = input_file.read()

    output_audio_bytes = run_voicefixer_probe.remote(input_audio_bytes, mode)

    with open(output_path, "wb") as output_file:
        output_file.write(output_audio_bytes)

    print(f"Saved output to {output_path}")
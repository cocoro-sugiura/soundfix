from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

import modal


app = modal.App("soundfix-stable-audio-probe")

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
        "diffusers",
        "transformers",
        "accelerate",
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=1200,
)
def run_stable_audio_probe(input_audio_bytes: bytes) -> bytes:
    import torch
    import soundfile as sf
    import librosa
    from diffusers import StableAudioPipeline

    started_at = perf_counter()

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.wav"
        output_path = temp_path / "stable_audio_output.wav"

        input_path.write_bytes(input_audio_bytes)

        print(
            {
                "input_path": str(input_path),
                "input_size_bytes": len(input_audio_bytes),
            },
            flush=True,
        )

        pipe = StableAudioPipeline.from_pretrained(
            "stabilityai/stable-audio-open-1.0",
            torch_dtype=torch.float16,
        ).to("cuda")

        # 入力音声読み込み
        audio, sr = librosa.load(input_path, sr=16000)

        # 条件として使う
        output = pipe(
            audio=audio,
            sample_rate=16000,
            num_inference_steps=50,
        )

        generated = output.audios[0]

        sf.write(output_path, generated, 44100)

        audio_out, sr_out = sf.read(output_path)

        print(
            {
                "output_path": str(output_path),
                "output_shape": audio_out.shape,
                "sample_rate": sr_out,
                "elapsed_seconds": perf_counter() - started_at,
            },
            flush=True,
        )

        return output_path.read_bytes()


@app.local_entrypoint()
def main(
    input_path: str = "backend/test_acapella_ineedyourlove.mp3",
    output_path: str = "stable_audio_ineedyourlove.wav",
):
    with open(input_path, "rb") as f:
        input_audio_bytes = f.read()

    output_audio_bytes = run_stable_audio_probe.remote(input_audio_bytes)

    with open(output_path, "wb") as f:
        f.write(output_audio_bytes)

    print(f"Saved output to {output_path}")
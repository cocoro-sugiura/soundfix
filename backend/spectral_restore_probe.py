from pathlib import Path

import modal


app = modal.App("soundfix-spectral-restore-probe")

image = (
    modal.Image.debian_slim(python_version="3.10")
    .apt_install(
        "ffmpeg",
        "libsndfile1",
    )
    .pip_install(
        "numpy==1.26.4",
        "librosa==0.10.2.post1",
        "soundfile==0.12.1",
        "torch==2.3.0",
        "torchaudio==2.3.0",
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=600,
)
def restore_with_spectral_model(
    input_audio_bytes: bytes,
    model_bytes: bytes,
    residual_amount: float = 0.25,
) -> bytes:
    import numpy as np
    import soundfile as sf
    import torch
    import torch.nn as nn
    import librosa
    from tempfile import TemporaryDirectory

    class SpectralResidualNet(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv2d(1, 16, 3, padding=1),
                nn.ReLU(),
                nn.Conv2d(16, 32, 3, padding=1),
                nn.ReLU(),
                nn.Conv2d(32, 32, 3, padding=1),
                nn.ReLU(),
                nn.Conv2d(32, 16, 3, padding=1),
                nn.ReLU(),
                nn.Conv2d(16, 1, 3, padding=1),
            )

        def forward(self, x):
            return self.net(x)

    def peak_normalize(audio: np.ndarray, target: float = 0.95) -> np.ndarray:
        peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0

        if peak > 0:
            audio = audio / peak * target

        return np.clip(audio, -1.0, 1.0).astype(np.float32)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        input_path = temp_path / "input.wav"
        model_path = temp_path / "spectral_residual_model.pt"
        output_path = temp_path / "spectral_restored.wav"

        input_path.write_bytes(input_audio_bytes)
        model_path.write_bytes(model_bytes)

        checkpoint = torch.load(model_path, map_location=device)
        sample_rate = int(checkpoint["sample_rate"])
        n_fft = int(checkpoint["n_fft"])
        hop_length = int(checkpoint["hop_length"])

        audio, _ = librosa.load(input_path, sr=sample_rate, mono=True)
        audio = torch.from_numpy(audio).float().to(device)

        window = torch.hann_window(n_fft, device=device)

        spec = torch.stft(
            audio,
            n_fft=n_fft,
            hop_length=hop_length,
            win_length=n_fft,
            window=window,
            return_complex=True,
        )

        mag = torch.abs(spec)
        phase = torch.angle(spec)
        logmag = torch.log1p(mag)

        model = SpectralResidualNet().to(device)
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()

        with torch.no_grad():
            x = logmag.unsqueeze(0).unsqueeze(0)
            predicted_log_residual = model(x).squeeze(0).squeeze(0)

        freq_bins = logmag.shape[0]
        freqs = torch.linspace(0, sample_rate / 2, freq_bins, device=device)

        band_mask = torch.zeros_like(freqs)
        band_mask = torch.where((freqs >= 2000) & (freqs <= 12000), torch.ones_like(band_mask), band_mask)
        band_mask = torch.where((freqs > 12000) & (freqs <= 15500), torch.ones_like(band_mask) * 0.25, band_mask)
        band_mask = band_mask.view(-1, 1)

        voice_energy = logmag[(freqs >= 250) & (freqs <= 5000)].mean(dim=0)
        voice_floor = torch.quantile(voice_energy, 0.35)
        voice_peak = torch.quantile(voice_energy, 0.95)
        voice_mask = torch.clamp((voice_energy - voice_floor) / (voice_peak - voice_floor + 1e-6), 0.0, 1.0)
        voice_mask = voice_mask.view(1, -1)

        predicted_log_residual = torch.clamp(predicted_log_residual, min=-0.25, max=0.35)
        controlled_residual = predicted_log_residual * band_mask * voice_mask

        restored_logmag = logmag + controlled_residual * float(residual_amount)
        restored_logmag = torch.clamp(restored_logmag, min=0.0)
        restored_mag = torch.expm1(restored_logmag)

        restored_spec = restored_mag * torch.exp(1j * phase)

        restored_audio = torch.istft(
            restored_spec,
            n_fft=n_fft,
            hop_length=hop_length,
            win_length=n_fft,
            window=window,
            length=audio.shape[0],
        )

        restored_np = restored_audio.detach().cpu().numpy().astype(np.float32)
        restored_np = peak_normalize(restored_np)

        sf.write(output_path, restored_np, sample_rate, format="WAV")

        print(
            {
                "output": str(output_path),
                "sample_rate": sample_rate,
                "duration_seconds": float(restored_np.shape[0] / sample_rate),
                "residual_amount": float(residual_amount),
                "device": device,
            },
            flush=True,
        )

        return output_path.read_bytes()


@app.local_entrypoint()
def main(
    input_path: str = "backend/test_acapella_ineedyourlove.mp3",
    model_path: str = "backend/spectral_residual_model.pt",
    output_path: str = "spectral_restored_ineedyourlove.wav",
    residual_amount: float = 0.25,
):
    with open(input_path, "rb") as input_file:
        input_audio_bytes = input_file.read()

    with open(model_path, "rb") as model_file:
        model_bytes = model_file.read()

    output_audio_bytes = restore_with_spectral_model.remote(
        input_audio_bytes,
        model_bytes,
        residual_amount,
    )

    with open(output_path, "wb") as output_file:
        output_file.write(output_audio_bytes)

    print(f"Saved output to {output_path}")
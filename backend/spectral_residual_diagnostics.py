from pathlib import Path

import modal


app = modal.App("soundfix-spectral-residual-diagnostics")

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
def run_diagnostics(
    degraded_audio_bytes: bytes,
    studio_audio_bytes: bytes,
    model_bytes: bytes,
) -> dict:
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

    device = "cuda" if torch.cuda.is_available() else "cpu"

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        degraded_path = temp_path / "degraded.wav"
        studio_path = temp_path / "studio.wav"
        model_path = temp_path / "spectral_residual_model.pt"

        degraded_path.write_bytes(degraded_audio_bytes)
        studio_path.write_bytes(studio_audio_bytes)
        model_path.write_bytes(model_bytes)

        checkpoint = torch.load(model_path, map_location=device)
        sample_rate = int(checkpoint["sample_rate"])
        n_fft = int(checkpoint["n_fft"])
        hop_length = int(checkpoint["hop_length"])

        def load_logmag(path):
            audio, _ = librosa.load(path, sr=sample_rate, mono=True)
            audio = torch.from_numpy(audio).float().to(device)

            spec = torch.stft(
                audio,
                n_fft=n_fft,
                hop_length=hop_length,
                win_length=n_fft,
                window=torch.hann_window(n_fft, device=device),
                return_complex=True,
            )

            return torch.log1p(torch.abs(spec))

        degraded_logmag = load_logmag(degraded_path)
        studio_logmag = load_logmag(studio_path)

        min_frames = min(degraded_logmag.shape[-1], studio_logmag.shape[-1])
        degraded_logmag = degraded_logmag[:, :min_frames]
        studio_logmag = studio_logmag[:, :min_frames]

        true_residual = studio_logmag - degraded_logmag

        model = SpectralResidualNet().to(device)
        model.load_state_dict(checkpoint["state_dict"])
        model.eval()

        with torch.no_grad():
            predicted_residual = model(degraded_logmag.unsqueeze(0).unsqueeze(0)).squeeze(0).squeeze(0)

        freq_bins = degraded_logmag.shape[0]
        freqs = torch.linspace(0, sample_rate / 2, freq_bins, device=device)

        bands = [
            ("body", 0, 2000),
            ("presence", 2000, 4000),
            ("clarity", 4000, 8000),
            ("air_density", 8000, 12000),
            ("air_top", 12000, 18000),
        ]

        stats = []

        for name, low_hz, high_hz in bands:
            mask = (freqs >= low_hz) & (freqs < high_hz)

            pred = predicted_residual[mask].reshape(-1)
            true = true_residual[mask].reshape(-1)

            pred_energy = torch.mean(pred ** 2).item()
            true_energy = torch.mean(true ** 2).item()

            denom = torch.sqrt(torch.sum(pred ** 2) * torch.sum(true ** 2) + 1e-8)
            similarity = (torch.sum(pred * true) / denom).item()

            stats.append(
                {
                    "band": name,
                    "low_hz": low_hz,
                    "high_hz": high_hz,
                    "similarity": float(similarity),
                    "pred_energy": float(pred_energy),
                    "true_energy": float(true_energy),
                    "energy_ratio_pred_to_true": float(pred_energy / (true_energy + 1e-8)),
                }
            )

        result = {
            "sample_rate": sample_rate,
            "n_fft": n_fft,
            "hop_length": hop_length,
            "frames": int(min_frames),
            "device": device,
            "bands": stats,
        }

        print(result, flush=True)

        return result


@app.local_entrypoint()
def main(
    degraded_path: str = "backend/test_acapella_ineedyourlove.mp3",
    studio_path: str = "backend/studio_acapella.wav",
    model_path: str = "backend/spectral_residual_model.pt",
):
    with open(degraded_path, "rb") as input_file:
        degraded_audio_bytes = input_file.read()

    with open(studio_path, "rb") as studio_file:
        studio_audio_bytes = studio_file.read()

    with open(model_path, "rb") as model_file:
        model_bytes = model_file.read()

    result = run_diagnostics.remote(
        degraded_audio_bytes,
        studio_audio_bytes,
        model_bytes,
    )

    print(result)
from pathlib import Path

import modal


app = modal.App("soundfix-spectral-residual-train-probe")

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
    .add_local_dir(
        "backend/data",
        remote_path="/root/backend/data",
    )
)


@app.function(
    image=image,
    gpu="L4",
    timeout=1800,
)
def train_spectral_residual_probe() -> bytes:
    import torch
    import torch.nn as nn
    import librosa

    device = "cuda" if torch.cuda.is_available() else "cpu"

    sample_rate = 44100
    n_fft = 2048
    hop_length = 512

    def audio_to_logmag(path):
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

        mag = torch.abs(spec)
        logmag = torch.log1p(mag)

        return logmag

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

    data_dir = Path("/root/backend/data")
    inputs = sorted((data_dir / "input").glob("*.wav"))
    targets = sorted((data_dir / "target").glob("*.wav"))

    if not inputs:
        raise RuntimeError(f"No training inputs found in {data_dir / 'input'}")

    model = SpectralResidualNet().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=2e-4)

    for epoch in range(20):
        total = 0.0

        for inp, tgt in zip(inputs, targets):
            input_logmag = audio_to_logmag(inp)
            target_logmag = audio_to_logmag(tgt)

            min_frames = min(input_logmag.shape[-1], target_logmag.shape[-1])
            input_logmag = input_logmag[:, :min_frames]
            target_logmag = target_logmag[:, :min_frames]

            target_residual = target_logmag - input_logmag

            x = input_logmag.unsqueeze(0).unsqueeze(0)
            y = target_residual.unsqueeze(0).unsqueeze(0)

            pred = model(x)

            freq_bins = input_logmag.shape[0]
            freqs = torch.linspace(0, sample_rate / 2, freq_bins, device=device)
            weight = torch.ones_like(freqs)
            weight = torch.where((freqs >= 2000) & (freqs <= 12000), weight * 4.0, weight)
            weight = torch.where(freqs > 12000, weight * 2.0, weight)
            weight = weight.view(1, 1, -1, 1)

            loss = ((pred - y) ** 2 * weight).mean()

            opt.zero_grad()
            loss.backward()
            opt.step()

            total += float(loss.item())

        if epoch % 2 == 0:
            print(
                {
                    "epoch": epoch,
                    "loss": total / len(inputs),
                    "device": device,
                    "pairs": len(inputs),
                },
                flush=True,
            )

    model_path = Path("/tmp/spectral_residual_model.pt")
    torch.save(
        {
            "state_dict": model.state_dict(),
            "sample_rate": sample_rate,
            "n_fft": n_fft,
            "hop_length": hop_length,
        },
        model_path,
    )

    return model_path.read_bytes()


@app.local_entrypoint()
def main(output_path: str = "backend/spectral_residual_model.pt"):
    model_bytes = train_spectral_residual_probe.remote()

    with open(output_path, "wb") as output_file:
        output_file.write(model_bytes)

    print(f"Saved model to {output_path}")
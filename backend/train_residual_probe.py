# backend/train_residual_probe.py
from pathlib import Path

import modal


app = modal.App("soundfix-residual-train-probe")

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
    timeout=1200,
)
def train_residual_probe() -> bytes:
    import torch
    import torch.nn as nn
    import librosa

    device = "cuda" if torch.cuda.is_available() else "cpu"

    def load_pair(inp, tgt):
        x, _ = librosa.load(inp, sr=22050)
        y, _ = librosa.load(tgt, sr=22050)

        x = torch.from_numpy(x).float().to(device)
        y = torch.from_numpy(y).float().to(device)

        min_len = min(x.shape[0], y.shape[0])
        return x[:min_len], y[:min_len]

    class Simple1D(nn.Module):
        def __init__(self):
            super().__init__()
            self.net = nn.Sequential(
                nn.Conv1d(1, 32, 9, padding=4),
                nn.ReLU(),
                nn.Conv1d(32, 64, 9, padding=4),
                nn.ReLU(),
                nn.Conv1d(64, 32, 9, padding=4),
                nn.ReLU(),
                nn.Conv1d(32, 1, 9, padding=4),
            )

        def forward(self, x):
            return self.net(x)

    data_dir = Path("/root/backend/data")
    inputs = sorted((data_dir / "input").glob("*.wav"))
    targets = sorted((data_dir / "target").glob("*.wav"))

    if not inputs:
        raise RuntimeError(f"No training inputs found in {data_dir / 'input'}")

    model = Simple1D().to(device)
    opt = torch.optim.Adam(model.parameters(), lr=1e-3)

    for epoch in range(80):
        total = 0.0

        for inp, tgt in zip(inputs, targets):
            x, y = load_pair(inp, tgt)

            x = x.unsqueeze(0).unsqueeze(0)
            y = y.unsqueeze(0).unsqueeze(0)

            residual = y - x
            pred = model(x)

            loss = ((pred - residual) ** 2).mean()

            opt.zero_grad()
            loss.backward()
            opt.step()

            total += float(loss.item())

        if epoch % 5 == 0:
            print(
                {
                    "epoch": epoch,
                    "loss": total / len(inputs),
                    "device": device,
                    "pairs": len(inputs),
                },
                flush=True,
            )

    model_path = Path("/tmp/residual_model.pt")
    torch.save(model.state_dict(), model_path)

    return model_path.read_bytes()


@app.local_entrypoint()
def main(output_path: str = "backend/residual_model.pt"):
    model_bytes = train_residual_probe.remote()

    with open(output_path, "wb") as output_file:
        output_file.write(model_bytes)

    print(f"Saved model to {output_path}")
from pathlib import Path

import numpy as np
import soundfile as sf
import librosa
import torch
import torch.nn as nn


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


def peak_normalize(audio: np.ndarray, target: float = 0.95) -> np.ndarray:
    peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0

    if peak > 0:
        audio = audio / peak * target

    return np.clip(audio, -1.0, 1.0).astype(np.float32)


def main() -> None:
    input_path = Path("backend/test_acapella_ineedyourlove.mp3")
    model_path = Path("backend/residual_model.pt")
    output_path = Path("residual_restored_ineedyourlove.wav")

    sample_rate = 22050
    residual_amount = 0.35

    audio, _ = librosa.load(input_path, sr=sample_rate)
    audio = audio.astype(np.float32)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    model = Simple1D().to(device)
    model.load_state_dict(torch.load(model_path, map_location=device))
    model.eval()

    with torch.no_grad():
        x = torch.from_numpy(audio).float().to(device)
        x = x.unsqueeze(0).unsqueeze(0)

        predicted_residual = model(x)
        predicted_residual = predicted_residual.squeeze().detach().cpu().numpy().astype(np.float32)

    restored = audio + predicted_residual * residual_amount
    restored = peak_normalize(restored)

    sf.write(output_path, restored, sample_rate, format="WAV")

    print(
        {
            "input": str(input_path),
            "model": str(model_path),
            "output": str(output_path),
            "sample_rate": sample_rate,
            "duration_seconds": float(restored.shape[0] / sample_rate),
            "residual_amount": residual_amount,
        }
    )


if __name__ == "__main__":
    main()
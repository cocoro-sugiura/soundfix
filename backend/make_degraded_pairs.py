# backend/make_degraded_pairs.py
from pathlib import Path
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfiltfilt
import random

def band_lowpass(x, sr, cutoff):
    sos = butter(4, cutoff/(sr/2), btype="lowpass", output="sos")
    return sosfiltfilt(sos, x)

def normalize(x):
    m = np.max(np.abs(x)) + 1e-8
    return x / m * 0.9

def main():
    src = Path("backend/studio_acapella.wav")
    out_dir = Path("backend/data")
    (out_dir/"input").mkdir(parents=True, exist_ok=True)
    (out_dir/"target").mkdir(parents=True, exist_ok=True)

    y, sr = sf.read(src)
    if y.ndim > 1:
        y = y.mean(axis=1)

    # 4秒チャンク
    chunk = sr * 4
    idx = 0

    for i in range(0, len(y)-chunk, chunk):
        seg = y[i:i+chunk]

        # ランダム劣化
        cutoff = random.choice([4000, 6000, 8000])
        degraded = band_lowpass(seg, sr, cutoff)

        # 軽いランダムノイズ
        degraded += np.random.randn(len(degraded))*0.002

        degraded = normalize(degraded)
        target = normalize(seg)

        sf.write(out_dir/"input"/f"{idx}.wav", degraded, sr)
        sf.write(out_dir/"target"/f"{idx}.wav", target, sr)
        idx += 1

    print("generated:", idx, "pairs")

if __name__ == "__main__":
    main()
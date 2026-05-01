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


def degrade(x, sr):
    # ランダム劣化
    mode = random.choice(["lp4", "lp6", "lp8", "mix"])

    if mode == "lp4":
        x = band_lowpass(x, sr, 4000)
    elif mode == "lp6":
        x = band_lowpass(x, sr, 6000)
    elif mode == "lp8":
        x = band_lowpass(x, sr, 8000)
    else:
        x = band_lowpass(x, sr, random.choice([4000, 6000, 8000]))

    # ノイズ追加
    x += np.random.randn(len(x)) * 0.003

    return normalize(x)


def main():
    src = Path("backend/i_need_your_love_acapella.mp3")

    out_dir = Path("backend/data")
    (out_dir/"input").mkdir(parents=True, exist_ok=True)
    (out_dir/"target").mkdir(parents=True, exist_ok=True)

    y, sr = sf.read(src)

    if y.ndim > 1:
        y = y.mean(axis=1)

    # 設定
    chunk_sec = 4
    hop_sec = 1

    chunk = int(sr * chunk_sec)
    hop = int(sr * hop_sec)

    idx = 0

    for start in range(0, len(y) - chunk, hop):
        seg = y[start:start+chunk]

        # 10種類の劣化を作る
        for _ in range(10):
            degraded = degrade(seg, sr)

            sf.write(out_dir/"input"/f"{idx}.wav", degraded, sr)
            sf.write(out_dir/"target"/f"{idx}.wav", normalize(seg), sr)

            idx += 1

    print("generated:", idx, "pairs")


if __name__ == "__main__":
    main()
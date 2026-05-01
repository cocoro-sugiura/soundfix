import argparse
from pathlib import Path

import numpy as np
import soundfile as sf
from scipy.signal import butter, resample_poly, sosfiltfilt


def _load_mono_audio(path: Path) -> tuple[np.ndarray, int]:
    audio, sample_rate = sf.read(path, always_2d=True)
    audio = audio.astype(np.float32)

    if audio.shape[1] > 1:
        audio = np.mean(audio, axis=1)
    else:
        audio = audio[:, 0]

    peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0

    if peak > 0:
        audio = audio / peak * 0.95

    return audio.astype(np.float32), int(sample_rate)


def _resample_audio(audio: np.ndarray, source_rate: int, target_rate: int) -> np.ndarray:
    if source_rate == target_rate:
        return audio.astype(np.float32)

    from math import gcd

    common_divisor = gcd(source_rate, target_rate)
    up = target_rate // common_divisor
    down = source_rate // common_divisor

    return resample_poly(audio, up, down).astype(np.float32)


def _match_length(audio: np.ndarray, target_length: int) -> np.ndarray:
    if audio.shape[0] > target_length:
        return audio[:target_length].astype(np.float32)

    if audio.shape[0] < target_length:
        return np.pad(audio, (0, target_length - audio.shape[0])).astype(np.float32)

    return audio.astype(np.float32)


def _filter_band(
    audio: np.ndarray,
    sample_rate: int,
    low_hz: float | None,
    high_hz: float | None,
) -> np.ndarray:
    nyquist = sample_rate / 2

    if low_hz is None and high_hz is None:
        return audio.astype(np.float32)

    if low_hz is None:
        high = min(high_hz / nyquist, 0.999)
        sos = butter(4, high, btype="lowpass", output="sos")
        return sosfiltfilt(sos, audio).astype(np.float32)

    if high_hz is None:
        low = max(low_hz / nyquist, 0.001)
        sos = butter(4, low, btype="highpass", output="sos")
        return sosfiltfilt(sos, audio).astype(np.float32)

    low = max(low_hz / nyquist, 0.001)
    high = min(high_hz / nyquist, 0.999)

    if low >= high:
        return np.zeros_like(audio, dtype=np.float32)

    sos = butter(4, [low, high], btype="bandpass", output="sos")
    return sosfiltfilt(sos, audio).astype(np.float32)


def _soft_limit_audio(audio: np.ndarray, drive: float = 1.08) -> np.ndarray:
    driven = audio * drive
    limited = np.tanh(driven) / np.tanh(drive)
    return limited.astype(np.float32)


def _peak_normalize(audio: np.ndarray, peak_target: float = 0.95) -> np.ndarray:
    peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0

    if peak > 0:
        audio = audio / peak * peak_target

    return np.clip(audio, -1.0, 1.0).astype(np.float32)


def _blend_highband(
    original: np.ndarray,
    ai_output: np.ndarray,
    sample_rate: int,
    mode: str,
    preset: str,
) -> np.ndarray:
    if preset == "conservative":
        bands = [
            (None, 4000, 1.00, 0.00),
            (4000, 8000, 0.90, 0.10),
            (8000, 14000, 0.75, 0.25),
            (14000, None, 0.60, 0.40),
        ]
    elif preset == "aggressive":
        bands = [
            (None, 4000, 1.00, 0.00),
            (4000, 8000, 0.70, 0.30),
            (8000, 14000, 0.45, 0.55),
            (14000, None, 0.25, 0.75),
        ]
    else:
        bands = [
            (None, 4000, 1.00, 0.00),
            (4000, 8000, 0.80, 0.20),
            (8000, 14000, 0.60, 0.40),
            (14000, None, 0.40, 0.60),
        ]

    blended = np.zeros_like(original, dtype=np.float32)

    for low_hz, high_hz, original_amount, ai_amount in bands:
        original_band = _filter_band(original, sample_rate, low_hz, high_hz)
        ai_band = _filter_band(ai_output, sample_rate, low_hz, high_hz)

        if mode == "residual":
            residual_band = ai_band - original_band
            blended += original_band + residual_band * ai_amount
        else:
            blended += original_band * original_amount + ai_band * ai_amount

    return blended.astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Blend AI-generated high-band material into the original vocal.",
    )
    parser.add_argument("--original", required=True, help="Path to the degraded original vocal.")
    parser.add_argument("--ai-output", required=True, help="Path to the AI-generated candidate output.")
    parser.add_argument("--output", required=True, help="Path to write the blended wav.")
    parser.add_argument("--sample-rate", type=int, default=48000)
    parser.add_argument(
        "--mode",
        choices=["band", "residual"],
        default="residual",
        help="Use direct band blend or AI-minus-original residual blend.",
    )
    parser.add_argument(
        "--preset",
        choices=["conservative", "default", "aggressive"],
        default="default",
    )

    args = parser.parse_args()

    original_path = Path(args.original)
    ai_output_path = Path(args.ai_output)
    output_path = Path(args.output)

    original, original_rate = _load_mono_audio(original_path)
    ai_output, ai_rate = _load_mono_audio(ai_output_path)

    original = _resample_audio(original, original_rate, args.sample_rate)
    ai_output = _resample_audio(ai_output, ai_rate, args.sample_rate)

    target_length = min(original.shape[0], ai_output.shape[0])
    original = _match_length(original, target_length)
    ai_output = _match_length(ai_output, target_length)

    blended = _blend_highband(
        original=original,
        ai_output=ai_output,
        sample_rate=args.sample_rate,
        mode=args.mode,
        preset=args.preset,
    )

    blended = _soft_limit_audio(blended, drive=1.08)
    blended = _peak_normalize(blended)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_path, blended, args.sample_rate, format="WAV")

    print(
        {
            "original": str(original_path),
            "ai_output": str(ai_output_path),
            "output": str(output_path),
            "sample_rate": int(args.sample_rate),
            "duration_seconds": float(blended.shape[0] / args.sample_rate),
            "mode": args.mode,
            "preset": args.preset,
        }
    )


if __name__ == "__main__":
    main()

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


def _soft_limit_audio(audio: np.ndarray, drive: float = 1.06) -> np.ndarray:
    driven = audio * drive
    limited = np.tanh(driven) / np.tanh(drive)
    return limited.astype(np.float32)


def _peak_normalize(audio: np.ndarray, peak_target: float = 0.95) -> np.ndarray:
    peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0

    if peak > 0:
        audio = audio / peak * peak_target

    return np.clip(audio, -1.0, 1.0).astype(np.float32)


def _fit_residual_amount(candidate_residual: np.ndarray, target_residual: np.ndarray) -> tuple[float, float]:
    candidate_energy = float(np.dot(candidate_residual, candidate_residual) + 1e-8)
    target_energy = float(np.dot(target_residual, target_residual) + 1e-8)
    similarity = float(np.dot(candidate_residual, target_residual) / np.sqrt(candidate_energy * target_energy))

    amount = float(np.dot(candidate_residual, target_residual) / candidate_energy)
    amount = float(np.clip(amount, 0.0, 0.65))

    if similarity < 0.08:
        amount = 0.0

    return amount, similarity


def _density_blend(
    original: np.ndarray,
    studio: np.ndarray,
    candidates: list[tuple[str, np.ndarray]],
    sample_rate: int,
) -> np.ndarray:
    bands = [
        (None, 2000, "body", 0.0),
        (2000, 4000, "presence", 0.35),
        (4000, 8000, "clarity", 0.50),
        (8000, 12000, "air_density", 0.55),
        (12000, None, "air_top", 0.35),
    ]

    blended = np.zeros_like(original, dtype=np.float32)
    stats = []

    for low_hz, high_hz, name, max_amount in bands:
        original_band = _filter_band(original, sample_rate, low_hz, high_hz)

        if max_amount <= 0:
            blended += original_band
            stats.append(
                {
                    "band": name,
                    "low_hz": low_hz,
                    "high_hz": high_hz,
                    "selected": "original",
                    "amount": 0.0,
                    "similarity": None,
                }
            )
            continue

        studio_band = _filter_band(studio, sample_rate, low_hz, high_hz)
        target_residual = studio_band - original_band

        best_name = None
        best_residual = None
        best_amount = 0.0
        best_similarity = -1.0

        for candidate_name, candidate_audio in candidates:
            candidate_band = _filter_band(candidate_audio, sample_rate, low_hz, high_hz)
            candidate_residual = candidate_band - original_band
            amount, similarity = _fit_residual_amount(candidate_residual, target_residual)

            if similarity > best_similarity:
                best_name = candidate_name
                best_residual = candidate_residual
                best_amount = min(amount, max_amount)
                best_similarity = similarity

        if best_residual is None:
            blended += original_band
            continue

        blended += original_band + best_residual * best_amount

        stats.append(
            {
                "band": name,
                "low_hz": low_hz,
                "high_hz": high_hz,
                "selected": best_name,
                "amount": float(best_amount),
                "similarity": float(best_similarity),
            }
        )

    print({"density_blend_stats": stats})

    return blended.astype(np.float32)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Oracle density blend probe for Soundfix vocal restoration.",
    )
    parser.add_argument("--original", required=True)
    parser.add_argument("--studio", required=True)
    parser.add_argument("--candidate", action="append", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--sample-rate", type=int, default=44100)

    args = parser.parse_args()

    original_path = Path(args.original)
    studio_path = Path(args.studio)
    output_path = Path(args.output)

    original, original_rate = _load_mono_audio(original_path)
    studio, studio_rate = _load_mono_audio(studio_path)

    original = _resample_audio(original, original_rate, args.sample_rate)
    studio = _resample_audio(studio, studio_rate, args.sample_rate)

    candidates = []

    for candidate_value in args.candidate:
        if "=" in candidate_value:
            candidate_name, candidate_path_text = candidate_value.split("=", 1)
        else:
            candidate_path = Path(candidate_value)
            candidate_name = candidate_path.stem
            candidate_path_text = candidate_value

        candidate_path = Path(candidate_path_text)
        candidate_audio, candidate_rate = _load_mono_audio(candidate_path)
        candidate_audio = _resample_audio(candidate_audio, candidate_rate, args.sample_rate)

        candidates.append((candidate_name, candidate_audio))

    target_length = min(
        [original.shape[0], studio.shape[0]]
        + [candidate_audio.shape[0] for _, candidate_audio in candidates]
    )

    original = _match_length(original, target_length)
    studio = _match_length(studio, target_length)
    candidates = [
        (candidate_name, _match_length(candidate_audio, target_length))
        for candidate_name, candidate_audio in candidates
    ]

    blended = _density_blend(
        original=original,
        studio=studio,
        candidates=candidates,
        sample_rate=args.sample_rate,
    )

    blended = _soft_limit_audio(blended)
    blended = _peak_normalize(blended)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(output_path, blended, args.sample_rate, format="WAV")

    print(
        {
            "original": str(original_path),
            "studio": str(studio_path),
            "candidates": [candidate_name for candidate_name, _ in candidates],
            "output": str(output_path),
            "sample_rate": int(args.sample_rate),
            "duration_seconds": float(blended.shape[0] / args.sample_rate),
        }
    )


if __name__ == "__main__":
    main()
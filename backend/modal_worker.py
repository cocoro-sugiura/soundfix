from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from time import perf_counter

import modal
import numpy as np
import soundfile as sf

app = modal.App("soundfix-gpu-worker")

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
        "torch",
        "torchaudio",
        "torchvision",
        "librosa==0.10.2.post1",
        "scipy==1.11.4",
        "transformers==4.30.2",
        "huggingface_hub",
        "diffusers",
        "progressbar",
        "unidecode",
        "einops",
        "omegaconf",
        "phonemizer",
        "torchlibrosa",
        "ftfy",
        "pandas",
        "timm",
        "matplotlib",
        "torchcodec",
        "deepfilternet",
    )
    .run_commands(
        "git clone https://github.com/haoheliu/versatile_audio_super_resolution.git /opt/audiosr"
    )
)

_AUDIOSR_MODEL = None

def _get_audiosr_model():
    global _AUDIOSR_MODEL

    if _AUDIOSR_MODEL is not None:
        return _AUDIOSR_MODEL

    import sys

    if "/opt/audiosr" not in sys.path:
        sys.path.insert(0, "/opt/audiosr")

    import audiosr

    print("[soundfix] loading AudioSR model", flush=True)

    _AUDIOSR_MODEL = audiosr.build_model(
        model_name="basic",
        device="auto",
    )

    print("[soundfix] AudioSR model loaded", flush=True)

    return _AUDIOSR_MODEL


def _soft_limit_audio(audio: np.ndarray, drive: float = 1.15) -> np.ndarray:
    driven = audio * drive
    limited = np.tanh(driven) / np.tanh(drive)
    return limited.astype(np.float32)


def _reduce_voice_noise(audio: np.ndarray, sample_rate: int) -> tuple[np.ndarray, int]:
    import torch
    import torchaudio
    from df.enhance import enhance, init_df

    if audio.size == 0 or sample_rate <= 0:
        return audio, sample_rate

    model, df_state, _ = init_df()
    target_sample_rate = int(df_state.sr())

    waveform = torch.from_numpy(audio).float().unsqueeze(0)

    if sample_rate != target_sample_rate:
        waveform = torchaudio.functional.resample(
            waveform,
            orig_freq=sample_rate,
            new_freq=target_sample_rate,
        )

    with torch.no_grad():
        denoised = enhance(
            model,
            df_state,
            waveform,
        )

    denoised = denoised.squeeze(0).detach().cpu().numpy().astype(np.float32)

    original_peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0
    denoised_peak = float(np.max(np.abs(denoised))) if denoised.size > 0 else 0.0

    if original_peak > 0 and denoised_peak > 0:
        denoised = denoised / denoised_peak * original_peak

    denoise_amount = 0.75
    if sample_rate != target_sample_rate:
        return denoised, target_sample_rate

    mixed = audio * (1.0 - denoise_amount) + denoised * denoise_amount

    return mixed.astype(np.float32), sample_rate


def _smooth_high_band(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    from scipy.signal import butter, sosfiltfilt

    if audio.size == 0 or sample_rate <= 0:
        return audio

    high_start_hz = 7500
    nyquist = sample_rate / 2

    if high_start_hz >= nyquist:
        return audio

    sos = butter(
        2,
        high_start_hz / nyquist,
        btype="highpass",
        output="sos",
    )

    high_band = sosfiltfilt(sos, audio).astype(np.float32)
    smoothed_high = _soft_limit_audio(high_band, drive=1.35)

    return (audio - high_band + smoothed_high * 0.85).astype(np.float32)


def _enhance_vocal_clarity(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    from scipy.signal import butter, sosfiltfilt

    if audio.size == 0 or sample_rate <= 0:
        return audio

    nyquist = sample_rate / 2

    presence_low_hz = 3500
    presence_high_hz = 7500
    air_low_hz = 10000
    air_high_hz = 14500

    if presence_high_hz >= nyquist or air_high_hz >= nyquist:
        return audio

    presence_sos = butter(
        2,
        [presence_low_hz / nyquist, presence_high_hz / nyquist],
        btype="bandpass",
        output="sos",
    )
    air_sos = butter(
        2,
        [air_low_hz / nyquist, air_high_hz / nyquist],
        btype="bandpass",
        output="sos",
    )

    presence_band = sosfiltfilt(presence_sos, audio).astype(np.float32)
    air_band = sosfiltfilt(air_sos, audio).astype(np.float32)

    presence_band = _soft_limit_audio(presence_band, drive=1.15)
    air_band = _soft_limit_audio(air_band, drive=1.25)

    presence_amount = 0.12
    air_amount = 0.10

    enhanced = audio + presence_band * presence_amount + air_band * air_amount

    return enhanced.astype(np.float32)


def _synthesize_vocal_air(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    from scipy.ndimage import uniform_filter1d
    from scipy.signal import butter, sosfiltfilt

    if audio.size == 0 or sample_rate <= 0:
        return audio

    nyquist = sample_rate / 2

    body_low_hz = 1800
    body_high_hz = 5200
    edge_low_hz = 4200
    edge_high_hz = 9500
    air_low_hz = 9500
    air_high_hz = 18500

    if edge_high_hz >= nyquist or air_high_hz >= nyquist:
        return audio

    body_sos = butter(
        2,
        [body_low_hz / nyquist, body_high_hz / nyquist],
        btype="bandpass",
        output="sos",
    )
    edge_sos = butter(
        2,
        [edge_low_hz / nyquist, edge_high_hz / nyquist],
        btype="bandpass",
        output="sos",
    )
    air_sos = butter(
        2,
        [air_low_hz / nyquist, air_high_hz / nyquist],
        btype="bandpass",
        output="sos",
    )

    body_band = sosfiltfilt(body_sos, audio).astype(np.float32)
    edge_band = sosfiltfilt(edge_sos, audio).astype(np.float32)

    body_harmonics = np.tanh(body_band * 7.0).astype(np.float32)
    edge_harmonics = np.sign(edge_band) * np.sqrt(np.abs(edge_band) + 1e-8)
    edge_harmonics = edge_harmonics.astype(np.float32)

    generated = body_harmonics * 0.35 + edge_harmonics * 0.65
    generated = generated - float(np.mean(generated))

    air_band = sosfiltfilt(air_sos, generated).astype(np.float32)

    envelope_window = max(1, int(sample_rate * 0.018))
    voice_envelope = uniform_filter1d(np.abs(body_band), size=envelope_window, mode="nearest")
    envelope_peak = float(np.max(voice_envelope)) if voice_envelope.size > 0 else 0.0

    if envelope_peak > 0:
        voice_mask = np.clip(voice_envelope / (envelope_peak * 0.45), 0.0, 1.0)
    else:
        voice_mask = np.ones_like(audio, dtype=np.float32)

    voice_mask = uniform_filter1d(voice_mask.astype(np.float32), size=envelope_window, mode="nearest")

    air_band = air_band * voice_mask
    air_band = _soft_limit_audio(air_band, drive=1.08)

    air_rms = float(np.sqrt(np.mean(np.square(air_band)) + 1e-8))
    audio_rms = float(np.sqrt(np.mean(np.square(audio)) + 1e-8))

    if air_rms > 0 and audio_rms > 0:
        air_band = air_band / air_rms * audio_rms

    air_amount = 0.26
    enhanced = audio + air_band * air_amount

    return np.clip(enhanced, -1.0, 1.0).astype(np.float32)


def _reduce_high_band_noise(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    from scipy.signal import butter, sosfiltfilt
    from scipy.ndimage import median_filter

    if audio.size == 0 or sample_rate <= 0:
        return audio

    high_start_hz = 6500
    nyquist = sample_rate / 2

    if high_start_hz >= nyquist:
        return audio

    sos = butter(
        2,
        high_start_hz / nyquist,
        btype="highpass",
        output="sos",
    )

    high_band = sosfiltfilt(sos, audio).astype(np.float32)

    filter_size = max(3, int(sample_rate * 0.0015))
    if filter_size % 2 == 0:
        filter_size += 1

    smoothed_high = median_filter(high_band, size=filter_size, mode="nearest").astype(np.float32)
    smoothed_high = _soft_limit_audio(smoothed_high, drive=1.20)

    noise_reduce_amount = 0.35
    controlled_high = high_band * (1.0 - noise_reduce_amount) + smoothed_high * noise_reduce_amount

    return (audio - high_band + controlled_high).astype(np.float32)


def _repair_clicky_artifacts(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    from scipy.ndimage import median_filter

    if audio.size == 0 or sample_rate <= 0:
        return audio

    median_size = max(3, int(sample_rate * 0.00035))

    if median_size % 2 == 0:
        median_size += 1

    smoothed = median_filter(audio, size=median_size, mode="nearest").astype(np.float32)
    difference = audio - smoothed

    threshold = max(
        0.025,
        float(np.percentile(np.abs(difference), 98.5)) * 1.8,
    )

    artifact_mask = np.abs(difference) > threshold

    repaired = audio.copy()
    repaired[artifact_mask] = smoothed[artifact_mask]

    blend_amount = 0.65
    repaired = audio * (1.0 - blend_amount) + repaired * blend_amount

    return repaired.astype(np.float32)


def _level_for_remix(audio: np.ndarray) -> np.ndarray:
    if audio.size == 0:
        return audio

    rms = float(np.sqrt(np.mean(np.square(audio)) + 1e-8))
    target_rms = 0.12

    if rms > 0:
        gain = min(target_rms / rms, 2.2)
        audio = audio * gain

    audio = _soft_limit_audio(audio, drive=1.12)

    peak = float(np.max(np.abs(audio))) if audio.size > 0 else 0.0

    if peak > 0:
        audio = audio / peak * 0.95

    return np.clip(audio, -1.0, 1.0).astype(np.float32)


def _repair_pumping_envelope(audio: np.ndarray, sample_rate: int) -> np.ndarray:
    from scipy.ndimage import maximum_filter1d, uniform_filter1d

    if audio.size == 0 or sample_rate <= 0:
        return audio

    envelope = np.abs(audio).astype(np.float32)

    short_window = max(1, int(sample_rate * 0.025))
    long_window = max(short_window + 1, int(sample_rate * 0.350))

    short_envelope = uniform_filter1d(envelope, size=short_window, mode="nearest")
    long_envelope = maximum_filter1d(short_envelope, size=long_window, mode="nearest")

    dip_ratio = long_envelope / (short_envelope + 1e-4)
    dip_ratio = np.clip(dip_ratio, 1.0, 1.8)

    gain = 1.0 + (dip_ratio - 1.0) * 0.22
    gain = uniform_filter1d(gain, size=short_window, mode="nearest")
    gain = np.clip(gain, 1.0, 1.18)

    repaired = audio * gain

    blend_amount = 0.35
    repaired = audio * (1.0 - blend_amount) + repaired * blend_amount

    return repaired.astype(np.float32)


def _restore_with_soundfix_preview(
    audio: np.ndarray,
    sample_rate: int,
) -> tuple[np.ndarray, int]:
    import sys

    if "/opt/audiosr" not in sys.path:
        sys.path.insert(0, "/opt/audiosr")

    import audiosr

    max_preview_seconds = 60
    max_preview_samples = int(sample_rate * max_preview_seconds)

    if audio.shape[1] > max_preview_samples:
        audio = audio[:, :max_preview_samples]

    if audio.shape[0] > 1:
        audio_mono = np.mean(audio, axis=0)
    else:
        audio_mono = audio[0]

    audio_mono = np.asarray(audio_mono, dtype=np.float32)

    peak = float(np.max(np.abs(audio_mono))) if audio_mono.size > 0 else 0.0

    if peak > 0:
        audio_mono = audio_mono / peak * 0.95

    denoise_started_at = perf_counter()
    audio_mono, sample_rate = _reduce_voice_noise(audio_mono, sample_rate)
    print(
        "[soundfix] voice denoise completed "
        f"seconds={perf_counter() - denoise_started_at:.3f} "
        f"sample_rate={sample_rate}",
        flush=True,
    )

    with TemporaryDirectory() as temp_dir:
        input_path = Path(temp_dir) / "input.wav"

        sf.write(
            input_path,
            audio_mono,
            sample_rate,
            format="WAV",
        )

        latent_diffusion = _get_audiosr_model()

        restored = audiosr.super_resolution(
            latent_diffusion,
            str(input_path),
            seed=42,
            ddim_steps=25,
            guidance_scale=3.5,
        )

    if hasattr(restored, "detach"):
        restored = restored.detach().cpu().numpy()

    restored = np.asarray(restored, dtype=np.float32)
    restored = np.squeeze(restored)

    if restored.ndim > 1:
        restored = restored.reshape(-1)

    output_sample_rate = 48000
    original_duration_seconds = audio.shape[1] / sample_rate if sample_rate > 0 else 0
    target_samples = int(output_sample_rate * original_duration_seconds)

    if target_samples > 0 and restored.shape[0] > target_samples:
        restored = restored[:target_samples]

    from math import gcd
    from scipy.signal import resample_poly

    common_divisor = gcd(sample_rate, output_sample_rate)
    up = output_sample_rate // common_divisor
    down = sample_rate // common_divisor

    original_resampled = resample_poly(audio_mono, up, down).astype(np.float32)

    if original_resampled.shape[0] > target_samples:
        original_resampled = original_resampled[:target_samples]

    if original_resampled.shape[0] < target_samples:
        original_resampled = np.pad(
            original_resampled,
            (0, target_samples - original_resampled.shape[0]),
        )

    if restored.shape[0] < target_samples:
        restored = np.pad(
            restored,
            (0, target_samples - restored.shape[0]),
        )

    wet_amount = 0.42
    mixed = original_resampled * (1.0 - wet_amount) + restored * wet_amount

    mixed = _smooth_high_band(mixed, output_sample_rate)
    mixed = _reduce_high_band_noise(mixed, output_sample_rate)
    mixed = _enhance_vocal_clarity(mixed, output_sample_rate)
    mixed = _synthesize_vocal_air(mixed, output_sample_rate)
    mixed = _level_for_remix(mixed)

    restored_audio = np.stack([mixed, mixed], axis=0)

    return restored_audio, output_sample_rate


@app.function(
    image=image,
    gpu="L4",
    timeout=600,
)
def check_audiosr_environment() -> dict:
    started_at = perf_counter()

    result = {
        "torch_import_ok": False,
        "torch_version": None,
        "cuda_available": False,
        "cuda_device_name": None,
        "torchaudio_import_ok": False,
        "torchaudio_version": None,
        "librosa_import_ok": False,
        "librosa_version": None,
        "audiosr_import_ok": False,
        "audiosr_import_error": None,
        "elapsed_seconds": None,
    }

    try:
        import torch

        result["torch_import_ok"] = True
        result["torch_version"] = str(torch.__version__)
        result["cuda_available"] = bool(torch.cuda.is_available())

        if result["cuda_available"]:
            result["cuda_device_name"] = str(torch.cuda.get_device_name(0))
    except Exception as error:
        result["torch_import_error"] = repr(error)

    try:
        import torchaudio

        result["torchaudio_import_ok"] = True
        result["torchaudio_version"] = str(torchaudio.__version__)
    except Exception as error:
        result["torchaudio_import_error"] = repr(error)

    try:
        import librosa

        result["librosa_import_ok"] = True
        result["librosa_version"] = str(librosa.__version__)
    except Exception as error:
        result["librosa_import_error"] = repr(error)

    try:
        import sys

        if "/opt/audiosr" not in sys.path:
            sys.path.insert(0, "/opt/audiosr")

        import audiosr

        result["audiosr_import_ok"] = True
        audiosr_version = getattr(audiosr, "__version__", None)
        result["audiosr_version"] = str(audiosr_version) if audiosr_version is not None else None
        result["audiosr_attrs"] = [
            name for name in dir(audiosr) if not name.startswith("_")
        ][:80]
    except Exception as error:
        result["audiosr_import_error"] = repr(error)

    result["elapsed_seconds"] = float(perf_counter() - started_at)

    print(
        "[soundfix] audiosr environment checked "
        f"result={result}",
        flush=True,
    )

    return result


@app.function(
    image=image,
    gpu="L4",
    timeout=600,
)
def restore_audio_bytes(audio_bytes: bytes) -> bytes:
    started_at = perf_counter()
    input_size_bytes = len(audio_bytes)

    print(
        "[soundfix] restore started "
        f"input_size_bytes={input_size_bytes}",
        flush=True,
    )

    audio, sample_rate = sf.read(BytesIO(audio_bytes), always_2d=True)

    audio = audio.astype(np.float32).T
    channel_count = audio.shape[0]
    sample_count = audio.shape[1]
    duration_seconds = sample_count / sample_rate if sample_rate > 0 else 0

    print(
        "[soundfix] audio loaded "
        f"sample_rate={sample_rate} "
        f"channels={channel_count} "
        f"samples={sample_count} "
        f"duration_seconds={duration_seconds:.2f}",
        flush=True,
    )

    restore_started_at = perf_counter()

    try:
        audio, sample_rate = _restore_with_soundfix_preview(audio, sample_rate)
        restore_mode = "soundfix_preview"
    except Exception as error:
        print(
            "[soundfix] soundfix preview failed "
            f"error={repr(error)} "
            "fallback=normalize",
            flush=True,
        )

        peak = np.max(np.abs(audio))

        if peak > 0:
            audio = audio / peak * 0.95

        audio = np.clip(audio, -1.0, 1.0)
        restore_mode = "normalize_fallback"

    restore_seconds = perf_counter() - restore_started_at

    output_buffer = BytesIO()
    sf.write(output_buffer, audio.T, sample_rate, format="WAV")
    output_audio_bytes = output_buffer.getvalue()

    total_seconds = perf_counter() - started_at

    print(
        "[soundfix] restore completed "
        f"mode={restore_mode} "
        f"restore_seconds={restore_seconds:.3f} "
        f"total_seconds={total_seconds:.3f} "
        f"output_size_bytes={len(output_audio_bytes)}",
        flush=True,
    )

    return output_audio_bytes


@app.local_entrypoint()
def main(input_path: str = "", output_path: str = "audiosr_preview_output.wav"):
    if input_path:
        with open(input_path, "rb") as input_file:
            input_audio_bytes = input_file.read()
    else:
        sample_rate = 44100
        duration_seconds = 10
        t = np.linspace(0, duration_seconds, int(sample_rate * duration_seconds), endpoint=False)

        test_audio = (
            0.12 * np.sin(2 * np.pi * 110 * t)
            + 0.08 * np.sin(2 * np.pi * 440 * t)
            + 0.04 * np.sin(2 * np.pi * 1760 * t)
            + 0.015 * np.random.default_rng(42).normal(size=t.shape)
        )

        test_audio = np.asarray(test_audio, dtype=np.float32)
        test_audio = np.clip(test_audio, -1.0, 1.0)

        input_buffer = BytesIO()
        sf.write(input_buffer, test_audio, sample_rate, format="WAV")
        input_audio_bytes = input_buffer.getvalue()

    output_audio_bytes = restore_audio_bytes.remote(input_audio_bytes)

    output_audio, output_sample_rate = sf.read(BytesIO(output_audio_bytes), always_2d=True)

    print(
        {
            "output_sample_rate": int(output_sample_rate),
            "output_shape": tuple(output_audio.shape),
            "output_duration_seconds": float(output_audio.shape[0] / output_sample_rate),
        }
    )

    with open(output_path, "wb") as output_file:
        output_file.write(output_audio_bytes)

    print(f"Saved output to {output_path}")
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { getPreviewAudioFile } from "../../lib/preview-audio-store";

const BEFORE_WAVEFORM_WIDTH = 960;
const BEFORE_WAVEFORM_HEIGHT = 96;
const BEFORE_WAVEFORM_SAMPLE_COUNT = 720;

export default function PreviewPageClient() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const beforeWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewAudio = getPreviewAudioFile();
  const fileName = previewAudio.fileName || "FILENAME.wav";
  const audioUrl = previewAudio.audioUrl || "";
  const previewFile = previewAudio.file;
  const isReady = true;
  const [isPlayingBefore, setIsPlayingBefore] = useState(false);
  const [beforeWaveformPoints, setBeforeWaveformPoints] = useState<number[]>([]);
  const [beforePlaybackProgress, setBeforePlaybackProgress] = useState(0);
  const [beforeCurrentTime, setBeforeCurrentTime] = useState(0);
  const [beforeDuration, setBeforeDuration] = useState(0);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    const handleEnded = () => {
      setIsPlayingBefore(false);
      setBeforePlaybackProgress(1);
      setBeforeCurrentTime(audioElement.duration || 0);
    };

    const handlePause = () => {
      setIsPlayingBefore(false);
    };

    const handleTimeUpdate = () => {
      if (!audioElement.duration || Number.isNaN(audioElement.duration)) {
        setBeforePlaybackProgress(0);
        setBeforeCurrentTime(0);
        return;
      }

      setBeforeCurrentTime(audioElement.currentTime);
      setBeforePlaybackProgress(audioElement.currentTime / audioElement.duration);
    };

    const handleLoadedMetadata = () => {
      setBeforeCurrentTime(0);
      setBeforeDuration(audioElement.duration || 0);
      setBeforePlaybackProgress(0);
    };

    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, [audioUrl]);

  useEffect(() => {
    const buildWaveformPoints = async () => {
      if (!previewFile) {
        setBeforeWaveformPoints([]);
        return;
      }

      const audioContext = new window.AudioContext();

      try {
        const arrayBuffer = await previewFile.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.max(
          1,
          Math.floor(channelData.length / BEFORE_WAVEFORM_SAMPLE_COUNT),
        );

        const points = Array.from(
          { length: BEFORE_WAVEFORM_SAMPLE_COUNT },
          (_, index) => {
            const start = index * blockSize;
            const end = Math.min(start + blockSize, channelData.length);

            let peak = 0;

            for (let i = start; i < end; i += 1) {
              const amplitude = Math.abs(channelData[i]);

              if (amplitude > peak) {
                peak = amplitude;
              }
            }

            return peak;
          },
        );

        const normalizedPoints = points.map((point) =>
          Math.max(0.02, Math.min(1, point)),
        );

        setBeforeWaveformPoints(normalizedPoints);
      } catch {
        setBeforeWaveformPoints([]);
      } finally {
        await audioContext.close();
      }
    };

    void buildWaveformPoints();
  }, [previewFile]);

  useEffect(() => {
    const canvas = beforeWaveformCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = BEFORE_WAVEFORM_WIDTH;
    const height = BEFORE_WAVEFORM_HEIGHT;
    const midY = height / 2;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (!beforeWaveformPoints.length) {
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.fillRect(0, midY - 1, width, 2);
      return;
    }

    const stepX = width / beforeWaveformPoints.length;
    const progressWidth = Math.max(
      0,
      Math.min(width, width * beforePlaybackProgress),
    );

    context.beginPath();
    context.moveTo(0, midY);

    beforeWaveformPoints.forEach((point, index) => {
      const x = index * stepX;
      const amplitude = point * (height * 0.42);

      context.lineTo(x, midY - amplitude);
    });

    for (let index = beforeWaveformPoints.length - 1; index >= 0; index -= 1) {
      const x = index * stepX;
      const amplitude = beforeWaveformPoints[index] * (height * 0.42);

      context.lineTo(x, midY + amplitude);
    }

    context.closePath();
    context.save();
    context.fillStyle = "rgba(255,255,255,0.28)";
    context.fill();
    context.restore();

    if (progressWidth > 0) {
      context.save();
      context.beginPath();
      context.rect(0, 0, progressWidth, height);
      context.clip();

      context.beginPath();
      context.moveTo(0, midY);

      beforeWaveformPoints.forEach((point, index) => {
        const x = index * stepX;
        const amplitude = point * (height * 0.42);

        context.lineTo(x, midY - amplitude);
      });

      for (let index = beforeWaveformPoints.length - 1; index >= 0; index -= 1) {
        const x = index * stepX;
        const amplitude = beforeWaveformPoints[index] * (height * 0.42);

        context.lineTo(x, midY + amplitude);
      }

      context.closePath();
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.fill();
      context.restore();
    }
  }, [beforeWaveformPoints, beforePlaybackProgress]);

  const beforeButtonIconClassName = useMemo(() => {
    return isPlayingBefore ? "fa-solid fa-pause" : "fa-solid fa-play";
  }, [isPlayingBefore]);

  const formatPlaybackTime = (timeInSeconds: number) => {
    if (!Number.isFinite(timeInSeconds) || timeInSeconds < 0) {
      return "00:00";
    }

    const totalSeconds = Math.floor(timeInSeconds);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleToggleBeforePlayback = async () => {
    const audioElement = audioRef.current;

    if (!audioElement || !audioUrl) {
      return;
    }

    if (audioElement.paused) {
      if (
        audioElement.duration &&
        !Number.isNaN(audioElement.duration) &&
        audioElement.currentTime >= audioElement.duration
      ) {
        audioElement.currentTime = 0;
        setBeforeCurrentTime(0);
        setBeforePlaybackProgress(0);
      }

      await audioElement.play();
      setIsPlayingBefore(true);
      return;
    }

    audioElement.pause();
    setIsPlayingBefore(false);
  };

  const handleWaveformSeek = (event: MouseEvent<HTMLCanvasElement>) => {
    const audioElement = audioRef.current;
    const canvasElement = beforeWaveformCanvasRef.current;

    if (
      !audioElement ||
      !canvasElement ||
      !audioElement.duration ||
      Number.isNaN(audioElement.duration)
    ) {
      return;
    }

    const rect = canvasElement.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const nextTime = audioElement.duration * ratio;

    audioElement.currentTime = nextTime;
    setBeforeCurrentTime(nextTime);
    setBeforePlaybackProgress(ratio);
  };

  const handleContinueToDownload = () => {
    router.push(`/download?file=${encodeURIComponent(fileName)}`);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Soundfix
          </Link>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center py-10 lg:py-14">
          <div className="w-full max-w-[980px]">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
                Preview
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Your fixed preview is ready
              </h1>
            </div>

            <div className="mt-14">
              <p className="text-[14px] font-medium uppercase tracking-[0.08em] text-white/78">
                {fileName}
              </p>

              {!isReady ? (
                <p className="mt-4 text-sm text-white/45">Loading preview...</p>
              ) : !audioUrl ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/58">
                  No preview audio was found. Please go back and select a file again.
                </div>
              ) : null}

              <div className="mt-10 space-y-10">
                <div>
                  <p className="text-[22px] font-medium tracking-tight text-white sm:text-[28px]">
                    Before
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className="text-base text-white/72">
                      Original separated audio
                    </p>

                    <p className="text-sm tabular-nums text-white/48">
                      {formatPlaybackTime(beforeCurrentTime)} / {formatPlaybackTime(beforeDuration)}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-6">
                    {audioUrl ? (
                      <audio ref={audioRef} src={audioUrl} preload="metadata" />
                    ) : null}

                    <button
                      type="button"
                      onClick={handleToggleBeforePlayback}
                      disabled={!audioUrl}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <i className={beforeButtonIconClassName} aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 items-center">
                      <canvas
                        ref={beforeWaveformCanvasRef}
                        onClick={handleWaveformSeek}
                        className="block h-24 w-full cursor-pointer"
                        aria-label="Seek preview waveform"
                        role="img"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[22px] font-medium tracking-tight text-white sm:text-[28px]">
                    After
                  </p>
                  <p className="mt-2 text-base text-white/72">
                    Soundfix fixed preview
                  </p>

                  <div className="mt-5 flex items-center gap-6">
                    <button
                      type="button"
                      disabled
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <i className="fa-solid fa-play" aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 items-center gap-[5px]">
                      <div className="h-3 w-1.5 rounded-full bg-white/65" />
                      <div className="h-5 w-1.5 rounded-full bg-white/90" />
                      <div className="h-8 w-1.5 rounded-full bg-white/95" />
                      <div className="h-10 w-1.5 rounded-full bg-white/85" />
                      <div className="h-12 w-1.5 rounded-full bg-white/70" />
                      <div className="h-11 w-1.5 rounded-full bg-white/85" />
                      <div className="h-8 w-1.5 rounded-full bg-white/95" />
                      <div className="h-6 w-1.5 rounded-full bg-white/80" />
                      <div className="h-4 w-1.5 rounded-full bg-white/65" />
                      <div className="h-5 w-1.5 rounded-full bg-white/78" />
                      <div className="h-8 w-1.5 rounded-full bg-white/92" />
                      <div className="h-10 w-1.5 rounded-full bg-white/82" />
                      <div className="h-7 w-1.5 rounded-full bg-white/72" />
                      <div className="h-4 w-1.5 rounded-full bg-white/62" />
                      <div className="h-6 w-1.5 rounded-full bg-white/85" />
                      <div className="h-9 w-1.5 rounded-full bg-white/96" />
                      <div className="h-11 w-1.5 rounded-full bg-white/84" />
                      <div className="h-8 w-1.5 rounded-full bg-white/74" />
                      <div className="h-5 w-1.5 rounded-full bg-white/65" />
                      <div className="h-4 w-1.5 rounded-full bg-white/58" />
                      <div className="h-7 w-1.5 rounded-full bg-white/82" />
                      <div className="h-10 w-1.5 rounded-full bg-white/94" />
                      <div className="h-12 w-1.5 rounded-full bg-white/86" />
                      <div className="h-10 w-1.5 rounded-full bg-white/75" />
                      <div className="h-7 w-1.5 rounded-full bg-white/64" />
                      <div className="h-5 w-1.5 rounded-full bg-white/58" />
                      <div className="h-4 w-1.5 rounded-full bg-white/64" />
                      <div className="h-6 w-1.5 rounded-full bg-white/82" />
                      <div className="h-9 w-1.5 rounded-full bg-white/94" />
                      <div className="h-11 w-1.5 rounded-full bg-white/86" />
                      <div className="h-8 w-1.5 rounded-full bg-white/74" />
                      <div className="h-6 w-1.5 rounded-full bg-white/63" />
                      <div className="h-5 w-1.5 rounded-full bg-white/60" />
                      <div className="h-7 w-1.5 rounded-full bg-white/84" />
                      <div className="h-10 w-1.5 rounded-full bg-white/96" />
                      <div className="h-12 w-1.5 rounded-full bg-white/88" />
                      <div className="h-9 w-1.5 rounded-full bg-white/78" />
                      <div className="h-6 w-1.5 rounded-full bg-white/64" />
                      <div className="h-4 w-1.5 rounded-full bg-white/58" />
                      <div className="h-3 w-1.5 rounded-full bg-white/54" />
                      <div className="h-5 w-1.5 rounded-full bg-white/74" />
                      <div className="h-8 w-1.5 rounded-full bg-white/92" />
                      <div className="h-10 w-1.5 rounded-full bg-white/86" />
                      <div className="h-12 w-1.5 rounded-full bg-white/80" />
                      <div className="h-11 w-1.5 rounded-full bg-white/90" />
                      <div className="h-8 w-1.5 rounded-full bg-white/96" />
                      <div className="h-6 w-1.5 rounded-full bg-white/84" />
                      <div className="h-4 w-1.5 rounded-full bg-white/68" />
                      <div className="h-3 w-1.5 rounded-full bg-white/58" />
                      <div className="h-5 w-1.5 rounded-full bg-white/72" />
                      <div className="h-8 w-1.5 rounded-full bg-white/90" />
                      <div className="h-10 w-1.5 rounded-full bg-white/85" />
                      <div className="h-9 w-1.5 rounded-full bg-white/76" />
                      <div className="h-7 w-1.5 rounded-full bg-white/66" />
                      <div className="h-5 w-1.5 rounded-full bg-white/58" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-14 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueToDownload}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Unlock the full fixed export
                </button>
              </div>

              <div className="mt-7 flex justify-start">
                <Link
                  href="/"
                  className="text-sm text-white/45 transition hover:text-white/70"
                >
                  Back
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
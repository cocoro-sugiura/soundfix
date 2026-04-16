"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { getPreviewAudioFile } from "../../lib/preview-audio-store";

const PREVIEW_WAVEFORM_WIDTH = 960;
const PREVIEW_WAVEFORM_HEIGHT = 96;
const PREVIEW_WAVEFORM_SAMPLE_COUNT = 720;

export default function PreviewPageClient() {
  const router = useRouter();
  const beforeAudioRef = useRef<HTMLAudioElement | null>(null);
  const afterAudioRef = useRef<HTMLAudioElement | null>(null);
  const beforeWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const afterWaveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewAudio = getPreviewAudioFile();
  const fileName = previewAudio.fileName || "FILENAME.wav";
  const audioUrl = previewAudio.audioUrl || "";
  const afterAudioUrl = audioUrl;
  const previewFile = previewAudio.file;
  const isReady = true;
  const [isPlayingBefore, setIsPlayingBefore] = useState(false);
  const [isPlayingAfter, setIsPlayingAfter] = useState(false);
  const [beforeWaveformPoints, setBeforeWaveformPoints] = useState<number[]>([]);
  const [afterWaveformPoints, setAfterWaveformPoints] = useState<number[]>([]);
  const [beforePlaybackProgress, setBeforePlaybackProgress] = useState(0);
  const [afterPlaybackProgress, setAfterPlaybackProgress] = useState(0);
  const [beforeCurrentTime, setBeforeCurrentTime] = useState(0);
  const [afterCurrentTime, setAfterCurrentTime] = useState(0);
  const [beforeDuration, setBeforeDuration] = useState(0);
  const [afterDuration, setAfterDuration] = useState(0);

  useEffect(() => {
    const audioElement = beforeAudioRef.current;

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
    const audioElement = afterAudioRef.current;

    if (!audioElement) {
      return;
    }

    const handleEnded = () => {
      setIsPlayingAfter(false);
      setAfterPlaybackProgress(1);
      setAfterCurrentTime(audioElement.duration || 0);
    };

    const handlePause = () => {
      setIsPlayingAfter(false);
    };

    const handleTimeUpdate = () => {
      if (!audioElement.duration || Number.isNaN(audioElement.duration)) {
        setAfterPlaybackProgress(0);
        setAfterCurrentTime(0);
        return;
      }

      setAfterCurrentTime(audioElement.currentTime);
      setAfterPlaybackProgress(audioElement.currentTime / audioElement.duration);
    };

    const handleLoadedMetadata = () => {
      setAfterCurrentTime(0);
      setAfterDuration(audioElement.duration || 0);
      setAfterPlaybackProgress(0);
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
  }, [afterAudioUrl]);

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
          Math.floor(channelData.length / PREVIEW_WAVEFORM_SAMPLE_COUNT),
        );

        const points = Array.from(
          { length: PREVIEW_WAVEFORM_SAMPLE_COUNT },
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
    const width = PREVIEW_WAVEFORM_WIDTH;
    const height = PREVIEW_WAVEFORM_HEIGHT;
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

  useEffect(() => {
    const canvas = afterWaveformCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = PREVIEW_WAVEFORM_WIDTH;
    const height = PREVIEW_WAVEFORM_HEIGHT;
    const midY = height / 2;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (!afterWaveformPoints.length) {
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.fillRect(0, midY - 1, width, 2);
      return;
    }

    const stepX = width / afterWaveformPoints.length;
    const progressWidth = Math.max(
      0,
      Math.min(width, width * afterPlaybackProgress),
    );

    context.beginPath();
    context.moveTo(0, midY);

    afterWaveformPoints.forEach((point, index) => {
      const x = index * stepX;
      const amplitude = point * (height * 0.42);

      context.lineTo(x, midY - amplitude);
    });

    for (let index = afterWaveformPoints.length - 1; index >= 0; index -= 1) {
      const x = index * stepX;
      const amplitude = afterWaveformPoints[index] * (height * 0.42);

      context.lineTo(x, midY + amplitude);
    }

    context.closePath();
    context.save();
    context.fillStyle = "rgba(255,255,255,0.18)";
    context.fill();
    context.restore();

    if (progressWidth > 0) {
      context.save();
      context.beginPath();
      context.rect(0, 0, progressWidth, height);
      context.clip();

      context.beginPath();
      context.moveTo(0, midY);

      afterWaveformPoints.forEach((point, index) => {
        const x = index * stepX;
        const amplitude = point * (height * 0.42);

        context.lineTo(x, midY - amplitude);
      });

      for (let index = afterWaveformPoints.length - 1; index >= 0; index -= 1) {
        const x = index * stepX;
        const amplitude = afterWaveformPoints[index] * (height * 0.42);

        context.lineTo(x, midY + amplitude);
      }

      context.closePath();
      context.fillStyle = "rgba(255,255,255,0.88)";
      context.fill();
      context.restore();
    }
  }, [afterWaveformPoints, afterPlaybackProgress]);

  useEffect(() => {
    if (!beforeWaveformPoints.length) {
      setAfterWaveformPoints([]);
      return;
    }

    const derivedAfterPoints = beforeWaveformPoints.map((point, index) => {
      const modulation = 0.88 + ((index % 9) / 40);
      return Math.max(0.02, Math.min(1, point * modulation));
    });

    setAfterWaveformPoints(derivedAfterPoints);
  }, [beforeWaveformPoints]);

  const beforeButtonIconClassName = useMemo(() => {
    return isPlayingBefore ? "fa-solid fa-pause" : "fa-solid fa-play";
  }, [isPlayingBefore]);

  const afterButtonIconClassName = useMemo(() => {
    return isPlayingAfter ? "fa-solid fa-pause" : "fa-solid fa-play";
  }, [isPlayingAfter]);

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
    const audioElement = beforeAudioRef.current;
    const afterAudioElement = afterAudioRef.current;

    if (!audioElement || !audioUrl) {
      return;
    }

    if (audioElement.paused) {
      if (afterAudioElement && !afterAudioElement.paused) {
        afterAudioElement.pause();
        setIsPlayingAfter(false);
      }

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

  const handleToggleAfterPlayback = async () => {
    const audioElement = afterAudioRef.current;
    const beforeAudioElement = beforeAudioRef.current;

    if (!audioElement || !afterAudioUrl) {
      return;
    }

    if (audioElement.paused) {
      if (beforeAudioElement && !beforeAudioElement.paused) {
        beforeAudioElement.pause();
        setIsPlayingBefore(false);
      }

      if (
        audioElement.duration &&
        !Number.isNaN(audioElement.duration) &&
        audioElement.currentTime >= audioElement.duration
      ) {
        audioElement.currentTime = 0;
        setAfterCurrentTime(0);
        setAfterPlaybackProgress(0);
      }

      await audioElement.play();
      setIsPlayingAfter(true);
      return;
    }

    audioElement.pause();
    setIsPlayingAfter(false);
  };

  const handleWaveformSeek = (
    event: MouseEvent<HTMLCanvasElement>,
    canvasElement: HTMLCanvasElement | null,
    audioElement: HTMLAudioElement | null,
    setCurrentTime: (time: number) => void,
    setPlaybackProgress: (progress: number) => void,
  ) => {
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
    setCurrentTime(nextTime);
    setPlaybackProgress(ratio);
  };

  const handleBeforeWaveformSeek = (event: MouseEvent<HTMLCanvasElement>) => {
    handleWaveformSeek(
      event,
      beforeWaveformCanvasRef.current,
      beforeAudioRef.current,
      setBeforeCurrentTime,
      setBeforePlaybackProgress,
    );
  };

  const handleAfterWaveformSeek = (event: MouseEvent<HTMLCanvasElement>) => {
    handleWaveformSeek(
      event,
      afterWaveformCanvasRef.current,
      afterAudioRef.current,
      setAfterCurrentTime,
      setAfterPlaybackProgress,
    );
  };

  const handleContinueToDownload = () => {
    router.push(
      `/processing?step=full&file=${encodeURIComponent(fileName)}`,
    );
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

        <section className="flex flex-1 flex-col items-center py-8 lg:py-10">
          <div className="w-full max-w-[980px]">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
                Preview
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Your fixed preview is ready
              </h1>
            </div>

            <div className="mt-10">
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

              <div className="mt-8 space-y-8">
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
                      <audio ref={beforeAudioRef} src={audioUrl} preload="metadata" />
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
                        onClick={handleBeforeWaveformSeek}
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
                  <div className="mt-2 flex items-center justify-between gap-4">
                    <p className="text-base text-white/72">
                      Soundfix fixed preview
                    </p>

                    <p className="text-sm tabular-nums text-white/48">
                      {formatPlaybackTime(afterCurrentTime)} / {formatPlaybackTime(afterDuration)}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center gap-6">
                    {afterAudioUrl ? (
                      <audio ref={afterAudioRef} src={afterAudioUrl} preload="metadata" />
                    ) : null}

                    <button
                      type="button"
                      onClick={handleToggleAfterPlayback}
                      disabled={!afterAudioUrl}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <i className={afterButtonIconClassName} aria-hidden="true" />
                    </button>

                    <div className="flex flex-1 items-center">
                      <canvas
                        ref={afterWaveformCanvasRef}
                        onClick={handleAfterWaveformSeek}
                        className="block h-24 w-full cursor-pointer"
                        aria-label="Fixed preview waveform"
                        role="img"
                      />
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-white/40">
                    1 minute preview
                  </p>
                </div>
              </div>

              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueToDownload}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Unlock the full fixed export
                </button>
              </div>

              <div className="mt-5 flex justify-start">
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
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  getPreviewAudioFile,
  setPreviewAudioErrorMessage,
  setPreviewAudioStatus,
  setPreviewAudioUrls,
} from "../../lib/preview-audio-store";

const DOWNLOAD_WAVEFORM_WIDTH = 960;
const DOWNLOAD_WAVEFORM_HEIGHT = 80;
const DOWNLOAD_WAVEFORM_SAMPLE_COUNT = 720;
const BACKEND_BASE_URL =
  process.env.NEXT_PUBLIC_SOUNDFIX_BACKEND_URL || "http://localhost:8000";

const resolveBackendAudioUrl = (url: string | null) => {
  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return new URL(url, BACKEND_BASE_URL).toString();
};

type BackendJobStatusResponse = {
  jobId: string;
  status: "idle" | "uploaded" | "preview_processing" | "preview_ready" | "full_processing" | "full_ready" | "failed";
  previewUrl: string | null;
  fullUrl: string | null;
  error: string | null;
};

type DownloadPageClientProps = {
  fileName: string;
  jobId: string;
};

export default function DownloadPageClient({
  fileName,
  jobId,
}: DownloadPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const waveformCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewAudio = getPreviewAudioFile();
  const resolvedJobId = searchParams.get("job") || jobId || previewAudio.jobId || "";
  const audioUrl = previewAudio.fullAfterAudioUrl || "";
  const displayFileName =
    previewAudio.fileName || fileName || "FILENAME.wav";
  const [isPlaying, setIsPlaying] = useState(false);
  const [waveformPoints, setWaveformPoints] = useState<number[]>([]);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    console.log("[download-audio-url]", {
      audioUrl,
      storeStatus: previewAudio.status,
      resolvedJobId,
    });
  }, [audioUrl, previewAudio.status, resolvedJobId]);

  useEffect(() => {
    if (!resolvedJobId) {
      router.replace("/");
      return;
    }

    let isCancelled = false;

    const syncDownloadState = async () => {
      try {
        const response = await fetch(
          `${BACKEND_BASE_URL}/jobs/${encodeURIComponent(resolvedJobId)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        if (!response.ok) {
          throw new Error("Failed to load full file.");
        }

        const job = await response.json() as BackendJobStatusResponse;

        if (isCancelled) {
          return;
        }

        setPreviewAudioStatus(job.status);
        setPreviewAudioErrorMessage(job.error || "");

        if (job.previewUrl) {
          setPreviewAudioUrls({
            previewAfterAudioUrl: resolveBackendAudioUrl(job.previewUrl),
          });
        }

        if (job.fullUrl) {
          setPreviewAudioUrls({
            fullAfterAudioUrl: resolveBackendAudioUrl(job.fullUrl),
          });
        }

        if (job.status === "failed") {
          router.replace("/");
        }
      } catch {
        router.replace("/");
      }
    };

    void syncDownloadState();

    return () => {
      isCancelled = true;
    };
  }, [resolvedJobId, router]);  

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    const handleEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(1);
      setCurrentTime(audioElement.duration || 0);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleTimeUpdate = () => {
      if (!audioElement.duration || Number.isNaN(audioElement.duration)) {
        setPlaybackProgress(0);
        setCurrentTime(0);
        return;
      }

      setCurrentTime(audioElement.currentTime);
      setPlaybackProgress(audioElement.currentTime / audioElement.duration);
    };

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration || 0);
      setCurrentTime(0);
      setPlaybackProgress(0);
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
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    if (!audioUrl) {
      audioElement.removeAttribute("src");
      audioElement.load();
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlaybackProgress(0);
      return;
    }

    if (audioElement.getAttribute("src") !== audioUrl) {
      console.log("[download-src-set]", {
        prevSrc: audioElement.getAttribute("src"),
        nextSrc: audioUrl,
      });

      audioElement.setAttribute("src", audioUrl);
      audioElement.load();

      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      setPlaybackProgress(0);
    }
  }, [audioUrl]);  

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    const logEvent = (eventName: string) => {
      console.log(`[download-audio:${eventName}]`, {
        currentTime: audioElement.currentTime,
        duration: audioElement.duration,
        paused: audioElement.paused,
        readyState: audioElement.readyState,
        networkState: audioElement.networkState,
        src: audioElement.currentSrc || audioElement.getAttribute("src"),
        seekableStart:
          audioElement.seekable.length > 0 ? audioElement.seekable.start(0) : null,
        seekableEnd:
          audioElement.seekable.length > 0 ? audioElement.seekable.end(0) : null,
      });
    };

    const handleLoadStart = () => logEvent("loadstart");
    const handleLoadedMetadata = () => logEvent("loadedmetadata");
    const handleLoadedData = () => logEvent("loadeddata");
    const handleCanPlay = () => logEvent("canplay");
    const handleSeeking = () => logEvent("seeking");
    const handleSeeked = () => logEvent("seeked");
    const handleTimeUpdate = () => logEvent("timeupdate");
    const handlePlay = () => logEvent("play");
    const handlePause = () => logEvent("pause");
    const handleEnded = () => logEvent("ended");

    audioElement.addEventListener("loadstart", handleLoadStart);
    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("loadeddata", handleLoadedData);
    audioElement.addEventListener("canplay", handleCanPlay);
    audioElement.addEventListener("seeking", handleSeeking);
    audioElement.addEventListener("seeked", handleSeeked);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("play", handlePlay);
    audioElement.addEventListener("pause", handlePause);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("loadstart", handleLoadStart);
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("loadeddata", handleLoadedData);
      audioElement.removeEventListener("canplay", handleCanPlay);
      audioElement.removeEventListener("seeking", handleSeeking);
      audioElement.removeEventListener("seeked", handleSeeked);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("play", handlePlay);
      audioElement.removeEventListener("pause", handlePause);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);  

  useEffect(() => {
    const buildWaveformPoints = async () => {
      if (!audioUrl) {
        setWaveformPoints([]);
        return;
      }

      const audioContext = new window.AudioContext();

      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const channelData = audioBuffer.getChannelData(0);
        const blockSize = Math.max(
          1,
          Math.floor(channelData.length / DOWNLOAD_WAVEFORM_SAMPLE_COUNT),
        );

        const points = Array.from(
          { length: DOWNLOAD_WAVEFORM_SAMPLE_COUNT },
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

        setWaveformPoints(normalizedPoints);
      } catch {
        setWaveformPoints([]);
      } finally {
        await audioContext.close();
      }
    };

    void buildWaveformPoints();
  }, [audioUrl]);

  useEffect(() => {
    const canvas = waveformCanvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");

    if (!context) {
      return;
    }

    const devicePixelRatio = window.devicePixelRatio || 1;
    const width = DOWNLOAD_WAVEFORM_WIDTH;
    const height = DOWNLOAD_WAVEFORM_HEIGHT;
    const midY = height / 2;

    canvas.width = width * devicePixelRatio;
    canvas.height = height * devicePixelRatio;
    canvas.style.width = "100%";
    canvas.style.height = `${height}px`;

    context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    context.clearRect(0, 0, width, height);

    if (!waveformPoints.length) {
      context.fillStyle = "rgba(255,255,255,0.08)";
      context.fillRect(0, midY - 1, width, 2);
      return;
    }

    const stepX = width / waveformPoints.length;
    const progressWidth = Math.max(
      0,
      Math.min(width, width * playbackProgress),
    );

    context.beginPath();
    context.moveTo(0, midY);

    waveformPoints.forEach((point, index) => {
      const x = index * stepX;
      const amplitude = point * (height * 0.42);

      context.lineTo(x, midY - amplitude);
    });

    for (let index = waveformPoints.length - 1; index >= 0; index -= 1) {
      const x = index * stepX;
      const amplitude = waveformPoints[index] * (height * 0.42);

      context.lineTo(x, midY + amplitude);
    }

    context.closePath();
    context.save();
    context.fillStyle = "rgba(255,255,255,0.2)";
    context.fill();
    context.restore();

    if (progressWidth > 0) {
      context.save();
      context.beginPath();
      context.rect(0, 0, progressWidth, height);
      context.clip();

      context.beginPath();
      context.moveTo(0, midY);

      waveformPoints.forEach((point, index) => {
        const x = index * stepX;
        const amplitude = point * (height * 0.42);

        context.lineTo(x, midY - amplitude);
      });

      for (let index = waveformPoints.length - 1; index >= 0; index -= 1) {
        const x = index * stepX;
        const amplitude = waveformPoints[index] * (height * 0.42);

        context.lineTo(x, midY + amplitude);
      }

      context.closePath();
      context.fillStyle = "rgba(255,255,255,0.9)";
      context.fill();
      context.restore();
    }
  }, [waveformPoints, playbackProgress]);

  const buttonIconClassName = useMemo(() => {
    return isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
  }, [isPlaying]);

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

  const handleTogglePlayback = async () => {
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
        setCurrentTime(0);
        setPlaybackProgress(0);
      } else {
        setCurrentTime(audioElement.currentTime);
        setPlaybackProgress(
          audioElement.duration > 0 ? audioElement.currentTime / audioElement.duration : 0,
        );
      }

      await audioElement.play();
      setIsPlaying(true);
      return;
    }

    audioElement.pause();
    setIsPlaying(false);
  };

  const handleWaveformSeek = async (event: MouseEvent<HTMLCanvasElement>) => {
    const audioElement = audioRef.current;
    const canvasElement = waveformCanvasRef.current;

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
    const wasPlaying = !audioElement.paused;

    console.log("[download-waveform-seek:before]", {
      target: nextTime,
      actual: audioElement.currentTime,
      duration: audioElement.duration,
      paused: audioElement.paused,
      readyState: audioElement.readyState,
      networkState: audioElement.networkState,
      seekableRanges: audioElement.seekable.length,
    });

    if (wasPlaying) {
      audioElement.pause();
    }

    if (typeof audioElement.fastSeek === "function") {
      audioElement.fastSeek(nextTime);
    } else {
      audioElement.currentTime = nextTime;
    }

    window.setTimeout(async () => {
      console.log("[download-waveform-seek:after-100ms]", {
        target: nextTime,
        actual: audioElement.currentTime,
        duration: audioElement.duration,
        paused: audioElement.paused,
        readyState: audioElement.readyState,
        networkState: audioElement.networkState,
        seekableRanges: audioElement.seekable.length,
      });

      setCurrentTime(audioElement.currentTime);
      setPlaybackProgress(
        audioElement.duration > 0 ? audioElement.currentTime / audioElement.duration : 0,
      );

      if (wasPlaying) {
        try {
          await audioElement.play();
          setIsPlaying(true);
        } catch (error) {
          console.log("[download-waveform-seek:resume-failed]", error);
          setIsPlaying(false);
        }
      }
    }, 100);
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

        <section className="flex flex-1 flex-col items-center py-6 lg:py-8">
          <div className="w-full max-w-[980px] text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
              Download
            </p>

            <h1 className="mt-4 text-3xl font-semibold leading-[1.06] tracking-tight text-white sm:text-4xl lg:text-[46px]">
              Your full fixed file is ready
            </h1>

            <p className="mt-4 mx-auto max-w-xl text-base leading-7 text-white/58 sm:text-[17px]">
              Credits have been used for this export. You can now download the full fixed version.
            </p>
          </div>

          <div className="mt-8 w-full max-w-[760px] rounded-[32px] border border-white/10 bg-white/[0.03] p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-blue-300">
                  Fixed audio
                </span>
              </div>

              <p className="mt-4 break-all text-xl font-semibold tracking-tight text-white sm:text-[26px]">
                {displayFileName}
              </p>
            </div>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base text-white/72">
                  Soundfix fixed file
                </p>

                <p className="text-sm tabular-nums text-white/48">
                  {formatPlaybackTime(currentTime)} / {formatPlaybackTime(duration)}
                </p>
              </div>

              <div className="mt-4 flex items-center gap-4">
                <audio ref={audioRef} preload="metadata" />

                <button
                  type="button"
                  onClick={handleTogglePlayback}
                  disabled={!audioUrl}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-sm text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <i className={buttonIconClassName} aria-hidden="true" />
                </button>

                <div className="flex flex-1 items-center">
                  <canvas
                    ref={waveformCanvasRef}
                    onClick={handleWaveformSeek}
                    className="block h-20 w-full cursor-pointer"
                    aria-label="Fixed full waveform"
                    role="img"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <a
                href={audioUrl}
                download
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
              >
                <i className="fa-solid fa-arrow-down-to-bracket" aria-hidden="true" />
                <span>Download file</span>
              </a>

              <Link
                href="/"
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Fix another file
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
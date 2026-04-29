"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getPreviewAudioFile,
  setPreviewAudioErrorMessage,
  setPreviewAudioStatus,
  setPreviewAudioUrls,
} from "../../lib/preview-audio-store";
import { SoundfixJobStatus } from "../../lib/soundfix-job";

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

const preloadAudioUrl = async (url: string) => {
  const response = await fetch(url, {
    cache: "force-cache",
  });

  if (!response.ok) {
    throw new Error("Failed to preload audio.");
  }

  await response.blob();
};

type BackendJobStatusResponse = {
  jobId: string;
  status: SoundfixJobStatus;
  previewUrl: string | null;
  fullUrl: string | null;
  error: string | null;
};

export default function ProcessingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFileName = searchParams.get("file") ?? "";
  const jobId = searchParams.get("job") ?? "";
  const processingStep = searchParams.get("step") ?? "preview";
  const isFullProcessing = processingStep === "full";
  const previewAudio = getPreviewAudioFile();
  const displayFileName =
    previewAudio.fileName || selectedFileName || "Audio file";  

  useEffect(() => {
    if (!jobId) {
      router.replace("/");
      return;
    }

    let isCancelled = false;

    const startProcessing = async () => {
      setPreviewAudioStatus(
        isFullProcessing ? "full_processing" : "preview_processing",
      );
      setPreviewAudioErrorMessage("");

      try {
        const startResponse = await fetch(
          `${BACKEND_BASE_URL}/jobs/${encodeURIComponent(jobId)}/${isFullProcessing ? "full" : "preview"}`,
          {
            method: "POST",
          },
        );

        if (!startResponse.ok) {
          throw new Error("Failed to start processing.");
        }

        const pollStatus = async () => {
          if (isCancelled) {
            return;
          }

          const statusResponse = await fetch(
            `${BACKEND_BASE_URL}/jobs/${encodeURIComponent(jobId)}`,
            {
              method: "GET",
              cache: "no-store",
            },
          );

          if (!statusResponse.ok) {
            throw new Error("Failed to fetch job status.");
          }

          const job = await statusResponse.json() as BackendJobStatusResponse;

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

          if (!isFullProcessing && job.status === "preview_ready") {
            router.replace(`/preview?job=${encodeURIComponent(jobId)}`);
            return;
          }

          if (isFullProcessing && job.status === "full_ready") {
            if (job.fullUrl) {
              await preloadAudioUrl(resolveBackendAudioUrl(job.fullUrl));
            }

            router.replace(`/download?job=${encodeURIComponent(jobId)}`);
            return;
          }

          if (job.status === "failed") {
            throw new Error(job.error || "Processing failed.");
          }

          window.setTimeout(() => {
            void pollStatus();
          }, 1500);
        };

        await pollStatus();
      } catch (error) {
        setPreviewAudioStatus("failed");
        setPreviewAudioErrorMessage(
          error instanceof Error ? error.message : "Processing failed.",
        );
        router.replace("/");
      }
    };

    void startProcessing();

    return () => {
      isCancelled = true;
    };
  }, [isFullProcessing, jobId, router, selectedFileName]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="relative flex h-[180px] w-[180px] items-center justify-center">
          <div className="absolute h-[180px] w-[180px] animate-pulse rounded-full border border-cyan-300/20 bg-cyan-400/5 blur-[2px]" />
          <div className="absolute h-[132px] w-[132px] rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md" />
          <div className="absolute h-[112px] w-[112px] animate-spin rounded-full border border-transparent border-t-cyan-300/80 border-r-fuchsia-400/70" style={{ animationDuration: "2.4s" }} />
          <div className="absolute h-[84px] w-[84px] animate-spin rounded-full border border-transparent border-b-blue-400/80 border-l-cyan-200/70" style={{ animationDuration: "1.8s", animationDirection: "reverse" }} />
          <div className="absolute h-[34px] w-[34px] rounded-full bg-[linear-gradient(135deg,rgba(82,224,255,0.95)_0%,rgba(110,103,255,0.92)_52%,rgba(255,68,214,0.92)_100%)] shadow-[0_0_30px_rgba(96,165,250,0.45)]" />
        </div>

        <p className="mt-10 text-xs font-medium uppercase tracking-[0.3em] text-white/40">
          Soundfix Processing
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          {isFullProcessing ? "Preparing full export..." : "Fixing audio..."}
        </h1>

        <p className="mt-4 max-w-md text-sm leading-7 text-white/55 sm:text-base">
          {isFullProcessing
            ? "Generating your full fixed file."
            : "Preparing your fixed preview."}
        </p>

        <div className="mt-8 h-[6px] w-full max-w-[240px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,rgba(82,224,255,0.95)_0%,rgba(110,103,255,0.95)_55%,rgba(255,68,214,0.95)_100%)]" />
        </div>

        <p className="mt-6 text-xs text-white/28">
          {displayFileName}
        </p>
      </div>
    </main>
  );
}
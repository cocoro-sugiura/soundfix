"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  applyMockJobResponse,
  getPreviewAudioFile,
  setPreviewAudioStatus,
} from "../../lib/preview-audio-store";
import { SoundfixJobResponse } from "../../lib/soundfix-job";

export default function ProcessingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFileName = searchParams.get("file") ?? "";
  const jobId = searchParams.get("job") ?? "";
  const processingStep = searchParams.get("step") ?? "preview";
  const isFullProcessing = processingStep === "full";

  const buildMockJobResponse = (
    status: SoundfixJobResponse["status"],
  ): SoundfixJobResponse => {
    const current = getPreviewAudioFile();

    return {
      jobId: current.jobId || jobId,
      status,
      originalFileName: current.fileName || selectedFileName || "FILENAME.wav",
      originalFileType: current.fileType || "audio/wav",
      previewBeforeUrl: current.previewBeforeAudioUrl,
      previewAfterUrl: current.previewAfterAudioUrl,
      fullAfterUrl: current.fullAfterAudioUrl,
      errorMessage: "",
    };
  };

  useEffect(() => {
    if (!selectedFileName && !jobId) {
      router.replace("/");
      return;
    }

    setPreviewAudioStatus(
      isFullProcessing ? "full_processing" : "preview_processing",
    );

    applyMockJobResponse(
      buildMockJobResponse(
        isFullProcessing ? "full_processing" : "preview_processing",
      ),
    );

    const intervalId = window.setInterval(() => {
      const current = getPreviewAudioFile();

      const isPreviewReady = current.status === "preview_ready";
      const isFullReady = current.status === "full_ready";

      if (!isFullProcessing && isPreviewReady) {
        window.clearInterval(intervalId);

        if (jobId) {
          router.replace(`/preview?job=${encodeURIComponent(jobId)}`);
          return;
        }

        router.replace(`/preview?file=${encodeURIComponent(selectedFileName)}`);
        return;
      }

      if (isFullProcessing && isFullReady) {
        window.clearInterval(intervalId);

        if (jobId) {
          router.replace(`/download?job=${encodeURIComponent(jobId)}`);
          return;
        }

        router.replace(`/download?file=${encodeURIComponent(selectedFileName)}`);
      }
    }, 1500);

    // 仮: 今はまだバックエンドがないので疑似的に完了させる
    const mockTimeoutId = window.setTimeout(() => {
      const nextStatus = isFullProcessing ? "full_ready" : "preview_ready";

      setPreviewAudioStatus(nextStatus);
      applyMockJobResponse(buildMockJobResponse(nextStatus));
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(mockTimeoutId);
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
          {selectedFileName || jobId}
        </p>
      </div>
    </main>
  );
}
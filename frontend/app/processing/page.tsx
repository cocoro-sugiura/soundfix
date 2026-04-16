"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function ProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedFileName = searchParams.get("file") ?? "";

  useEffect(() => {
    if (!selectedFileName) {
      router.replace("/");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.replace(`/preview?file=${encodeURIComponent(selectedFileName)}`);
    }, 10000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, selectedFileName]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050816] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(63,126,255,0.22)_0%,rgba(122,55,255,0.18)_28%,rgba(255,0,199,0.12)_48%,rgba(5,8,22,0)_72%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/10 blur-3xl" />

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
          Restoring clarity...
        </h1>

        <p className="mt-4 max-w-md text-sm leading-7 text-white/55 sm:text-base">
          Preparing your preview with AI enhancement.
        </p>

        <div className="mt-8 h-[6px] w-full max-w-[240px] overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/2 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-[linear-gradient(90deg,rgba(82,224,255,0.95)_0%,rgba(110,103,255,0.95)_55%,rgba(255,68,214,0.95)_100%)]" />
        </div>

        <p className="mt-6 text-xs text-white/28">
          {selectedFileName}
        </p>
      </div>
    </main>
  );
}
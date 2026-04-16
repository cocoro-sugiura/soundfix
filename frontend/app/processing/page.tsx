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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 text-center">
        <div className="relative flex h-[260px] w-[260px] items-center justify-center">
          <div className="absolute h-[260px] w-[260px] rounded-full bg-cyan-400/8 blur-3xl" />
          <div className="absolute h-[220px] w-[220px] rounded-full bg-[radial-gradient(circle_at_center,rgba(56,92,255,0.18)_0%,rgba(18,24,62,0.42)_48%,rgba(5,8,22,0.96)_100%)] shadow-[0_0_90px_rgba(33,103,255,0.16)]" />
          <div className="absolute h-[188px] w-[188px] overflow-hidden rounded-full border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_16%,rgba(255,255,255,0)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-30px_40px_rgba(15,23,42,0.28)]">
            <div className="absolute inset-0 animate-[spin_10s_linear_infinite]">
              <svg
                viewBox="0 0 188 188"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <filter id="orbBlur">
                    <feGaussianBlur stdDeviation="2.4" />
                  </filter>

                  <radialGradient id="pinkBlob" cx="35%" cy="32%" r="75%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.98)" />
                    <stop offset="28%" stopColor="rgba(255,226,247,0.98)" />
                    <stop offset="62%" stopColor="rgba(255,124,235,0.94)" />
                    <stop offset="100%" stopColor="rgba(214,70,255,0.88)" />
                  </radialGradient>

                  <radialGradient id="cyanBlob" cx="68%" cy="34%" r="75%">
                    <stop offset="0%" stopColor="rgba(214,255,255,0.98)" />
                    <stop offset="30%" stopColor="rgba(93,247,255,0.95)" />
                    <stop offset="66%" stopColor="rgba(20,214,255,0.92)" />
                    <stop offset="100%" stopColor="rgba(31,128,255,0.84)" />
                  </radialGradient>
                </defs>

                <g filter="url(#orbBlur)">
                  <path
                    d="M46 47C56 28 86 22 103 31C119 39 128 58 122 75C116 91 95 102 75 108C58 113 42 112 36 101C29 89 35 67 46 47Z"
                    fill="url(#pinkBlob)"
                  />
                  <path
                    d="M82 117C95 101 123 91 143 96C159 100 166 114 162 129C158 145 143 158 124 162C105 166 84 161 76 148C69 138 72 128 82 117Z"
                    fill="url(#cyanBlob)"
                  />
                </g>
              </svg>
            </div>
            <div className="absolute inset-[10px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
          </div>
          <div className="absolute h-[220px] w-[220px] rounded-full border border-fuchsia-300/8" />
        </div>

        <p className="mt-10 text-xs font-medium uppercase tracking-[0.3em] text-white/40">
          Soundfix Processing
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Fixing audio...
        </h1>

        <p className="mt-4 max-w-md text-sm leading-7 text-white/55 sm:text-base">
          Preparing your fixed preview.
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
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
          <div className="absolute h-[300px] w-[300px] rounded-full bg-cyan-500/8 blur-3xl" />
          <div className="absolute h-[226px] w-[226px] rounded-full bg-[radial-gradient(circle_at_center,rgba(36,74,255,0.18)_0%,rgba(12,18,48,0.52)_52%,rgba(5,8,22,0.98)_100%)] shadow-[0_0_100px_rgba(29,78,216,0.18)]" />
          <div className="absolute h-[188px] w-[188px] overflow-hidden rounded-full border border-white/6 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_18%,rgba(13,18,48,0.26)_55%,rgba(9,12,32,0.92)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-24px_34px_rgba(10,14,30,0.32)]">
            <div className="absolute inset-0 animate-[spin_12s_linear_infinite]">
              <svg
                viewBox="0 0 188 188"
                className="h-full w-full"
                aria-hidden="true"
              >
                <defs>
                  <filter id="surfaceBlur">
                    <feGaussianBlur stdDeviation="3.2" />
                  </filter>

                  <filter id="surfaceGlow">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>

                  <radialGradient id="pinkSurface" cx="34%" cy="34%" r="82%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="26%" stopColor="#ffdff6" />
                    <stop offset="58%" stopColor="#ff8be9" />
                    <stop offset="100%" stopColor="#eb47ff" />
                  </radialGradient>

                  <radialGradient id="cyanSurface" cx="68%" cy="34%" r="82%">
                    <stop offset="0%" stopColor="#dfffff" />
                    <stop offset="28%" stopColor="#88fbff" />
                    <stop offset="62%" stopColor="#1ee7ff" />
                    <stop offset="100%" stopColor="#2e8fff" />
                  </radialGradient>
                </defs>

                <g filter="url(#surfaceGlow)">
                  <path
                    d="M46 58C56 34 83 26 104 31C118 34 128 44 132 57C136 70 132 83 120 93C108 102 90 108 73 111C60 113 49 113 44 107C39 100 40 85 46 58Z"
                    fill="url(#pinkSurface)"
                  />
                  <path
                    d="M84 109C98 95 119 87 138 88C150 89 160 95 164 107C168 120 164 134 153 146C142 157 126 163 109 163C95 163 82 159 77 149C71 138 73 123 84 109Z"
                    fill="url(#cyanSurface)"
                  />
                </g>

                <path
                  d="M53 102C66 89 81 84 95 84C109 84 122 90 134 103"
                  fill="none"
                  stroke="rgba(5,8,22,0.92)"
                  strokeWidth="17"
                  strokeLinecap="round"
                  filter="url(#surfaceBlur)"
                />
              </svg>
            </div>
            <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0.03)_22%,rgba(255,255,255,0)_44%)]" />
            <div className="absolute inset-[10px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
          </div>
          <div className="absolute h-[226px] w-[226px] rounded-full border border-fuchsia-300/6" />
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
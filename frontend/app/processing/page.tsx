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
        <div className="relative flex h-[240px] w-[240px] items-center justify-center">
          <div className="absolute h-[240px] w-[240px] rounded-full bg-cyan-400/8 blur-3xl" />
          <div className="absolute h-[196px] w-[196px] rounded-full bg-[radial-gradient(circle_at_center,rgba(65,95,255,0.12)_0%,rgba(18,24,62,0.34)_46%,rgba(7,10,28,0.94)_100%)] shadow-[0_0_80px_rgba(33,103,255,0.14)]" />
          <div className="absolute h-[168px] w-[168px] animate-[spin_9s_ease-in-out_infinite] rounded-full border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_18%,rgba(255,255,255,0)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-20px_30px_rgba(17,24,59,0.22)]">
            <div
              className="absolute left-[20px] top-[18px] h-[78px] w-[108px] rotate-[-26deg] rounded-[58%_42%_68%_32%/42%_54%_46%_58%] bg-[radial-gradient(circle_at_34%_34%,rgba(255,255,255,0.95)_0%,rgba(255,224,248,0.96)_28%,rgba(255,136,238,0.93)_62%,rgba(227,74,255,0.88)_100%)] shadow-[0_0_28px_rgba(255,84,214,0.48)] blur-[0.4px]"
            />
            <div
              className="absolute bottom-[20px] right-[18px] h-[74px] w-[104px] rotate-[-24deg] rounded-[38%_62%_46%_54%/58%_36%_64%_42%] bg-[radial-gradient(circle_at_68%_36%,rgba(197,255,255,0.96)_0%,rgba(95,247,255,0.94)_30%,rgba(23,214,255,0.92)_66%,rgba(35,137,255,0.84)_100%)] shadow-[0_0_28px_rgba(34,211,238,0.46)] blur-[0.4px]"
            />
            <div className="absolute inset-[14px] rounded-full shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04)]" />
          </div>
          <div className="absolute h-[196px] w-[196px] rounded-full border border-fuchsia-300/8" />
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
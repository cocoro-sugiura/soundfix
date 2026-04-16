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
        <div className="relative flex h-[220px] w-[220px] items-center justify-center">
          <div className="absolute h-[220px] w-[220px] rounded-full bg-cyan-400/8 blur-3xl" />
          <div className="absolute h-[178px] w-[178px] rounded-full border border-white/8 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_26%,rgba(34,18,84,0.42)_62%,rgba(11,15,40,0.86)_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_0_40px_rgba(38,99,255,0.14)]" />
          <div className="absolute h-[146px] w-[146px] animate-[spin_8s_linear_infinite] rounded-full">
            <div
              className="absolute left-[18px] top-[16px] h-[68px] w-[88px] rotate-[-22deg] rounded-[58%_42%_52%_48%/44%_58%_42%_56%] bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.95)_0%,rgba(255,210,245,0.96)_26%,rgba(255,112,232,0.92)_70%,rgba(168,85,247,0.86)_100%)] blur-[0.5px] shadow-[0_0_24px_rgba(255,86,214,0.45)]"
            />
            <div
              className="absolute bottom-[14px] right-[14px] h-[64px] w-[84px] rotate-[-18deg] rounded-[44%_56%_50%_50%/58%_42%_58%_42%] bg-[radial-gradient(circle_at_65%_35%,rgba(170,255,255,0.95)_0%,rgba(58,244,255,0.92)_36%,rgba(27,188,255,0.9)_72%,rgba(59,130,246,0.82)_100%)] blur-[0.5px] shadow-[0_0_24px_rgba(34,211,238,0.42)]"
            />
          </div>
          <div className="absolute h-[178px] w-[178px] rounded-full border border-fuchsia-300/8" />
        </div>

        <p className="mt-10 text-xs font-medium uppercase tracking-[0.3em] text-white/40">
          Soundfix Processing
        </p>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Fixing audio...
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
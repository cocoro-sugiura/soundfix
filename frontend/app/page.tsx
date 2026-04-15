"use client";

import { ChangeEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      return;
    }

    setSelectedFileName(file.name);
  };

  const handleContinueToPreview = () => {
    if (!selectedFileName) {
      return;
    }

    router.push(`/preview?file=${encodeURIComponent(selectedFileName)}`);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0a0d] text-white">
      <div className="pointer-events-none absolute inset-x-0 top-[-56px] h-[140px] bg-[linear-gradient(180deg,rgba(32,187,255,0.14)_0%,rgba(77,99,255,0.08)_52%,rgba(10,10,13,0)_100%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-[120px] h-[320px] bg-[linear-gradient(180deg,rgba(33,198,255,0.24)_0%,rgba(71,102,255,0.2)_34%,rgba(116,60,255,0.18)_68%,rgba(10,10,13,0)_100%)] blur-3xl" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="text-xl font-semibold tracking-tight">Soundfix</div>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-10 text-center lg:py-14">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
            AI Audio Restoration
          </p>

          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[56px]">
            Restore degraded vocals and stems
          </h1>

          <p className="mt-5 max-w-xl text-base leading-7 text-white/58 sm:text-[17px]">
            Upload separated audio, hear a restored preview, then unlock the full export.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept=".wav,.mp3,audio/wav,audio/mpeg"
            className="hidden"
            onChange={handleFileChange}
          />

          <div
            onClick={handleSelectFile}
            className="mt-10 flex w-full max-w-[760px] cursor-pointer flex-col items-center rounded-[32px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-12 transition hover:border-white/30 hover:bg-white/[0.04] sm:px-10 sm:py-14"
          >
            <p className="text-[30px] font-semibold tracking-tight text-white sm:text-[34px]">
              {selectedFileName || "Drag and drop audio here"}
            </p>

            <p className="mt-4 max-w-lg text-sm leading-6 text-white/42 sm:text-[15px]">
              {selectedFileName
                ? "Your file is loaded and ready for preview."
                : "Upload a separated vocal or stem to generate a short restored preview."}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleSelectFile();
                }}
                className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
              >
                {selectedFileName ? "Change file" : "Select file"}
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleContinueToPreview();
                }}
                disabled={!selectedFileName}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to preview
              </button>
            </div>

            <p className="mt-5 text-xs text-white/32">WAV, MP3</p>
          </div>
        </section>

        <section className="grid gap-6 pb-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
              Demo preview
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Hear the difference first
            </h3>
            <p className="mt-4 max-w-lg text-sm leading-7 text-white/50 sm:text-base">
              A short before and after example helps users understand the value before uploading.
            </p>

            <div className="mt-8 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Before</p>
                    <p className="mt-1 text-xs text-white/35">Separated vocal</p>
                  </div>
                  <span className="text-xs text-white/30">00:59</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-sm text-white">
                    ▶
                  </div>
                  <div className="grid flex-1 grid-cols-12 gap-1">
                    <div className="h-8 rounded-full bg-white/10" />
                    <div className="h-8 rounded-full bg-white/5" />
                    <div className="h-8 rounded-full bg-white/10" />
                    <div className="h-8 rounded-full bg-white/5" />
                    <div className="h-8 rounded-full bg-white/10" />
                    <div className="h-8 rounded-full bg-white/5" />
                    <div className="h-8 rounded-full bg-white/10" />
                    <div className="h-8 rounded-full bg-white/5" />
                    <div className="h-8 rounded-full bg-white/10" />
                    <div className="h-8 rounded-full bg-white/5" />
                    <div className="h-8 rounded-full bg-white/10" />
                    <div className="h-8 rounded-full bg-white/5" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">After</p>
                    <p className="mt-1 text-xs text-white/35">Soundfix restored</p>
                  </div>
                  <span className="text-xs text-white/30">00:59</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-sm text-white">
                    ▶
                  </div>
                  <div className="grid flex-1 grid-cols-12 gap-1">
                    <div className="h-8 rounded-full bg-white/20" />
                    <div className="h-8 rounded-full bg-white/8" />
                    <div className="h-8 rounded-full bg-white/20" />
                    <div className="h-8 rounded-full bg-white/8" />
                    <div className="h-8 rounded-full bg-white/20" />
                    <div className="h-8 rounded-full bg-white/8" />
                    <div className="h-8 rounded-full bg-white/20" />
                    <div className="h-8 rounded-full bg-white/8" />
                    <div className="h-8 rounded-full bg-white/20" />
                    <div className="h-8 rounded-full bg-white/8" />
                    <div className="h-8 rounded-full bg-white/20" />
                    <div className="h-8 rounded-full bg-white/8" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
                What it does
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Restore clarity lost during separation
              </p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                Soundfix is built to improve degraded extracted audio and make it more usable for production.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
                Workflow
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Upload, preview, unlock full export
              </p>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                Users can hear a short restored preview first, then use credits only when they want the final file.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
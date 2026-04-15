"use client";

import { ChangeEvent, useRef, useState } from "react";

export default function Home() {
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

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="text-xl font-semibold tracking-tight">Soundfix</div>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-12 text-center lg:py-16">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/40">
            AI Audio Restoration
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Restore degraded vocals and stems
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-lg">
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
            className="mt-12 flex w-full max-w-3xl cursor-pointer flex-col items-center rounded-[32px] border border-dashed border-white/15 bg-white/[0.02] px-6 py-14 transition hover:border-white/30 hover:bg-white/[0.04] sm:px-10 sm:py-16"
          >
            <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {selectedFileName || "Drag and drop audio here"}
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/45 sm:text-base">
              {selectedFileName
                ? "Your file is loaded and ready for preview."
                : "Upload a separated vocal or stem to generate a short restored preview."}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
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
                disabled={!selectedFileName}
                className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue to preview
              </button>
            </div>

            <p className="mt-6 text-xs text-white/35">WAV, MP3</p>
          </div>
        </section>

        <section className="grid gap-6 pb-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
              Demo preview
            </p>
            <h3 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Hear the kind of change users should expect
            </h3>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/55 sm:text-base">
              Before and after examples should help users understand the value of
              restoration before they upload anything.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">Before</p>
                    <p className="mt-1 text-xs text-white/40">Separated vocal</p>
                  </div>
                  <span className="text-xs text-white/35">00:59</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-semibold text-black">
                    ▶
                  </div>
                  <div className="grid flex-1 grid-cols-12 gap-1">
                    <div className="h-9 rounded-full bg-white/10" />
                    <div className="h-9 rounded-full bg-white/5" />
                    <div className="h-9 rounded-full bg-white/10" />
                    <div className="h-9 rounded-full bg-white/5" />
                    <div className="h-9 rounded-full bg-white/10" />
                    <div className="h-9 rounded-full bg-white/5" />
                    <div className="h-9 rounded-full bg-white/10" />
                    <div className="h-9 rounded-full bg-white/5" />
                    <div className="h-9 rounded-full bg-white/10" />
                    <div className="h-9 rounded-full bg-white/5" />
                    <div className="h-9 rounded-full bg-white/10" />
                    <div className="h-9 rounded-full bg-white/5" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f4d029]/30 bg-[#f4d029]/10 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white">After</p>
                    <p className="mt-1 text-xs text-white/50">Soundfix restored</p>
                  </div>
                  <span className="text-xs text-white/40">00:59</span>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4d029] text-sm font-semibold text-black">
                    ▶
                  </div>
                  <div className="grid flex-1 grid-cols-12 gap-1">
                    <div className="h-9 rounded-full bg-[#f4d029]/70" />
                    <div className="h-9 rounded-full bg-[#f4d029]/35" />
                    <div className="h-9 rounded-full bg-[#f4d029]/70" />
                    <div className="h-9 rounded-full bg-[#f4d029]/35" />
                    <div className="h-9 rounded-full bg-[#f4d029]/70" />
                    <div className="h-9 rounded-full bg-[#f4d029]/35" />
                    <div className="h-9 rounded-full bg-[#f4d029]/70" />
                    <div className="h-9 rounded-full bg-[#f4d029]/35" />
                    <div className="h-9 rounded-full bg-[#f4d029]/70" />
                    <div className="h-9 rounded-full bg-[#f4d029]/35" />
                    <div className="h-9 rounded-full bg-[#f4d029]/70" />
                    <div className="h-9 rounded-full bg-[#f4d029]/35" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xl font-semibold tracking-tight text-white">
                Cleaner separation results
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
                Fix brittle upper mids, smeared details, and thin-sounding vocals
                after extraction.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xl font-semibold tracking-tight text-white">
                Preview before using credits
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
                Let users hear a short restored result first, then unlock the full
                export when they want the complete file.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xl font-semibold tracking-tight text-white">
                Built for DJs and producers
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
                Designed for remix workflows, bootlegs, mashups, edits, and any
                production process that depends on extracted stems.
              </p>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xl font-semibold tracking-tight text-white">
                Simple credit-based flow
              </p>
              <p className="mt-4 text-sm leading-7 text-white/55 sm:text-base">
                Upload, preview, spend credits, and download the final restored
                version in a clean step-by-step experience.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
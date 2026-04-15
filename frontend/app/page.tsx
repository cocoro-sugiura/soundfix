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
        <header className="flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.02] px-5 py-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f4d029] text-base font-bold text-black">
              S
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight">Soundfix</p>
              <p className="text-xs text-white/45">AI stem restoration</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="hidden rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5 sm:inline-flex">
              Pricing
            </button>
            <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
              Sign in
            </button>
          </div>
        </header>

        <section className="grid flex-1 items-stretch gap-8 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:py-10">
          <div className="flex flex-col justify-center rounded-[36px] border border-white/10 bg-white/[0.02] p-7 sm:p-9 lg:p-12">
            <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/45">
              AI Audio Restoration
            </p>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-tight text-white sm:text-5xl lg:text-[72px]">
              Restore degraded vocals and stems in one clean workflow
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-white/62 sm:text-lg">
              Upload a separated vocal or stem, preview the restored result, then
              unlock the full export when you are ready.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Cleaner transients</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Reduce brittle artifacts and rough separation residue.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Restored detail</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Bring back clarity, air, and presence lost in extraction.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="text-sm font-medium text-white">Preview first</p>
                <p className="mt-2 text-sm leading-6 text-white/45">
                  Hear the difference before using credits on the full file.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[36px] border border-white/10 bg-[#111115] p-5 shadow-2xl shadow-black/40 sm:p-6 lg:p-7">
            <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium uppercase tracking-[0.24em] text-white/35">
                    Start here
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-white sm:text-4xl">
                    Drop your file and generate a short restored preview
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
                  WAV, MP3
                </span>
              </div>

              <input
                ref={inputRef}
                type="file"
                accept=".wav,.mp3,audio/wav,audio/mpeg"
                className="hidden"
                onChange={handleFileChange}
              />

              <div
                onClick={handleSelectFile}
                className="mt-6 flex min-h-[340px] cursor-pointer flex-col justify-between rounded-[28px] border border-dashed border-white/15 bg-black/25 p-6 transition hover:border-white/30 hover:bg-black/35"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
                    Preview export
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
                    Up to 1 min demo
                  </div>
                </div>

                <div className="py-10 text-center">
                  <p className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                    {selectedFileName || "Drag and drop audio here"}
                  </p>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/45 sm:text-base">
                    {selectedFileName
                      ? "Your file is loaded. Continue to the preview step."
                      : "Upload a separated vocal or stem to hear how Soundfix restores clarity, body, and detail."}
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                    className="rounded-full bg-[#f4d029] px-6 py-3 text-sm font-semibold text-black transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Continue to preview
                  </button>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/35">
                By uploading audio, you agree to the processing of your file for
                preview generation.
              </p>
            </div>
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
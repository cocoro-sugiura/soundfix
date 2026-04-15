"use client";

import { ChangeEvent, useRef, useState } from "react";

export default function Home() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSelectFile = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setSelectedFileName("");
      setIsReady(false);
      return;
    }

    setSelectedFileName(file.name);
    setIsReady(false);
  };

  const handleFixAudio = async () => {
    if (!selectedFileName || isProcessing) {
      return;
    }

    setIsProcessing(true);
    setIsReady(false);

    await new Promise((resolve) => setTimeout(resolve, 2200));

    setIsProcessing(false);
    setIsReady(true);
  };

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <div className="text-xl font-semibold tracking-tight">Soundfix</div>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col justify-center py-12">
          <div className="max-w-3xl">
            <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-white/45">
              AI Audio Restoration
            </p>
            <h1 className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Fix degraded vocals and stems instantly
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-white/65 sm:text-lg">
              Restore clarity, presence, and high-end detail after vocal
              extraction or stem separation.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">
                    Upload your audio
                  </h2>
                  <p className="mt-2 text-sm text-white/55">
                    Drag and drop your file here or select a file
                  </p>
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

              <div className="mt-6 rounded-3xl border border-dashed border-white/15 bg-black/30 px-6 py-14 text-center">
                <div className="mx-auto max-w-md">
                  <p className="text-base font-medium text-white">
                    {selectedFileName || "No file selected"}
                  </p>
                  <p className="mt-2 text-sm text-white/45">
                    {selectedFileName
                      ? "File loaded and ready for restoration"
                      : "Upload one separated vocal or stem to begin"}
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleSelectFile}
                      className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90"
                    >
                      {selectedFileName ? "Change file" : "Select file"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-white">
                    {isProcessing
                      ? "Restoring your audio"
                      : isReady
                        ? "Restoration complete"
                        : "Ready to restore"}
                  </p>
                  <p className="mt-1 text-sm text-white/45">
                    {isProcessing
                      ? "Improving clarity, fixing artifacts, rebuilding high-end"
                      : "AI will restore clarity and reduce artifacts"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFixAudio}
                  disabled={!selectedFileName || isProcessing}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isProcessing ? "Restoring..." : "Fix Audio"}
                </button>
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
              <div className="border-b border-white/10 pb-4">
                <h2 className="text-xl font-semibold tracking-tight">Compare</h2>
                <p className="mt-2 text-sm text-white/55">
                  {isReady
                    ? "Preview is ready for before and after comparison"
                    : "Before / After preview will appear here"}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">
                      Before
                    </span>
                    <span className="text-xs text-white/40">Original</span>
                  </div>
                  <div className="mt-4 h-12 rounded-xl bg-white/5" />
                </div>

                <div
                  className={`rounded-2xl border border-white/10 bg-black/30 p-4 transition ${
                    isReady ? "opacity-100" : "opacity-40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">After</span>
                    <span className="text-xs text-white/40">Restored</span>
                  </div>
                  <div className="mt-4 h-12 rounded-xl bg-white/5" />
                </div>
              </div>

              <div
                className={`mt-6 rounded-2xl border border-white/10 bg-black/30 p-4 transition ${
                  isReady ? "opacity-100" : "opacity-40"
                }`}
              >
                <p className="text-sm font-medium text-white">
                  {isReady ? "Your audio is ready" : "Processed audio will appear here"}
                </p>
                <p className="mt-1 text-sm text-white/45">
                  {isReady
                    ? "Sign in to download your restored audio"
                    : "Run restoration to enable download"}
                </p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    disabled={!isReady}
                    className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Download
                  </button>
                  <button className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5">
                    Sign in
                  </button>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
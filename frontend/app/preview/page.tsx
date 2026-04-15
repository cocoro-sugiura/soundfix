"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const fileName = searchParams.get("file") || "untitled-file.wav";

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Soundfix
          </Link>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col justify-center py-10 lg:py-14">
          <div className="mx-auto w-full max-w-4xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
              Preview
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              Your restored preview is ready
            </h1>

            <p className="mt-5 text-base leading-7 text-white/58 sm:text-[17px]">
              Compare the before and after preview, then unlock the full export when you are ready.
            </p>
          </div>

          <div className="mx-auto mt-10 grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
                File
              </p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {fileName}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/50 sm:text-base">
                This is a short restored preview. The full file will be available after credit usage.
              </p>

              <div className="mt-8 space-y-3">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">Before</p>
                      <p className="mt-1 text-xs text-white/35">Original separated audio</p>
                    </div>
                    <span className="text-xs text-white/30">01:00</span>
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
                      <p className="mt-1 text-xs text-white/35">Soundfix restored preview</p>
                    </div>
                    <span className="text-xs text-white/30">01:00</span>
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

            <div className="flex flex-col gap-6">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
                  Next step
                </p>
                <p className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Unlock the full restored export
                </p>
                <p className="mt-4 text-sm leading-7 text-white/50 sm:text-base">
                  If the preview sounds right, continue to the export step and use credits for the full download.
                </p>

                <div className="mt-8 flex flex-col gap-3">
                  <button className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                    Use credits and continue
                  </button>

                  <Link
                    href="/"
                    className="rounded-full border border-white/15 px-6 py-3 text-center text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/5"
                  >
                    Back
                  </Link>
                </div>
              </div>

              <div className="rounded-[32px] border border-white/10 bg-white/[0.02] p-6 sm:p-8">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/35">
                  Preview policy
                </p>
                <p className="mt-4 text-sm leading-7 text-white/50 sm:text-base">
                  Preview length, credit usage, and final download controls will be connected in the next step.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
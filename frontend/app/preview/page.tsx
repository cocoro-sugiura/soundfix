"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PreviewPage() {
  const searchParams = useSearchParams();
  const fileName = searchParams.get("file") || "FILENAME.wav";

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

        <section className="flex flex-1 flex-col items-center py-12 lg:py-16">
          <div className="w-full max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/40">
                Preview
              </p>

              <h1 className="mt-5 text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Your restored preview is ready
              </h1>
            </div>

            <div className="mt-16">
              <p className="text-[15px] font-medium uppercase tracking-[0.08em] text-white/80">
                {fileName}
              </p>

              <div className="mt-10 space-y-10">
                <div>
                  <p className="text-[22px] font-medium tracking-tight text-white sm:text-[28px]">
                    Before
                  </p>
                  <p className="mt-2 text-base text-white/72">
                    Original separated audio
                  </p>

                  <div className="mt-5 flex items-center gap-6">
                    <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition hover:opacity-90">
                      ▶
                    </button>

                    <div className="flex flex-1 items-center gap-[5px]">
                      <div className="h-3 w-1.5 rounded-full bg-white/65" />
                      <div className="h-5 w-1.5 rounded-full bg-white/90" />
                      <div className="h-8 w-1.5 rounded-full bg-white/95" />
                      <div className="h-10 w-1.5 rounded-full bg-white/85" />
                      <div className="h-12 w-1.5 rounded-full bg-white/70" />
                      <div className="h-11 w-1.5 rounded-full bg-white/85" />
                      <div className="h-8 w-1.5 rounded-full bg-white/95" />
                      <div className="h-6 w-1.5 rounded-full bg-white/80" />
                      <div className="h-4 w-1.5 rounded-full bg-white/65" />
                      <div className="h-5 w-1.5 rounded-full bg-white/78" />
                      <div className="h-8 w-1.5 rounded-full bg-white/92" />
                      <div className="h-10 w-1.5 rounded-full bg-white/82" />
                      <div className="h-7 w-1.5 rounded-full bg-white/72" />
                      <div className="h-4 w-1.5 rounded-full bg-white/62" />
                      <div className="h-6 w-1.5 rounded-full bg-white/85" />
                      <div className="h-9 w-1.5 rounded-full bg-white/96" />
                      <div className="h-11 w-1.5 rounded-full bg-white/84" />
                      <div className="h-8 w-1.5 rounded-full bg-white/74" />
                      <div className="h-5 w-1.5 rounded-full bg-white/65" />
                      <div className="h-4 w-1.5 rounded-full bg-white/58" />
                      <div className="h-7 w-1.5 rounded-full bg-white/82" />
                      <div className="h-10 w-1.5 rounded-full bg-white/94" />
                      <div className="h-12 w-1.5 rounded-full bg-white/86" />
                      <div className="h-10 w-1.5 rounded-full bg-white/75" />
                      <div className="h-7 w-1.5 rounded-full bg-white/64" />
                      <div className="h-5 w-1.5 rounded-full bg-white/58" />
                      <div className="h-4 w-1.5 rounded-full bg-white/64" />
                      <div className="h-6 w-1.5 rounded-full bg-white/82" />
                      <div className="h-9 w-1.5 rounded-full bg-white/94" />
                      <div className="h-11 w-1.5 rounded-full bg-white/86" />
                      <div className="h-8 w-1.5 rounded-full bg-white/74" />
                      <div className="h-6 w-1.5 rounded-full bg-white/63" />
                      <div className="h-5 w-1.5 rounded-full bg-white/60" />
                      <div className="h-7 w-1.5 rounded-full bg-white/84" />
                      <div className="h-10 w-1.5 rounded-full bg-white/96" />
                      <div className="h-12 w-1.5 rounded-full bg-white/88" />
                      <div className="h-9 w-1.5 rounded-full bg-white/78" />
                      <div className="h-6 w-1.5 rounded-full bg-white/64" />
                      <div className="h-4 w-1.5 rounded-full bg-white/58" />
                      <div className="h-3 w-1.5 rounded-full bg-white/54" />
                      <div className="h-5 w-1.5 rounded-full bg-white/74" />
                      <div className="h-8 w-1.5 rounded-full bg-white/92" />
                      <div className="h-10 w-1.5 rounded-full bg-white/86" />
                      <div className="h-12 w-1.5 rounded-full bg-white/80" />
                      <div className="h-11 w-1.5 rounded-full bg-white/90" />
                      <div className="h-8 w-1.5 rounded-full bg-white/96" />
                      <div className="h-6 w-1.5 rounded-full bg-white/84" />
                      <div className="h-4 w-1.5 rounded-full bg-white/68" />
                      <div className="h-3 w-1.5 rounded-full bg-white/58" />
                      <div className="h-5 w-1.5 rounded-full bg-white/72" />
                      <div className="h-8 w-1.5 rounded-full bg-white/90" />
                      <div className="h-10 w-1.5 rounded-full bg-white/85" />
                      <div className="h-9 w-1.5 rounded-full bg-white/76" />
                      <div className="h-7 w-1.5 rounded-full bg-white/66" />
                      <div className="h-5 w-1.5 rounded-full bg-white/58" />
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-[22px] font-medium tracking-tight text-white sm:text-[28px]">
                    After
                  </p>
                  <p className="mt-2 text-base text-white/72">
                    Soundfix restored preview
                  </p>

                  <div className="mt-5 flex items-center gap-6">
                    <button className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition hover:opacity-90">
                      ▶
                    </button>

                    <div className="flex flex-1 items-center gap-[5px]">
                      <div className="h-3 w-1.5 rounded-full bg-white/65" />
                      <div className="h-5 w-1.5 rounded-full bg-white/90" />
                      <div className="h-8 w-1.5 rounded-full bg-white/95" />
                      <div className="h-10 w-1.5 rounded-full bg-white/85" />
                      <div className="h-12 w-1.5 rounded-full bg-white/70" />
                      <div className="h-11 w-1.5 rounded-full bg-white/85" />
                      <div className="h-8 w-1.5 rounded-full bg-white/95" />
                      <div className="h-6 w-1.5 rounded-full bg-white/80" />
                      <div className="h-4 w-1.5 rounded-full bg-white/65" />
                      <div className="h-5 w-1.5 rounded-full bg-white/78" />
                      <div className="h-8 w-1.5 rounded-full bg-white/92" />
                      <div className="h-10 w-1.5 rounded-full bg-white/82" />
                      <div className="h-7 w-1.5 rounded-full bg-white/72" />
                      <div className="h-4 w-1.5 rounded-full bg-white/62" />
                      <div className="h-6 w-1.5 rounded-full bg-white/85" />
                      <div className="h-9 w-1.5 rounded-full bg-white/96" />
                      <div className="h-11 w-1.5 rounded-full bg-white/84" />
                      <div className="h-8 w-1.5 rounded-full bg-white/74" />
                      <div className="h-5 w-1.5 rounded-full bg-white/65" />
                      <div className="h-4 w-1.5 rounded-full bg-white/58" />
                      <div className="h-7 w-1.5 rounded-full bg-white/82" />
                      <div className="h-10 w-1.5 rounded-full bg-white/94" />
                      <div className="h-12 w-1.5 rounded-full bg-white/86" />
                      <div className="h-10 w-1.5 rounded-full bg-white/75" />
                      <div className="h-7 w-1.5 rounded-full bg-white/64" />
                      <div className="h-5 w-1.5 rounded-full bg-white/58" />
                      <div className="h-4 w-1.5 rounded-full bg-white/64" />
                      <div className="h-6 w-1.5 rounded-full bg-white/82" />
                      <div className="h-9 w-1.5 rounded-full bg-white/94" />
                      <div className="h-11 w-1.5 rounded-full bg-white/86" />
                      <div className="h-8 w-1.5 rounded-full bg-white/74" />
                      <div className="h-6 w-1.5 rounded-full bg-white/63" />
                      <div className="h-5 w-1.5 rounded-full bg-white/60" />
                      <div className="h-7 w-1.5 rounded-full bg-white/84" />
                      <div className="h-10 w-1.5 rounded-full bg-white/96" />
                      <div className="h-12 w-1.5 rounded-full bg-white/88" />
                      <div className="h-9 w-1.5 rounded-full bg-white/78" />
                      <div className="h-6 w-1.5 rounded-full bg-white/64" />
                      <div className="h-4 w-1.5 rounded-full bg-white/58" />
                      <div className="h-3 w-1.5 rounded-full bg-white/54" />
                      <div className="h-5 w-1.5 rounded-full bg-white/74" />
                      <div className="h-8 w-1.5 rounded-full bg-white/92" />
                      <div className="h-10 w-1.5 rounded-full bg-white/86" />
                      <div className="h-12 w-1.5 rounded-full bg-white/80" />
                      <div className="h-11 w-1.5 rounded-full bg-white/90" />
                      <div className="h-8 w-1.5 rounded-full bg-white/96" />
                      <div className="h-6 w-1.5 rounded-full bg-white/84" />
                      <div className="h-4 w-1.5 rounded-full bg-white/68" />
                      <div className="h-3 w-1.5 rounded-full bg-white/58" />
                      <div className="h-5 w-1.5 rounded-full bg-white/72" />
                      <div className="h-8 w-1.5 rounded-full bg-white/90" />
                      <div className="h-10 w-1.5 rounded-full bg-white/85" />
                      <div className="h-9 w-1.5 rounded-full bg-white/76" />
                      <div className="h-7 w-1.5 rounded-full bg-white/66" />
                      <div className="h-5 w-1.5 rounded-full bg-white/58" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 flex justify-end">
                <button className="rounded-full bg-white px-8 py-3 text-base font-medium text-black transition hover:opacity-90">
                  Unlock the full restored export
                </button>
              </div>

              <div className="mt-8 flex justify-start">
                <Link
                  href="/"
                  className="text-sm text-white/45 transition hover:text-white/70"
                >
                  Back
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
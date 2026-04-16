"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type StoredPreviewFile = {
  fileName: string;
  audioDataUrl: string;
  fileType?: string;
};

export default function PreviewPageClient() {
  const router = useRouter();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [fileName, setFileName] = useState("FILENAME.wav");
  const [audioDataUrl, setAudioDataUrl] = useState("");
  const [isPlayingBefore, setIsPlayingBefore] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedValue = sessionStorage.getItem("soundfix-preview-file");

    if (!storedValue) {
      setIsReady(true);
      return;
    }

    try {
      const parsedValue = JSON.parse(storedValue) as StoredPreviewFile;

      if (parsedValue.fileName) {
        setFileName(parsedValue.fileName);
      }

      if (parsedValue.audioDataUrl) {
        setAudioDataUrl(parsedValue.audioDataUrl);
      }
    } catch {
      sessionStorage.removeItem("soundfix-preview-file");
    } finally {
      setIsReady(true);
    }
  }, []);

  useEffect(() => {
    const audioElement = audioRef.current;

    if (!audioElement) {
      return;
    }

    const handleEnded = () => {
      setIsPlayingBefore(false);
    };

    const handlePause = () => {
      setIsPlayingBefore(false);
    };

    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("pause", handlePause);

    return () => {
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("pause", handlePause);
    };
  }, [audioDataUrl]);

  const beforeButtonLabel = useMemo(() => {
    return isPlayingBefore ? "❚❚" : "▶";
  }, [isPlayingBefore]);

  const handleToggleBeforePlayback = async () => {
    const audioElement = audioRef.current;

    if (!audioElement || !audioDataUrl) {
      return;
    }

    if (audioElement.paused) {
      await audioElement.play();
      setIsPlayingBefore(true);
      return;
    }

    audioElement.pause();
    setIsPlayingBefore(false);
  };

  const handleContinueToDownload = () => {
    router.push(`/download?file=${encodeURIComponent(fileName)}`);
  };

  return (
    <main className="min-h-screen bg-[#0a0a0d] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Soundfix
          </Link>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center py-10 lg:py-14">
          <div className="w-full max-w-[980px]">
            <div className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
                Preview
              </p>

              <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[56px]">
                Your restored preview is ready
              </h1>
            </div>

            <div className="mt-14">
              <p className="text-[14px] font-medium uppercase tracking-[0.08em] text-white/78">
                {fileName}
              </p>

              {!isReady ? (
                <p className="mt-4 text-sm text-white/45">Loading preview...</p>
              ) : !audioDataUrl ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-white/58">
                  No preview audio was found. Please go back and select a file again.
                </div>
              ) : null}

              <div className="mt-10 space-y-10">
                <div>
                  <p className="text-[22px] font-medium tracking-tight text-white sm:text-[28px]">
                    Before
                  </p>
                  <p className="mt-2 text-base text-white/72">
                    Original separated audio
                  </p>

                  <div className="mt-5 flex items-center gap-6">
                    {audioDataUrl ? (
                      <audio ref={audioRef} src={audioDataUrl} preload="metadata" />
                    ) : null}

                    <button
                      type="button"
                      onClick={handleToggleBeforePlayback}
                      disabled={!audioDataUrl}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {beforeButtonLabel}
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
                    <button
                      type="button"
                      disabled
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-base text-black transition disabled:cursor-not-allowed disabled:opacity-40"
                    >
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

              <div className="mt-14 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueToDownload}
                  className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90"
                >
                  Unlock the full restored export
                </button>
              </div>

              <div className="mt-7 flex justify-start">
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
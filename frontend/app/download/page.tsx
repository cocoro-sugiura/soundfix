import Link from "next/link";

type DownloadPageProps = {
  searchParams?: Promise<{
    file?: string;
  }>;
};

export default async function DownloadPage({
  searchParams,
}: DownloadPageProps) {
  const params = await searchParams;
  const fileName = params?.file || "FILENAME.wav";

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

        <section className="flex flex-1 flex-col items-center justify-center py-10 lg:py-14">
          <div className="w-full max-w-[980px] text-center">
            <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/38">
              Download
            </p>

            <h1 className="mt-5 text-4xl font-semibold leading-[1.06] tracking-tight text-white sm:text-5xl lg:text-[56px]">
              Your full restored file is ready
            </h1>

            <p className="mt-5 max-w-xl mx-auto text-base leading-7 text-white/58 sm:text-[17px]">
              Credits have been used for this export. You can now download the full restored version.
            </p>
          </div>

          <div className="mt-14 w-full max-w-[760px] rounded-[32px] border border-white/10 bg-white/[0.03] p-8 sm:p-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-lg text-white">
                <i className="fa-solid fa-download" aria-hidden="true" />
              </div>

              <p className="mt-6 text-xs font-medium uppercase tracking-[0.24em] text-white/38">
                Export ready
              </p>

              <p className="mt-4 break-all text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                {fileName}
              </p>

              <p className="mt-4 max-w-xl text-sm leading-7 text-white/52 sm:text-base">
                Your full restored export is ready to download. Save the file and continue refining your workflow in Soundfix.
              </p>
            </div>

            <div className="mt-8 grid gap-3 rounded-[24px] border border-white/10 bg-black/20 p-4 sm:grid-cols-3 sm:gap-4 sm:p-5">
              <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">
                  Type
                </p>
                <p className="mt-2 text-sm font-medium text-white/88">
                  Full export
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">
                  Status
                </p>
                <p className="mt-2 text-sm font-medium text-white/88">
                  Ready
                </p>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-4 text-center">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/34">
                  Output
                </p>
                <p className="mt-2 text-sm font-medium text-white/88">
                  Restored audio
                </p>
              </div>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                <i className="fa-solid fa-arrow-down" aria-hidden="true" />
                <span>Download file</span>
              </button>

              <p className="text-xs text-white/30">
                The restored file will be available here once export delivery is connected.
              </p>

              <Link
                href="/"
                className="text-sm text-white/45 transition hover:text-white/70"
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
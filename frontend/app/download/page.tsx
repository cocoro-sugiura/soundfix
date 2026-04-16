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
            <div className="inline-flex items-center rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1">
              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-blue-300">
                Restored audio
              </span>
            </div>

              <p className="mt-4 break-all text-2xl font-semibold tracking-tight text-white sm:text-[30px]">
                {fileName}
              </p>
            </div>

            <div className="mt-10 flex flex-col items-center gap-4">
              <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-90">
                <i className="fa-solid fa-arrow-down-to-bracket" aria-hidden="true" />
                <span>Download file</span>
              </button>

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
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
      <div className="mx-auto flex min-h-screen w-full max-w-[1280px] flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="text-xl font-semibold tracking-tight">
            Soundfix
          </Link>
          <button className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/5">
            Sign in
          </button>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center py-12 lg:py-16">
          <div className="w-full max-w-4xl text-center">
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-white/40">
              Download
            </p>

            <h1 className="mt-5 text-4xl font-medium leading-tight tracking-tight text-white sm:text-5xl lg:text-[56px]">
              Your full restored file is ready
            </h1>

            <p className="mt-6 text-base text-white/62 sm:text-[17px]">
              Credits have been used for this export. You can now download the full restored version.
            </p>
          </div>

          <div className="mt-16 w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/[0.02] p-8 text-center sm:p-10">
            <p className="text-[15px] font-medium uppercase tracking-[0.08em] text-white/80">
              {fileName}
            </p>

            <p className="mt-6 text-sm leading-7 text-white/50 sm:text-base">
              Full restored export
            </p>

            <div className="mt-10 flex flex-col items-center gap-4">
              <button className="rounded-full bg-white px-8 py-3 text-base font-medium text-black transition hover:opacity-90">
                Download file
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
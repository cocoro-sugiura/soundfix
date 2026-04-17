import DownloadPageClient from "./download-page-client";

type DownloadPageProps = {
  searchParams?: Promise<{
    file?: string;
    job?: string;
  }>;
};

export default async function DownloadPage({
  searchParams,
}: DownloadPageProps) {
  const params = await searchParams;
  const fileName = params?.file || "FILENAME.wav";

  return <DownloadPageClient fileName={fileName} />;
}
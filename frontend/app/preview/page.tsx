import Link from "next/link";
import PreviewPageClient from "./preview-page-client";

type PreviewPageProps = {
  searchParams?: Promise<{
    file?: string;
  }>;
};

export default async function PreviewPage({
  searchParams,
}: PreviewPageProps) {
  const params = await searchParams;
  const fileName = params?.file || "FILENAME.wav";

  return <PreviewPageClient fileName={fileName} />;
}
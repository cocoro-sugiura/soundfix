import PreviewPageClient from "./preview-page-client";

type PreviewPageProps = {
  searchParams?: Promise<{
    file?: string;
    job?: string;
  }>;
};

export default async function PreviewPage({
  searchParams,
}: PreviewPageProps) {
  await searchParams;

  return <PreviewPageClient />;
}
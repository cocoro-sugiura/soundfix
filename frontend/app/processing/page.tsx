import { Suspense } from "react";
import ProcessingPageClient from "./processing-page-client";

export default function ProcessingPage() {
  return (
    <Suspense fallback={null}>
      <ProcessingPageClient />
    </Suspense>
  );
}
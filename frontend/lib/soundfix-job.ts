export type SoundfixJobStatus =
  | "idle"
  | "uploaded"
  | "preview_processing"
  | "preview_ready"
  | "full_processing"
  | "full_ready"
  | "failed";

export type SoundfixJobResponse = {
  jobId: string;
  status: SoundfixJobStatus;
  originalFileName: string;
  originalFileType: string;
  previewBeforeUrl: string;
  previewAfterUrl: string;
  fullAfterUrl: string;
  errorMessage: string;
};
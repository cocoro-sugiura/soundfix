import {
  SoundfixJobResponse,
  SoundfixJobStatus,
} from "./soundfix-job";

type PreviewAudioState = {
  jobId: string;
  status: SoundfixJobStatus;
  fileName: string;
  originalFile: File | null;
  originalAudioUrl: string;
  previewBeforeAudioUrl: string;
  previewAfterAudioUrl: string;
  fullAfterAudioUrl: string;
  fileType: string;
  errorMessage: string;
};

const previewAudioState: PreviewAudioState = {
  jobId: "",
  status: "idle",
  fileName: "",
  originalFile: null,
  originalAudioUrl: "",
  previewBeforeAudioUrl: "",
  previewAfterAudioUrl: "",
  fullAfterAudioUrl: "",
  fileType: "",
  errorMessage: "",
};

function revokeAudioUrl(audioUrl: string) {
  if (!audioUrl) {
    return;
  }

  URL.revokeObjectURL(audioUrl);
}

export function setPreviewAudioFile(file: File) {
  revokeAudioUrl(previewAudioState.originalAudioUrl);
  revokeAudioUrl(previewAudioState.previewBeforeAudioUrl);
  revokeAudioUrl(previewAudioState.previewAfterAudioUrl);
  revokeAudioUrl(previewAudioState.fullAfterAudioUrl);

  const objectUrl = URL.createObjectURL(file);

  previewAudioState.jobId = "";
  previewAudioState.status = "uploaded";
  previewAudioState.fileName = file.name;
  previewAudioState.originalFile = file;
  previewAudioState.originalAudioUrl = objectUrl;
  previewAudioState.previewBeforeAudioUrl = objectUrl;
  previewAudioState.previewAfterAudioUrl = objectUrl;
  previewAudioState.fullAfterAudioUrl = objectUrl;
  previewAudioState.fileType = file.type;
}

export function setPreviewAudioJob(jobId: string) {
  previewAudioState.jobId = jobId;
}

export function setPreviewAudioStatus(status: SoundfixJobStatus) {
  previewAudioState.status = status;
}

export function applyMockJobResponse(job: SoundfixJobResponse) {
  previewAudioState.jobId = job.jobId;
  previewAudioState.status = job.status;
  previewAudioState.fileName = job.originalFileName;
  previewAudioState.fileType = job.originalFileType;
  previewAudioState.previewBeforeAudioUrl =
    job.previewBeforeUrl || previewAudioState.previewBeforeAudioUrl;
  previewAudioState.previewAfterAudioUrl =
    job.previewAfterUrl || previewAudioState.previewAfterAudioUrl;
  previewAudioState.fullAfterAudioUrl =
    job.fullAfterUrl || previewAudioState.fullAfterAudioUrl;
  previewAudioState.errorMessage = job.errorMessage;
}

export function getPreviewAudioFile() {
  return previewAudioState;
}

export function clearPreviewAudioFile() {
  revokeAudioUrl(previewAudioState.originalAudioUrl);

  if (
    previewAudioState.previewBeforeAudioUrl &&
    previewAudioState.previewBeforeAudioUrl !== previewAudioState.originalAudioUrl
  ) {
    revokeAudioUrl(previewAudioState.previewBeforeAudioUrl);
  }

  if (
    previewAudioState.previewAfterAudioUrl &&
    previewAudioState.previewAfterAudioUrl !== previewAudioState.originalAudioUrl
  ) {
    revokeAudioUrl(previewAudioState.previewAfterAudioUrl);
  }

  if (
    previewAudioState.fullAfterAudioUrl &&
    previewAudioState.fullAfterAudioUrl !== previewAudioState.originalAudioUrl
  ) {
    revokeAudioUrl(previewAudioState.fullAfterAudioUrl);
  }

  previewAudioState.jobId = "";
  previewAudioState.status = "idle";
  previewAudioState.fileName = "";
  previewAudioState.originalFile = null;
  previewAudioState.originalAudioUrl = "";
  previewAudioState.previewBeforeAudioUrl = "";
  previewAudioState.previewAfterAudioUrl = "";
  previewAudioState.fullAfterAudioUrl = "";
  previewAudioState.fileType = "";
  previewAudioState.errorMessage = "";
}
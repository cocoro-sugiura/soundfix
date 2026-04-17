type PreviewAudioState = {
  jobId: string;
  status:
    | "idle"
    | "uploaded"
    | "preview_processing"
    | "preview_ready"
    | "full_processing"
    | "full_ready";
  fileName: string;
  originalFile: File | null;
  originalAudioUrl: string;
  previewBeforeAudioUrl: string;
  previewAfterAudioUrl: string;
  fullAfterAudioUrl: string;
  fileType: string;
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

export function setPreviewAudioStatus(
  status: PreviewAudioState["status"],
) {
  previewAudioState.status = status;
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
}
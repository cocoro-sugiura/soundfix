type PreviewAudioState = {
  fileName: string;
  file: File | null;
  audioUrl: string;
  fileType: string;
};

const previewAudioState: PreviewAudioState = {
  fileName: "",
  file: null,
  audioUrl: "",
  fileType: "",
};

export function setPreviewAudioFile(file: File) {
  if (previewAudioState.audioUrl) {
    URL.revokeObjectURL(previewAudioState.audioUrl);
  }

  previewAudioState.fileName = file.name;
  previewAudioState.file = file;
  previewAudioState.audioUrl = URL.createObjectURL(file);
  previewAudioState.fileType = file.type;
}

export function getPreviewAudioFile() {
  return previewAudioState;
}

export function clearPreviewAudioFile() {
  if (previewAudioState.audioUrl) {
    URL.revokeObjectURL(previewAudioState.audioUrl);
  }

  previewAudioState.fileName = "";
  previewAudioState.file = null;
  previewAudioState.audioUrl = "";
  previewAudioState.fileType = "";
}
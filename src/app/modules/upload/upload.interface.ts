export interface TInitiateUploadPayload {
  fileName: string;
  fileSize: number;
  mimeType: string;
  category?: string;
}

export interface TGetPresignedUrlsPayload {
  uploadId: string;
  fileKey: string;
  partNumbers: number[];
}

export interface TCompleteUploadPart {
  PartNumber: number;
  ETag: string;
}

export interface TCompleteUploadPayload {
  uploadId: string;
  fileKey: string;
  parts: TCompleteUploadPart[];
}

export interface TAbortUploadPayload {
  uploadId: string;
  fileKey: string;
}

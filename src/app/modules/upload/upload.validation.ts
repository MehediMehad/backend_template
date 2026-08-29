import { z } from 'zod';

const initiateUpload = z.object({
  fileName: z.string().min(1, 'File name is required'),
  fileSize: z.number().positive('File size must be greater than 0'),
  mimeType: z.string().min(1, 'Mime type is required'),
  category: z.string().optional(),
});

const getPresignedUrls = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  fileKey: z.string().min(1, 'File key is required'),
  partNumbers: z
    .array(z.number().int().positive())
    .min(1, 'At least one part number must be requested'),
});

const completeUpload = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  fileKey: z.string().min(1, 'File key is required'),
  parts: z
    .array(
      z.object({
        PartNumber: z.number().int().positive(),
        ETag: z.string().min(1, 'ETag is required'),
      }),
    )
    .min(1, 'At least one part object is required'),
});

const abortUpload = z.object({
  uploadId: z.string().min(1, 'Upload ID is required'),
  fileKey: z.string().min(1, 'File key is required'),
});

export const UploadValidations = {
  initiateUpload,
  getPresignedUrls,
  completeUpload,
  abortUpload,
};

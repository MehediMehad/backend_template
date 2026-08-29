import { randomUUID } from 'crypto';

import httpStatus from 'http-status';

import type {
  TAbortUploadPayload,
  TCompleteUploadPayload,
  TGetPresignedUrlsPayload,
  TInitiateUploadPayload,
} from './upload.interface';
import ApiError from '../../errors/ApiError';
import { s3MultipartHelper } from '../../helpers/s3Multipart';
import prisma from '../../libs/prisma';

// Standard 10MB chunk size (AWS S3 minimum per part is 5MB except last part)
const DEFAULT_CHUNK_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB max limit

/**
 * Initiate a large file multipart upload session
 */
const initiateUpload = async (userId: string | undefined, payload: TInitiateUploadPayload) => {
  const { fileName, fileSize, mimeType, category = 'general' } = payload;

  if (fileSize > MAX_FILE_SIZE) {
    throw new ApiError(httpStatus.BAD_REQUEST, `File size exceeds maximum allowed limit of 5 GB`);
  }

  // Sanitize filename and construct a clean unique key path
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const fileKey = `uploads/${category}/${year}/${month}/${randomUUID()}-${sanitizedFileName}`;

  // 1. Initiate Multipart Session with S3
  const { uploadId } = await s3MultipartHelper.initiateMultipartUpload(fileKey, mimeType);

  // 2. Calculate Total Parts required
  const totalParts = Math.ceil(fileSize / DEFAULT_CHUNK_SIZE);

  // 3. Create tracking entry in PostgreSQL via Prisma
  const fileRecord = await prisma.fileUpload.create({
    data: {
      userId: userId || null,
      uploadId,
      fileKey,
      fileName,
      fileSize: BigInt(fileSize),
      mimeType,
      totalParts,
      status: 'UPLOADING',
    },
  });

  return {
    id: fileRecord.id,
    uploadId: fileRecord.uploadId,
    fileKey: fileRecord.fileKey,
    fileName: fileRecord.fileName,
    totalParts: fileRecord.totalParts,
    chunkSize: DEFAULT_CHUNK_SIZE,
  };
};

/**
 * Generate Presigned URLs for requested part numbers
 */
const getPresignedUrls = async (userId: string | undefined, payload: TGetPresignedUrlsPayload) => {
  const { uploadId, fileKey, partNumbers } = payload;

  // 1. Verify upload session exists in DB
  const uploadRecord = await prisma.fileUpload.findUnique({
    where: { uploadId },
  });

  if (!uploadRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Upload session not found');
  }

  if (userId && uploadRecord.userId && uploadRecord.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not own this upload session');
  }

  if (uploadRecord.status !== 'UPLOADING') {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      `Cannot generate URLs. Current upload status is '${uploadRecord.status}'`,
    );
  }

  // 2. Generate presigned URLs concurrently
  const presignedUrls = await Promise.all(
    partNumbers.map(async (partNumber) => {
      if (partNumber < 1 || partNumber > uploadRecord.totalParts) {
        throw new ApiError(
          httpStatus.BAD_REQUEST,
          `Invalid part number ${partNumber}. Total parts: ${uploadRecord.totalParts}`,
        );
      }

      const url = await s3MultipartHelper.generatePresignedPartUrl(fileKey, uploadId, partNumber);
      return {
        partNumber,
        url,
      };
    }),
  );

  return presignedUrls;
};

/**
 * Complete the Multipart Upload and stitch chunks in S3
 */
const completeUpload = async (userId: string | undefined, payload: TCompleteUploadPayload) => {
  const { uploadId, fileKey, parts } = payload;

  // 1. Verify upload record in DB
  const uploadRecord = await prisma.fileUpload.findUnique({
    where: { uploadId },
  });

  if (!uploadRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Upload session not found');
  }

  if (userId && uploadRecord.userId && uploadRecord.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not own this upload session');
  }

  if (uploadRecord.status === 'COMPLETED') {
    return uploadRecord;
  }

  try {
    // 2. Complete S3 Multipart Upload
    const fileUrl = await s3MultipartHelper.completeMultipartUpload(fileKey, uploadId, parts);

    // 3. Update DB record to COMPLETED
    const updatedRecord = await prisma.fileUpload.update({
      where: { uploadId },
      data: {
        status: 'COMPLETED',
        fileUrl,
      },
    });

    return {
      id: updatedRecord.id,
      uploadId: updatedRecord.uploadId,
      fileKey: updatedRecord.fileKey,
      fileName: updatedRecord.fileName,
      fileUrl: updatedRecord.fileUrl,
      status: updatedRecord.status,
    };
  } catch (error) {
    // Mark as FAILED on error
    await prisma.fileUpload.update({
      where: { uploadId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
};

/**
 * Abort an active upload session
 */
const abortUpload = async (userId: string | undefined, payload: TAbortUploadPayload) => {
  const { uploadId, fileKey } = payload;

  const uploadRecord = await prisma.fileUpload.findUnique({
    where: { uploadId },
  });

  if (!uploadRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Upload session not found');
  }

  if (userId && uploadRecord.userId && uploadRecord.userId !== userId) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Forbidden: You do not own this upload session');
  }

  // 1. Send abort command to S3
  try {
    await s3MultipartHelper.abortMultipartUpload(fileKey, uploadId);
  } catch (err) {
    // Ignore error if S3 session was already aborted/removed
    console.warn(`S3 Abort notice for uploadId ${uploadId}:`, err);
  }

  // 2. Update DB status to ABORTED
  const updatedRecord = await prisma.fileUpload.update({
    where: { uploadId },
    data: { status: 'ABORTED' },
  });

  return {
    id: updatedRecord.id,
    uploadId: updatedRecord.uploadId,
    status: updatedRecord.status,
    message: 'Upload session successfully aborted',
  };
};

/**
 * Get upload status details by upload ID
 */
const getUploadStatus = async (uploadId: string) => {
  const uploadRecord = await prisma.fileUpload.findUnique({
    where: { uploadId },
  });

  if (!uploadRecord) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Upload record not found');
  }

  return {
    id: uploadRecord.id,
    uploadId: uploadRecord.uploadId,
    fileKey: uploadRecord.fileKey,
    fileName: uploadRecord.fileName,
    fileSize: uploadRecord.fileSize.toString(),
    totalParts: uploadRecord.totalParts,
    status: uploadRecord.status,
    fileUrl: uploadRecord.fileUrl,
    createdAt: uploadRecord.createdAt,
  };
};

export const UploadServices = {
  initiateUpload,
  getPresignedUrls,
  completeUpload,
  abortUpload,
  getUploadStatus,
};

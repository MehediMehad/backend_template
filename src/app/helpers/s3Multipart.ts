import {
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  type CompletedPart,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import config from '../../configs';
import { s3Client } from '../libs/s3Client';

/**
 * Helper utility for AWS S3 / DigitalOcean Spaces Multipart Upload operations
 */
export const s3MultipartHelper = {
  /**
   * Initiates a multipart upload session on S3.
   */
  async initiateMultipartUpload(fileKey: string, mimeType: string) {
    const command = new CreateMultipartUploadCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      ContentType: mimeType,
    });

    const response = await s3Client.send(command);

    if (!response.UploadId || !response.Key) {
      throw new Error('Failed to initiate S3 multipart upload session');
    }

    return {
      uploadId: response.UploadId,
      fileKey: response.Key,
    };
  },

  /**
   * Generates a presigned URL for uploading a specific part chunk directly to S3.
   * Expires in 1 hour (3600 seconds).
   */
  async generatePresignedPartUrl(fileKey: string, uploadId: string, partNumber: number) {
    const command = new UploadPartCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      UploadId: uploadId,
      PartNumber: partNumber,
    });

    return await getSignedUrl(s3Client as any, command as any, { expiresIn: 3600 });
  },

  /**
   * Completes the multipart upload by stitching all uploaded parts together.
   */
  async completeMultipartUpload(fileKey: string, uploadId: string, parts: CompletedPart[]) {
    // S3 requires parts sorted in ascending order of PartNumber
    const sortedParts = [...parts].sort((a, b) => (a.PartNumber || 0) - (b.PartNumber || 0));

    const command = new CompleteMultipartUploadCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: sortedParts,
      },
    });

    const response = await s3Client.send(command);

    // Return S3 Location or construct CDN/bucket public URL
    if (response.Location) {
      return response.Location;
    }

    const endpoint = config.s3.endpoint?.replace(/\/$/, '');
    return `${endpoint}/${config.s3.bucket}/${fileKey}`;
  },

  /**
   * Aborts an incomplete multipart upload to prevent orphan part charges.
   */
  async abortMultipartUpload(fileKey: string, uploadId: string) {
    const command = new AbortMultipartUploadCommand({
      Bucket: config.s3.bucket,
      Key: fileKey,
      UploadId: uploadId,
    });

    await s3Client.send(command);
  },
};

import express from 'express';

import { UploadControllers } from './upload.controller';
import { UploadValidations } from './upload.validation';
import validateRequest from '../../middlewares/validateRequest';

const router = express.Router();

// 1. Initiate Multipart Upload Session
router.post(
  '/initiate',
  validateRequest(UploadValidations.initiateUpload),
  UploadControllers.initiateUpload,
);

// 2. Get Presigned URLs for Chunk Uploads
router.post(
  '/presigned-urls',
  validateRequest(UploadValidations.getPresignedUrls),
  UploadControllers.getPresignedUrls,
);

// 3. Complete Multipart Upload Session
router.post(
  '/complete',
  validateRequest(UploadValidations.completeUpload),
  UploadControllers.completeUpload,
);

// 4. Abort Multipart Upload Session
router.post(
  '/abort',
  validateRequest(UploadValidations.abortUpload),
  UploadControllers.abortUpload,
);

// 5. Track Upload Status
router.get('/status/:uploadId', UploadControllers.getUploadStatus);

export const UploadRoutes = router;

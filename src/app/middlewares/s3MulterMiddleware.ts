import multer from 'multer';
import multerS3 from 'multer-s3';

import config from '../../configs';
import { s3Client } from '../libs/s3Client';

// Create multer storage for DigitalOcean Spaces
const s3Storage = multerS3({
  s3: s3Client,
  bucket: config.s3.bucket || '',
  // acl: 'public-read', // Ensure files are publicly accessible
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (_req, file, cb) => {
    // Generate a unique name for the file
    const uniqueName = `${Date.now()}-${file.originalname}/file-${file.fieldname}`;
    cb(null, uniqueName);
  },
});
// eslint-disable-next-line
const imageFilter = (_req: any, file: any, cb: any) => {
  // const allowedMimes = [
  //   'image/png',
  //   'image/jpeg',
  //   'image/jpg',
  //   'application/pdf', // pdf
  //   'video/mp4',
  //   'video/webm',
  //   'video/quicktime',
  //   'video/x-msvideo',
  // ];

  // TODO: Add UNCOMMENTED CODE

  // if (!allowedMimes.includes(file.mimetype)) {
  //   return cb(
  //     new ApiError(
  //       httpStatus.BAD_REQUEST,
  //       'Invalid file type. Only PNG, JPG, PDF and JPEG videos are allowed.',
  //     ),
  //     false,
  //   );
  // }

  cb(null, true);
};

const upload = multer({
  storage: s3Storage,
  fileFilter: imageFilter,
});

// Single uploads
const uploadProfileImage = upload.single('image');

// Multiple uploads
const uploadFields = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'referenceDocument', maxCount: 1 },
  { name: 'image', maxCount: 1 },
]);

// Export uploader
export const fileUploader = {
  upload,
  uploadProfileImage,
  uploadFields,
};

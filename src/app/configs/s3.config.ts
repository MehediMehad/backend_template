import path from 'path';

import dotenv from 'dotenv';

import { getEnvVar } from '../helpers/getEnvVar';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const s3Config = {
  accessKeyId: getEnvVar('S3_ACCESS_KEY'),
  secretAccessKey: getEnvVar('S3_SECRET_KEY'),
  region: getEnvVar('S3_REGION', 'nyc3'),
  bucketName: getEnvVar('S3_BUCKET_NAME'),
  endpoint: getEnvVar('S3_ENDPOINT'),
};

export default s3Config;

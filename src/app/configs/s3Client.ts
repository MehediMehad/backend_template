import path from 'path';

import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

import config from '.';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const s3Client = new S3Client({
  region: config.S3.region,
  endpoint: config.S3.endpoint,
  credentials: {
    accessKeyId: config.S3.accessKeyId as string,
    secretAccessKey: config.S3.secretAccessKey as string,
  },
});

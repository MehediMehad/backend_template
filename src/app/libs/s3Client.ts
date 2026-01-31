import { S3Client } from '@aws-sdk/client-s3';

import config from '../../configs';

export const s3Client = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint,
  credentials: {
    accessKeyId: config.s3.access_key_id,
    secretAccessKey: config.s3.secret_access_key,
  },
});

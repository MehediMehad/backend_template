import path from 'path';

import dotenv from 'dotenv';

import { getEnvVar } from '../helpers/getEnvVar';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const appConfig = {
  env: getEnvVar('NODE_ENV'),
  port: getEnvVar('PORT'),
};

export default appConfig;

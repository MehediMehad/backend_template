import path from 'path';

import dotenv from 'dotenv';

import { getEnvVar } from '../helpers/getEnvVar';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const stripeConfig = {
  secret_key: getEnvVar('STRIPE_SECRET_KEY'),
  publishable_key: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
};

export default stripeConfig;

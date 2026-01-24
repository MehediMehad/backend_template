import path from 'path';

import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

import appConfig from './app.config';
import authConfig from './auth.config';
import emailConfig from './email.config';
import { serviceAccount } from './firebase.config';
import s3Config from './s3.config';
import stripeConfig from './stripe.config';

const config = {
  app: appConfig,
  auth: authConfig,
  email: emailConfig,
  stripe: stripeConfig,
  S3: s3Config,
  fireBase: serviceAccount,
  Zoom: {
    account_id: process.env.ZOOM_ACCOUNT_ID!,
    client_id: process.env.ZOOM_CLIENT_ID!,
    client_secret: process.env.ZOOM_CLIENT_SECRET!,
  },
  Google: {
    google_translate_api_key: process.env.GOOGLE_TRANSLATE_API_KEY!,
  },
};

export default config;

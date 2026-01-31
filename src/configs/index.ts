import path from 'path';

import dotenv from 'dotenv';

import { getEnvVar } from '../app/helpers/getEnvVar';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const config = {
  app: {
    name: getEnvVar('APP_NAME'),
    web_url: getEnvVar('WEB_URL'),
    app_url: getEnvVar('APP_URL'),
    env: getEnvVar('NODE_ENV'),
    port: getEnvVar('PORT'),
    cors_origins: getEnvVar('CORS_ORIGINS').split(','),
  },
  admin: {
    email: getEnvVar('ADMIN_EMAIL'),
    password: getEnvVar('ADMIN_PASSWORD'),
  },
  jwt: {
    access_secret: getEnvVar('JWT_ACCESS_SECRET'),
    access_expires_in: getEnvVar('JWT_ACCESS_EXPIRES_IN'),
    refresh_secret: getEnvVar('JWT_REFRESH_SECRET'),
    refresh_expires_in: getEnvVar('JWT_REFRESH_EXPIRES_IN'),
    reset_pass_secret: getEnvVar('JWT_RESET_PASS_SECRET'),
    reset_pass_expires_in: getEnvVar('JWT_RESET_PASS_EXPIRES_IN'),
    bcrypt_salt_rounds: Number(getEnvVar('BCRYPT_SALT_ROUNDS')),
  },
  s3: {
    access_key_id: getEnvVar('S3_ACCESS_KEY'),
    secret_access_key: getEnvVar('S3_SECRET_KEY'),
    region: getEnvVar('S3_REGION'),
    bucket: getEnvVar('S3_BUCKET_NAME'),
    endpoint: getEnvVar('S3_ENDPOINT'),
  },
  stripe: {
    secret_key: getEnvVar('STRIPE_SECRET_KEY'),
    publishable_key: getEnvVar('STRIPE_PUBLISHABLE_KEY'),
  },
  mail: {
    email: getEnvVar('SMTP_EMAIL'),
    host: getEnvVar('SMTP_HOST'),
    port: Number(getEnvVar('SMTP_PORT', '465')),
    secure: getEnvVar('SMTP_SECURE') === 'true',
    auth: {
      user: getEnvVar('SMTP_EMAIL'),
      pass: getEnvVar('SMTP_PASS'),
    },
  },

  zoom: {
    account_id: getEnvVar('ZOOM_ACCOUNT_ID'),
    client_id: getEnvVar('ZOOM_CLIENT_ID'),
    client_secret: getEnvVar('ZOOM_CLIENT_SECRET'),
  },
  google: {
    translate_api_key: getEnvVar('GOOGLE_TRANSLATE_API_KEY'),
  },
  twilio: {
    account_sid: getEnvVar('TWILIO_ACCOUNT_SID'),
    auth_token: getEnvVar('TWILIO_AUTH_TOKEN'),
    twilio_number: getEnvVar('TWILIO_NUMBER'),
  },
  firebase: {
    clientEmail: getEnvVar('FIREBASE_CLIENT_EMAIL'),
    privateKey: getEnvVar('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
    projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  },
};

export default config;

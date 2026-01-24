import path from 'path';

import dotenv from 'dotenv';

import { getEnvVar } from '../helpers/getEnvVar';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const authConfig = {
  super_admin_email: getEnvVar('SUPER_ADMIN_EMAIL', 'admin@gmail.com'),
  super_admin_password: getEnvVar('SUPER_ADMIN_PASSWORD', '12345678'),
  bcrypt_salt_rounds: Number(getEnvVar('BCRYPT_SALT_ROUNDS', '12')),
  jwt: {
    access_secret: getEnvVar('JWT_ACCESS_SECRET'),
    access_expires_in: getEnvVar('JWT_ACCESS_EXPIRES_IN', '30d'),
    refresh_secret: getEnvVar('JWT_REFRESH_SECRET'),
    refresh_expires_in: getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d'),
    reset_pass_secret: getEnvVar('JWT_RESET_PASS_SECRET'),
    reset_pass_expires_in: getEnvVar('JWT_RESET_PASS_EXPIRES_IN', '10m'),
  },
};

export default authConfig;

import type { ServiceAccount } from 'firebase-admin';
import path from 'path';
import dotenv from 'dotenv';
import config from '.';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export const serviceAccount: ServiceAccount = {
  clientEmail: config.firebase.clientEmail,
  privateKey: config.firebase.privateKey,
  projectId: config.firebase.projectId,
}
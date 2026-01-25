import admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { getEnvVar } from '../helpers/getEnvVar';

const serviceAccount: ServiceAccount = {
  projectId: getEnvVar('FIREBASE_PROJECT_ID'),
  privateKey: getEnvVar('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
  clientEmail: getEnvVar('FIREBASE_CLIENT_EMAIL'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
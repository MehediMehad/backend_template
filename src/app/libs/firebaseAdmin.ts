import admin from 'firebase-admin';
import type { ServiceAccount } from 'firebase-admin';

import config from '../../configs';

const serviceAccount: ServiceAccount = {
  clientEmail: config.firebase.clientEmail,
  privateKey: config.firebase.privateKey,
  projectId: config.firebase.projectId,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const fcm = admin.messaging();

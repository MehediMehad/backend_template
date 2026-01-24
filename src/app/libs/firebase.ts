import admin from 'firebase-admin';

import { serviceAccount } from '../configs/serviceAccount';

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as any), // eslint-disable-line
});

export default admin;

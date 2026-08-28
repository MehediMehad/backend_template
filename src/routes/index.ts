import express from 'express';

import { AuthRoute } from '../app/modules/auth/auth.route';
import { NotificationRoute } from '../app/modules/notification/notification.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoute,
  },
  {
    path: '/notifications',
    route: NotificationRoute,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

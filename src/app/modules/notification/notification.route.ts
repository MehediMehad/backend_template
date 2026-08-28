import { Router } from 'express';

import { NotificationControllers } from './notification.controller';
import { NotificationValidations } from './notification.validation';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';

const router = Router();

router.post(
  '/fcm-token',
  auth('USER', 'ADMIN'),
  validateRequest(NotificationValidations.saveFcmTokenSchema),
  NotificationControllers.saveFcmToken,
);

router.get('/', auth('USER', 'ADMIN'), NotificationControllers.getMyNotifications);

router.patch(
  '/read-all',
  auth('USER', 'ADMIN'),
  NotificationControllers.markAllNotificationsAsRead,
);

router.patch('/:id/read', auth('USER', 'ADMIN'), NotificationControllers.markNotificationAsRead);

export const NotificationRoute = router;

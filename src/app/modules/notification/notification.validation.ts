import { NotificationType } from '@prisma/client';
import { z } from 'zod';

export const saveFcmTokenSchema = z.object({
  deviceId: z.string().min(1, 'deviceId is required'),
  fcmToken: z.string().min(1, 'fcmToken is required'),
});

export const sendNotificationSchema = z.object({
  receiverId: z.string().min(1, 'receiverId is required'),
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  notificationType: z.nativeEnum(NotificationType).optional(),
  data: z.record(z.string(), z.string()).optional(),
  isSaveToDb: z.boolean().optional(),
});

export const NotificationValidations = {
  saveFcmTokenSchema,
  sendNotificationSchema,
};

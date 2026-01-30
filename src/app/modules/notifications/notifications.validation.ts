import { z } from 'zod';

export const sendPushNotificationSchema = z.object({
  userId: z.string(),
  title: z.string().min(1),
  body: z.string().min(1),
  data: z.any().optional(),
});

export const NotificationsValidations = {
  sendPushNotificationSchema,
};

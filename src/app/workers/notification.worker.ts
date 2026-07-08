import type { Job } from 'bullmq';
import { Worker } from 'bullmq';

import { queueConnection } from '../libs/queueConnection';
import { NotificationsServices } from '../modules/notifications/notifications.service';
import type { INotificationJobData } from '../queues/notification.queue';
import { notificationQueueName } from '../queues/notification.queue';

export const notificationWorker = new Worker<INotificationJobData>(
  notificationQueueName,
  async (job: Job<INotificationJobData>) => {
    const { type, isSaveToDb, receiverId, title, body, data } = job.data;
    console.log(`🔔 [NotificationWorker] Processing job ${job.id} - type: ${type}`);

    try {
      if (type === 'SINGLE') {
        if (!receiverId) {
          throw new Error('receiverId is required for SINGLE notifications');
        }
        await NotificationsServices.sendPushNotification({
          receiverId,
          title,
          body,
          data,
          isSaveToDb,
        });
      } else {
        await NotificationsServices.sendPushNotificationToAllUsers({
          title,
          body,
          data,
          isSaveToDb,
        });
      }
      console.log(`✅ [NotificationWorker] Job ${job.id} processed successfully`);
    } catch (error) {
      console.error(`❌ [NotificationWorker] Job ${job.id} failed:`, error);
      throw error; // Throw to trigger automatic retries via BullMQ
    }
  },
  {
    connection: queueConnection,
    concurrency: 5, // Run up to 5 jobs concurrently
  },
);

notificationWorker.on('failed', (job, err) => {
  console.error(`⚠️ [NotificationWorker] Job ${job?.id} failed with error: ${err.message}`);
});

import { Queue } from 'bullmq';

import { queueConnection } from '../libs/queueConnection';

export interface IEmailJobData {
  emailTo: string;
  EmailSubject: string;
  EmailHTML?: string;
}

export const emailQueueName = 'EmailQueue';

export const emailQueue = new Queue<IEmailJobData>(emailQueueName, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 3, // Auto-retry up to 3 times on failure
    backoff: {
      type: 'exponential',
      delay: 5000, // Wait 5 seconds before retrying
    },
    removeOnComplete: true, // Automatically clean up successful jobs
    removeOnFail: 1000, // Keep last 1000 failed jobs for debugging
  },
});

export const queueEmail = async (data: IEmailJobData) => {
  await emailQueue.add(`send-email-${data.emailTo}-${Date.now()}`, data);
};

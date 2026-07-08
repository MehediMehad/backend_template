import type { Job } from 'bullmq';
import { Worker } from 'bullmq';

import { queueConnection } from '../libs/queueConnection';
import type { IEmailJobData } from '../queues/email.queue';
import { emailQueueName } from '../queues/email.queue';
import { sentEmailUtility } from '../utils/email/sendEmail.util';

export const emailWorker = new Worker<IEmailJobData>(
  emailQueueName,
  async (job: Job<IEmailJobData>) => {
    const { emailTo, EmailSubject, EmailHTML } = job.data;
    console.log(`✉️ [EmailWorker] Processing job ${job.id} - sending email to ${emailTo}`);

    try {
      await sentEmailUtility(emailTo, EmailSubject, EmailHTML);
      console.log(`✅ [EmailWorker] Job ${job.id} processed successfully`);
    } catch (error) {
      console.error(`❌ [EmailWorker] Job ${job.id} failed to send email:`, error);
      throw error; // Throw so BullMQ registers failure and triggers retry
    }
  },
  {
    connection: queueConnection,
    concurrency: 5, // Concurrency control: run up to 5 jobs concurrently
  },
);

emailWorker.on('failed', (job, err) => {
  console.error(`⚠️ [EmailWorker] Job ${job?.id} failed with error: ${err.message}`);
});

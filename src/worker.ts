import { emailWorker } from './app/workers/email.worker';
import { notificationWorker } from './app/workers/notification.worker';

console.log('🤖 Background Worker Process started successfully...');
console.log('📬 Listening for jobs in EmailQueue and NotificationQueue...');

// Handle graceful shutdown for workers
const gracefulShutdown = async (signal: string) => {
  console.log(`🔁 Received ${signal}. Shutting down workers gracefully...`);

  try {
    await Promise.all([emailWorker.close(), notificationWorker.close()]);
    console.log('🔒 Workers shut down successfully.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during worker shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

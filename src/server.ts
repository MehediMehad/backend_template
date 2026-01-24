import type { Server as HttpServer } from 'http';

import { Server as SocketIOServer } from 'socket.io';

import app from './app';
import appConfig from './app/configs/app.config';
import seedSuperAdmin from './app/helpers/db/seedSuperAdmin';
import { getLocalIP } from './app/helpers/devHelpers';
// import { initializeSocket } from './app/modules/chat/chat.socket';

let server: HttpServer;
let io: SocketIOServer;

async function main() {
  try {
    // 🟢 Start the server
    const port = appConfig.port || 5000;
    server = app.listen(port, async () => {
      console.log(`🚀 Server is running on port ${port}`);
      await seedSuperAdmin(); // Seed Super Admin user on startup
      getLocalIP(); // 🖥️ Your PC's local IPv4 address(es)

      // Initialize Socket.IO
      io = new SocketIOServer(server, {
        cors: {
          origin: '*', // Adjust based on your frontend URL
          methods: ['GET', 'POST'],
        },
      });

      // Pass io to socket handler
      // initializeSocket(io);
    });

    // 🔐 Handle Uncaught Exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown();
    });

    // 🔐 Handle Unhandled Promise Rejections
    process.on('unhandledRejection', (reason) => {
      console.error('❌ Unhandled Rejection:', reason);
      shutdown();
    });

    // 🛑 Graceful Shutdown
    process.on('SIGTERM', () => {
      console.info('🔁 SIGTERM received.');
      shutdown();
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// 🔁 Graceful Server Shutdown
function shutdown() {
  if (server) {
    server.close(() => {
      console.info('🔒 Server closed gracefully.');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
}

main();

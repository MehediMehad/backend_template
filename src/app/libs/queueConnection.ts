import type { ConnectionOptions } from 'bullmq';

import config from '../../configs';

export const queueConnection: ConnectionOptions = {
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password || undefined,
};

import { Redis } from 'ioredis';
import { config } from './env';

export const redis = new Redis(config.redis.url, {
  maxRetriesPerRequest: null,
  tls: config.redis.url.startsWith('rediss://') ? {} : undefined,
});

export const closeRedis = () => {
  redis.quit();
};

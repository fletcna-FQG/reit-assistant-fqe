import { Request, Response, NextFunction } from 'express';
import { redis } from '../config/redis';

const USER_LIMIT = 10;
const WINDOW_SECONDS = 60;

export async function geocodeUserRateLimit(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?.id as string | undefined;
    if (!userId) {
      return next();
    }

    const key = `geocode:ratelimit:${userId}`;
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, WINDOW_SECONDS);
    }

    if (count > USER_LIMIT) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: 'Geocode limit reached. Please wait a moment and try again.',
      });
    }

    next();
  } catch (error) {
    console.warn('Geocode rate limit check failed:', error);
    next();
  }
}

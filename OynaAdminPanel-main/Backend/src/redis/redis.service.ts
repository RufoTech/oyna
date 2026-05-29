import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: Redis;
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    
    if (!redisUrl) {
      this.logger.warn('REDIS_URL is not defined in environment variables');
      return;
    }

    try {
      // Connect to Redis. TLS will be enabled automatically if the URL uses rediss://
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      });

      this.client.on('connect', () => {
        const type = redisUrl.startsWith('rediss://') ? 'Cloud/Upstash' : 'Local/VPS';
        this.logger.log(`✅ Connected to Redis (${type})`);
      });

      this.client.on('error', (err) => {
        this.logger.error('❌ Redis Connection Error:', err.message);
      });
    } catch (err) {
      this.logger.error('❌ Redis Initialization Error:', err.message);
    }
  }

  onModuleDestroy() {
    if (this.client) {
      this.client.disconnect();
    }
  }

  getClient(): Redis {
    return this.client;
  }

  /** Helper to set cache */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    if (ttlSeconds) {
      await this.client.set(key, stringValue, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, stringValue);
    }
  }

  /** Helper to get cache */
  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;
    
    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /** Helper to delete cache */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Delete all keys matching a glob pattern (e.g. "venues:public:*") */
  async delByPattern(pattern: string): Promise<number> {
    let deleted = 0;
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.client.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        await this.client.del(...keys);
        deleted += keys.length;
      }
    } while (cursor !== '0');

    if (deleted > 0) {
      this.logger.log(`🗑️ Cache invalidated: ${pattern} (${deleted} keys)`);
    }
    return deleted;
  }

  /** Distributed lock — SET NX with atomic expiration (Fail-Closed) */
  async acquireLock(key: string, ttlSeconds: number): Promise<boolean> {
    if (!this.client) {
      this.logger.warn(`Redis client not initialized. Rejecting lock acquisition for key: ${key}`);
      return false;
    }
    try {
      const result = await this.client.set(key, '1', 'EX', ttlSeconds, 'NX');
      return result === 'OK';
    } catch (err) {
      this.logger.error(`Error acquiring lock for key ${key}:`, err.message);
      return false; // Fail-closed
    }
  }

  /** Release lock */
  async releaseLock(key: string): Promise<void> {
    if (!this.client) return;
    try {
      await this.client.del(key);
    } catch (err) {
      this.logger.error(`Error releasing lock for key ${key}:`, err.message);
    }
  }
}


import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisClientPromise: Promise<RedisClientType | null> | null = null;

function buildRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL;
  if (url) {
    return createClient({ url });
  }

  const host =
    process.env.REDIS_HOST || process.env.REDISHOST || process.env.REDIS_SERVER || '127.0.0.1';
  const port = Number.parseInt(
    process.env.REDIS_PORT || process.env.REDISPORT || process.env.REDIS_SERVER_PORT || '6379',
    10,
  );
  const password = process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined;

  return createClient({
    socket: {
      host,
      port,
    },
    password,
  });
}

export async function getRedisClient(): Promise<RedisClientType | null> {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  if (redisClientPromise) {
    return redisClientPromise;
  }

  const shouldAttemptConnection =
    Boolean(process.env.REDIS_URL) ||
    Boolean(process.env.REDIS_HOST) ||
    Boolean(process.env.REDISHOST) ||
    Boolean(process.env.REDIS_SERVER);

  if (!shouldAttemptConnection) {
    return null;
  }

  const client = buildRedisClient();
  redisClientPromise = client
    .connect()
    .then(() => {
      redisClient = client;
      redisClientPromise = null;
      client.on('error', (error) => {
        console.error('[redis] connection error', error);
        redisClient = null;
      });
      return client;
    })
    .catch((error) => {
      console.warn('[redis] failed to connect:', error);
      redisClientPromise = null;
      try {
        client.disconnect();
      } catch (disconnectError) {
        console.warn('[redis] disconnect after failure errored', disconnectError);
      }
      return null;
    });

  return redisClientPromise;
}

export async function getCachedValue(key: string): Promise<string | null> {
  const client = await getRedisClient();
  if (!client) {
    return null;
  }
  try {
    return await client.get(key);
  } catch (error) {
    console.warn('[redis] get failed', { key, error });
    return null;
  }
}

export async function setCachedValue(
  key: string,
  ttlSeconds: number,
  value: string,
): Promise<void> {
  const client = await getRedisClient();
  if (!client) {
    return;
  }
  try {
    await client.setEx(key, ttlSeconds, value);
  } catch (error) {
    console.warn('[redis] setEx failed', { key, error });
  }
}


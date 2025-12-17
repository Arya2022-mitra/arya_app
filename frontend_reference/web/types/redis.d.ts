declare module 'redis' {
  export interface RedisClientType {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    on(event: string, listener: (...args: any[]) => void): void;
    isOpen?: boolean;
    get(key: string): Promise<string | null>;
    setEx(key: string, ttlSeconds: number, value: string): Promise<void>;
  }

  export interface RedisClientOptions {
    url?: string;
    socket?: {
      host?: string;
      port?: number;
    };
    password?: string;
  }

  export function createClient(options?: RedisClientOptions): RedisClientType;
}

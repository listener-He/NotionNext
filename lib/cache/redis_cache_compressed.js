import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'
import { parseCacheKey } from './cache_keys'

// 生产级压缩管理器 - 使用zlib
class ProductionCompression {
  constructor() {
    this.zlib = require('zlib');
    this.compressionAvailable = true;
    this.CHUNK_SIZE = 500 * 1024; // 500KB
    this.MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
  }

  /**
   *  压缩
   * @param data 数据
   * @param level 压缩级 1-9
   * @returns {Uint8Array|*|Uint8Array}
   */
  compressData(data, level = 3) {
    try {
      if (!this.compressionAvailable || !data || data.length === 0) {
        return data instanceof Uint8Array ? data : new Uint8Array(data);
      }

      // 检查大小限制
      if (data.length > this.MAX_TOTAL_SIZE) {
        console.warn(`Data too large: ${(data.length / 1024 / 1024).toFixed(1)}MB > 50MB`);
        return data;
      }

      // 小数据(16KB以下)直接返回，不压缩
      if (data.length <= 16 * 1024) {
        return new Uint8Array(data);
      }

      // 根据数据大小动态调整压缩级别
      let effectiveLevel = level;
      if (data.length >= 500 * 1024) { // 500KB以上使用最高压缩级别
        effectiveLevel = 9;
      } else if (effectiveLevel < 3) {
        effectiveLevel = 3; // 最低使用3级压缩
      } else if (effectiveLevel > 9) {
        effectiveLevel = 9; // 最高使用9级压缩
      }

      // 小于分块大小的数据直接压缩
      if (data.length <= this.CHUNK_SIZE) {
        const compressed = this.zlib.gzipSync(Buffer.from(data), { level: effectiveLevel });
        return new Uint8Array(compressed);
      }

      // 分块压缩 - 正确实现
      const chunkResults = [];
      const chunkCount = Math.ceil(data.length / this.CHUNK_SIZE);

      for (let i = 0; i < chunkCount; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, data.length);
        const chunk = data.slice(start, end);

        if (chunk.length === 0) continue;

        const compressedChunk = this.zlib.gzipSync(Buffer.from(chunk), { level: effectiveLevel });
        chunkResults.push(compressedChunk);
      }

      // 构建元数据
      const metadata = {
        isChunked: true,
        chunkCount: chunkResults.length,
        originalSize: data.length,
        chunkSizes: chunkResults.map(c => c.length)
      };

      const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8');
      const compressedMetadata = this.zlib.gzipSync(metadataBuffer, { level: effectiveLevel });

      // 高效构建结果缓冲区
      const totalLength = 4 + compressedMetadata.length + chunkResults.reduce((sum, c) => sum + c.length, 0);
      const result = new Uint8Array(totalLength);

      let offset = 0;
      // 写入元数据长度
      new DataView(result.buffer, result.byteOffset).setUint32(offset, compressedMetadata.length, true);
      offset += 4;

      // 写入压缩元数据
      result.set(new Uint8Array(compressedMetadata), offset);
      offset += compressedMetadata.length;

      // 写入压缩块
      for (const chunk of chunkResults) {
        result.set(new Uint8Array(chunk), offset);
        offset += chunk.length;
      }

      return result;
    } catch (error) {
      return data;
    }
  }

  /**
   *  解压
   * @param compressedData
   * @returns {Uint8Array|*}
   */
  decompressData(compressedData) {
    try {
      if (!this.compressionAvailable || !compressedData || compressedData.length === 0) {
        return new Uint8Array(0);
      }

      // 检查是否为分块数据
      if (compressedData.length >= 4) {
        try {
          const metadataLength = new DataView(compressedData.buffer, compressedData.byteOffset, 4).getUint32(0, true);

          if (metadataLength > 0 && metadataLength < compressedData.length - 4) {
            // 解析分块数据
            const compressedMetadata = compressedData.slice(4, 4 + metadataLength);
            const metadataBuffer = this.zlib.gunzipSync(Buffer.from(compressedMetadata));
            const metadata = JSON.parse(Buffer.from(metadataBuffer).toString('utf8'));

            if (metadata.isChunked) {
              const chunks = [];
              let offset = 4 + metadataLength;

              for (let i = 0; i < metadata.chunkCount; i++) {
                const chunkSize = metadata.chunkSizes[i];
                const chunk = compressedData.slice(offset, offset + chunkSize);

                const decompressedChunk = this.zlib.gunzipSync(Buffer.from(chunk));
                chunks.push(new Uint8Array(decompressedChunk));
                offset += chunkSize;
              }

              // 合并结果
              const totalLength = metadata.originalSize;
              const result = new Uint8Array(totalLength);
              let resultOffset = 0;

              for (const chunk of chunks) {
                result.set(chunk, resultOffset);
                resultOffset += chunk.length;
              }

              return result;
            }
          }
        } catch (e) {
          // 元数据解析失败，尝试直接解压
        }
      }

      // 直接解压
      const decompressed = this.zlib.gunzipSync(Buffer.from(compressedData));
      return new Uint8Array(decompressed);
    } catch (error) {
      return compressedData;
    }
  }
}

// Redis连接池管理
class RedisConnectionPool {
  constructor(config) {
    this.redisConfig = config;
    this.pool = {
      maxConnections: 32, // 降低最大连接数以避免资源浪费
      minConnections: 2,
      acquireTimeout: 5000,
      active: 0,
      waiting: [],
      connections: new Map(), // 追踪活跃连接和获取时间
      maxIdleTime: 300000, // 5分钟无活动则关闭连接
      maxConnectionAge: 1800000 // 30分钟最大连接生命周期
    };

    this.client = new Redis({
      ...this.redisConfig,
      connectTimeout: 3000,
      reconnectOnError: () => true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
      connectionName: 'blog-redis-client-' + Date.now(), // 添加时间戳避免重复
      lazyConnect: true,
      keepAlive: 30000,
      family: 4,
      maxRetriesPerRequest: 3,
      enableAutoPipelining: true,
      maxLoadingTimeout: 5000
    });

    this.setupEventHandlers();

    // 定期清理空闲连接
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // 每分钟清理一次
  }

  setupEventHandlers() {
    this.client.on('connect', () => {
      // console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      // 静默处理错误
      console.error('Redis error:', err);
    });

    this.client.on('close', () => {
      // console.log('🔌 Redis disconnected');
    });

    // 监听连接断开事件，重置连接池状态
    this.client.on('end', () => {
      this.pool.active = 0;
      // 唤醒所有等待的请求，让它们重新获取连接
      while (this.pool.waiting.length > 0) {
        const { reject } = this.pool.waiting.shift();
        reject(new Error('Redis connection ended'));
      }
    });
  }

  async acquire() {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        // 从等待队列中移除这个请求
        const index = this.pool.waiting.findIndex(item => item.timeoutId === timeoutId);
        if (index > -1) {
          this.pool.waiting.splice(index, 1);
        }
        reject(new Error('Connection acquire timeout'));
      }, this.pool.acquireTimeout);

      // 记录连接获取时间，用于后续超时检测
      const connectionId = Date.now() + Math.random();
      const acquireTime = Date.now();

      if (this.pool.active < this.pool.maxConnections) {
        this.pool.active++;
        this.pool.connections.set(connectionId, acquireTime);
        clearTimeout(timeoutId);
        // 添加连接释放的包装器，确保在使用后正确释放
        const wrappedClient = {
          ...this.client,
          release: () => this.release(connectionId)
        };
        resolve(wrappedClient);
      } else {
        this.pool.waiting.push({ resolve, reject, timeoutId, connectionId, acquireTime });
      }
    });
  }

  release(connectionId) {
    // 从连接追踪中移除
    this.pool.connections.delete(connectionId);

    this.pool.active = Math.max(0, this.pool.active - 1);

    if (this.pool.waiting.length > 0) {
      const { resolve, reject, timeoutId, connectionId: nextConnectionId, acquireTime } = this.pool.waiting.shift();
      clearTimeout(timeoutId);
      this.pool.active++;
      this.pool.connections.set(nextConnectionId, acquireTime);
      const wrappedClient = {
        ...this.client,
        release: () => this.release(nextConnectionId)
      };
      resolve(wrappedClient);
    }
  }

  /**
   * 清理空闲连接
   */
  cleanupIdleConnections() {
    const now = Date.now();
    const idleConnections = [];

    // 检查长时间未释放的连接
    for (const [connectionId, acquireTime] of this.pool.connections) {
      if (now - acquireTime > this.pool.maxIdleTime) {
        idleConnections.push(connectionId);
      }
    }

    // 清理超时的连接
    for (const connectionId of idleConnections) {
      this.pool.connections.delete(connectionId);
      console.warn(`[Redis] 强制释放超时连接: ${connectionId}`);
    }

    // 检查是否有等待时间过长的请求
    const expiredWaiting = [];
    for (let i = 0; i < this.pool.waiting.length; i++) {
      if (now - this.pool.waiting[i].acquireTime > this.pool.acquireTimeout) {
        expiredWaiting.push(i);
      }
    }

    // 清理过期的等待请求
    for (const index of expiredWaiting.reverse()) {
      const { reject, timeoutId } = this.pool.waiting.splice(index, 1)[0];
      clearTimeout(timeoutId);
      if (reject) {
        reject(new Error('Waiting request timeout'));
      }
    }
  }

  /**
   * 关闭连接池
   */
  async close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // 清理所有等待的请求
    while (this.pool.waiting.length > 0) {
      const { reject, timeoutId } = this.pool.waiting.shift();
      clearTimeout(timeoutId);
      if (reject) {
        reject(new Error('Connection pool closed'));
      }
    }

    // 关闭Redis连接
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }
}

// 配置常量
const CACHE_TIME_MULTIPLIERS = {
  PAGE_CONTENT: 1.5,
  PAGE_BLOCK: 1.2,
  SITE_DATA: 0.9,
  AI_SUMMARY: 2.5,
  RSS: 0.9,
  DEFAULT: 1.0
};

const BASE_CACHE_TIME = siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND);
const COMPRESSION_THRESHOLD = 16 * 1024; // 16KB - 小于此大小不压缩
const MIN_COMPRESSION_LEVEL = 3;
const ROUTINE_COMPRESSION_LEVEL = 6;
const MAX_COMPRESSION_LEVEL = 9;
const MIN_COMPRESSION_RATIO = 0.15; // 最少15%的压缩效果才使用压缩

// Redis配置
let redisConfig = {};
if (BLOG.REDIS_URL) {
  try {
    const url = new URL(BLOG.REDIS_URL);
    redisConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      db: url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1)) : 0
    };
  } catch (error) {
    console.warn('⚠️ Invalid Redis URL, using default config');
    redisConfig = { host: '127.0.0.1', port: 6379 };
  }
} else {
  redisConfig = { host: '127.0.0.1', port: 6379 };
}

const redisPool = new RedisConnectionPool(redisConfig);

function calculateCacheTime(key) {
  const cacheInfo = parseCacheKey(key);
  let multiplier = CACHE_TIME_MULTIPLIERS.DEFAULT;

  if (cacheInfo) {
    multiplier = CACHE_TIME_MULTIPLIERS[cacheInfo.type] || CACHE_TIME_MULTIPLIERS.DEFAULT;
  }

  return Math.max(Math.trunc(BASE_CACHE_TIME * multiplier), 300);
}

/**
 * 从缓存中获取数据 - 使用连接池，不对外抛出异常
 */
export async function getCache(key) {
  let connection = null;
  try {
    if (!key || typeof key !== 'string') {
      return null;
    }

    connection = await redisPool.acquire();
    const value = await connection.get(key);

    if (!value) {
      return null;
    }

    if (value.startsWith('ZSTD:')) {
      try {
        const compressedData = Buffer.from(value.slice(5), 'base64');
        const decompressed = compressionManager.decompressData(new Uint8Array(compressedData));
        return JSON.parse(Buffer.from(decompressed).toString('utf8'));
      } catch (decompressionError) {
        await connection.del(key); // 清除损坏的缓存
        return null;
      }
    }

    return JSON.parse(value);
  } catch (error) {
    return null;
  } finally {
    if (connection) {
      redisPool.release();
    }
  }
}

/**
 * 设置缓存数据 - 使用连接池，不对外抛出异常
 */
export async function setCache(key, data, customCacheTime) {
  let connection = null;
  try {
    if (!key || typeof key !== 'string' || data === undefined || data === null) {
      return null;
    }

    connection = await redisPool.acquire();

    let jsonString;
    try {
      jsonString = JSON.stringify(data);
    } catch (serializeError) {
      console.error('⚠️ Serialization failed:', serializeError.message);
      return null;
    }

    if (!jsonString || jsonString === 'undefined') {
      return null;
    }

    const dataBuffer = Buffer.from(jsonString, 'utf8');
    const dataSize = dataBuffer.length;
    let finalValue = jsonString;

    // 智能压缩：仅对大于16KB的数据进行压缩
    if (dataSize > COMPRESSION_THRESHOLD) {
      // 根据数据大小决定压缩级别
      let compressionLevel = MIN_COMPRESSION_LEVEL;
       if (dataSize >= 500 * 1024) { // 500KB及以上使用最高压缩级别
        compressionLevel = MAX_COMPRESSION_LEVEL;
      } else if (dataSize > 100 * 1024) { // 100KB-500KB使用中规压缩级别
         compressionLevel = ROUTINE_COMPRESSION_LEVEL;
       }

      try {
        const uint8Array = new Uint8Array(dataBuffer);
        const compressed = compressionManager.compressData(uint8Array, compressionLevel);

        if (compressed && compressed !== uint8Array) {
          const compressedSize = compressed.length;
          const compressionRatio = (dataSize - compressedSize) / dataSize;

          // 仅当压缩效果显著时才使用压缩数据
          if (compressionRatio >= MIN_COMPRESSION_RATIO) {
            finalValue = 'ZSTD:' + Buffer.from(compressed).toString('base64');

            if (process.env.NODE_ENV === 'development') {
              console.log(`[CACHE] Compressed ${key}: ${dataSize}B → ${compressedSize}B (${Math.round(compressionRatio * 100)}% saved, level ${compressionLevel})`);
            }
          }
        }
      } catch (compressionError) {
        console.warn('⚠️ Compression failed:', compressionError.message);
      }
    }

    const cacheTimeToUse = customCacheTime || calculateCacheTime(key);
    await connection.set(key, finalValue, 'EX', cacheTimeToUse);

    return true;
  } catch (e) {
    console.error(`⚠️ Redis setCache failed for key "${key}":`, String(e));
    return null;
  } finally {
    if (connection) {
      redisPool.release();
    }
  }
}

/**
 * 删除缓存 - 使用连接池，不对外抛出异常
 */
export async function delCache(key) {
  let connection = null;
  try {
    if (!key || typeof key !== 'string') {
      return 0;
    }

    connection = await redisPool.acquire();
    return await connection.del(key);
  } catch (error) {
    return 0;
  } finally {
    if (connection) {
      redisPool.release();
    }
  }
}

/**
 * 获取缓存统计信息 - 使用连接池，不对外抛出异常
 */
export async function getCacheStats(keyPattern = '*') {
  let connection = null;
  try {
    if (!keyPattern || typeof keyPattern !== 'string') {
      keyPattern = '*';
    }

    connection = await redisPool.acquire();
    const keys = await connection.keys(keyPattern);

    if (keys.length === 0) {
      return {
        totalKeys: 0,
        totalSize: 0,
        compressedKeys: 0,
        uncompressedKeys: 0,
        connectionPoolStats: {
          activeConnections: redisPool.pool.active,
          queueLength: redisPool.pool.waiting.length,
          maxConnections: redisPool.pool.maxConnections
        }
      };
    }

    const sampleKeys = keys.slice(0, 100);
    const values = await connection.mget(sampleKeys);

    let totalSize = 0;
    let compressedKeys = 0;
    let uncompressedKeys = 0;

    values.forEach(value => {
      if (value) {
        totalSize += Buffer.byteLength(value, 'utf8');
        if (value.startsWith('ZSTD:')) {
          compressedKeys++;
        } else {
          uncompressedKeys++;
        }
      }
    });

    return {
      totalKeys: keys.length,
      sampledKeys: sampleKeys.length,
      totalSize: Math.round(totalSize / 1024),
      compressedKeys,
      uncompressedKeys,
      compressionRatio: compressedKeys > 0 ? compressedKeys / (compressedKeys + uncompressedKeys) : 0,
      connectionPoolStats: {
        activeConnections: redisPool.pool.active,
        queueLength: redisPool.pool.waiting.length,
        maxConnections: redisPool.pool.maxConnections
      }
    };
  } catch (error) {
    return {
      error: error.message,
      connectionPoolStats: {
        activeConnections: redisPool.pool.active,
        queueLength: redisPool.pool.waiting.length,
        maxConnections: redisPool.pool.maxConnections
      }
    };
  } finally {
    if (connection) {
      redisPool.release();
    }
  }
}

// 压缩管理器实例
const compressionManager = new ProductionCompression();

export default { getCache, setCache, delCache, getCacheStats };

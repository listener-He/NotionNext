import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'
import { parseCacheKey } from './cache_keys'

// 生产级压缩管理器 - 使用zlib (升级为 Brotli 获得更高压缩率)
const { promisify } = require('util');

class ProductionCompression {
  constructor() {
    this.zlib = require('zlib');
    this.brotliCompressAsync = promisify(this.zlib.brotliCompress);
    this.brotliDecompressAsync = promisify(this.zlib.brotliDecompress);
    this.gunzipAsync = promisify(this.zlib.gunzip);
    this.compressionAvailable = true;
    this.CHUNK_SIZE = 500 * 1024; // 500KB
    this.MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB
  }

  /**
   *  异步压缩 (使用 Brotli)
   */
  async compressData(data, level = 4) {
    try {
      if (!this.compressionAvailable || !data || data.length === 0) {
        return data instanceof Uint8Array ? data : new Uint8Array(data);
      }

      if (data.length > this.MAX_TOTAL_SIZE) {
        console.warn(`Data too large: ${(data.length / 1024 / 1024).toFixed(1)}MB > 50MB`);
        return data;
      }

      if (data.length <= 16 * 1024) {
        return new Uint8Array(data);
      }

      // Brotli 压缩等级 1-11。默认使用 4，平衡速度与压缩率
      const options = {
        params: {
          [this.zlib.constants.BROTLI_PARAM_QUALITY]: level,
        }
      };

      if (data.length <= this.CHUNK_SIZE) {
        const compressed = await this.brotliCompressAsync(Buffer.from(data), options);
        return new Uint8Array(compressed);
      }

      // 分块压缩
      const chunkPromises = [];
      const chunkCount = Math.ceil(data.length / this.CHUNK_SIZE);

      for (let i = 0; i < chunkCount; i++) {
        const start = i * this.CHUNK_SIZE;
        const end = Math.min(start + this.CHUNK_SIZE, data.length);
        const chunk = data.slice(start, end);
        if (chunk.length === 0) continue;
        chunkPromises.push(this.brotliCompressAsync(Buffer.from(chunk), options));
      }
      
      const chunkResults = await Promise.all(chunkPromises);

      const metadata = {
        isChunked: true,
        chunkCount: chunkResults.length,
        originalSize: data.length,
        chunkSizes: chunkResults.map(c => c.length)
      };

      const compressedMetadata = await this.brotliCompressAsync(Buffer.from(JSON.stringify(metadata), 'utf8'), options);
      const totalLength = 4 + compressedMetadata.length + chunkResults.reduce((sum, c) => sum + c.length, 0);
      const result = new Uint8Array(totalLength);

      let offset = 0;
      new DataView(result.buffer, result.byteOffset).setUint32(offset, compressedMetadata.length, true);
      offset += 4;
      result.set(new Uint8Array(compressedMetadata), offset);
      offset += compressedMetadata.length;

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
   *  异步解压 (支持向下兼容旧的 Gzip/ZSTD，以及新的 Brotli)
   */
  async decompressData(compressedData, isLegacyGzip = false) {
    try {
      if (!this.compressionAvailable || !compressedData || compressedData.length === 0) {
        return new Uint8Array(0);
      }

      const decompressFunc = isLegacyGzip ? this.gunzipAsync : this.brotliDecompressAsync;

      if (compressedData.length >= 4) {
        try {
          const metadataLength = new DataView(compressedData.buffer, compressedData.byteOffset, 4).getUint32(0, true);
          if (metadataLength > 0 && metadataLength < compressedData.length - 4) {
            const compressedMetadata = compressedData.slice(4, 4 + metadataLength);
            const metadataBuffer = await decompressFunc(Buffer.from(compressedMetadata));
            const metadata = JSON.parse(Buffer.from(metadataBuffer).toString('utf8'));

            if (metadata.isChunked) {
              const chunkPromises = [];
              let offset = 4 + metadataLength;

              for (let i = 0; i < metadata.chunkCount; i++) {
                const chunkSize = metadata.chunkSizes[i];
                const chunk = compressedData.slice(offset, offset + chunkSize);
                chunkPromises.push(decompressFunc(Buffer.from(chunk)));
                offset += chunkSize;
              }
              
              const chunks = await Promise.all(chunkPromises);

              const result = new Uint8Array(metadata.originalSize);
              let resultOffset = 0;
              for (const chunk of chunks) {
                result.set(new Uint8Array(chunk), resultOffset);
                resultOffset += chunk.length;
              }
              return result;
            }
          }
        } catch (e) {
          // Fallback to direct decompression
        }
      }

      const decompressed = await decompressFunc(Buffer.from(compressedData));
      return new Uint8Array(decompressed);
    } catch (error) {
      return compressedData;
    }
  }
}

// ----------------------------------------------------------------------
// SERVERLESS 友好的单例 Redis 客户端 (彻底废弃长连接池)
// ----------------------------------------------------------------------
let redisClient = null;

function getRedisClient() {
  if (redisClient) return redisClient;

  if (!BLOG.REDIS_URL) {
    console.warn('⚠️ No REDIS_URL provided');
    return null;
  }

  // 极简且健壮的配置，适合 Vercel Serverless
  redisClient = new Redis(BLOG.REDIS_URL, {
    maxRetriesPerRequest: 1, // Serverless 环境不要无限重试，宁可抛错走降级
    connectTimeout: 3000,
    retryStrategy(times) {
      if (times > 2) return null; // 超过2次放弃重试
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('error', (err) => {
    console.error('[Redis Error]:', err.message);
  });

  return redisClient;
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
const COMPRESSION_THRESHOLD = 16 * 1024; // 16KB

function calculateCacheTime(key) {
  const cacheInfo = parseCacheKey(key);
  let multiplier = CACHE_TIME_MULTIPLIERS.DEFAULT;
  if (cacheInfo) {
    multiplier = CACHE_TIME_MULTIPLIERS[cacheInfo.type] || CACHE_TIME_MULTIPLIERS.DEFAULT;
  }
  return Math.max(Math.trunc(BASE_CACHE_TIME * multiplier), 300);
}

const compressionManager = new ProductionCompression();

/**
 * 获取缓存
 */
export async function getCache(key) {
  try {
    if (!key || typeof key !== 'string') return null;
    
    const client = getRedisClient();
    if (!client) return null;

    const value = await client.get(key);
    if (!value) return null;

    // 向下兼容旧的 GZIP 格式
    if (value.startsWith('ZSTD:')) {
      try {
        const compressedData = Buffer.from(value.slice(5), 'base64');
        const decompressed = await compressionManager.decompressData(new Uint8Array(compressedData), true);
        return JSON.parse(Buffer.from(decompressed).toString('utf8'));
      } catch (e) {
        await client.del(key);
        return null;
      }
    }

    // 新的 Brotli 格式
    if (value.startsWith('BR:')) {
      try {
        const compressedData = Buffer.from(value.slice(3), 'base64');
        const decompressed = await compressionManager.decompressData(new Uint8Array(compressedData), false);
        return JSON.parse(Buffer.from(decompressed).toString('utf8'));
      } catch (e) {
        await client.del(key);
        return null;
      }
    }

    return JSON.parse(value);
  } catch (error) {
    return null;
  }
}

/**
 * 设置缓存
 */
export async function setCache(key, data, customCacheTime) {
  try {
    if (!key || typeof key !== 'string' || data === undefined || data === null) return null;

    const client = getRedisClient();
    if (!client) return null;

    const jsonString = JSON.stringify(data);
    const dataBuffer = Buffer.from(jsonString, 'utf8');
    const dataSize = dataBuffer.length;
    let finalValue = jsonString;

    if (dataSize > COMPRESSION_THRESHOLD) {
      let compressionLevel = 4; // Brotli 默认级别
      if (dataSize >= 500 * 1024) compressionLevel = 6; 

      try {
        const uint8Array = new Uint8Array(dataBuffer);
        const compressed = await compressionManager.compressData(uint8Array, compressionLevel);

        if (compressed && compressed !== uint8Array) {
          const compressedSize = compressed.length;
          const compressionRatio = (dataSize - compressedSize) / dataSize;

          if (compressionRatio >= 0.15) {
            finalValue = 'BR:' + Buffer.from(compressed).toString('base64');
            if (process.env.NODE_ENV === 'development') {
              console.log(`[CACHE] Brotli Compressed ${key}: ${dataSize}B → ${compressedSize}B`);
            }
          }
        }
      } catch (compressionError) {
        console.warn('⚠️ Compression failed:', compressionError.message);
      }
    }

    const cacheTimeToUse = customCacheTime || calculateCacheTime(key);
    await client.set(key, finalValue, 'EX', cacheTimeToUse);
    return true;
  } catch (e) {
    return null;
  }
}

/**
 * 删除缓存
 */
export async function delCache(key) {
  try {
    if (!key || typeof key !== 'string') return 0;
    const client = getRedisClient();
    if (!client) return 0;
    return await client.del(key);
  } catch (error) {
    return 0;
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(keyPattern = '*') {
  try {
    const client = getRedisClient();
    if (!client) return { error: 'No Redis client' };

    const keys = await client.keys(keyPattern || '*');
    if (keys.length === 0) return { totalKeys: 0, totalSize: 0 };

    const sampleKeys = keys.slice(0, 100);
    const values = await client.mget(sampleKeys);

    let totalSize = 0;
    let compressedKeys = 0;
    let uncompressedKeys = 0;

    values.forEach(value => {
      if (value) {
        totalSize += Buffer.byteLength(value, 'utf8');
        if (value.startsWith('ZSTD:') || value.startsWith('BR:')) {
          compressedKeys++;
        } else {
          uncompressedKeys++;
        }
      }
    });

    return {
      totalKeys: keys.length,
      totalSize: Math.round(totalSize / 1024),
      compressionRatio: compressedKeys > 0 ? compressedKeys / (compressedKeys + uncompressedKeys) : 0,
      serverlessMode: true // 标识当前为Serverless安全模式
    };
  } catch (error) {
    return { error: error.message };
  }
}

export default { getCache, setCache, delCache, getCacheStats };
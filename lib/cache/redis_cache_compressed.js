import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'

// zstd-codec 动态导入和初始化
let zstdCodec = null
let compressionAvailable = false

// 初始化 zstd-codec
async function initZstdCodec() {
  try {
    const { ZstdCodec } = await import('zstd-codec')
    return new Promise((resolve) => {
      ZstdCodec.run(zstd => {
        zstdCodec = zstd
        compressionAvailable = true
        console.log('✅ ZSTD compression enabled')
        resolve(zstd)
      })
    })
  } catch (error) {
    console.warn('⚠️ ZSTD codec not available:', error.message)
    compressionAvailable = false
    return null
  }
}

// 初始化 zstd-codec
initZstdCodec()

// 压缩函数
function compressData(data, level = 3) {
  if (!compressionAvailable || !zstdCodec) {
    throw new Error('ZSTD codec not available')
  }
  
  // 验证输入数据
  if (!data || data.length === 0) {
    return new Uint8Array(0) // 返回空的 Uint8Array
  }
  
  // 检查数据大小，避免内存溢出
  if (data.length > 100 * 1024 * 1024) { // 100MB 限制
    throw new Error('Data too large for compression: ' + data.length + ' bytes')
  }
  
  try {
    const simple = new zstdCodec.Simple()
    return simple.compress(data, level)
  } catch (error) {
    console.error('ZSTD compression error:', error)
    throw error
  }
}

// 解压函数
function decompressData(compressedData) {
  if (!compressionAvailable || !zstdCodec) {
    throw new Error('ZSTD codec not available')
  }
  
  try {
    const simple = new zstdCodec.Simple()
    return simple.decompress(compressedData)
  } catch (error) {
    console.error('ZSTD decompression error:', error)
    throw error
  }
}

// 连接池配置
// 解析 Redis URL 或使用默认配置
let redisConfig = {}
if (BLOG.REDIS_URL) {
  try {
    const url = new URL(BLOG.REDIS_URL)
    redisConfig = {
      host: url.hostname,
      port: parseInt(url.port) || 6379,
      username: url.username || undefined,
      password: url.password || undefined,
      db: url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1)) : 0
    }
    console.log('✅ Redis URL parsed successfully:', `${url.hostname}:${url.port}`)
  } catch (error) {
    console.warn('⚠️ Invalid Redis URL, using default config:', error.message)
    redisConfig = { host: '127.0.0.1', port: 6379 }
  }
} else {
  redisConfig = { host: '127.0.0.1', port: 6379 }
}

const redisClient = new Redis({
  ...redisConfig,
  connectTimeout: 2000, // 超时时间2秒
  maxRetriesPerRequest: 1,
  reconnectOnError: () => true,
  retryStrategy(times) {
    return Math.min(times * 50, 2000)
  },
  connectionName: 'blog-redis-client',
  lazyConnect: true,
  minIdleTime: 60000, // 闲置时间60秒
  idleCheckInterval: 15000, // 每15秒检查一次闲置连接
  minConnections: 1,
  maxConnections: 15
})

const cacheTime = Math.trunc(
  siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND) * 1.5
)

// 压缩阈值：超过此大小的数据才进行压缩（字节）
const COMPRESSION_THRESHOLD = 1 * 1024 // 1KB

// 动态压缩级别配置：根据数据大小智能调整压缩级别（6个级别）
const COMPRESSION_LEVELS = {
  level1: 3,    // 1KB-10KB: 最低级别，速度优先
  level2: 6,    // 10KB-50KB: 低级别，平衡性能
  level3: 9,    // 50KB-100KB: 中等级别
  level4: 12,   // 100KB-200KB: 中高级别
  level5: 15,   // 200KB-500KB: 高级别
  level6: 22    // >500KB: 最高级别，压缩率优先
}
const SIZE_THRESHOLDS = {
  level1: 10 * 1024,   // 10KB
  level2: 50 * 1024,   // 50KB
  level3: 100 * 1024,  // 100KB
  level4: 200 * 1024,  // 200KB
  level5: 500 * 1024   // 500KB
}

const MIN_COMPRESSION_RATIO = 0.15 // 最小压缩效果阈值 (15%节省空间才使用压缩)

/**
 * 根据数据大小动态选择压缩级别
 * @param {number} dataSize - 数据大小（字节）
 * @returns {number} 压缩级别
 */
function getDynamicCompressionLevel(dataSize) {
  if (dataSize <= SIZE_THRESHOLDS.level1) return COMPRESSION_LEVELS.level1
  if (dataSize <= SIZE_THRESHOLDS.level2) return COMPRESSION_LEVELS.level2
  if (dataSize <= SIZE_THRESHOLDS.level3) return COMPRESSION_LEVELS.level3
  if (dataSize <= SIZE_THRESHOLDS.level4) return COMPRESSION_LEVELS.level4
  if (dataSize <= SIZE_THRESHOLDS.level5) return COMPRESSION_LEVELS.level5
  return COMPRESSION_LEVELS.level6
}

/**
 * 从缓存中获取数据
 */
export async function getCache(key) {
  try {
    const value = await redisClient.get(key)
    if (!value) return null

    // 检查是否为压缩数据
    if (value.startsWith('ZSTD:')) {
      if (!compressionAvailable) {
        console.warn('⚠️ Found compressed data but ZSTD codec not available')
        return null
      }
      
      const compressedData = Buffer.from(value.slice(5), 'base64')
      const decompressed = decompressData(new Uint8Array(compressedData))
      return JSON.parse(Buffer.from(decompressed).toString('utf8'))
    }

    return JSON.parse(value)
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

/**
 * 设置缓存数据
 */
export async function setCache(key, data, customCacheTime) {
  try {
    // 验证输入数据
    if (data === undefined || data === null) {
      throw new Error('Cannot cache undefined or null data')
    }
    
    const jsonString = JSON.stringify(data)
    if (!jsonString || jsonString === 'undefined') {
      throw new Error('Failed to serialize data to JSON')
    }
    
    const dataBuffer = Buffer.from(jsonString, 'utf8')
    const dataSize = dataBuffer.length
    let finalValue = jsonString
    let compressionStats = null

    // 智能压缩策略：仅对大于阈值的数据进行压缩
    if (compressionAvailable && dataSize > COMPRESSION_THRESHOLD) {
      const compressionLevel = getDynamicCompressionLevel(dataSize)
      const startTime = Date.now()
      
      try {
        // 确保数据缓冲区有效
        if (!dataBuffer || dataBuffer.length === 0) {
          throw new Error('Invalid data buffer for compression')
        }
        
        const uint8Array = new Uint8Array(dataBuffer)
        if (!uint8Array || uint8Array.length === 0) {
          throw new Error('Failed to create Uint8Array from buffer')
        }
        
        const compressed = compressData(uint8Array, compressionLevel)
        const compressedSize = compressed.length
        const compressionTime = Date.now() - startTime
        const compressionRatio = (dataSize - compressedSize) / dataSize
        
        compressionStats = {
          originalSize: dataSize,
          compressedSize,
          compressionRatio,
          compressionTime,
          level: compressionLevel
        }
        
        // 仅在压缩效果显著时使用压缩（节省空间≥15%）
        if (compressionRatio >= MIN_COMPRESSION_RATIO) {
          finalValue = 'ZSTD:' + Buffer.from(compressed).toString('base64')
          console.log(`🗜️ Cache compressed: ${(dataSize/1024).toFixed(1)}KB → ${(compressedSize/1024).toFixed(1)}KB (${(compressionRatio*100).toFixed(1)}% saved, level ${compressionLevel}, ${compressionTime}ms)`)
        } else {
          console.log(`📦 Cache not compressed: ratio ${(compressionRatio*100).toFixed(1)}% < ${(MIN_COMPRESSION_RATIO*100)}% threshold`)
        }
      } catch (compressionError) {
        console.warn('⚠️ Compression failed, storing uncompressed:', compressionError.message)
      }
    } else if (!compressionAvailable && dataSize > COMPRESSION_THRESHOLD) {
      console.log('📦 Large data detected but ZSTD codec not available, storing uncompressed')
    }

    const ttl = customCacheTime || cacheTime
    await redisClient.setex(key, ttl, finalValue)
    
    return compressionStats
  } catch (error) {
    console.error('Cache set error:', error)
    throw error
  }
}

/**
 * 删除缓存
 */
export async function delCache(key) {
  try {
    return await redisClient.del(key)
  } catch (error) {
    console.error('Cache delete error:', error)
    return 0
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats(keyPattern = '*') {
  try {
    const keys = await redisClient.keys(keyPattern)
    if (keys.length === 0) {
      return { totalKeys: 0, totalSize: 0, compressedKeys: 0, uncompressedKeys: 0 }
    }

    // 采样前100个键进行统计
    const sampleKeys = keys.slice(0, 100)
    const values = await redisClient.mget(sampleKeys)
    
    let totalSize = 0
    let compressedKeys = 0
    let uncompressedKeys = 0
    
    values.forEach(value => {
      if (value) {
        totalSize += Buffer.byteLength(value, 'utf8')
        if (value.startsWith('ZSTD:')) {
          compressedKeys++
        } else {
          uncompressedKeys++
        }
      }
    })
    
    return {
      totalKeys: keys.length,
      sampledKeys: sampleKeys.length,
      totalSize: Math.round(totalSize / 1024), // KB
      compressedKeys,
      uncompressedKeys,
      compressionRatio: compressedKeys / (compressedKeys + uncompressedKeys)
    }
  } catch (error) {
    console.error('Cache stats error:', error)
    return { error: error.message }
  }
}

export default { getCache, setCache, delCache, getCacheStats }
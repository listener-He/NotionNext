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

// 分块大小配置
const CHUNK_SIZE = 500 * 1024 // 500KB 分块大小
const MAX_TOTAL_SIZE = 50 * 1024 * 1024 // 50MB 总大小限制

// 压缩函数 - 支持分块压缩，不对外抛出异常
function compressData(data, level = 3) {
  try {
    if (!compressionAvailable || !zstdCodec) {
      console.warn('⚠️ ZSTD codec not available, returning original data')
      return data
    }
    
    // 验证输入数据
    if (!data || data.length === 0) {
      return new Uint8Array(0)
    }
    
    // 检查数据大小限制
    if (data.length > MAX_TOTAL_SIZE) {
      console.warn(`⚠️ Data too large for compression: ${(data.length/1024/1024).toFixed(1)}MB > ${MAX_TOTAL_SIZE/1024/1024}MB limit`)
      return data // 返回原始数据而不是抛出异常
    }
    
    const simple = new zstdCodec.Simple()
    
    // 如果数据小于分块大小，直接压缩
    if (data.length <= CHUNK_SIZE) {
      return simple.compress(data, level)
    }
    
    // 分块压缩
    const chunks = []
    const chunkCount = Math.ceil(data.length / CHUNK_SIZE)
    
    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, data.length)
      const chunk = data.slice(start, end)
      
      if (chunk.length === 0) {
        throw new Error(`Empty chunk ${i} detected during compression`)
      }
      
      const compressedChunk = simple.compress(chunk, level)
      if (!compressedChunk || compressedChunk.length === 0) {
        throw new Error(`Failed to compress chunk ${i} or result is empty`)
      }
      
      chunks.push(compressedChunk)
    }
    
    // 创建分块压缩标识和元数据
    const metadata = {
      isChunked: true,
      chunkCount: chunks.length,
      originalSize: data.length,
      chunkSizes: chunks.map(chunk => chunk.length)
    }
    
    // 验证元数据完整性
    if (metadata.chunkCount !== chunks.length || metadata.chunkSizes.length !== chunks.length) {
      throw new Error('Metadata inconsistency: chunk count mismatch')
    }
    
    const totalCompressedSize = metadata.chunkSizes.reduce((sum, size) => sum + size, 0)
    const actualCompressedSize = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    if (totalCompressedSize !== actualCompressedSize) {
      throw new Error('Metadata inconsistency: compressed size mismatch')
    }
    
    // 将元数据序列化并压缩
    const metadataBuffer = Buffer.from(JSON.stringify(metadata), 'utf8')
    const compressedMetadata = simple.compress(new Uint8Array(metadataBuffer), level)
    
    // 组合：元数据长度(4字节) + 压缩元数据 + 所有压缩块
    const metadataLengthBuffer = new ArrayBuffer(4)
    const metadataLengthView = new DataView(metadataLengthBuffer)
    metadataLengthView.setUint32(0, compressedMetadata.length, true)
    
    const totalLength = 4 + compressedMetadata.length + chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    
    let offset = 0
    result.set(new Uint8Array(metadataLengthBuffer), offset)
    offset += 4
    result.set(compressedMetadata, offset)
    offset += compressedMetadata.length
    
    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }
    
    return result
  } catch (error) {
    console.error('⚠️ ZSTD compression error, returning original data:', error.message)
    return data // 返回原始数据而不是抛出异常
  }
}

// 解压函数 - 兼容分块压缩，不对外抛出异常
function decompressData(compressedData) {
  try {
    if (!compressionAvailable || !zstdCodec) {
      console.warn('⚠️ ZSTD codec not available, returning original data')
      return compressedData
    }
    
    if (!compressedData || compressedData.length === 0) {
      return new Uint8Array(0)
    }
    
    const simple = new zstdCodec.Simple()
    
    // 检查是否为分块压缩数据（至少需要4字节的元数据长度）
    if (compressedData.length < 4) {
      // 直接解压缩
      return simple.decompress(compressedData)
    }
    
    try {
      // 尝试读取元数据长度
      const metadataLengthView = new DataView(compressedData.buffer, compressedData.byteOffset, 4)
      const metadataLength = metadataLengthView.getUint32(0, true)
      
      // 验证元数据长度是否合理
      if (metadataLength > 0 && metadataLength < compressedData.length - 4) {
        // 提取并解压元数据
        const compressedMetadata = compressedData.slice(4, 4 + metadataLength)
        const metadataBuffer = simple.decompress(compressedMetadata)
        const metadataString = Buffer.from(metadataBuffer).toString('utf8')
        const metadata = JSON.parse(metadataString)
        
        // 检查是否为分块压缩数据
        if (metadata.isChunked && metadata.chunkCount && metadata.chunkSizes && 
            metadata.originalSize && metadata.chunkCount > 0 && 
            Array.isArray(metadata.chunkSizes) && metadata.chunkSizes.length === metadata.chunkCount) {
          // 分块解压缩
          const chunks = []
          let offset = 4 + metadataLength
          
          for (let i = 0; i < metadata.chunkCount; i++) {
            const chunkSize = metadata.chunkSizes[i]
            if (chunkSize <= 0 || offset + chunkSize > compressedData.length) {
              throw new Error(`Invalid chunk ${i}: size=${chunkSize}, offset=${offset}, total=${compressedData.length}`)
            }
            
            const compressedChunk = compressedData.slice(offset, offset + chunkSize)
            if (compressedChunk.length !== chunkSize) {
              throw new Error(`Chunk ${i} size mismatch: expected ${chunkSize}, got ${compressedChunk.length}`)
            }
            
            const decompressedChunk = simple.decompress(compressedChunk)
            if (!decompressedChunk || decompressedChunk.length === 0) {
              throw new Error(`Failed to decompress chunk ${i} or chunk is empty`)
            }
            
            chunks.push(decompressedChunk)
            offset += chunkSize
          }
          
          // 合并所有解压缩的块
          const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
          if (totalLength !== metadata.originalSize) {
            throw new Error(`Decompressed size mismatch: expected ${metadata.originalSize}, got ${totalLength}`)
          }
          
          const result = new Uint8Array(metadata.originalSize)
          let resultOffset = 0
          for (const chunk of chunks) {
            if (resultOffset + chunk.length > metadata.originalSize) {
              throw new Error('Chunk data exceeds expected original size')
            }
            result.set(chunk, resultOffset)
            resultOffset += chunk.length
          }
          
          return result
        }
      }
    } catch (metadataError) {
      // 如果元数据解析失败，尝试直接解压缩
      console.log('📦 Not chunked data or metadata parse failed, trying direct decompression')
    }
    
    // 直接解压缩（非分块数据或元数据解析失败）
    return simple.decompress(compressedData)
  } catch (error) {
    console.error('⚠️ ZSTD decompression error, returning original data:', error.message)
    return compressedData // 返回原始数据而不是抛出异常
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
    // console.log('✅ Redis URL parsed successfully:', `${url.hostname}:${url.port}`)
  } catch (error) {
    console.warn('⚠️ Invalid Redis URL, using default config:', error.message)
    redisConfig = { host: '127.0.0.1', port: 6379 }
  }
} else {
  redisConfig = { host: '127.0.0.1', port: 6379 }
}

// Redis连接池配置
const REDIS_POOL_CONFIG = {
  maxConnections: 30,        // 最大连接数
  minConnections: 2,         // 最小连接数
  acquireTimeoutMillis: 5000, // 获取连接超时时间
  idleTimeoutMillis: 60000,   // 连接空闲超时时间
  maxWaitingClients: 50       // 最大等待客户端数
}

// 连接等待队列
const connectionQueue = []
let activeConnections = 0

const redisClient = new Redis({
  ...redisConfig,
  connectTimeout: 3000, // 超时时间3秒
  maxRetriesPerRequest: 2,
  reconnectOnError: (err) => {
    console.log('Redis reconnecting due to error:', err.message)
    return true
  },
  retryStrategy(times) {
    const delay = Math.min(times * 100, 3000)
    console.log(`Redis retry attempt ${times}, delay: ${delay}ms`)
    return delay
  },
  connectionName: 'blog-redis-client',
  lazyConnect: true,
  keepAlive: 30000,
  family: 4, // 强制使用IPv4
  // 连接池相关配置
  maxRetriesPerRequest: REDIS_POOL_CONFIG.maxConnections,
  enableAutoPipelining: true,
  maxLoadingTimeout: 5000
})

// 连接池管理函数
async function acquireConnection() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      const index = connectionQueue.findIndex(item => item.resolve === resolve)
      if (index !== -1) {
        connectionQueue.splice(index, 1)
      }
      reject(new Error('Connection acquire timeout'))
    }, REDIS_POOL_CONFIG.acquireTimeoutMillis)

    if (activeConnections < REDIS_POOL_CONFIG.maxConnections) {
      activeConnections++
      clearTimeout(timeout)
      resolve(redisClient)
    } else if (connectionQueue.length < REDIS_POOL_CONFIG.maxWaitingClients) {
      connectionQueue.push({ resolve, reject, timeout })
    } else {
      clearTimeout(timeout)
      reject(new Error('Connection pool exhausted'))
    }
  })
}

function releaseConnection() {
  activeConnections = Math.max(0, activeConnections - 1)
  
  if (connectionQueue.length > 0) {
    const { resolve, timeout } = connectionQueue.shift()
    clearTimeout(timeout)
    activeConnections++
    resolve(redisClient)
  }
}

// Redis连接事件监听
redisClient.on('connect', () => {
  // console.log('✅ Redis connected successfully')
})

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err.message)
})

redisClient.on('close', () => {
  // console.log('🔌 Redis connection closed')
})

redisClient.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...')
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
  level5: 15,   // 200KB-499KB: 高级别
  level6: 22    // >=500KB: 最高级别，压缩率优先
}
const SIZE_THRESHOLDS = {
  level1: 10 * 1024,   // 10KB
  level2: 50 * 1024,   // 50KB
  level3: 100 * 1024,  // 100KB
  level4: 200 * 1024,  // 200KB
  level5: 499 * 1024   // 499KB
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
 * 从缓存中获取数据 - 使用连接池，不对外抛出异常
 */
export async function getCache(key) {
  let connection = null
  try {
    // 验证输入参数
    if (!key || typeof key !== 'string') {
      console.warn('⚠️ Invalid cache key provided')
      return null
    }

    // 获取连接
    connection = await acquireConnection()
    const value = await connection.get(key)
    
    if (!value) {
      return null
    }

    // 检查是否为压缩数据
    if (value.startsWith('ZSTD:')) {
      if (!compressionAvailable) {
        console.warn('⚠️ Found compressed data but ZSTD codec not available')
        return null
      }
      
      try {
        const compressedData = Buffer.from(value.slice(5), 'base64')
        const decompressed = decompressData(new Uint8Array(compressedData))
        const jsonString = Buffer.from(decompressed).toString('utf8')
        return JSON.parse(jsonString)
      } catch (decompressionError) {
        console.error('⚠️ Cache decompression failed:', decompressionError.message)
        return null
      }
    }

    try {
      return JSON.parse(value)
    } catch (parseError) {
      console.error('⚠️ Cache JSON parse failed:', parseError.message)
      return null
    }
  } catch (error) {
    console.error('⚠️ Cache get error:', error.message)
    return null
  } finally {
    // 释放连接
    if (connection) {
      releaseConnection()
    }
  }
}

/**
 * 设置缓存数据 - 使用连接池，不对外抛出异常
 */
export async function setCache(key, data, customCacheTime) {
  let connection = null
  try {
    // 验证输入参数
    if (!key || typeof key !== 'string') {
      console.warn('⚠️ Invalid cache key provided')
      return null
    }
    
    if (data === undefined || data === null) {
      console.warn('⚠️ Cannot cache undefined or null data')
      return null
    }
    
    let jsonString
    try {
      jsonString = JSON.stringify(data)
    } catch (serializeError) {
      console.error('⚠️ Failed to serialize data to JSON:', serializeError.message)
      return null
    }
    
    if (!jsonString || jsonString === 'undefined') {
      console.warn('⚠️ Invalid JSON serialization result')
      return null
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
        const uint8Array = new Uint8Array(dataBuffer)
        const compressed = compressData(uint8Array, compressionLevel)
        
        // 检查压缩是否成功（compressData现在不会抛出异常）
        if (compressed && compressed !== uint8Array) {
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
        } else {
          console.log('📦 Compression returned original data, storing uncompressed')
        }
      } catch (compressionError) {
        console.warn('⚠️ Compression failed, storing uncompressed:', compressionError.message)
      }
    } else if (!compressionAvailable && dataSize > COMPRESSION_THRESHOLD) {
      console.log('📦 Large data detected but ZSTD codec not available, storing uncompressed')
    }

    // 获取连接并存储数据
    connection = await acquireConnection()
    const ttl = customCacheTime || cacheTime
    await connection.setex(key, ttl, finalValue)
    
    return compressionStats
  } catch (error) {
    console.error('⚠️ Cache set error:', error.message)
    return null
  } finally {
    // 释放连接
    if (connection) {
      releaseConnection()
    }
  }
}

/**
 * 删除缓存 - 使用连接池，不对外抛出异常
 */
export async function delCache(key) {
  let connection = null
  try {
    if (!key || typeof key !== 'string') {
      console.warn('⚠️ Invalid cache key provided')
      return 0
    }

    connection = await acquireConnection()
    return await connection.del(key)
  } catch (error) {
    console.error('⚠️ Cache delete error:', error.message)
    return 0
  } finally {
    if (connection) {
      releaseConnection()
    }
  }
}

/**
 * 获取缓存统计信息 - 使用连接池，不对外抛出异常
 */
export async function getCacheStats(keyPattern = '*') {
  let connection = null
  try {
    if (!keyPattern || typeof keyPattern !== 'string') {
      keyPattern = '*'
    }

    connection = await acquireConnection()
    const keys = await connection.keys(keyPattern)
    
    if (keys.length === 0) {
      return { 
        totalKeys: 0, 
        totalSize: 0, 
        compressedKeys: 0, 
        uncompressedKeys: 0,
        connectionPoolStats: {
          activeConnections,
          queueLength: connectionQueue.length,
          maxConnections: REDIS_POOL_CONFIG.maxConnections
        }
      }
    }

    // 采样前100个键进行统计
    const sampleKeys = keys.slice(0, 100)
    const values = await connection.mget(sampleKeys)
    
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
      compressionRatio: compressedKeys > 0 ? compressedKeys / (compressedKeys + uncompressedKeys) : 0,
      connectionPoolStats: {
        activeConnections,
        queueLength: connectionQueue.length,
        maxConnections: REDIS_POOL_CONFIG.maxConnections
      }
    }
  } catch (error) {
    console.error('⚠️ Cache stats error:', error.message)
    return { 
      error: error.message,
      connectionPoolStats: {
        activeConnections,
        queueLength: connectionQueue.length,
        maxConnections: REDIS_POOL_CONFIG.maxConnections
      }
    }
  } finally {
    if (connection) {
      releaseConnection()
    }
  }
}

export default { getCache, setCache, delCache, getCacheStats }
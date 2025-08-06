import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'
import zstd from 'node-zstd'
import { promisify } from 'util'

// 异步压缩和解压函数
const compressAsync = promisify(zstd.compress)
const decompressAsync = promisify(zstd.decompress)

// 连接池配置
const redisClient = new Redis({
  url: BLOG.REDIS_URL,
  connectTimeout: 2000, // 超时时间2秒
  maxRetriesPerRequest: 1,
  reconnectOnError: () => true,
  retryStrategy(times) {
    return Math.min(times * 50, 2000)
  },
  connectionName: 'my-redis-client',
  lazyConnect: true,
  minIdleTime: 60000, // 闲置时间60秒
  idleCheckInterval: 10000, // 每10秒检查一次闲置连接
  minConnections: 1,
  maxConnections: 15
})

const cacheTime = Math.trunc(
  siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND) * 1.5
)

// 压缩阈值：超过此大小的数据才进行压缩（字节）
const COMPRESSION_THRESHOLD = 1024 // 1KB

// 动态压缩级别配置：根据数据大小智能调整压缩级别
const COMPRESSION_LEVELS = {
  small: 1, // 1KB-5KB: 速度优先
  medium: 6, // 5KB-50KB: 平衡性能
  large: 15, // 50KB-100KB: 较高压缩级别
  highest: 22 // >100KB: 最高压缩级别
}
const SIZE_THRESHOLDS = {
  small: 5 * 1024, // 5KB
  medium: 50 * 1024, // 50KB
  large: 100 * 1024 // 100KB
}

const MIN_COMPRESSION_RATIO = 0.15 // 最小压缩效果阈值 (15%节省空间才使用压缩)

/**
 * 根据数据大小动态选择最优压缩级别
 * @param {number} dataSize 数据大小（字节）
 * @returns {number} 压缩级别 (1-22)
 */
function getDynamicCompressionLevel(dataSize) {
  if (dataSize <= SIZE_THRESHOLDS.small) {
    return COMPRESSION_LEVELS.small
  } else if (dataSize <= SIZE_THRESHOLDS.medium) {
    return COMPRESSION_LEVELS.medium
  } else if (dataSize <= SIZE_THRESHOLDS.large) {
    return COMPRESSION_LEVELS.large
  } else {
    return COMPRESSION_LEVELS.highest
  }
}

/**
 * 获取缓存数据
 * @param {string} key 缓存键
 * @returns {Promise<any>} 解析后的数据
 */
export async function getCache(key) {
  try {
    const data = await redisClient.get(key)
    if (!data) return null

    // 检查是否为压缩数据（通过特殊前缀标识）
    if (data.startsWith('ZSTD:')) {
      // 移除前缀并解压
      const compressedData = Buffer.from(data.slice(5), 'base64')
      const decompressed = await decompressAsync(compressedData)
      return JSON.parse(decompressed.toString('utf8'))
    } else {
      // 未压缩的数据，直接解析
      return JSON.parse(data)
    }
  } catch (e) {
    console.error(`redisClient读取失败 ${String(e)}`)
    return null
  }
}

/**
 * 设置缓存数据
 * @param {string} key 缓存键
 * @param {any} data 要缓存的数据
 * @param {number} customCacheTime 自定义过期时间
 */
export async function setCache(key, data, customCacheTime) {
  try {
    const jsonString = JSON.stringify(data)
    const dataSize = Buffer.byteLength(jsonString, 'utf8')

    let finalData = jsonString
    let compressionInfo = ''

    // 智能压缩策略：只对大于1KB的数据进行压缩
    if (dataSize > COMPRESSION_THRESHOLD) {
      const startTime = process.hrtime.bigint()

      // 根据数据大小动态选择最优压缩级别
      const compressionLevel = getDynamicCompressionLevel(dataSize)
      const levelDesc =
        dataSize <= SIZE_THRESHOLDS.small
          ? '速度优先'
          : dataSize <= SIZE_THRESHOLDS.medium
            ? '平衡性能'
            : dataSize <= SIZE_THRESHOLDS.large
              ? '较高压缩'
              : '最高压缩'

      // 使用动态压缩级别进行zstd压缩
      const compressed = await compressAsync(Buffer.from(jsonString, 'utf8'), {
        level: compressionLevel
      })
      const compressedSize = compressed.length
      const compressionRatio = (dataSize - compressedSize) / dataSize

      const endTime = process.hrtime.bigint()
      const compressionTime = Number(endTime - startTime) / 1000000 // 转换为毫秒

      // 只有压缩效果达到最小阈值时才使用压缩版本
      if (compressionRatio >= MIN_COMPRESSION_RATIO) {
        finalData = 'ZSTD:' + compressed.toString('base64')
        compressionInfo = ` (动态压缩[${levelDesc}L${compressionLevel}]: ${dataSize}B -> ${compressedSize}B, 节省${(compressionRatio * 100).toFixed(1)}%, 耗时${compressionTime.toFixed(2)}ms)`
      } else {
        compressionInfo = ` (跳过压缩: 效果不佳，仅节省${(compressionRatio * 100).toFixed(1)}%)`
      }
    } else {
      compressionInfo = ` (跳过压缩: 数据小于${COMPRESSION_THRESHOLD / 1024}KB阈值)`
    }

    await redisClient.set(key, finalData, 'EX', customCacheTime || cacheTime)

    // 开发环境下输出压缩信息
    if (process.env.NODE_ENV === 'development') {
      console.log(`Redis缓存写入: ${key}${compressionInfo}`)
    }
  } catch (e) {
    console.error(`redisClient写入失败 ${String(e)}`)
  }
}

/**
 * 删除缓存数据
 * @param {string} key 缓存键
 */
export async function delCache(key) {
  try {
    await redisClient.del(key)
  } catch (e) {
    console.error(`redisClient删除失败 ${String(e)}`)
  }
}

/**
 * 获取缓存统计信息
 * @param {string} keyPattern 键模式，如 'page_content_*'
 * @returns {Promise<object>} 统计信息
 */
export async function getCacheStats(keyPattern = '*') {
  try {
    const keys = await redisClient.keys(keyPattern)
    let totalSize = 0
    let compressedCount = 0
    let uncompressedCount = 0

    for (const key of keys.slice(0, 100)) {
      // 限制检查前100个键
      const data = await redisClient.get(key)
      if (data) {
        totalSize += Buffer.byteLength(data, 'utf8')
        if (data.startsWith('ZSTD:')) {
          compressedCount++
        } else {
          uncompressedCount++
        }
      }
    }

    return {
      totalKeys: keys.length,
      sampledKeys: Math.min(keys.length, 100),
      totalSize: `${(totalSize / 1024).toFixed(2)} KB`,
      compressedCount,
      uncompressedCount,
      compressionRatio: compressedCount / (compressedCount + uncompressedCount)
    }
  } catch (e) {
    console.error(`获取缓存统计失败 ${String(e)}`)
    return null
  }
}

export default { getCache, setCache, delCache, getCacheStats }
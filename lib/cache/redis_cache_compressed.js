import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'
import { gzip, gunzip } from 'zlib'
import { promisify } from 'util'

// 异步压缩和解压函数
const gzipAsync = promisify(gzip)
const gunzipAsync = promisify(gunzip)

export const redisClient = BLOG.REDIS_URL ? new Redis(BLOG.REDIS_URL) : {}

const cacheTime = Math.trunc(
  siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND) * 1.5
)

// 压缩阈值：超过此大小的数据才进行压缩（字节）
const COMPRESSION_THRESHOLD = 5 * 1024 // 5KB

// 动态压缩级别配置：根据数据大小智能调整压缩级别
const COMPRESSION_LEVELS = {
  small: 3,   // 5KB-50KB: 低压缩级别，优先速度
  medium: 6,  // 50KB-500KB: 中等压缩级别，平衡性能
  large: 9    // >500KB: 高压缩级别，优先压缩率
}
const SIZE_THRESHOLDS = {
  small: 50 * 1024,   // 50KB
  medium: 500 * 1024  // 500KB
}
const MIN_COMPRESSION_RATIO = 0.15 // 最小压缩效果阈值 (15%节省空间才使用压缩)

/**
 * 根据数据大小动态选择最优压缩级别
 * @param {number} dataSize 数据大小（字节）
 * @returns {number} 压缩级别 (1-9)
 */
function getDynamicCompressionLevel(dataSize) {
  if (dataSize <= SIZE_THRESHOLDS.small) {
    return COMPRESSION_LEVELS.small
  } else if (dataSize <= SIZE_THRESHOLDS.medium) {
    return COMPRESSION_LEVELS.medium
  } else {
    return COMPRESSION_LEVELS.large
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
    if (data.startsWith('GZIP:')) {
      // 移除前缀并解压
      const compressedData = Buffer.from(data.slice(5), 'base64')
      const decompressed = await gunzipAsync(compressedData)
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
    
    let finalData
    let compressionInfo = ''
    
    // 智能压缩策略：只对大于5KB的数据进行压缩
    if (dataSize > COMPRESSION_THRESHOLD) {
      const startTime = process.hrtime.bigint()
      
      // 根据数据大小动态选择最优压缩级别
      const compressionLevel = getDynamicCompressionLevel(dataSize)
      const levelDesc = dataSize <= SIZE_THRESHOLDS.small ? '快速' : 
                       dataSize <= SIZE_THRESHOLDS.medium ? '平衡' : '高效'
      
      // 使用动态压缩级别进行gzip压缩
      const compressed = await gzipAsync(Buffer.from(jsonString, 'utf8'), { level: compressionLevel })
      const compressedSize = compressed.length
      const compressionRatio = (dataSize - compressedSize) / dataSize
      
      const endTime = process.hrtime.bigint()
      const compressionTime = Number(endTime - startTime) / 1000000 // 转换为毫秒
      
      // 只有压缩效果达到最小阈值时才使用压缩版本
      if (compressionRatio >= MIN_COMPRESSION_RATIO) {
        finalData = 'GZIP:' + compressed.toString('base64')
        compressionInfo = ` (动态压缩[${levelDesc}L${compressionLevel}]: ${dataSize}B -> ${compressedSize}B, 节省${(compressionRatio * 100).toFixed(1)}%, 耗时${compressionTime.toFixed(2)}ms)`
      } else {
        finalData = jsonString
        compressionInfo = ` (跳过压缩: 效果不佳，仅节省${(compressionRatio * 100).toFixed(1)}%)`
      }
    } else {
      finalData = jsonString
      compressionInfo = ` (跳过压缩: 数据小于${COMPRESSION_THRESHOLD / 1024}KB阈值)`
    }
    
    await redisClient.set(
      key,
      finalData,
      'EX',
      customCacheTime || cacheTime
    )
    
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
    
    for (const key of keys.slice(0, 100)) { // 限制检查前100个键
      const data = await redisClient.get(key)
      if (data) {
        totalSize += Buffer.byteLength(data, 'utf8')
        if (data.startsWith('GZIP:')) {
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
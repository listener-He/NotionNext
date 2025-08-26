import BLOG from '@/blog.config'
import FileCache from './local_file_cache'
import MemoryCache from './memory_cache'
import RedisCache from './redis_cache'
import RedisCompressedCache from './redis_cache_compressed'

// 配置是否开启Vercel环境中的缓存，因为Vercel中现有两种缓存方式在无服务环境下基本都是无意义的，纯粹的浪费资源
const enableCacheInVercel =
  process.env.npm_lifecycle_event === 'build' ||
  process.env.npm_lifecycle_event === 'export' ||
  process.env.npm_lifecycle_event === 'dev' || BLOG.ENABLE_CACHE ||
  !BLOG['isProd']

/**
 * 尝试从缓存中获取数据，如果没有则尝试获取数据并写入缓存，最终返回所需数据
 * @param key
 * @param getDataFunction
 * @param getDataArgs
 * @returns {Promise<*|null>}
 */
export async function getOrSetDataWithCache(
  key,
  getDataFunction,
  ...getDataArgs
) {
  return getOrSetDataWithCustomCache(key, null, getDataFunction, ...getDataArgs)
}

/**
 * 尝试从缓存中获取数据，如果没有则尝试获取数据并自定义写入缓存，最终返回所需数据
 * @param key
 * @param customCacheTime
 * @param getDataFunction
 * @param getDataArgs
 * @returns {Promise<*|null>}
 */
export async function getOrSetDataWithCustomCache(
  key,
  customCacheTime,
  getDataFunction,
  ...getDataArgs
) {
  const dataFromCache = await getDataFromCache(key)
  if (dataFromCache) {
    // console.log('[缓存-->>API]:', key) // 避免过多的缓存日志输出
    return dataFromCache
  }
  const data = await getDataFunction(...getDataArgs)
  if (data) {
    // 不等待缓存写入完成，提升响应速度
    setDataToCache(key, data, customCacheTime).catch(e => {
      // 静默处理缓存写入失败，不影响主流程
      console.warn('Cache write failed:', e)
    })
  }
  return data || null
}

/**
 * 为减少频繁接口请求，notion数据将被缓存
 * @param {*} key
 * @returns
 */
export async function getDataFromCache(key, force) {
  // 修复缓存启用检查逻辑
  const cacheEnabled = typeof BLOG.ENABLE_CACHE === 'string' ? 
    JSON.parse(BLOG.ENABLE_CACHE) : BLOG.ENABLE_CACHE
  
  if (cacheEnabled || force) {
    const dataFromCache = await getApi().getCache(key)
    if (!dataFromCache || JSON.stringify(dataFromCache) === '[]') {
      return null
    }
    // console.log(`[缓存命中]: ${key}`) // 减少日志输出
    return dataFromCache
  } else {
    return null
  }
}

/**
 * 写入缓存
 * @param {*} key
 * @param {*} data
 * @param {*} customCacheTime
 * @returns
 */
export async function setDataToCache(key, data, customCacheTime) {
  if (!enableCacheInVercel || !data) {
    return
  }
  
  try {
    await getApi().setCache(key, data, customCacheTime)
  } catch (error) {
    // 静默处理缓存写入失败
  }
}

export async function delCacheData(key) {
  if (!JSON.parse(BLOG.ENABLE_CACHE)) {
    return
  }
  await getApi().delCache(key)
}

/**
 * 缓存实现类
 * @returns
 */
export function getApi() {
  if (BLOG.REDIS_URL) {
    // 检查是否启用Redis智能压缩缓存
    if (BLOG.ENABLE_REDIS_COMPRESSION) {
      return RedisCompressedCache
    } else {
      return RedisCache
    }
  } else if (process.env.ENABLE_FILE_CACHE) {
    return FileCache
  } else {
    return MemoryCache
  }
}

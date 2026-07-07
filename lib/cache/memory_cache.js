import cache from 'memory-cache'
import BLOG from '@/blog.config'

const cacheTime = BLOG.isProd ? 10 * 60 : 120 * 60 // 120 minutes for dev,10 minutes for prod

export async function getCache(key, options) {
  return await cache.get(key)
}

export async function setCache(key, data, customCacheTime) {
  await cache.put(key, data, (customCacheTime || cacheTime) * 1000)
}

export async function delCache(key) {
  await cache.del(key)
}

/** 清空整个内存缓存（用于 on-demand 全站刷新） */
export async function clearAll() {
  cache.clear()
}

export default { getCache, setCache, delCache, clearAll }

import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import Redis from 'ioredis'

export const redisClient = BLOG.REDIS_URL ? new Redis(BLOG.REDIS_URL) : {}

const cacheTime = Math.trunc(
  siteConfig('NEXT_REVALIDATE_SECOND', BLOG.NEXT_REVALIDATE_SECOND) * 1.5
)

export async function getCache(key) {
  try {
    const data = await redisClient.get(key)
    return data ? JSON.parse(data) : null
  } catch (e) {
    return null
  }
}

export async function setCache(key, data, customCacheTime) {
  try {
    await redisClient.set(
      key,
      JSON.stringify(data),
      'EX',
      customCacheTime || cacheTime
    )
  } catch (e) {
    return false
  }
}

export async function delCache(key) {
  try {
    await redisClient.del(key)
  } catch (e) {
    return 0
  }
}

export default { getCache, setCache, delCache }

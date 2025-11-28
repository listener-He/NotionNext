import { getGlobalData } from '@/lib/db/getSiteData'
import { generateRssFeed } from '@/lib/rss'
import { getOrSetDataWithCustomCache } from '@/lib/cache/cache_manager'
import { CACHE_KEY_RSS } from '@/lib/cache/cache_keys'
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)

// RSS缓存时间（秒）- 30分钟
const RSS_CACHE_TIME = 30 * 60

/**
 * RSS API 路由
 * 在 Vercel 等无服务器环境中动态生成 RSS 内容
 * 复用原有的 RSS 生成逻辑
 * 
 * 功能特性：
 * - 支持多种格式：RSS2.0 (默认)、Atom、JSON Feed
 * - 集成缓存管理器，30分钟缓存时间
 * - 支持 gzip 压缩，优化传输性能
 * - 独立缓存不同格式的RSS内容
 * 
 * 查询参数：
 * - format: 'rss2' | 'atom' | 'json' (可选，默认为 rss2)
 * 
 * 示例：
 * - GET /api/rss - 返回 RSS2.0 格式
 * - GET /api/rss?format=atom - 返回 Atom 格式
 * - GET /api/rss?format=json - 返回 JSON Feed 格式
 */
export default async function handler(req, res) {
  try {
    // 根据请求的格式确定缓存键和内容类型
    const { format } = req.query
    const cacheKey = CACHE_KEY_RSS(format || 'rss2');
    let contentType
    
    switch (format) {
      case 'atom':
        contentType = 'application/atom+xml; charset=utf-8'
        break
      case 'json':
        contentType = 'application/json; charset=utf-8'
        break
      default:
        contentType = 'application/rss+xml; charset=utf-8'
        break
    }

    // 使用缓存管理器获取或生成RSS内容
    const startTime = Date.now()
    const content = await getOrSetDataWithCustomCache(
      cacheKey,
      RSS_CACHE_TIME,
      async () => {
        console.log(`[RSS API] 🔄 生成新的RSS内容: ${format || 'rss2'}`)
        
        // 获取站点数据
        const props = await getGlobalData({ from: 'rss-api' })
        
        if (!props || !props.latestPosts) {
          throw new Error('Failed to fetch site data')
        }

        // 使用原有的 RSS 生成逻辑
        const feed = await generateRssFeed(props)
        
        if (!feed) {
          throw new Error('Failed to generate RSS feed')
        }

        // 根据格式生成对应的RSS内容
        switch (format) {
          case 'atom':
            return feed.atom1()
          case 'json':
            return feed.json1()
          default:
            return feed.rss2()
        }
      }
    )
    
    const duration = Date.now() - startTime
    console.log(`[RSS API] ⚡ RSS响应完成: ${format || 'rss2'}, 耗时: ${duration}ms`)
    
    if (!content) {
      return res.status(500).json({ error: 'Failed to generate RSS feed' })
    }

    // 检查客户端是否支持 gzip 压缩
    const acceptEncoding = req.headers['accept-encoding'] || ''
    const shouldCompress = acceptEncoding.includes('gzip') && content.length > 1024

    res.setHeader('Content-Type', contentType)
    
    if (shouldCompress) {
      try {
        const compressed = await gzipAsync(Buffer.from(content, 'utf8'))
        res.setHeader('Content-Encoding', 'gzip')
        res.setHeader('Vary', 'Accept-Encoding')
        res.setHeader('Content-Length', compressed.length)
        return res.status(200).send(compressed)
      } catch (compressionError) {
        console.warn('[RSS API] 压缩失败，返回未压缩内容:', compressionError)
        // 如果压缩失败，返回原始内容
        return res.status(200).send(content)
      }
    } else {
      return res.status(200).send(content)
    }
  } catch (error) {
    console.error('[RSS API] 生成失败:', error)
    return res.status(500).json({ error: 'Failed to generate RSS feed' })
  }
}
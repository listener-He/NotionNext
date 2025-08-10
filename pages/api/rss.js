import { getGlobalData } from '@/lib/db/getSiteData'
import { generateRssFeed } from '@/lib/rss'
import { gzip } from 'zlib'
import { promisify } from 'util'

const gzipAsync = promisify(gzip)

/**
 * RSS API 路由
 * 在 Vercel 等无服务器环境中动态生成 RSS 内容
 * 复用原有的 RSS 生成逻辑
 */
export default async function handler(req, res) {
  try {
    // 获取站点数据
    const props = await getGlobalData({ from: 'rss-api' })
    
    if (!props || !props.latestPosts) {
      return res.status(500).json({ error: 'Failed to fetch site data' })
    }

    // 使用原有的 RSS 生成逻辑
    const feed = await generateRssFeed(props)
    
    if (!feed) {
      return res.status(500).json({ error: 'Failed to generate RSS feed' })
    }

    // 根据请求的格式返回不同的 RSS 格式
    const { format } = req.query
    let content
    let contentType
    
    switch (format) {
      case 'atom':
        content = feed.atom1()
        contentType = 'application/atom+xml; charset=utf-8'
        break
      case 'json':
        content = feed.json1()
        contentType = 'application/json; charset=utf-8'
        break
      default:
        content = feed.rss2()
        contentType = 'application/rss+xml; charset=utf-8'
        break
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
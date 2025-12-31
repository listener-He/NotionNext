import fs from 'fs'
import path from 'path'

/**
 * RSS 智能路由处理器
 *
 * 功能特性：
 * 1. 文件系统支持检测：自动检测当前环境是否支持文件系统访问
 * 2. 智能重定向：根据文件存在性和系统支持情况决定是否重定向到 API
 * 3. 格式识别：自动识别不同 RSS 格式并重定向到对应的 API 端点
 *    - feed.xml → /api/rss (RSS 2.0)
 *    - atom.xml → /api/rss?format=atom (Atom)
 *    - feed.json → /api/rss?format=json (JSON Feed)
 * 4. 缓存优化：维护文件系统支持状态缓存，避免重复检测
 *
 * 工作流程：
 * 1. 检测文件系统是否支持（仅首次检测，后续使用缓存）
 * 2. 如果不支持文件系统，直接重定向到对应的 API 路由
 * 3. 如果支持文件系统，检查静态文件是否存在
 * 4. 文件存在时：保持原有RSS自更新逻辑，让静态文件服务处理
 * 5. 文件不存在时：重定向到 API 路由动态生成内容
 *
 * 适用场景：
 * - Vercel 等无服务器环境（文件系统受限）
 * - 传统服务器环境（文件系统完全支持）
 * - 静态文件缺失或过期的情况
 */

// 缓存文件系统支持状态，避免重复检测
let fileSystemSupported = null

/**
 * 检测文件系统是否支持
 * @returns {boolean} 是否支持文件系统访问
 */
function checkFileSystemSupport() {
  if (fileSystemSupported !== null) {
    return fileSystemSupported
  }

  try {
    // 尝试访问 public 目录
    const rssExists = require('fs').existsSync('./public/rss/feed.xml')
    if (rssExists) {
      fileSystemSupported = true
      console.log('[RSS] 文件系统支持检测: 支持')
    } else {
      fileSystemSupported = false
    }
  } catch (error) {
    fileSystemSupported = false
    console.log('[RSS] 文件系统支持检测: 不支持，将使用 API 路由')
  }

  return fileSystemSupported
}

export async function getServerSideProps({ params, req, res }) {
  const slug = params.slug.join('/')

  // 检测文件系统支持
  const isFileSystemSupported = checkFileSystemSupport()

  // 确定目标 API 路由
  let destination = '/api/rss'
  if (slug === 'atom.xml') {
    destination = '/api/rss?format=atom'
  } else if (slug === 'feed.json') {
    destination = '/api/rss?format=json'
  }

  // 如果文件系统不支持或使用其他模式，直接重定向到 API
  if (!isFileSystemSupported || process.env.EXPORT) {
    console.log(`[RSS] 文件系统不支持，重定向到 API: ${destination}`)
    return {
      redirect: {
        destination,
        permanent: false
      }
    }
  }

  // 如果文件系统支持，只在文件不存在时才重定向到 API
  // 文件存在时，让 Next.js 的静态文件服务自然处理（保持原有RSS自更新逻辑）
  const filePath = path.join(process.cwd(), 'public', 'rss', slug)

  try {
    fs.accessSync(filePath, fs.constants.R_OK)
    // 文件存在，记录日志但不做任何处理
    // 让 Next.js 的静态文件服务优先级生效
    console.log(`[RSS] 静态文件 ${slug} 存在，保持原有RSS自更新逻辑`)
  } catch (error) {
    // 文件不存在，重定向到 API
    console.log(`[RSS] 静态文件 ${slug} 不存在，重定向到 API: ${destination}`)
    // 设置缓存头以优化性能
    res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=59')
    return {
      redirect: {
        destination,
        permanent: false
      }
    }
  }

  // 如果文件存在，我们不返回任何重定向，让静态文件服务处理
  // 但是由于这是动态路由，我们需要返回404让Next.js回退到静态文件查找
  return {
    notFound: true
  }
}

// 空组件，不会被渲染因为会重定向
export default function RssHandler() {
  return null
}

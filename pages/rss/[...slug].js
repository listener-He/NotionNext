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
let lastCheckTime = null
let fsObj = null;
// RSS 生成缓存
let rssFileCache = {
  lastGeneratedTime: 0,
  intervalMinutes: 10 // RSS缓存间隔（分钟
}


function getFs() {
  if (fsObj) {
    return fsObj
  }
  try {
    fsObj = require('fs')
  } catch (error) {
    fsObj = null
  }
  return fsObj
}

/**
 * 检测文件系统是否支持
 * @returns {boolean} 是否支持文件系统访问
 */
function checkFileSystemSupport() {
  // 缓存检测结果，避免重复检测
  const now = Date.now();
  if (fileSystemSupported !== null && lastCheckTime && now - lastCheckTime < 60 * 1000) {
    return fileSystemSupported
  }

  try {
    const fs = getFs()
    // 尝试访问 public 目录
    const rssExists = fs.existsSync('./public/rss/feed.xml')
    if (rssExists) {
      fs.writeFileSync('./public/rss/check-write.log', now)
      fileSystemSupported = true
      console.log('[RSS] 文件系统支持检测: 支持')
    } else {
      fileSystemSupported = false
    }
  } catch (error) {
    fileSystemSupported = false
    console.warn('[RSS] 文件系统支持检测: 不支持，将使用 API 路由')
  }
  lastCheckTime = now
  return fileSystemSupported
}

export async function getServerSideProps({ params, ctx }) {
  const slug = params.slug.join('/')

  // 确定目标 API 路由
  let destination = '/api/rss'
  if (slug === 'atom.xml') {
    destination = '/api/rss?format=atom'
  } else if (slug === 'feed.json') {
    destination = '/api/rss?format=json'
  }
  const now = Date.now();
  if (checkFileSystemSupport()) {
    if (now - rssFileCache.lastGeneratedTime < rssFileCache.intervalMinutes * 60 * 1000) {
      // 文件存在且在缓存周期内, 让静态文件服务处理
      return {}
    }
  }

  return {
    redirect: {
      destination,
      permanent: false
    }
  }
}

// 空组件，不会被渲染因为会重定向
export default function RssHandler() {
  return null
}

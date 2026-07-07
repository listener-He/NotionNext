import BLOG from '@/blog.config'
import { clearAllCache } from '@/lib/cache/cache_manager'
import { clearGlobalDataCache } from '@/lib/db/SiteDataApi'

/**
 * On-Demand Revalidation API
 *
 * 解决 Issue #1020：Notion 内容更新后前端不实时同步
 *
 * 使用方式：
 *   POST /api/revalidate
 *   Authorization: Bearer <REVALIDATION_TOKEN>
 *   Body: { "path": "/article/my-post" }        — 刷新单个页面
 *   Body: { "paths": ["/", "/article/post-1"] }  — 批量刷新
 *   Body: { "all": true }                        — 全站刷新
 *
 * 环境变量：
 *   REVALIDATION_TOKEN — API 鉴权 Token（必须设置）
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      ok: false,
      message: 'Method Not Allowed. Use POST.'
    })
  }

  // Token 鉴权
  const token = process.env.REVALIDATION_TOKEN || BLOG.REVALIDATION_TOKEN
  if (!token) {
    return res.status(503).json({
      ok: false,
      message: 'Revalidation is disabled: REVALIDATION_TOKEN not set'
    })
  }

  const authHeader = req.headers.authorization || ''
  const receivedToken = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : req.body?.token || ''

  if (receivedToken !== token) {
    return res.status(401).json({ ok: false, message: 'Unauthorized' })
  }

  const { path, paths, all } = req.body || {}

  try {
    // 全站刷新：清空运行时缓存链（memory/redis/file）+ revalidate 首页
    if (all) {
      await clearAllCache()
      const results = []
      try {
        await res.revalidate('/')
        results.push({ path: '/', revalidated: true })
      } catch (e) {
        results.push({ path: '/', revalidated: false, error: e.message })
      }
      return res.status(200).json({
        ok: true,
        message: 'Full site cache cleared. Homepage revalidated. Other pages will refresh on next visit.',
        results
      })
    }

    // 单页/批量刷新：先失效全局数据缓存（否则列表/首页在 memory TTL 内仍读旧数据），
    // 再逐个 res.revalidate 重建 HTML。文章正文缓存按 lastEditedDate 版本化 key 天然失效。
    await clearGlobalDataCache()

    const targetPaths = paths || (path ? [path] : ['/'])
    const results = []

    for (const p of targetPaths) {
      const normalizedPath = normalizePath(p)
      try {
        await res.revalidate(normalizedPath)
        results.push({ path: normalizedPath, revalidated: true })
      } catch (e) {
        results.push({ path: normalizedPath, revalidated: false, error: e.message })
      }
    }

    return res.status(200).json({
      ok: true,
      message: `Revalidated ${results.filter(r => r.revalidated).length}/${results.length} paths`,
      results
    })
  } catch (error) {
    console.error('[revalidate] Error:', error)
    return res.status(500).json({
      ok: false,
      message: 'Revalidation failed',
      error: error.message
    })
  }
}

/**
 * 标准化路径：确保以 / 开头，去掉尾部 /
 */
function normalizePath(p) {
  if (!p || typeof p !== 'string') return '/'
  let normalized = p.trim()
  if (!normalized.startsWith('/')) normalized = '/' + normalized
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }
  return normalized
}

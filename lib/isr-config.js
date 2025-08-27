/**
 * ISR (Incremental Static Regeneration) 智能配置
 * 根据页面类型和内容特性优化缓存策略
 */

const BLOG = require('../blog.config')
const { siteConfig } = require('./config')

/**
 * 获取智能ISR配置
 * @param {string} pageType - 页面类型 (index, post, category, tag, archive, search)
 * @param {object} pageData - 页面数据
 * @param {object} notionConfig - Notion配置
 * @returns {number|false} 重新验证时间（秒）或false表示不使用ISR
 */
function getISRConfig(pageType, pageData = {}, notionConfig = {}) {
  // 如果是导出模式，不使用ISR
  if (process.env.EXPORT) {
    return false
  }

  const baseRevalidate = siteConfig(
    'NEXT_REVALIDATE_SECOND',
    BLOG.NEXT_REVALIDATE_SECOND,
    notionConfig
  )

  // 根据页面类型设置不同的缓存策略
  switch (pageType) {
    case 'index':
      // 首页：中等频率更新，因为需要显示最新文章
      return Math.max(baseRevalidate, 600) // 最少10分钟

    case 'post':
      // 文章页面：根据文章发布时间动态调整
      const postAge = getPostAge(pageData.publishDate)
      if (postAge < 7) {
        // 新文章（7天内）：较频繁更新
        return Math.max(baseRevalidate, 1800) // 30分钟
      } else if (postAge < 30) {
        // 中等文章（30天内）：中等频率更新
        return Math.max(baseRevalidate * 2, 7200) // 2小时
      } else {
        // 老文章（30天以上）：低频率更新
        return Math.max(baseRevalidate * 10, 86400) // 1天
      }

    case 'category':
    case 'tag':
      // 分类和标签页面：中等频率更新
      return Math.max(baseRevalidate * 3, 7200) // 2小时

    case 'archive':
      // 归档页面：低频率更新
      return Math.max(baseRevalidate * 6, 86400) // 1天

    case 'search':
      // 搜索页面：不使用ISR，因为是动态内容
      return false

    case 'sitemap':
    case 'rss':
      // 站点地图和RSS：低频率更新
      return Math.max(baseRevalidate * 12, 3600) // 1小时

    default:
      // 其他页面：使用默认配置
      return baseRevalidate
  }
}

/**
 * 计算文章发布后的天数
 * @param {string} publishDate - 发布日期
 * @returns {number} 天数
 */
function getPostAge(publishDate) {
  if (!publishDate) return 0
  
  const publishTime = new Date(publishDate).getTime()
  const currentTime = new Date().getTime()
  const diffTime = currentTime - publishTime
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  return Math.max(diffDays, 0)
}

/**
 * 检查是否应该跳过ISR
 * @param {object} context - Next.js上下文
 * @returns {boolean} 是否跳过ISR
 */
function shouldSkipISR(context) {
  // 开发环境跳过ISR
  if (process.env.NODE_ENV === 'development') {
    return true
  }

  // 预览模式跳过ISR
  if (context.preview) {
    return true
  }

  // 特定查询参数跳过ISR
  const { query } = context
  if (query.nocache || query.preview) {
    return true
  }

  return false
}

/**
 * 获取缓存标签，用于按需重新验证
 * @param {string} pageType - 页面类型
 * @param {object} pageData - 页面数据
 * @returns {string[]} 缓存标签数组
 */
function getCacheTags(pageType, pageData = {}) {
  const tags = [pageType]

  switch (pageType) {
    case 'post':
      if (pageData.category) {
        tags.push(`category:${pageData.category}`)
      }
      if (pageData.tags) {
        pageData.tags.forEach(tag => tags.push(`tag:${tag}`))
      }
      break

    case 'category':
      if (pageData.category) {
        tags.push(`category:${pageData.category}`)
      }
      break

    case 'tag':
      if (pageData.tag) {
        tags.push(`tag:${pageData.tag}`)
      }
      break
  }

  return tags
}

module.exports = {
  getISRConfig,
  shouldSkipISR,
  getCacheTags,
  getPostAge
}
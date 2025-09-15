/**
 * 缓存键常量配置
 * 统一管理项目中所有缓存键的命名，便于维护和修改
 */

// 页面内容缓存键
export const CACHE_KEY_PAGE_CONTENT = (id, slice) => slice ? `page_content_${id}_slice_${slice}` : `page_content_${id}_full`

// 页面块缓存键 (用于重试机制)
export const CACHE_KEY_PAGE_BLOCK = (id) => `page_block_${id}`

// 站点数据缓存键
export const CACHE_KEY_SITE_DATA = (pageId) => `site_data_${pageId}`

// AI摘要缓存键
export const CACHE_KEY_AI_SUMMARY = (postId) => `ai_summary_${postId}`

// RSS缓存键
export const CACHE_KEY_RSS = (format) => `rss_feed_${format || 'rss2'}`

// 默认缓存键前缀
export const CACHE_KEY_PREFIX = {
  PAGE_CONTENT: 'page_content_',
  PAGE_BLOCK: 'page_block_',
  SITE_DATA: 'site_data_',
  AI_SUMMARY: 'ai_summary_',
  RSS: 'rss_feed_'
}

/**
 * 解析完整的缓存key，识别其类型和相关数据
 * @param {string} fullKey 完整的缓存key
 * @returns {Object|null} 解析结果，包含类型和相关数据，无法识别时返回null
 */
export const parseCacheKey = (fullKey) => {
  if (!fullKey || typeof fullKey !== 'string') {
    return null
  }

  // 解析页面内容缓存键
  if (fullKey.startsWith(CACHE_KEY_PREFIX.PAGE_CONTENT)) {
    // 匹配 slice 类型: page_content_{id}_slice_{slice}
    const sliceRegex = /^page_content_([a-zA-Z0-9\-_]+)_slice_(\d+)$/
    const sliceMatch = fullKey.match(sliceRegex)
    if (sliceMatch) {
      return {
        type: 'PAGE_CONTENT',
        id: sliceMatch[1],
        slice: parseInt(sliceMatch[2]),
        fullKey
      }
    }
    
    // 匹配 full 类型: page_content_{id}_full
    const fullRegex = /^page_content_([a-zA-Z0-9\-_]+)_full$/
    const fullMatch = fullKey.match(fullRegex)
    if (fullMatch) {
      return {
        type: 'PAGE_CONTENT',
        id: fullMatch[1],
        slice: null,
        fullKey
      }
    }
  }

  // 解析页面块缓存键: page_block_{id}
  if (fullKey.startsWith(CACHE_KEY_PREFIX.PAGE_BLOCK)) {
    const regex = /^page_block_([a-zA-Z0-9\-_]+)$/
    const match = fullKey.match(regex)
    if (match) {
      return {
        type: 'PAGE_BLOCK',
        id: match[1],
        fullKey
      }
    }
  }

  // 解析站点数据缓存键: site_data_{pageId}
  if (fullKey.startsWith(CACHE_KEY_PREFIX.SITE_DATA)) {
    const regex = /^site_data_([a-zA-Z0-9\-_]+)$/
    const match = fullKey.match(regex)
    if (match) {
      return {
        type: 'SITE_DATA',
        pageId: match[1],
        fullKey
      }
    }
  }

  // 解析AI摘要缓存键: ai_summary_{postId}
  if (fullKey.startsWith(CACHE_KEY_PREFIX.AI_SUMMARY)) {
    const regex = /^ai_summary_([a-zA-Z0-9\-_]+)$/
    const match = fullKey.match(regex)
    if (match) {
      return {
        type: 'AI_SUMMARY',
        postId: match[1],
        fullKey
      }
    }
  }

  // 无法识别的缓存键
  return null
}
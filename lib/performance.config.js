/**
 * 性能优化配置文件
 * 用于集中管理各种性能优化参数
 */

const PERFORMANCE_CONFIG = {
  // 数据传输优化
  DATA_OPTIMIZATION: {
    // 是否启用页面数据优化（移除不必要字段）
    ENABLE_PAGE_DATA_OPTIMIZATION: true,
    
    // 推荐文章最大数量
    MAX_RECOMMEND_POSTS: 6,
    
    // 上一篇/下一篇文章保留的字段
    PREV_NEXT_FIELDS: ['id', 'title', 'slug', 'prefix', 'href', 'pageCoverThumbnail'],
    
    // 推荐文章保留的字段
    RECOMMEND_POST_FIELDS: [
      'id', 'title', 'slug', 'prefix', 'href', 'summary', 'pageCoverThumbnail', 
      'publishDay', 'category'
    ],
    
    // 页面列表保留的核心字段
    PAGE_LIST_FIELDS: [
      'id', 'title', 'slug', 'prefix', 'href', 'type', 'status', 'category', 'summary',
      'publishDate', 'publishDay', 'lastEditedDate', 'lastEditedDay',
      'pageCover', 'pageCoverThumbnail', 'pageIcon', 'tagItems', 'date',
      'fullWidth', 'password', 'ext'
    ]
  },
  
  // 预览内容优化
  PREVIEW_OPTIMIZATION: {
    // 首页最大预览文章数量
    INDEX_MAX_PREVIEW_POSTS: 3,
    
    // 分页页面最大预览文章数量
    PAGE_MAX_PREVIEW_POSTS: 4,
    
    // 首页预览内容最大行数
    INDEX_MAX_PREVIEW_LINES: 4,
    
    // 分页页面预览内容最大行数
    PAGE_MAX_PREVIEW_LINES: 5
  },
  
  // 缓存优化
  CACHE_OPTIMIZATION: {
    // 是否启用智能缓存
    ENABLE_SMART_CACHE: true,
    
    // 缓存过期时间（秒）
    CACHE_EXPIRE_TIME: 3600
  },
  
  // 压缩优化
  COMPRESSION: {
    // 启用 gzip 压缩的最小文件大小（字节）
    MIN_COMPRESS_SIZE: 1024,
    
    // 压缩级别 (1-9, 9为最高压缩率)
    COMPRESSION_LEVEL: 6
  }
}

/**
 * 获取性能配置
 * @param {string} category - 配置分类
 * @param {string} key - 配置键
 * @param {*} defaultValue - 默认值
 * @returns {*} 配置值
 */
export function getPerformanceConfig(category, key, defaultValue = null) {
  try {
    const categoryConfig = PERFORMANCE_CONFIG[category]
    if (!categoryConfig) {
      console.warn(`Performance config category '${category}' not found`)
      return defaultValue
    }
    
    return categoryConfig[key] !== undefined ? categoryConfig[key] : defaultValue
  } catch (error) {
    console.error('Error getting performance config:', error)
    return defaultValue
  }
}

/**
 * 检查是否启用数据优化
 * @returns {boolean}
 */
export function isDataOptimizationEnabled() {
  return getPerformanceConfig('DATA_OPTIMIZATION', 'ENABLE_PAGE_DATA_OPTIMIZATION', true)
}

/**
 * 获取预览优化配置
 * @param {string} pageType - 页面类型 ('index' | 'page')
 * @returns {object} 预览配置
 */
export function getPreviewConfig(pageType = 'page') {
  const isIndex = pageType === 'index'
  return {
    maxPosts: getPerformanceConfig(
      'PREVIEW_OPTIMIZATION', 
      isIndex ? 'INDEX_MAX_PREVIEW_POSTS' : 'PAGE_MAX_PREVIEW_POSTS',
      isIndex ? 6 : 5
    ),
    maxLines: getPerformanceConfig(
      'PREVIEW_OPTIMIZATION',
      isIndex ? 'INDEX_MAX_PREVIEW_LINES' : 'PAGE_MAX_PREVIEW_LINES', 
      isIndex ? 8 : 6
    )
  }
}

export default PERFORMANCE_CONFIG
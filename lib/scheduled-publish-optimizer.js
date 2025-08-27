/**
 * 定时发布功能优化器
 * 解决文章重复打印和性能问题
 */

// 动态导入性能监控模块（兼容 CommonJS 和 ES6）
let recordScheduledPublishCheck
try {
  if (typeof require !== 'undefined') {
    recordScheduledPublishCheck = require('./performance-monitor').recordScheduledPublishCheck
  } else {
    const performanceModule = await import('./performance-monitor')
    recordScheduledPublishCheck = performanceModule.recordScheduledPublishCheck
  }
} catch (error) {
  // 如果性能监控模块不可用，使用空函数
  recordScheduledPublishCheck = () => {}
}

// 全局状态管理
const scheduledPublishState = {
  lastCheckTime: 0,
  lastCheckResults: new Map(),
  checkInterval: 60000, // 1分钟内不重复检查
  processedArticles: new Set()
}

/**
 * 优化的时间范围检查函数
 * @param {string} publishDate - 发布日期
 * @param {string} archiveDate - 下架日期
 * @returns {boolean} 是否在有效期内
 */
function isInRange(publishDate, archiveDate) {
  const now = new Date()
  const currentTimestamp = now.getTime()
  
  // 发布时间检查
  if (publishDate) {
    const publishTimestamp = getTimestamp(publishDate)
    if (publishTimestamp > currentTimestamp) {
      return false // 还未到发布时间
    }
  }
  
  // 下架时间检查
  if (archiveDate) {
    const archiveTimestamp = getTimestamp(archiveDate)
    if (archiveTimestamp <= currentTimestamp) {
      return false // 已过下架时间
    }
  }
  
  return true
}

/**
 * 获取时间戳
 * @param {string} dateStr - 日期字符串
 * @returns {number} 时间戳
 */
function getTimestamp(dateStr) {
  if (!dateStr) return 0
  
  try {
    const date = new Date(dateStr)
    return date.getTime()
  } catch (error) {
    console.warn(`[定时发布] 无效的日期格式: ${dateStr}`)
    return 0
  }
}

/**
 * 生成文章唯一标识
 * @param {Object} post - 文章对象
 * @returns {string} 唯一标识
 */
function generatePostId(post) {
  return `${post.id || post.slug || post.title}_${post.publishDate || post.date}`
}

/**
 * 批量处理定时发布检查（优化版本）
 * @param {Array} allPages - 所有页面数据
 * @param {Object} options - 配置选项
 * @returns {Object} 处理结果
 */
export function optimizedScheduledPublishCheck(allPages, options = {}) {
  const {
    enableLogging = true,
    batchSize = 100,
    skipDuplicateCheck = false
  } = options
  
  const startTime = Date.now()
  const currentTime = Date.now()
  
  // 防止短时间内重复检查
  if (!skipDuplicateCheck && 
      currentTime - scheduledPublishState.lastCheckTime < scheduledPublishState.checkInterval) {
    if (enableLogging) {
      console.log(`[定时发布] 跳过重复检查，距离上次检查仅 ${currentTime - scheduledPublishState.lastCheckTime}ms`)
    }
    return {
      processed: 0,
      hidden: 0,
      skipped: true,
      reason: 'duplicate_check_prevention'
    }
  }
  
  if (!Array.isArray(allPages)) {
    return {
      processed: 0,
      hidden: 0,
      error: 'Invalid allPages data'
    }
  }
  
  // 筛选需要检查的文章
  const postsToCheck = allPages.filter(post => 
    post?.type === 'Post' && post?.status === 'Published'
  )
  
  if (postsToCheck.length === 0) {
    return {
      processed: 0,
      hidden: 0,
      reason: 'no_posts_to_check'
    }
  }
  
  const hiddenPosts = []
  const processedIds = new Set()
  
  // 分批处理，避免一次性处理过多数据
  for (let i = 0; i < postsToCheck.length; i += batchSize) {
    const batch = postsToCheck.slice(i, i + batchSize)
    
    batch.forEach(post => {
      const postId = generatePostId(post)
      
      // 防止重复处理同一篇文章
      if (processedIds.has(postId)) {
        if (enableLogging && process.env.NODE_ENV === 'development') {
          console.warn(`[定时发布] 检测到重复文章: ${post.title} (${postId})`)
        }
        return
      }
      
      processedIds.add(postId)
      
      const publishDate = post?.publishDate || post?.date
      const archiveDate = post?.archiveDate
      
      if (!isInRange(publishDate, archiveDate)) {
        post.status = 'Invisible'
        hiddenPosts.push({
          id: postId,
          title: post.title,
          publishDate,
          archiveDate,
          slug: post.slug,
          reason: publishDate && getTimestamp(publishDate) > currentTime 
            ? 'not_published_yet' 
            : 'archived'
        })
      }
    })
  }
  
  const duration = Date.now() - startTime
  
  // 更新全局状态
  scheduledPublishState.lastCheckTime = currentTime
  scheduledPublishState.lastCheckResults.set(currentTime, {
    processed: postsToCheck.length,
    hidden: hiddenPosts.length,
    duration
  })
  
  // 记录性能数据
  recordScheduledPublishCheck(postsToCheck.length, hiddenPosts.length, duration)
  
  // 输出优化的日志
  if (enableLogging && hiddenPosts.length > 0) {
    console.log(`[定时发布] 处理完成: 检查 ${postsToCheck.length} 篇文章，隐藏 ${hiddenPosts.length} 篇，耗时 ${duration}ms`)
    
    // 开发环境下显示详细信息
    if (process.env.NODE_ENV === 'development') {
      const groupedByReason = hiddenPosts.reduce((acc, post) => {
        acc[post.reason] = acc[post.reason] || []
        acc[post.reason].push(post)
        return acc
      }, {})
      
      Object.entries(groupedByReason).forEach(([reason, posts]) => {
        const reasonText = reason === 'not_published_yet' ? '未到发布时间' : '已过下架时间'
        console.log(`  ${reasonText}: ${posts.length} 篇`)
        posts.slice(0, 3).forEach(post => {
          console.log(`    - ${post.title} (${post.slug})`)
        })
        if (posts.length > 3) {
          console.log(`    ... 还有 ${posts.length - 3} 篇`)
        }
      })
    }
  }
  
  return {
    processed: postsToCheck.length,
    hidden: hiddenPosts.length,
    duration,
    hiddenPosts: process.env.NODE_ENV === 'development' ? hiddenPosts : [],
    duplicatesDetected: processedIds.size !== postsToCheck.length
  }
}

/**
 * 清理历史检查结果（防止内存泄漏）
 */
function cleanupCheckHistory() {
  const now = Date.now()
  const maxAge = 10 * 60 * 1000 // 10分钟
  
  for (const [timestamp] of scheduledPublishState.lastCheckResults.entries()) {
    if (now - timestamp > maxAge) {
      scheduledPublishState.lastCheckResults.delete(timestamp)
    }
  }
}

/**
 * 获取定时发布统计信息
 * @returns {Object} 统计信息
 */
export function getScheduledPublishStats() {
  cleanupCheckHistory()
  
  const recentChecks = Array.from(scheduledPublishState.lastCheckResults.values())
  const totalChecks = recentChecks.length
  
  if (totalChecks === 0) {
    return {
      totalChecks: 0,
      avgDuration: 0,
      totalHidden: 0,
      avgHidden: 0
    }
  }
  
  const totalDuration = recentChecks.reduce((sum, check) => sum + check.duration, 0)
  const totalHidden = recentChecks.reduce((sum, check) => sum + check.hidden, 0)
  
  return {
    totalChecks,
    avgDuration: Math.round(totalDuration / totalChecks),
    totalHidden,
    avgHidden: Math.round(totalHidden / totalChecks),
    lastCheckTime: scheduledPublishState.lastCheckTime,
    checkInterval: scheduledPublishState.checkInterval
  }
}

/**
 * 重置定时发布状态
 */
export function resetScheduledPublishState() {
  scheduledPublishState.lastCheckTime = 0
  scheduledPublishState.lastCheckResults.clear()
  scheduledPublishState.processedArticles.clear()
  console.log('[定时发布] 状态已重置')
}

/**
 * 设置检查间隔
 * @param {number} interval - 间隔时间（毫秒）
 */
export function setCheckInterval(interval) {
  scheduledPublishState.checkInterval = Math.max(interval, 10000) // 最小10秒
  console.log(`[定时发布] 检查间隔设置为 ${scheduledPublishState.checkInterval}ms`)
}

/**
 * 强制执行定时发布检查（忽略间隔限制）
 * @param {Array} allPages - 所有页面数据
 * @param {Object} options - 配置选项
 * @returns {Object} 处理结果
 */
export function forceScheduledPublishCheck(allPages, options = {}) {
  return optimizedScheduledPublishCheck(allPages, {
    ...options,
    skipDuplicateCheck: true
  })
}

// 定期清理历史数据
if (typeof setInterval !== 'undefined') {
  setInterval(cleanupCheckHistory, 5 * 60 * 1000) // 每5分钟清理一次
}

// 导出工具函数
export { isInRange, getTimestamp }
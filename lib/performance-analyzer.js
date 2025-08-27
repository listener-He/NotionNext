/**
 * 性能分析和优化工具
 * 用于分析和修复NotionNext中的性能问题
 */

import { siteConfig } from '@/lib/config'

// 性能监控数据
const performanceMetrics = {
  dataFetchCalls: new Map(), // 记录数据获取调用
  scheduledPublishLogs: [], // 记录定时发布日志
  cacheHits: 0,
  cacheMisses: 0
}

/**
 * 记录数据获取调用
 * @param {string} from - 调用来源
 * @param {string} type - 调用类型 (getGlobalData, getSiteDataByPageId)
 * @param {number} timestamp - 时间戳
 */
export function recordDataFetch(from, type, timestamp = Date.now()) {
  const key = `${type}-${from}`
  if (!performanceMetrics.dataFetchCalls.has(key)) {
    performanceMetrics.dataFetchCalls.set(key, [])
  }
  performanceMetrics.dataFetchCalls.get(key).push(timestamp)
}

/**
 * 分析重复调用
 * @param {number} timeWindow - 时间窗口（毫秒）
 * @returns {Object} 分析结果
 */
export function analyzeDuplicateCalls(timeWindow = 5000) {
  const duplicates = []
  
  for (const [key, timestamps] of performanceMetrics.dataFetchCalls) {
    if (timestamps.length > 1) {
      // 检查是否在时间窗口内有重复调用
      for (let i = 1; i < timestamps.length; i++) {
        if (timestamps[i] - timestamps[i-1] < timeWindow) {
          duplicates.push({
            key,
            count: timestamps.length,
            timeSpan: timestamps[timestamps.length-1] - timestamps[0],
            timestamps
          })
          break
        }
      }
    }
  }
  
  return {
    totalCalls: Array.from(performanceMetrics.dataFetchCalls.values()).reduce((sum, arr) => sum + arr.length, 0),
    duplicateGroups: duplicates.length,
    duplicates
  }
}

/**
 * 优化的定时发布检查函数
 * 减少不必要的日志输出，批量处理
 * @param {Array} allPages - 所有页面
 * @param {Object} NOTION_CONFIG - 配置
 * @returns {Object} 处理结果
 */
export function optimizedSchedulePublishCheck(allPages, NOTION_CONFIG) {
  const POST_SCHEDULE_PUBLISH = siteConfig(
    'POST_SCHEDULE_PUBLISH',
    null,
    NOTION_CONFIG
  )
  
  if (!POST_SCHEDULE_PUBLISH || !Array.isArray(allPages)) {
    return { processedCount: 0, hiddenCount: 0 }
  }

  let processedCount = 0
  let hiddenCount = 0
  const hiddenPosts = []
  const currentTimestamp = Date.now()

  // 批量处理，减少重复的时间戳计算
  allPages.forEach(p => {
    if (!p || !p.date) return
    
    processedCount++
    const publish = isInRange(p.title, p.date)
    
    if (!publish) {
      const startTimestamp = getTimestamp(
        p.date.start_date,
        p.date.start_time || '00:00',
        p.date.time_zone
      )
      const endTimestamp = getTimestamp(
        p.date.end_date,
        p.date.end_time || '23:59',
        p.date.time_zone
      )
      
      // 收集隐藏的文章信息，而不是立即打印
      hiddenPosts.push({
        title: p.title,
        currentTimestamp,
        startTimestamp,
        endTimestamp
      })
      
      // 隐藏文章
      p.status = 'Invisible'
      hiddenCount++
    }
  })

  // 批量输出日志，减少I/O操作
  if (hiddenPosts.length > 0) {
    console.log(`[定时发布] 批量隐藏 ${hiddenPosts.length} 篇文章:`)
    
    // 只在开发环境或调试模式下输出详细信息
    if (process.env.NODE_ENV === 'development' || process.env.DEBUG_SCHEDULE) {
      hiddenPosts.forEach(post => {
        console.log(
          `  - ${post.title} (当前: ${post.currentTimestamp}, 目标: ${post.startTimestamp}-${post.endTimestamp})`
        )
      })
    }
  }

  return { processedCount, hiddenCount, hiddenPosts }
}

/**
 * 缓存优化的数据获取函数
 * 避免在同一个构建周期内重复获取相同数据
 * @param {string} key - 缓存键
 * @param {Function} dataFetcher - 数据获取函数
 * @param {...any} args - 参数
 * @returns {Promise} 数据
 */
const buildTimeCache = new Map()
const CACHE_TTL = 30000 // 30秒缓存时间

export async function getCachedData(key, dataFetcher, ...args) {
  const now = Date.now()
  const cached = buildTimeCache.get(key)
  
  // 检查缓存是否有效
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    performanceMetrics.cacheHits++
    return cached.data
  }
  
  // 获取新数据
  performanceMetrics.cacheMisses++
  const data = await dataFetcher(...args)
  
  // 存储到缓存
  buildTimeCache.set(key, {
    data,
    timestamp: now
  })
  
  return data
}

/**
 * 清理构建时缓存
 */
export function clearBuildTimeCache() {
  buildTimeCache.clear()
}

/**
 * 获取性能报告
 * @returns {Object} 性能报告
 */
export function getPerformanceReport() {
  return {
    dataFetchCalls: Object.fromEntries(performanceMetrics.dataFetchCalls),
    cacheStats: {
      hits: performanceMetrics.cacheHits,
      misses: performanceMetrics.cacheMisses,
      hitRate: performanceMetrics.cacheHits / (performanceMetrics.cacheHits + performanceMetrics.cacheMisses) || 0
    },
    buildTimeCacheSize: buildTimeCache.size,
    duplicateAnalysis: analyzeDuplicateCalls()
  }
}

// 导入必要的工具函数
function isInRange(title, date = {}) {
  const {
    start_date,
    start_time = '00:00',
    end_date,
    end_time = '23:59',
    time_zone = 'Asia/Shanghai'
  } = date

  const currentTimestamp = Date.now()
  const startTimestamp = getTimestamp(start_date, start_time, time_zone)
  const endTimestamp = getTimestamp(end_date, end_time, time_zone)

  if (startTimestamp && currentTimestamp < startTimestamp) {
    return false
  }

  if (endTimestamp && currentTimestamp > endTimestamp) {
    return false
  }

  return true
}

function getTimestamp(date, time = '00:00', time_zone) {
  if (!date) return null
  
  // 简化的时区处理
  const timeZoneOffsets = {
    'Asia/Shanghai': 8,
    'Asia/Tokyo': 9,
    'Europe/London': 0,
    'America/New_York': -5,
    'America/Los_Angeles': -8,
    'UTC': 0
  }
  
  const offsetHours = timeZoneOffsets[time_zone] || 8
  const localDate = new Date(`${date} ${time}:00`)
  
  if (isNaN(localDate.getTime())) {
    return null
  }
  
  return localDate.getTime() - offsetHours * 60 * 60 * 1000
}
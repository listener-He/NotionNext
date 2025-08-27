/**
 * 性能监控中间件
 * 用于监控和分析NotionNext的性能问题
 */

// 全局性能监控状态
const performanceMonitor = {
  enabled: process.env.NODE_ENV === 'development' || process.env.PERFORMANCE_MONITOR === 'true',
  startTime: Date.now(),
  metrics: {
    dataFetches: [],
    scheduledPublishChecks: [],
    cacheOperations: [],
    buildSteps: []
  },
  thresholds: {
    slowDataFetch: 2000, // 2秒
    excessiveScheduledLogs: 10, // 超过10条日志认为过多
    duplicateCallWindow: 5000 // 5秒内的重复调用
  }
}

/**
 * 记录数据获取性能
 * @param {string} source - 数据来源
 * @param {string} operation - 操作类型
 * @param {number} duration - 耗时（毫秒）
 * @param {Object} metadata - 额外元数据
 */
export function recordDataFetch(source, operation, duration, metadata = {}) {
  if (!performanceMonitor.enabled) return
  
  const record = {
    timestamp: Date.now(),
    source,
    operation,
    duration,
    metadata
  }
  
  performanceMonitor.metrics.dataFetches.push(record)
  
  // 检查是否为慢查询
  if (duration > performanceMonitor.thresholds.slowDataFetch) {
    console.warn(`[性能警告] 慢数据获取: ${source} - ${operation} 耗时 ${duration}ms`)
  }
  
  // 检查重复调用
  checkDuplicateCalls(source, operation)
}

/**
 * 记录定时发布检查
 * @param {number} totalPosts - 总文章数
 * @param {number} hiddenPosts - 隐藏文章数
 * @param {number} duration - 处理耗时
 */
export function recordScheduledPublishCheck(totalPosts, hiddenPosts, duration) {
  if (!performanceMonitor.enabled) return
  
  const record = {
    timestamp: Date.now(),
    totalPosts,
    hiddenPosts,
    duration
  }
  
  performanceMonitor.metrics.scheduledPublishChecks.push(record)
  
  // 检查是否处理了过多文章
  if (hiddenPosts > performanceMonitor.thresholds.excessiveScheduledLogs) {
    console.warn(`[性能提示] 定时发布检查隐藏了 ${hiddenPosts} 篇文章，建议检查时间配置`)
  }
}

/**
 * 记录缓存操作
 * @param {string} operation - 操作类型 (hit/miss/set)
 * @param {string} key - 缓存键
 * @param {number} size - 数据大小（字节）
 */
export function recordCacheOperation(operation, key, size = 0) {
  if (!performanceMonitor.enabled) return
  
  performanceMonitor.metrics.cacheOperations.push({
    timestamp: Date.now(),
    operation,
    key,
    size
  })
}

/**
 * 记录构建步骤
 * @param {string} step - 构建步骤名称
 * @param {string} status - 状态 (start/end)
 * @param {Object} metadata - 额外信息
 */
export function recordBuildStep(step, status, metadata = {}) {
  if (!performanceMonitor.enabled) return
  
  performanceMonitor.metrics.buildSteps.push({
    timestamp: Date.now(),
    step,
    status,
    metadata
  })
}

/**
 * 检查重复调用
 * @param {string} source - 数据来源
 * @param {string} operation - 操作类型
 */
function checkDuplicateCalls(source, operation) {
  const now = Date.now()
  const recentCalls = performanceMonitor.metrics.dataFetches.filter(
    record => 
      record.source === source && 
      record.operation === operation &&
      (now - record.timestamp) < performanceMonitor.thresholds.duplicateCallWindow
  )
  
  if (recentCalls.length > 2) {
    console.warn(
      `[性能警告] 检测到重复调用: ${source} - ${operation} 在 ${performanceMonitor.thresholds.duplicateCallWindow}ms 内调用了 ${recentCalls.length} 次`
    )
  }
}

/**
 * 生成性能报告
 * @returns {Object} 性能报告
 */
export function generatePerformanceReport() {
  if (!performanceMonitor.enabled) {
    return { message: '性能监控未启用' }
  }
  
  const now = Date.now()
  const totalTime = now - performanceMonitor.startTime
  
  // 数据获取分析
  const dataFetches = performanceMonitor.metrics.dataFetches
  const avgFetchTime = dataFetches.length > 0 
    ? dataFetches.reduce((sum, record) => sum + record.duration, 0) / dataFetches.length
    : 0
  
  const slowFetches = dataFetches.filter(
    record => record.duration > performanceMonitor.thresholds.slowDataFetch
  )
  
  // 缓存分析
  const cacheOps = performanceMonitor.metrics.cacheOperations
  const cacheHits = cacheOps.filter(op => op.operation === 'hit').length
  const cacheMisses = cacheOps.filter(op => op.operation === 'miss').length
  const cacheHitRate = (cacheHits + cacheMisses) > 0 
    ? (cacheHits / (cacheHits + cacheMisses) * 100).toFixed(2)
    : 0
  
  // 定时发布分析
  const scheduleChecks = performanceMonitor.metrics.scheduledPublishChecks
  const totalHiddenPosts = scheduleChecks.reduce((sum, record) => sum + record.hiddenPosts, 0)
  
  // 重复调用分析
  const duplicateCalls = analyzeDuplicatePatterns()
  
  return {
    summary: {
      totalTime: `${(totalTime / 1000).toFixed(2)}s`,
      dataFetchCount: dataFetches.length,
      avgFetchTime: `${avgFetchTime.toFixed(2)}ms`,
      slowFetchCount: slowFetches.length,
      cacheHitRate: `${cacheHitRate}%`,
      totalHiddenPosts
    },
    dataFetches: {
      total: dataFetches.length,
      average: `${avgFetchTime.toFixed(2)}ms`,
      slowest: dataFetches.length > 0 
        ? `${Math.max(...dataFetches.map(r => r.duration))}ms`
        : '0ms',
      slowFetches: slowFetches.map(record => ({
        source: record.source,
        operation: record.operation,
        duration: `${record.duration}ms`
      }))
    },
    cache: {
      hits: cacheHits,
      misses: cacheMisses,
      hitRate: `${cacheHitRate}%`,
      totalOperations: cacheOps.length
    },
    scheduledPublish: {
      totalChecks: scheduleChecks.length,
      totalHiddenPosts,
      avgHiddenPerCheck: scheduleChecks.length > 0 
        ? (totalHiddenPosts / scheduleChecks.length).toFixed(2)
        : 0
    },
    duplicateCalls,
    recommendations: generateRecommendations()
  }
}

/**
 * 分析重复调用模式
 * @returns {Object} 重复调用分析
 */
function analyzeDuplicatePatterns() {
  const callPatterns = {}
  
  performanceMonitor.metrics.dataFetches.forEach(record => {
    const key = `${record.source}-${record.operation}`
    if (!callPatterns[key]) {
      callPatterns[key] = []
    }
    callPatterns[key].push(record.timestamp)
  })
  
  const duplicates = []
  Object.entries(callPatterns).forEach(([key, timestamps]) => {
    if (timestamps.length > 1) {
      // 检查是否有在短时间内的重复调用
      for (let i = 1; i < timestamps.length; i++) {
        if (timestamps[i] - timestamps[i-1] < performanceMonitor.thresholds.duplicateCallWindow) {
          duplicates.push({
            pattern: key,
            count: timestamps.length,
            timeSpan: timestamps[timestamps.length-1] - timestamps[0]
          })
          break
        }
      }
    }
  })
  
  return {
    totalPatterns: Object.keys(callPatterns).length,
    duplicatePatterns: duplicates.length,
    duplicates
  }
}

/**
 * 生成优化建议
 * @returns {Array} 建议列表
 */
function generateRecommendations() {
  const recommendations = []
  
  const dataFetches = performanceMonitor.metrics.dataFetches
  const slowFetches = dataFetches.filter(
    record => record.duration > performanceMonitor.thresholds.slowDataFetch
  )
  
  if (slowFetches.length > 0) {
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: `发现 ${slowFetches.length} 个慢数据获取操作，建议优化数据查询或增加缓存`
    })
  }
  
  const cacheOps = performanceMonitor.metrics.cacheOperations
  const cacheHits = cacheOps.filter(op => op.operation === 'hit').length
  const cacheMisses = cacheOps.filter(op => op.operation === 'miss').length
  const cacheHitRate = (cacheHits + cacheMisses) > 0 
    ? (cacheHits / (cacheHits + cacheMisses))
    : 0
  
  if (cacheHitRate < 0.5 && cacheOps.length > 10) {
    recommendations.push({
      type: 'cache',
      priority: 'medium',
      message: `缓存命中率较低 (${(cacheHitRate * 100).toFixed(2)}%)，建议检查缓存策略`
    })
  }
  
  const duplicates = analyzeDuplicatePatterns()
  if (duplicates.duplicatePatterns > 0) {
    recommendations.push({
      type: 'optimization',
      priority: 'medium',
      message: `发现 ${duplicates.duplicatePatterns} 个重复调用模式，建议实现数据复用`
    })
  }
  
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'info',
      priority: 'low',
      message: '当前性能表现良好，无明显优化点'
    })
  }
  
  return recommendations
}

/**
 * 打印性能报告
 */
export function printPerformanceReport() {
  if (!performanceMonitor.enabled) return
  
  const report = generatePerformanceReport()
  
  console.log('\n' + '='.repeat(50))
  console.log('📊 NotionNext 性能监控报告')
  console.log('='.repeat(50))
  
  console.log('\n📈 总体概况:')
  Object.entries(report.summary).forEach(([key, value]) => {
    console.log(`  ${key}: ${value}`)
  })
  
  if (report.dataFetches.slowFetches.length > 0) {
    console.log('\n⚠️  慢查询:')
    report.dataFetches.slowFetches.forEach(fetch => {
      console.log(`  - ${fetch.source} (${fetch.operation}): ${fetch.duration}`)
    })
  }
  
  if (report.duplicateCalls.duplicates.length > 0) {
    console.log('\n🔄 重复调用:')
    report.duplicateCalls.duplicates.forEach(dup => {
      console.log(`  - ${dup.pattern}: ${dup.count} 次调用`)
    })
  }
  
  console.log('\n💡 优化建议:')
  report.recommendations.forEach(rec => {
    const icon = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
    console.log(`  ${icon} ${rec.message}`)
  })
  
  console.log('\n' + '='.repeat(50))
}

/**
 * 重置监控数据
 */
export function resetMonitor() {
  performanceMonitor.startTime = Date.now()
  performanceMonitor.metrics = {
    dataFetches: [],
    scheduledPublishChecks: [],
    cacheOperations: [],
    buildSteps: []
  }
}

/**
 * 启用/禁用性能监控
 * @param {boolean} enabled - 是否启用
 */
export function setMonitorEnabled(enabled) {
  performanceMonitor.enabled = enabled
}

// 在进程退出时打印报告
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    if (performanceMonitor.enabled && performanceMonitor.metrics.dataFetches.length > 0) {
      printPerformanceReport()
    }
  })
}
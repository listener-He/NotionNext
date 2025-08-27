/**
 * 优化的数据获取包装器
 * 用于减少重复的getGlobalData调用，提升构建性能
 */

import { getGlobalData as originalGetGlobalData } from '@/lib/db/getSiteData'

// 构建时缓存，避免同一构建周期内的重复调用
const buildCache = new Map()
const CACHE_TTL = 60000 // 1分钟缓存时间

// 性能监控
const performanceStats = {
  totalCalls: 0,
  cacheHits: 0,
  cacheMisses: 0,
  duplicateCalls: []
}

/**
 * 优化的getGlobalData函数
 * 在构建时期避免重复获取相同数据
 * @param {Object} params - 参数对象
 * @param {string} params.pageId - 页面ID
 * @param {string} params.from - 调用来源
 * @param {string} params.locale - 语言环境
 * @returns {Promise<Object>} 全局数据
 */
export async function getOptimizedGlobalData({ pageId, from, locale }) {
  performanceStats.totalCalls++
  
  // 生成缓存键，考虑所有影响数据的参数
  const cacheKey = `${pageId || 'default'}-${locale || 'default'}`
  const now = Date.now()
  
  // 检查构建时缓存
  const cached = buildCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    performanceStats.cacheHits++
    
    // 记录重复调用用于分析
    performanceStats.duplicateCalls.push({
      from,
      cacheKey,
      timestamp: now,
      cached: true
    })
    
    return cached.data
  }
  
  performanceStats.cacheMisses++
  
  // 获取新数据
  const data = await originalGetGlobalData({ pageId, from, locale })
  
  // 存储到构建时缓存
  buildCache.set(cacheKey, {
    data,
    timestamp: now
  })
  
  return data
}

/**
 * 获取轻量级的全局数据
 * 只包含路径生成所需的基本信息
 * @param {Object} params - 参数对象
 * @returns {Promise<Object>} 轻量级数据
 */
export async function getLightweightGlobalData({ pageId, from, locale }) {
  const cacheKey = `lightweight-${pageId || 'default'}-${locale || 'default'}`
  const now = Date.now()
  
  const cached = buildCache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL) {
    return cached.data
  }
  
  // 获取完整数据
  const fullData = await getOptimizedGlobalData({ pageId, from, locale })
  
  // 提取路径生成所需的最小数据集
  const lightweightData = {
    allPages: fullData.allPages?.map(page => ({
      id: page.id,
      slug: page.slug,
      type: page.type,
      status: page.status,
      category: page.category,
      publishDate: page.publishDate
    })) || [],
    categoryOptions: fullData.categoryOptions || [],
    tagOptions: fullData.tagOptions || [],
    NOTION_CONFIG: fullData.NOTION_CONFIG || {}
  }
  
  buildCache.set(cacheKey, {
    data: lightweightData,
    timestamp: now
  })
  
  return lightweightData
}

/**
 * 智能数据获取策略
 * 根据调用来源决定获取完整数据还是轻量级数据
 * @param {Object} params - 参数对象
 * @returns {Promise<Object>} 数据
 */
export async function getSmartGlobalData({ pageId, from, locale }) {
  // 路径生成阶段使用轻量级数据
  const pathGenerationSources = [
    'slug-paths',
    'category-paths', 
    'tag-paths',
    'archive-paths'
  ]
  
  if (pathGenerationSources.some(source => from?.includes(source))) {
    return await getLightweightGlobalData({ pageId, from, locale })
  }
  
  // 其他情况使用完整数据
  return await getOptimizedGlobalData({ pageId, from, locale })
}

/**
 * 清理构建缓存
 * 在构建完成后调用
 */
export function clearBuildCache() {
  buildCache.clear()
  
  // 重置性能统计
  performanceStats.totalCalls = 0
  performanceStats.cacheHits = 0
  performanceStats.cacheMisses = 0
  performanceStats.duplicateCalls = []
}

/**
 * 获取性能统计信息
 * @returns {Object} 性能统计
 */
export function getPerformanceStats() {
  const hitRate = performanceStats.totalCalls > 0 
    ? (performanceStats.cacheHits / performanceStats.totalCalls * 100).toFixed(2)
    : 0
    
  return {
    ...performanceStats,
    hitRate: `${hitRate}%`,
    cacheSize: buildCache.size,
    duplicateCallsCount: performanceStats.duplicateCalls.length
  }
}

/**
 * 分析重复调用模式
 * @returns {Object} 分析结果
 */
export function analyzeDuplicateCalls() {
  const callsBySource = {}
  const callsByKey = {}
  
  performanceStats.duplicateCalls.forEach(call => {
    // 按来源分组
    if (!callsBySource[call.from]) {
      callsBySource[call.from] = 0
    }
    callsBySource[call.from]++
    
    // 按缓存键分组
    if (!callsByKey[call.cacheKey]) {
      callsByKey[call.cacheKey] = []
    }
    callsByKey[call.cacheKey].push(call)
  })
  
  return {
    totalDuplicates: performanceStats.duplicateCalls.length,
    bySource: callsBySource,
    byKey: callsByKey,
    mostDuplicatedSource: Object.entries(callsBySource)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'none',
    recommendations: generateOptimizationRecommendations(callsBySource)
  }
}

/**
 * 生成优化建议
 * @param {Object} callsBySource - 按来源分组的调用统计
 * @returns {Array} 优化建议
 */
function generateOptimizationRecommendations(callsBySource) {
  const recommendations = []
  
  Object.entries(callsBySource).forEach(([source, count]) => {
    if (count > 5) {
      recommendations.push({
        source,
        count,
        suggestion: `考虑在 ${source} 中实现更精细的缓存策略或数据复用`
      })
    }
  })
  
  if (recommendations.length === 0) {
    recommendations.push({
      suggestion: '当前数据获取模式较为优化，无明显重复调用问题'
    })
  }
  
  return recommendations
}

// 在构建结束时自动清理缓存
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    const stats = getPerformanceStats()
    if (stats.totalCalls > 0) {
      console.log('\n[性能统计] 数据获取优化报告:')
      console.log(`  总调用次数: ${stats.totalCalls}`)
      console.log(`  缓存命中率: ${stats.hitRate}`)
      console.log(`  重复调用次数: ${stats.duplicateCallsCount}`)
      
      if (stats.duplicateCallsCount > 0) {
        const analysis = analyzeDuplicateCalls()
        console.log(`  最频繁重复调用来源: ${analysis.mostDuplicatedSource}`)
      }
    }
    clearBuildCache()
  })
}
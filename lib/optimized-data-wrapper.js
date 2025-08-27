/**
 * 优化的数据获取包装器
 * 用于减少重复的数据获取调用，提升性能
 */

import { getGlobalData } from './db/getSiteData'
import { recordDataFetch } from './performance-monitor'

// 内存缓存，用于同一请求周期内的数据复用
const requestCache = new Map()
const pendingRequests = new Map()

// 缓存清理定时器
let cacheCleanupTimer = null

/**
 * 生成缓存键
 * @param {Object} params - 参数对象
 * @returns {string} 缓存键
 */
function generateCacheKey(params) {
  return JSON.stringify(params)
}

/**
 * 清理过期缓存
 */
function cleanupCache() {
  const now = Date.now()
  const maxAge = 5 * 60 * 1000 // 5分钟
  
  for (const [key, data] of requestCache.entries()) {
    if (now - data.timestamp > maxAge) {
      requestCache.delete(key)
    }
  }
  
  // 如果缓存为空，清除定时器
  if (requestCache.size === 0 && cacheCleanupTimer) {
    clearInterval(cacheCleanupTimer)
    cacheCleanupTimer = null
  }
}

/**
 * 启动缓存清理定时器
 */
function startCacheCleanup() {
  if (!cacheCleanupTimer) {
    cacheCleanupTimer = setInterval(cleanupCache, 60000) // 每分钟清理一次
  }
}

/**
 * 优化的全局数据获取函数
 * 在同一请求周期内复用数据，避免重复获取
 * @param {Object} params - 参数对象
 * @returns {Promise} 数据
 */
export async function getOptimizedGlobalData(params) {
  const cacheKey = generateCacheKey(params)
  const startTime = Date.now()
  
  // 检查内存缓存
  if (requestCache.has(cacheKey)) {
    const cachedData = requestCache.get(cacheKey)
    const duration = Date.now() - startTime
    
    recordDataFetch('getOptimizedGlobalData', 'memory-hit', duration, {
      ...params,
      cached: true,
      cacheAge: Date.now() - cachedData.timestamp
    })
    
    return cachedData.data
  }
  
  // 检查是否有正在进行的相同请求
  if (pendingRequests.has(cacheKey)) {
    const duration = Date.now() - startTime
    
    recordDataFetch('getOptimizedGlobalData', 'pending-wait', duration, {
      ...params,
      deduped: true
    })
    
    return await pendingRequests.get(cacheKey)
  }
  
  // 创建新的数据获取请求
  const dataPromise = getGlobalData(params)
  pendingRequests.set(cacheKey, dataPromise)
  
  try {
    const data = await dataPromise
    const duration = Date.now() - startTime
    
    // 缓存结果
    requestCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
    
    // 启动缓存清理
    startCacheCleanup()
    
    recordDataFetch('getOptimizedGlobalData', 'fresh-fetch', duration, {
      ...params,
      postsCount: data?.allPages?.length || 0,
      cached: false
    })
    
    return data
    
  } finally {
    // 清理待处理请求
    pendingRequests.delete(cacheKey)
  }
}

/**
 * 轻量级数据获取（仅获取必要字段）
 * @param {Object} params - 参数对象
 * @param {Array} fields - 需要的字段列表
 * @returns {Promise} 精简的数据
 */
export async function getLightweightGlobalData(params, fields = []) {
  const fullData = await getOptimizedGlobalData(params)
  
  if (fields.length === 0) {
    return fullData
  }
  
  // 提取指定字段
  const lightweightData = {}
  fields.forEach(field => {
    if (fullData[field] !== undefined) {
      lightweightData[field] = fullData[field]
    }
  })
  
  return lightweightData
}

/**
 * 智能数据获取（根据上下文自动优化）
 * @param {Object} params - 参数对象
 * @param {Object} context - 上下文信息
 * @returns {Promise} 数据
 */
export async function getSmartGlobalData(params, context = {}) {
  const { page, component, operation } = context
  
  // 根据不同页面类型优化数据获取
  switch (page) {
    case 'index':
      // 首页需要完整数据
      return await getOptimizedGlobalData(params)
      
    case 'post':
      // 文章页面可能只需要基础数据
      return await getLightweightGlobalData(params, [
        'allPages', 'categories', 'tags', 'siteInfo'
      ])
      
    case 'category':
    case 'tag':
      // 分类/标签页面需要相关数据
      return await getLightweightGlobalData(params, [
        'allPages', 'categories', 'tags'
      ])
      
    case 'search':
      // 搜索页面只需要文章数据
      return await getLightweightGlobalData(params, ['allPages'])
      
    default:
      return await getOptimizedGlobalData(params)
  }
}

/**
 * 预热缓存（在构建时预先获取常用数据）
 * @param {Array} paramsList - 参数列表
 */
export async function warmupCache(paramsList) {
  console.log(`🔥 预热缓存: ${paramsList.length} 个数据集`)
  
  const promises = paramsList.map(async (params, index) => {
    try {
      await getOptimizedGlobalData(params)
      console.log(`✅ 预热完成 ${index + 1}/${paramsList.length}`)
    } catch (error) {
      console.warn(`⚠️  预热失败 ${index + 1}/${paramsList.length}:`, error.message)
    }
  })
  
  await Promise.all(promises)
  console.log('🎉 缓存预热完成')
}

/**
 * 清空所有缓存
 */
export function clearAllCache() {
  requestCache.clear()
  pendingRequests.clear()
  
  if (cacheCleanupTimer) {
    clearInterval(cacheCleanupTimer)
    cacheCleanupTimer = null
  }
  
  console.log('🧹 缓存已清空')
}

/**
 * 获取缓存统计信息
 * @returns {Object} 缓存统计
 */
export function getCacheStats() {
  return {
    cacheSize: requestCache.size,
    pendingRequests: pendingRequests.size,
    cacheKeys: Array.from(requestCache.keys()),
    oldestCache: requestCache.size > 0 
      ? Math.min(...Array.from(requestCache.values()).map(v => v.timestamp))
      : null
  }
}

/**
 * 批量数据获取（并行处理多个请求）
 * @param {Array} requestList - 请求列表
 * @returns {Promise<Array>} 结果数组
 */
export async function batchGetGlobalData(requestList) {
  const startTime = Date.now()
  
  try {
    const results = await Promise.all(
      requestList.map(request => getOptimizedGlobalData(request.params))
    )
    
    const duration = Date.now() - startTime
    recordDataFetch('batchGetGlobalData', 'batch', duration, {
      batchSize: requestList.length,
      totalPosts: results.reduce((sum, data) => sum + (data?.allPages?.length || 0), 0)
    })
    
    return results
    
  } catch (error) {
    const duration = Date.now() - startTime
    recordDataFetch('batchGetGlobalData', 'batch-error', duration, {
      batchSize: requestList.length,
      error: error.message
    })
    
    throw error
  }
}

// 在进程退出时清理缓存
if (typeof process !== 'undefined') {
  process.on('exit', clearAllCache)
  process.on('SIGINT', clearAllCache)
  process.on('SIGTERM', clearAllCache)
}
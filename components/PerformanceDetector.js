import { useEffect, useState } from 'react'

/**
 * 性能检测组件和相关函数
 * 用于检测当前设备的性能等级，以便根据设备能力调整页面功能
 *
 * 使用方式：
 * <pre>
 * 1. 在页面根组件中引入并使用该组件，例如在主题的LayoutBase组件中添加<PerformanceDetector />
 * 2. 在其他组件中通过getDevicePerformance函数获取设备性能等级：
 *    const { performanceLevel, isLowEndDevice } = getDevicePerformance()
 * 3. 根据性能等级决定是否启用资源密集型功能：
 *    const { isLowEndDevice } = getDevicePerformance()
 *    const shouldEnableAnimations = !isLowEndDevice
 * </pre>
 * 性能等级说明：
 * - 'low': 低端设备（核心数≤2或内存≤2GB或移动设备或小屏幕）
 * - 'normal': 中端设备（不满足low也不满足high条件的设备）
 * - 'high': 高端设备（核心数≥8且内存≥8GB）
 *
 * @returns {null} 不渲染任何实际元素
 */
const PerformanceDetector = () => {
  useEffect(() => {
    // 确保只在客户端执行
    if (typeof window !== 'undefined') {
      detectAndStorePerformance().catch(e => {
        console.warn('Failed to detect device performance:', e)
      })
    }
  }, [])

  return null
}

/**
 * 获取存储的性能数据
 * @returns {Object|null} 性能数据对象或null（如果不存在或已过期）
 */
function getStoredPerformance() {
  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem('device_performance')
    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored)
    const now = Date.now()

    // 检查数据是否过期（7天有效期）
    if (now - data.timestamp > 168 * 60 * 60 * 1000) {
      localStorage.removeItem('device_performance')
      return null;
    } else {
      return data;
    }
  } catch (e) {
    console.warn('Failed to parse stored performance data:', e)
    return null
  }
}

/**
 * 存储性能数据到localStorage
 * @param {Object} data - 性能数据对象
 */
function storePerformance(data) {
  if (typeof window === 'undefined') return

  try {
    const payload = {
      ...data,
      timestamp: Date.now()
    }
    localStorage.setItem('device_performance', JSON.stringify(payload))
  } catch (e) {
    console.warn('Failed to store performance data:', e)
  }
}

/**
 * 检测并存储设备性能信息
 */
async function detectAndStorePerformance() {
  if (typeof window === 'undefined') return

  // 如果已经有缓存且未过期，则不重新检测
  if (getStoredPerformance()) return

  try {
    const performanceInfo = await calculateDevicePerformance()
    storePerformance(performanceInfo)
  } catch (e) {
    console.warn('Failed to detect device performance:', e)
  }
}

/**
 * 综合计算设备性能评分
 * 考虑CPU核心数、内存、GPU能力、设备类型等多个因素
 *
 * @returns {Promise<Object>} 包含性能评分和等级的对象
 */
async function calculateDevicePerformance() {
  // 基础硬件信息
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 4
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  const isSmallScreen = typeof window !== 'undefined' ? window.innerWidth < 768 : false

  // CPU性能评分 (满分30分)
  let cpuScore = 0
  if (cores >= 8) cpuScore = 30
  else if (cores >= 4) cpuScore = 20
  else if (cores >= 2) cpuScore = 10
  else cpuScore = 5

  // 内存评分 (满分20分)
  let memoryScore = 0
  if (memory >= 8) memoryScore = 20
  else if (memory >= 4) memoryScore = 15
  else if (memory >= 2) memoryScore = 10
  else memoryScore = 5

  // 设备类型扣分
  let devicePenalty = 0
  if (isMobile) devicePenalty += 10
  if (isSmallScreen) devicePenalty += 5

  // GPU性能检测 (满分30分)
  let gpuScore = await detectGPUPerformance()

  // 网络状况评分 (满分20分)
  let networkScore = detectNetworkPerformance()

  // 计算总分 (满分100分)
  const totalScore = Math.max(0, cpuScore + memoryScore + gpuScore + networkScore - devicePenalty)

  // 根据总分确定性能等级
  let performanceLevel
  if (totalScore >= 80) performanceLevel = 'high'
  else if (totalScore >= 50) performanceLevel = 'normal'
  else performanceLevel = 'low'
  // 检查是否用户偏好减少动画
  if (performanceLevel !== 'low' && typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    performanceLevel = 'low'
  }

  return {
    performanceLevel: performanceLevel,
    score: totalScore,
    details: {
      cpu: { cores, score: cpuScore },
      memory: { gb: memory, score: memoryScore },
      gpu: { score: gpuScore },
      network: { score: networkScore },
      device: { isMobile, isSmallScreen, penalty: devicePenalty }
    }
  }
}

/**
 * 检测GPU性能
 * @returns {Promise<number>} GPU性能评分 (0-30分)
 */
async function detectGPUPerformance() {
  // 在服务端或不支持的环境中返回默认值
  if (typeof window === 'undefined' || !window.WebGLRenderingContext) {
    return 15 // 默认中等分数
  }

  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

    if (!gl) return 10 // 不支持WebGL，较低分数

    // 获取GPU信息
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
    let renderer = ''
    if (debugInfo) {
      renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
    }

    // 基于渲染器名称简单评分
    if (renderer.includes('Apple GPU') || renderer.includes('Intel Iris') || renderer.includes('GeForce') || renderer.includes('Radeon')) {
      return 30 // 高性能GPU
    } else if (renderer.includes('Intel HD Graphics') || renderer.includes('Mali')) {
      return 20 // 中等性能GPU
    } else if (renderer.includes('Adreno')) {
      return 15 // 移动端GPU
    } else {
      return 10 // 基础GPU
    }
  } catch (e) {
    console.warn('GPU detection failed:', e)
    return 15 // 默认中等分数
  }
}

/**
 * 检测网络性能
 * @returns {number} 网络性能评分 (0-20分)
 */
function detectNetworkPerformance() {
  if (typeof navigator === 'undefined') return 10

  // 基于网络信息API评分
  if (navigator.connection) {
    const { effectiveType, downlink } = navigator.connection
    switch (effectiveType) {
      case '4g':
        return downlink > 10 ? 20 : 15
      case '3g':
        return 10
      case '2g':
        return 5
      default:
        return 10
    }
  }

  return 10 // 默认分数
}

/**
 * 获取设备性能信息
 * 这是一个全局函数，可以在任何组件中使用
 *
 * @returns {Object} 包含性能等级和设备类型信息的对象
 * @property {string} performanceLevel - 设备性能等级 ('low' | 'normal' | 'high')
 * @property {boolean} isLowEndDevice - 是否为低端设备
 * @property {boolean} isHighEndDevice - 是否为高端设备
 * @property {number} score - 性能总分 (0-100)
 * @property {Object} details - 详细评分信息
 */
export function getDevicePerformance() {
  // 默认值
  const defaultInfo = {
    performanceLevel: 'normal',
    isLowEndDevice: false,
    isHighEndDevice: false,
    score: 50,
    details: null
  }

  // 在服务端渲染时返回默认值
  if (typeof window === 'undefined') {
    return defaultInfo
  }

  try {
    // 首先尝试从localStorage获取缓存数据
    const cached = getStoredPerformance()
    if (cached) {
      return {
        performanceLevel: cached.performanceLevel,
        isLowEndDevice: cached.performanceLevel === 'low',
        isHighEndDevice: cached.performanceLevel === 'high',
        score: cached.score,
        details: cached.details
      }
    }

    return defaultInfo
  } catch (e) {
    console.warn('Error getting device performance info:', e)
    return defaultInfo
  }
}

export default PerformanceDetector

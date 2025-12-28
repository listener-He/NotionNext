import { loadExternalResource } from '@/lib/utils'
import { getCDNResourceSync } from '@/lib/utils/cdn'
import { useEffect } from 'react'
import { getDevicePerformance } from '@/components/PerformanceDetector'
import { isMobile, isBrowser } from '@/lib/utils'
// import AOS from 'aos'

/**
 * 加载滚动动画
 * 改从外部CDN读取
 * https://michalsnik.github.io/aos/
 */
export default function AOSAnimation() {
  const { isLowEndDevice, performanceLevel } = getDevicePerformance()

  const initAOS = () => {
    // 确保只在浏览器环境中执行
    if (!isBrowser) {
      return
    }

    // 在低端设备上完全禁用AOS动画以提升性能
    if (isLowEndDevice) {
      console.log('Low-end device detected, AOS animation disabled for performance')
      return
    }

    // 在移动端设备上也禁用AOS动画以提升性能
    if (isMobile()) {
      console.log('Mobile device detected, AOS animation disabled for better performance')
      return
    }

    // 根据设备性能调整动画配置
    let aosConfig = {
      duration: 600,
      once: true,
      offset: 120,
      delay: 0,
      disable: isMobile(),
      throttleDelay: 99,
      debounceDelay: 50
    }

    // 高性能设备使用更丰富的动画效果
    if (performanceLevel === 'high') {
      aosConfig = {
        ...aosConfig,
        duration: 800,
        offset: 150,
        once: false // 高性能设备允许多次触发动画
      }
    }

    // 使用CDN资源优化工具获取合适的资源地址
    const aosJsUrl = getCDNResourceSync('https://unpkg.com/aos@3.0.0-beta.6/dist/aos.js')
    const aosCssUrl = getCDNResourceSync('https://unpkg.com/aos@3.0.0-beta.6/dist/aos.css')

    Promise.all([
      loadExternalResource(aosJsUrl, 'js'),
      loadExternalResource(aosCssUrl, 'css')
    ]).then(() => {
      if (window.AOS) {
        // 进一步优化AOS配置以提升性能
        window.AOS.init(aosConfig)
      }
    }).catch(error => {
      console.error('AOS资源加载失败:', error)
    })
  }

  useEffect(() => {
    initAOS()
  }, [])
}

import { loadExternalResource } from '@/lib/utils'
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

    // 根据是否启用中国大陆优化选择不同的资源地址
    const aosJsUrl = process.env.NEXT_PUBLIC_CHINA_OPTIMIZATION_ENABLED === 'true'
      ? (process.env.NEXT_PUBLIC_AOS_JS_MIRROR || '/js/aos.js')
      : '/js/aos.js'
      
    const aosCssUrl = process.env.NEXT_PUBLIC_CHINA_OPTIMIZATION_ENABLED === 'true'
      ? (process.env.NEXT_PUBLIC_AOS_CSS_MIRROR || '/css/aos.css')
      : '/css/aos.css'

    Promise.all([
      loadExternalResource(aosJsUrl, 'js'),
      loadExternalResource(aosCssUrl, 'css')
    ]).then(() => {
      if (window.AOS) {
        // 进一步优化AOS配置以提升性能
        window.AOS.init(aosConfig)
      }
    })
  }
  
  useEffect(() => {
    initAOS()
  }, [])
}

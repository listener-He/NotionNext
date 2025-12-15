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
  const { isLowEndDevice } = getDevicePerformance()
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
        window.AOS.init({
          duration: 300, // 进一步减少动画持续时间
          once: true, // 动画只执行一次
          offset: 100, // 减少触发偏移量
          delay: 0, // 移除延迟
          disable: isMobile(), // 使用更可靠的移动端检测方法
          throttleDelay: 150, // 节流延迟
          debounceDelay: 50 // 防抖延迟
        })
      }
    })
  }
  useEffect(() => {
    initAOS()
  }, [])
}
import { loadExternalResource } from '@/lib/utils'
import { getCDNResourceSync } from '@/lib/utils/cdn'
import { useEffect } from 'react'
import { getDevicePerformance } from '@/components/PerformanceDetector'
import { isMobile, isBrowser } from '@/lib/utils'
import { useState } from 'react'
// import AOS from 'aos'

/**
 * 加载滚动动画
 * 改从外部CDN读取
 * https://michalsnik.github.io/aos/
 */
export default function AOSAnimation() {
  const [isClient, setIsClient] = useState(false)
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

    // 统一使用相同的动画配置，避免服务端和客户端不一致
    const aosConfig = {
      duration: 600, // 统一使用600ms，避免服务端和客户端配置不一致
      once: true,
      offset: 120,
      delay: 0,
      disable: isMobile(),
      throttleDelay: 99,
      debounceDelay: 50
    }

    // 使用CDN资源优化工具获取合适的资源地址
    const aosJsUrl = getCDNResourceSync('https://unpkg.com/aos@3.0.0-beta.6/dist/aos.js')
    const aosCssUrl = getCDNResourceSync('https://unpkg.com/aos@3.0.0-beta.6/dist/aos.css')

    Promise.all([
      loadExternalResource(aosJsUrl, 'js'),
      loadExternalResource(aosCssUrl, 'css')
    ]).then(() => {
      if (window.AOS) {
        // 初始化AOS
        window.AOS.init(aosConfig)
        
        // 在初始化后，可以动态更新配置（如果需要的话）
        // 但为避免Hydration问题，我们保持初始配置一致
      }
    }).catch(error => {
      console.error('AOS资源加载失败:', error)
    })
  }

  useEffect(() => {
    setIsClient(true)
    initAOS()
  }, [])

  // 在客户端渲染时才返回内容，避免SSR/CSR不匹配
  if (!isClient) {
    return null
  }

  // 如果是低端设备或移动设备，不渲染任何内容
  if (isLowEndDevice || isMobile()) {
    return null
  }

  return <></>
}
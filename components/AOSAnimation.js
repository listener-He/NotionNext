import { loadExternalResource } from '@/lib/utils'
import { useEffect } from 'react'
import { getDevicePerformance } from '@/components/PerformanceDetector'
// import AOS from 'aos'

/**
 * 加载滚动动画
 * 改从外部CDN读取
 * https://michalsnik.github.io/aos/
 */
export default function AOSAnimation() {
  const { isLowEndDevice } = getDevicePerformance()
  const initAOS = () => {
    if (isLowEndDevice) {
      console.log('Low-end device detected, AOS animation disabled for performance')
      return
    }

    if (isLowEndDevice) {
      // 在低端设备上禁用AOS动画以提升性能
      console.log('Low-end device detected, AOS animation disabled for performance')
      return
    }

    Promise.all([
      loadExternalResource('/js/aos.js', 'js'),
      loadExternalResource('/css/aos.css', 'css')
    ]).then(() => {
      if (window.AOS) {
        // 优化AOS配置以提升性能
        window.AOS.init({
          duration: 400, // 减少动画持续时间
          once: true, // 动画只执行一次
          offset: 100, // 减少触发偏移量
          delay: 0, // 移除延迟
          disable: window.innerWidth < 768 // 在移动端禁用
        })
      }
    })
  }
  useEffect(() => {
    initAOS()
  }, [])
}

import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import { getDevicePerformance } from '@/components/PerformanceDetector'

const StarrySky = () => {
  const { isLowEndDevice, performanceLevel } = getDevicePerformance();

  useEffect(() => {
    // 在低端设备或性能较差的设备上禁用星空动画
    if (isLowEndDevice || performanceLevel === 'low') {
      return;
    }

    // 使用 requestIdleCallback 延迟加载动画，避免阻塞主线程
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loadExternalResource('/js/starrySky.js', 'js').then(url => {
          window.renderStarrySky && window.renderStarrySky()
        })
      }, { timeout: 1000 })
    } else {
      // 兼容不支持 requestIdleCallback 的浏览器
      setTimeout(() => {
        loadExternalResource('/js/starrySky.js', 'js').then(url => {
          window.renderStarrySky && window.renderStarrySky()
        })
      }, 100)
    }
  }, [isLowEndDevice, performanceLevel])

  return (
    <></>
  )
}

export default StarrySky

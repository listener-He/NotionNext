/* eslint-disable */
import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import {getDevicePerformance} from '@/components/PerformanceDetector'
import { useGlobal } from '@/lib/global'

const Sakura = () => {
  const { isLowEndDevice} = getDevicePerformance();
  const { isDarkMode } = useGlobal()
  useEffect(() => {
    // 在低端设备或黑夜模式上禁用樱花动画
    if (isLowEndDevice || isDarkMode) {
      return;
    }
    loadExternalResource('/js/sakura.js', 'js').then(url => {
        window.createSakura && window.createSakura()
    })
    return () => window.destroySakura && window.destroySakura()
  }, [isLowEndDevice, isDarkMode])
  return <></>
}

export default Sakura

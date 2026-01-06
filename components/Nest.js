import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import { getDevicePerformance } from '@/components/PerformanceDetector'

const Nest = () => {
  const { isLowEndDevice } = getDevicePerformance()
  
  useEffect(() => {
    // 在低端设备上不加载连接点特效
    if (isLowEndDevice) {
      return
    }
    
    loadExternalResource('/js/nest.js', 'js').then(url => {
      window.createNest && window.createNest()
    })
    return () => window.destroyNest && window.destroyNest()
  }, [isLowEndDevice])
  
  // 在低端设备上不渲染组件
  if (isLowEndDevice) {
    return <></>
  }
  
  return <></>
}

export default Nest

import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import {getDevicePerformance} from '@/components/PerformanceDetector'

const StarrySky = () => {
  const { isLowEndDevice} = getDevicePerformance();

  useEffect(() => {
    if (!isLowEndDevice) {
      loadExternalResource('/js/starrySky.js', 'js').then(url => {
        window.renderStarrySky && window.renderStarrySky()
      })
    }
  }, [isLowEndDevice])

  return (
    <></>
  )
}

export default StarrySky
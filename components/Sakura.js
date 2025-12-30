/* eslint-disable */
import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import {getDevicePerformance} from '@/components/PerformanceDetector'

const Sakura = () => {
  const { isLowEndDevice} = getDevicePerformance();
  useEffect(() => {
    if (isLowEndDevice) {
      return;
    }
    loadExternalResource('/js/sakura.js', 'js').then(url => {
        window.createSakura && window.createSakura()
    })
    return () => window.destroySakura && window.destroySakura()
  }, [isLowEndDevice])
  return <></>
}

export default Sakura

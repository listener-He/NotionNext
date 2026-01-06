import { useEffect } from 'react'
// import anime from 'animejs'
import { siteConfig } from '@/lib/config'
import { loadExternalResource } from '@/lib/utils'
import { getDevicePerformance } from '@/components/PerformanceDetector'

/**
 * 鼠标跟随特效
 * @returns
 */
const MOUSE_FOLLOW = () => {
  const type = siteConfig('MOUSE_FOLLOW_EFFECT_TYPE')
  const color = siteConfig('MOUSE_FOLLOW_EFFECT_COLOR')
  const { isLowEndDevice } = getDevicePerformance()

  useEffect(() => {
    // 在低端设备上不加载鼠标跟随特效
    if (isLowEndDevice) {
      return
    }
    
    loadExternalResource('/js/mouse-follow.js', 'js').then(url => {
      window.createMouseCanvas && window.createMouseCanvas()({ type, color })
    })

    return () => {
      // 在组件卸载时清理资源
      const mouseFollowElement = document.getElementById('vixcityCanvas')
      mouseFollowElement?.parentNode?.removeChild(mouseFollowElement)
    }
  }, [type, color, isLowEndDevice])

  return (
    <>
      <style global jsx>
        {`
          @media (max-width: 600px) {
            #vixcityCanvas {
              display: none;
            }
          }
        `}
      </style>
    </>
  )
}
export default MOUSE_FOLLOW
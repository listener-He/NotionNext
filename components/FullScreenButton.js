import { isBrowser } from '@/lib/utils'
import React, { useEffect, useState, useCallback } from 'react'

/**
 * 全屏按钮
 * @returns
 */
const FullScreenButton = () => {
  const [isFullScreen, setIsFullScreen] = useState(false)

  // 统一处理全屏状态变化（包括 ESC 键、API 调用等）
  const updateFullScreenState = useCallback(() => {
    if (!isBrowser) return
    const isFull = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    )
    setIsFullScreen(isFull)
  }, [])

  useEffect(() => {
    if (!isBrowser) return

    // 监听所有浏览器的全屏变化事件
    const events = [
      'fullscreenchange',
      'webkitfullscreenchange',
      'mozfullscreenchange',
      'MSFullscreenChange'
    ]

    events.forEach(event => document.addEventListener(event, updateFullScreenState))

    // 清理监听器
    return () => {
      events.forEach(event => document.removeEventListener(event, updateFullScreenState))
    }
  }, [updateFullScreenState])

  const handleFullScreenClick = () => {
    if (!isBrowser) return

    const element = document.documentElement
    
    // 如果当前已经是全屏状态，则执行退出全屏
    if (isFullScreen) {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen()
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen()
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen()
      }
    } else {
      // 否则进入全屏
      if (element.requestFullscreen) {
        element.requestFullscreen()
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen()
      } else if (element.mozRequestFullScreen) {
        element.mozRequestFullScreen()
      } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen()
      }
    }
  }

  return (
    <div className="flex justify-end px-5 max-w-2xl lg:max-w-full mx-auto mt-2">
      <button
        onClick={handleFullScreenClick}
        aria-label={isFullScreen ? '退出全屏' : '全屏阅读'}
        className='p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 text-gray-500 dark:text-gray-400 flex items-center gap-2 text-sm'
      >
        <i className={`${isFullScreen ? 'fas fa-compress' : 'fas fa-expand'}`} />
        <span>{isFullScreen ? '退出全屏' : '全屏阅读'}</span>
      </button>
    </div>
  )
}

export default FullScreenButton

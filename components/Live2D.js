/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { useEffect, useState, useCallback } from 'react'
import { getDevicePerformance } from '@/components/PerformanceDetector'

/**
 * 网页动画
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme, isDarkMode } = useGlobal()
  const [currentModel, setCurrentModel] = useState('')
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petLinkDuring = siteConfig('WIDGET_PET_LINK_DURING')
  const petLinkNight = siteConfig('WIDGET_PET_LINK_NIGHT')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')

  // 获取设备性能信息
  const { isLowEndDevice } = getDevicePerformance()

  // 获取当前应使用的模型链接
  const getCurrentModelLink = useCallback(() => {
    // 直接使用isDarkMode状态而不是getCurrentThemeMode函数
    if (isDarkMode && petLinkNight) {
      return petLinkNight
    } else if (!isDarkMode && petLinkDuring) {
      return petLinkDuring
    }
    
    return petLink
  }, [petLink, petLinkDuring, petLinkNight, isDarkMode])

  // 加载Live2D模型
  const loadLive2D = useCallback((modelUrl) => {
    if (typeof window !== 'undefined' && window.loadlive2d && modelUrl) {
      window.loadlive2d('live2d', modelUrl)
    }
  }, [])

  // 监听主题变化并切换模型
  useEffect(() => {
    const newModelLink = getCurrentModelLink()
    if (newModelLink !== currentModel) {
      console.log(`Live2D: Switching model to ${isDarkMode ? 'night' : 'day'} mode`, newModelLink)
      setCurrentModel(newModelLink)
      if (newModelLink) {
        loadLive2D(newModelLink)
      }
    }
  }, [isDarkMode, getCurrentModelLink, currentModel, loadLive2D])

  useEffect(() => {
    // 在低端设备上不加载Live2D组件
    if (isLowEndDevice) {
      console.log('Live2D: Skipping load on low-end device')
      return
    }

    if (showPet && !isMobile()) {
      // 延迟加载Live2D资源，避免阻塞主进程
      const loadTimer = setTimeout(() => {
        Promise.all([
          loadExternalResource(
            'https://cdn.jsdmirror.com/gh/stevenjoezhang/live2d-widget@latest/live2d.min.js',
            'js'
          )
        ]).then(e => {
          if (typeof window?.loadlive2d !== 'undefined') {
            // https://github.com/xiazeyu/live2d-widget-models
            try {
              const initialModel = getCurrentModelLink()
              setCurrentModel(initialModel)
              if (initialModel) {
                loadLive2D(initialModel)
              }
            } catch (error) {
              console.error('读取PET模型', error)
            }
          }
        })
      }, 3000) // 延迟3秒加载

      // 清理函数
      return () => clearTimeout(loadTimer)
    }
  }, [showPet, isLowEndDevice, loadLive2D, getCurrentModelLink])

  function handleClick() {
    if (petSwitchTheme) {
      switchTheme()
    }
  }

  // 在低端设备上不渲染Live2D组件
  if (!showPet || isLowEndDevice) {
    return <></>
  }

  return (
    <canvas
      id='live2d'
      width='280'
      height='250'
      onClick={handleClick}
      className='cursor-grab'
      onMouseDown={e => e.target.classList.add('cursor-grabbing')}
      onMouseUp={e => e.target.classList.remove('cursor-grabbing')}
      // 添加防止错误的属性
      data-model={currentModel}
    />
  )
}

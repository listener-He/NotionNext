/* eslint-disable no-undef */
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isMobile, loadExternalResource } from '@/lib/utils'
import { getCurrentThemeMode } from '@/components/DarkModeAutoSwitch'
import { useEffect, useState, useCallback } from 'react'

/**
 * 网页动画
 * @returns
 */
export default function Live2D() {
  const { theme, switchTheme } = useGlobal()
  const [currentModel, setCurrentModel] = useState('')
  const showPet = JSON.parse(siteConfig('WIDGET_PET'))
  const petLink = siteConfig('WIDGET_PET_LINK')
  const petLinkDuring = siteConfig('WIDGET_PET_LINK_DURING')
  const petLinkNight = siteConfig('WIDGET_PET_LINK_NIGHT')
  const petSwitchTheme = siteConfig('WIDGET_PET_SWITCH_THEME')

  // 获取当前应使用的模型链接
  const getCurrentModelLink = useCallback(() => {
    const currentTheme = getCurrentThemeMode()
    
    if (currentTheme === 'dark' && petLinkNight) {
      return petLinkNight
    } else if (currentTheme === 'light' && petLinkDuring) {
      return petLinkDuring
    }
    
    return petLink
  }, [petLink, petLinkDuring, petLinkNight])

  // 加载Live2D模型
  const loadLive2D = useCallback((modelUrl) => {
    if (typeof window !== 'undefined' && window.loadlive2d) {
      window.loadlive2d('live2d', modelUrl)
    }
  }, [])

  // 监听主题变化并切换模型
  useEffect(() => {
    const newModelLink = getCurrentModelLink()
    if (newModelLink !== currentModel) {
      setCurrentModel(newModelLink)
      if (newModelLink) {
        loadLive2D(newModelLink)
      }
    }
  }, [theme, getCurrentModelLink, currentModel, loadLive2D])

  useEffect(() => {
    if (showPet && !isMobile()) {
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
            loadlive2d('live2d', initialModel)
          } catch (error) {
            console.error('读取PET模型', error)
          }
        }
      })
    }
  }, [])

  function handleClick() {
    if (petSwitchTheme) {
      switchTheme()
    }
  }

  if (!showPet) {
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
    />
  )
}

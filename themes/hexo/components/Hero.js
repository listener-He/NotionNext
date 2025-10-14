// import Image from 'next/image'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useState } from 'react'
import CONFIG from '../config'
import NavButtonGroup from './NavButtonGroup'
import {getDevicePerformance} from '@/components/PerformanceDetector'

let wrapperTop = 0

/**
 * 顶部全屏大图
 * @returns
 */
const Hero = props => {
  const [typed, changeType] = useState()
  const [enhancedStarryDestroy, setEnhancedStarryDestroy] = useState(null)
  const { siteInfo } = props
  const { locale, isDarkMode } = useGlobal()
  const scrollToWrapper = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: wrapperTop, behavior: 'smooth' })
    }
  }

  const GREETING_WORDS = siteConfig('GREETING_WORDS').split(',')
  // 添加状态来检测是否在客户端
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  useEffect(() => {
    updateHeaderHeight()

    if (!typed && window && window !== 'undefined' && document.getElementById('typed')) {
      loadExternalResource('/js/typed.min.js', 'js').then(() => {
        if (window.Typed) {
          changeType(
            new window.Typed('#typed', {
              strings: GREETING_WORDS,
              typeSpeed: 200,
              backSpeed: 100,
              backDelay: 400,
              showCursor: true,
              smartBackspace: true
            })
          )
        }
      })
    }


    // 优化：仅在高性能设备上加载星空背景
    const { isLowEndDevice } = getDevicePerformance()

    // 加载原有的星空背景
    if (!isLowEndDevice && isDarkMode && typeof window !== 'undefined') {
      loadExternalResource('/js/starrySky.js', 'js').then(() => {
        if (window.renderStarrySky) {
          window.renderStarrySky()
        }
      })
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateHeaderHeight)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateHeaderHeight)
      }
      // 组件卸载时清理增强版星空背景
      if (enhancedStarryDestroy && typeof window !== 'undefined') {
        enhancedStarryDestroy()
      }
    }
  }, [typed, enhancedStarryDestroy, GREETING_WORDS, isDarkMode])

  function updateHeaderHeight() {
    if (typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        const wrapperElement = document.getElementById('wrapper')
        wrapperTop = wrapperElement?.offsetTop
      })
    }
  }

  // 检查是否启用夜间模式下半屏效果
  const isHalfScreenDarkMode = siteConfig('HEXO_HOME_BANNER_HALF_SCREEN_DARK_MODE', true, CONFIG) && isDarkMode
  // 修复：始终使用全屏高度，但在夜间模式下半屏时调整内容位置
  const headerHeight = 'h-screen'
  const contentPosition = isHalfScreenDarkMode ? 'bottom-1/2' : 'bottom-0'
  const headerClass = `w-full ${headerHeight} relative bg-black`
  
  // 预先获取所有需要的配置值，确保Hooks调用顺序一致
  const showNavButtons = siteConfig('HEXO_HOME_NAV_BUTTONS', null, CONFIG)
  const showStartReading = siteConfig('HEXO_SHOW_START_READING', null, CONFIG)
  const backgroundFixed = siteConfig('HEXO_HOME_NAV_BACKGROUND_IMG_FIXED', null, CONFIG)
  const siteTitle = siteConfig('TITLE')

  // 只在客户端渲染时才显示需要浏览器API的元素
  if (!isClient) {
    return (
      <header
        id='header'
        style={{ zIndex: -1 , height: isHalfScreenDarkMode ? '35vh' : '100vh'}}
        className={headerClass}>
        <div className={`text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full ${contentPosition}`}>
          {/* 站点标题 */}
          <div className='font-black text-4xl md:text-5xl shadow-text'>
            {siteInfo?.title || siteTitle}
          </div>
          {/* 站点欢迎语 */}
          <div className='mt-2 h-12 items-center text-center font-medium shadow-text text-lg'>
            <span id='typed' />
          </div>

          {/* 首页导航大按钮 */}
          {showNavButtons && (
            <NavButtonGroup {...props} />
          )}
        </div>

        {siteInfo?.pageCover && (
          <LazyImage
            id='header-cover'
            alt={siteInfo?.title}
            src={siteInfo?.pageCover}
            className={`header-cover w-full ${headerHeight} object-cover object-center ${backgroundFixed ? 'fixed' : ''}`}
          />
        )}
      </header>
    )
  }

  return (
    <header
      id='header'
      style={{ zIndex: -1, height: isHalfScreenDarkMode ? '35vh' : '100vh'}}
      className={headerClass}>
      <div className={`text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full ${contentPosition}`}>
        {/* 站点标题 */}
        <div className='font-black text-4xl md:text-5xl shadow-text'>
          {siteInfo?.title || siteTitle}
        </div>
        {/* 站点欢迎语 */}
        <div className='mt-2 h-12 items-center text-center font-medium shadow-text text-lg'>
          <span id='typed' />
        </div>

        {/* 首页导航大按钮 */}
        {showNavButtons && (
          <NavButtonGroup {...props} />
        )}

        {/* 滚动按钮 */}
        {!isHalfScreenDarkMode && (
          <div
            onClick={scrollToWrapper}
            className='z-10 cursor-pointer w-full text-center py-4 text-3xl absolute bottom-10 text-white'>
            <div className='opacity-70 animate-bounce text-xs'>
              {showStartReading && locale.COMMON.START_READING}
            </div>
            <i className='opacity-70 animate-bounce fas fa-angle-down' />
          </div>
        )}
      </div>

      <LazyImage
        id='header-cover'
        alt={siteInfo?.title}
        src={siteInfo?.pageCover}
        className={`header-cover w-full  ${headerHeight} object-cover object-center ${backgroundFixed ? 'fixed' : ''}`}
      />
    </header>
  )
}

export default Hero

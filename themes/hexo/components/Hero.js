// import Image from 'next/image'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useState } from 'react'
import CONFIG from '../config'
import NavButtonGroup from './NavButtonGroup'
import Wave from './Wave'

let wrapperTop = 0

/**
 * 顶部全屏大图
 * @returns
 */
const Hero = props => {
  const [typed, changeType] = useState()
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

    // 在黑暗模式下不启用打字机效果
    if (isClient && !isDarkMode && !typed && window && window !== 'undefined') {
      loadExternalResource('/js/typed.min.js', 'js').then(() => {
        // 确保元素存在后再初始化Typed.js
        const typedElement = document.getElementById('typed')
        if (typedElement && window.Typed) {
          changeType(
            new window.Typed('#typed', {
              strings: GREETING_WORDS,
              typeSpeed: 200,
              backSpeed: 100,
              backDelay: 400,
              showCursor: true,
              smartBackspace: true,
              loop: siteConfig('TYPED_LOOP', true, CONFIG) // 添加循环播放配置
            })
          )
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
    }
  }, [typed, GREETING_WORDS, isDarkMode, isClient])

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
  const headerClass = `w-full ${headerHeight} relative bg-day-gradient dark:bg-night-gradient`

  // 预先获取所有需要的配置值，确保Hooks调用顺序一致
  const showNavButtons = siteConfig('HEXO_HOME_NAV_BUTTONS', null, CONFIG)
  const showStartReading = siteConfig('HEXO_SHOW_START_READING', null, CONFIG)
  const backgroundFixed = siteConfig('HEXO_HOME_NAV_BACKGROUND_IMG_FIXED', null, CONFIG)
  // const siteTitle = siteConfig('TITLE')

  // 只在客户端渲染时才显示需要浏览器API的元素
  if (!isClient) {
    return (
      <header
        id='header'
        style={{ height: isHalfScreenDarkMode ? '50vh' : '100vh'}}
        className={headerClass}>
        <div className={`text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full ${contentPosition} z-20`}>
          {/* 站点标题 */}
          {/*{!isHalfScreenDarkMode && (*/}
          {/*  <div className='font-light text-5xl md:text-6xl drop-shadow-md tracking-widest uppercase transition-all duration-500 font-serif'>*/}
          {/*    {siteInfo?.title || siteTitle}*/}
          {/*  </div>*/}
          {/*)}*/}

          {/* 站点欢迎语 - 仅在非黑暗模式下显示打字机效果 */}
          {!isHalfScreenDarkMode && (
            <div className='mt-6 h-12 items-center text-center font-bold text-3xl md:text-5xl tracking-widest drop-shadow-sm font-serif text-white'>
              <span id='typed' className="bg-clip-text text-transparent bg-gradient-to-r from-white to-cyan-400" />
            </div>
          )}

          {/* 首页导航大按钮 */}
          {showNavButtons && (
            <div className="mt-8">
              <NavButtonGroup {...props} />
            </div>
          )}
        </div>

        {siteInfo?.pageCover && (
          <LazyImage
            id='header-cover'
            alt={siteInfo?.title}
            src={siteInfo?.pageCover}
            className={`header-cover w-full ${headerHeight} object-cover object-center ${backgroundFixed ? 'fixed' : ''} dark:hidden brightness-90 z-10`}
          />
        )}

        {/* 白天模式下-波浪动画 */}
        {!isDarkMode && <Wave />}
      </header>
    )
  }

  return (
    <header
      id='header'
      style={{ height: isHalfScreenDarkMode ? '50vh' : '100vh'}}
      className={headerClass}>
      <div className={`text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full ${contentPosition} z-20`}>
        {/* 站点标题 */}
        {/*{!isHalfScreenDarkMode && (*/}
        {/*  <div className='font-light text-5xl md:text-6xl drop-shadow-md tracking-widest uppercase transition-all duration-500 font-serif'>*/}
        {/*    {siteInfo?.title || siteTitle}*/}
        {/*  </div>*/}
        {/*)}*/}

        {/* 站点欢迎语 - 仅在非黑暗模式下显示打字机效果 */}
        {!isHalfScreenDarkMode && (
          <div className='mt-6 h-12 items-center text-center font-medium text-2xl tracking-wider drop-shadow-sm font-serif italic text-white/90'>
            <span id='typed' />
          </div>
        )}

        {/* 首页导航大按钮 */}
        {showNavButtons && (
          <div className="mt-8">
             <NavButtonGroup {...props} />
          </div>
        )}

        {/* 滚动按钮 */}
        {!isHalfScreenDarkMode && (
          <div
            onClick={scrollToWrapper}
            className='z-30 cursor-pointer w-full text-center py-8 text-3xl absolute bottom-8 text-white opacity-80 hover:opacity-100 transition-opacity duration-300'>
            <div className='text-xs font-light tracking-widest mb-2 uppercase font-sans'>
              {showStartReading && locale.COMMON.START_READING}
            </div>
            <i className='fas fa-chevron-down animate-bounce' />
          </div>
        )}
      </div>

      <LazyImage
        id='header-cover'
        alt={siteInfo?.title}
        src={siteInfo?.pageCover}
        className={`header-cover w-full  ${headerHeight} object-cover object-center ${backgroundFixed ? 'fixed' : ''} dark:hidden brightness-90 z-10`}
      />

      {/* 波浪动画 */}
        <Wave />
    </header>
  )
}

export default Hero

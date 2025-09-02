// import Image from 'next/image'
import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useState } from 'react'
import CONFIG from '../config'
import NavButtonGroup from './NavButtonGroup'

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
    // window.scrollTo({ top: wrapperTop, behavior: 'smooth' })
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

    // 加载原有的星空背景
    if (isDarkMode && typeof window !== 'undefined') {
      loadExternalResource('/js/starrySky.js', 'js').then(() => {
        if (window.renderStarrySky) {
          window.renderStarrySky()
        }
      })
    }

    // 加载增强版星空背景
    if (isDarkMode && typeof window !== 'undefined' && !enhancedStarryDestroy) {
      loadExternalResource('/js/enhancedStarrySky.js', 'js').then(() => {
        if (window.createEnhancedStarrySky) {
          const destroyFn = window.createEnhancedStarrySky()
          setEnhancedStarryDestroy(() => destroyFn)
        }
      })
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', updateHeaderHeight)
    }
    // window.addEventListener('resize', updateHeaderHeight)
    return () => {
      // window.removeEventListener('resize', updateHeaderHeight)
      // // 组件卸载时清理增强版星空背景
      // if (enhancedStarryDestroy) {
      //   enhancedStarryDestroy()
      // }
      if (typeof window !== 'undefined') {
        window.removeEventListener('resize', updateHeaderHeight)
      }
      // 组件卸载时清理增强版星空背景
      if (enhancedStarryDestroy && typeof window !== 'undefined') {
        enhancedStarryDestroy()
      }
    }
  }, [typed, enhancedStarryDestroy])

  function updateHeaderHeight() {
    // requestAnimationFrame(() => {
    //   const wrapperElement = document.getElementById('wrapper')
    //   wrapperTop = wrapperElement?.offsetTop
    // })
    if (typeof window !== 'undefined' && typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => {
        const wrapperElement = document.getElementById('wrapper')
        wrapperTop = wrapperElement?.offsetTop
      })
    }
  }

// 只在客户端渲染时才显示需要浏览器API的元素
  if (!isClient) {
    return (
      <header
        id='header'
        style={{ zIndex: -1 }}
        className='w-full h-screen relative bg-black'>
        <div className='text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full '>
          {/* 站点标题 */}
          <div className='font-black text-4xl md:text-5xl shadow-text'>
            {siteInfo?.title || siteConfig('TITLE')}
          </div>
          {/* 站点欢迎语 */}
          <div className='mt-2 h-12 items-center text-center font-medium shadow-text text-lg'>
            <span id='typed' />
          </div>

          {/* 首页导航大按钮 */}
          {siteConfig('HEXO_HOME_NAV_BUTTONS', null, CONFIG) && (
            <NavButtonGroup {...props} />
          )}
        </div>

        {siteInfo?.pageCover && (
          <LazyImage
            id='header-cover'
            alt={siteInfo?.title}
            src={siteInfo?.pageCover}
            className={`header-cover w-full h-screen object-cover object-center ${siteConfig('HEXO_HOME_NAV_BACKGROUND_IMG_FIXED', null, CONFIG) ? 'fixed' : ''}`}
          />
        )}
      </header>
    )
  }

  return (
    <header
      id='header'
      style={{ zIndex: -1 }}
      className='w-full h-screen relative bg-black'>
      <div className='text-white absolute bottom-0 flex flex-col h-full items-center justify-center w-full '>
        {/* 站点标题 */}
        <div className='font-black text-4xl md:text-5xl shadow-text'>
          {siteInfo?.title || siteConfig('TITLE')}
        </div>
        {/* 站点欢迎语 */}
        <div className='mt-2 h-12 items-center text-center font-medium shadow-text text-lg'>
          <span id='typed' />
        </div>

        {/* 首页导航大按钮 */}
        {siteConfig('HEXO_HOME_NAV_BUTTONS', null, CONFIG) && (
          <NavButtonGroup {...props} />
        )}

        {/* 滚动按钮 */}
        <div
          onClick={scrollToWrapper}
          className='z-10 cursor-pointer w-full text-center py-4 text-3xl absolute bottom-10 text-white'>
          <div className='opacity-70 animate-bounce text-xs'>
            {siteConfig('HEXO_SHOW_START_READING', null, CONFIG) &&
              locale.COMMON.START_READING}
          </div>
          <i className='opacity-70 animate-bounce fas fa-angle-down' />
        </div>
      </div>

      <LazyImage
        id='header-cover'
        alt={siteInfo?.title}
        src={siteInfo?.pageCover}
        className={`header-cover w-full h-screen object-cover object-center ${siteConfig('HEXO_HOME_NAV_BACKGROUND_IMG_FIXED', null, CONFIG) ? 'fixed' : ''}`}
      />
    </header>
  )
}

export default Hero

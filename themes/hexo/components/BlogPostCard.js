import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import { BlogPostCardInfo } from './BlogPostCardInfo'
import { getDevicePerformance } from '@/components/PerformanceDetector'
import { useEffect, useRef, useState } from 'react'


const BlogPostCard = ({ index, post, showSummary, siteInfo }) => {
  const HEXO_POST_LIST_COVER = siteConfig('HEXO_POST_LIST_COVER', null, CONFIG)
  const HEXO_POST_LIST_IMG_CROSSOVER = siteConfig('HEXO_POST_LIST_IMG_CROSSOVER', null, CONFIG)
  const HEXO_POST_LIST_COVER_DEFAULT = siteConfig('HEXO_POST_LIST_COVER_DEFAULT', null, CONFIG)
  const infoRef = useRef(null)
  const imgWrapRef = useRef(null)
  
  if (
    post &&
    !post.pageCoverThumbnail &&
    HEXO_POST_LIST_COVER_DEFAULT
  ) {
    post.pageCoverThumbnail = siteInfo?.pageCover
  }
  const showPageCover = HEXO_POST_LIST_COVER && post?.pageCoverThumbnail
  
  // 获取设备性能信息
  const { isLowEndDevice, performanceLevel } = getDevicePerformance()

  // 为确保服务端和客户端渲染一致，我们只在客户端渲染时启用AOS动画
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 根据设备性能调整AOS动画
  const enableAOS = siteConfig('ENABLE_AOS', false) && isClient && !isLowEndDevice
  const aosDuration = isClient && performanceLevel === 'high' ? '800' : '600'
  const aosDelay = isClient ? index * (performanceLevel === 'high' ? 50 : 100) : index * 100

  // 为低端设备禁用更多效果
  const shouldUseAdvancedEffects = !isLowEndDevice && performanceLevel !== 'low'

  useEffect(() => {
    if (typeof window === 'undefined') return
    const infoEl = infoRef.current
    const imgEl = imgWrapRef.current
    if (!infoEl || !imgEl) return
    const apply = () => {
      // 保持一定的高度比例，而不是强制相等，避免文字很少时图片太矮
      // 或者在 flex 布局下，让 info 撑开高度
    }
    window.addEventListener('resize', apply)
    return () => {
      window.removeEventListener('resize', apply)
    }
  }, [post?.id])

  // 根据设备性能调整悬停效果 - 更加优雅的上浮效果
  const hovereffectclass = !shouldUseAdvancedEffects
    ? ''
    : 'hover:-translate-y-2 hover:shadow-elevation-xl transition-all duration-300 ease-out'

  const containerRef = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    // 更全面地检测是否为移动端设备
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 980

    // 在移动端始终设为可见，避免图片不渲染的问题
    if (isMobile) {
      setVisible(true)
      return
    }

    const rootMargin = isLowEndDevice ? '600px' : '400px'
    const io = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setVisible(true)
        })
      },
      { root: null, rootMargin, threshold: 0 }
    )
    if (containerRef.current) io.observe(containerRef.current)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={containerRef} className={`${hovereffectclass} w-full`}>
      <div
        key={post.id}
        {...(enableAOS && {
          'data-aos': 'fade-up',
          'data-aos-easing': 'ease-in-out',
          'data-aos-duration': aosDuration,
          'data-aos-delay': aosDelay,
          'data-aos-once': 'false',
          'data-aos-anchor-placement': 'top-bottom'
        })}
        id='blog-post-card'
        className={`group w-full flex flex-col sm:flex-row justify-between items-stretch 
                    ${HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 ? 'sm:flex-row-reverse' : ''}
                    overflow-hidden rounded-xl card-base dark:bg-gray-900/60 dark:border-gray-700/50 dark:backdrop-blur-md transition-all duration-300 ease-standard transform-gpu relative`}>
        
        {/* 图片封面  */}
        {showPageCover && (
          <div ref={imgWrapRef} className={`w-full md:w-5/12 relative overflow-hidden h-56 sm:h-auto min-h-[14rem] aspect-video sm:aspect-[4/3] flex-shrink-0
            ${HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 
              ? 'sm:rounded-r-xl sm:rounded-l-none'
              : 'sm:rounded-l-xl sm:rounded-r-none'
            }
          `}>
            <SmartLink href={post?.href} className='w-full h-full block relative'>
                <LazyImage
                  priority={index === 0} // 只给第一张卡片加 priority
                  alt={post?.title}
                  src={post?.pageCoverThumbnail}
                  className={`w-full h-full object-cover object-center absolute inset-0 transition-transform duration-700 ease-out ${!shouldUseAdvancedEffects ? '' : 'group-hover:scale-105'}`}
                  title={post?.title}
                />
                {/* 图片上的光泽遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </SmartLink>
          </div>
        )}

        {/* 文字内容 - 移除 w-full，使用 flex-1，避免flex-wrap行为导致的第三列 */}
        <div className="flex-1 flex flex-col justify-center p-6 sm:p-8">
            {visible ? (
            <BlogPostCardInfo
                post={post}
                showPageCover={showPageCover}
                showPreview={!showSummary}
                showSummary={showSummary}
                dateAlign={showPageCover && HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 ? 'right' : 'left'}
                containerRef={infoRef}
            />
            ) : (
            <div className='w-full min-h-[160px] animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg' />
            )}
        </div>
      </div>
    </div>
  )
}

export default BlogPostCard

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
  const HEXO_POST_LIST_COVER_HOVER_ENLARGE = siteConfig('HEXO_POST_LIST_COVER_HOVER_ENLARGE', null, CONFIG)
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
  const showPageCover =
    HEXO_POST_LIST_COVER && post?.pageCoverThumbnail
  // 获取设备性能信息
  const { isLowEndDevice, performanceLevel } = getDevicePerformance()

  // 为确保服务端和客户端渲染一致，我们只在客户端渲染时启用AOS动画
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // 根据设备性能调整AOS动画 - 在客户端设置，确保服务端和客户端一致
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
      const h = infoEl.offsetHeight
      if (h > 0) imgEl.style.height = h + 'px'
    }
    apply()
    const ro = new ResizeObserver(() => apply())
    ro.observe(infoEl)
    window.addEventListener('resize', apply)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', apply)
    }
  }, [post?.id])

  // 根据设备性能调整悬停效果
  const hovereffectclass = !shouldUseAdvancedEffects
    ? ''
    : (HEXO_POST_LIST_COVER_HOVER_ENLARGE ? ' hover:scale-102 transition-all duration-300 ease-standard' : '')

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
    <div ref={containerRef} className={hovereffectclass + ' hover:shadow-xl'}>
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
        className={`group w-full flex flex-col sm:flex-row justify-between items-stretch ${HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 ? 'sm:flex-row-reverse' : ''}
                    overflow-hidden rounded-xl glass-layer-soft transition-all duration-300 ease-standard transform-gpu shadow-sm hover:shadow-md min-h-[180px] relative`}>
        {/* 图片封面 */}
        {showPageCover && (
          <div ref={imgWrapRef} className={`w-full md:w-6/12 relative overflow-hidden rounded-t-xl md:rounded-none h-48 sm:h-56 md:h-64 aspect-video md:aspect-auto article-cover flex-shrink-0 hover:scale-[1.01] transition-transform duration-300 ease-standard transform-gpu
            ${HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 
              ? 'md:rounded-l-2xl md:rounded-r-3xl'  // 图片在左，右内角更大
              : 'md:rounded-l-3xl md:rounded-r-2xl'  // 图片在右，左内角更大
            } bg-transparent`}>
            <SmartLink href={post?.href} className='bg-transparent w-full h-full'>
              <>
                <LazyImage
                  priority={index === 1 || typeof window !== 'undefined' && window.innerWidth < 768} // 移动端也优先加载第一张图片
                  alt={post?.title}
                  src={post?.pageCoverThumbnail}
                  className={`w-full h-full object-cover object-center ${!shouldUseAdvancedEffects ? '' : 'group-hover:scale-[1.02] duration-300 ease-standard'}`}
                  title={post?.title} // 为图片添加title属性以提高SEO
                />

              </>
            </SmartLink>
          </div>
        )}

        {/* 文字内容 */}
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
          <div className='md:w-6/12 w-full min-h-[160px] bg-transparent' />
        )}
      </div>
    </div>
  )
}

export default BlogPostCard

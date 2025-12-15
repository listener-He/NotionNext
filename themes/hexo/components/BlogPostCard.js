import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import { BlogPostCardInfo } from './BlogPostCardInfo'
import { getDevicePerformance } from '@/components/PerformanceDetector'

const BlogPostCard = ({ index, post, showSummary, siteInfo }) => {
  const showPreview =
    siteConfig('HEXO_POST_LIST_PREVIEW', null, CONFIG) && post.blockMap
  if (
    post &&
    !post.pageCoverThumbnail &&
    siteConfig('HEXO_POST_LIST_COVER_DEFAULT', null, CONFIG)
  ) {
    post.pageCoverThumbnail = siteInfo?.pageCover
  }
  const showPageCover =
    siteConfig('HEXO_POST_LIST_COVER', null, CONFIG) &&
    post?.pageCoverThumbnail &&
    !showPreview
  // 获取设备性能信息
  const { isLowEndDevice } = getDevicePerformance()

  // 在低端设备上禁用AOS动画
  const enableAOS = !isLowEndDevice
  return (
    <div
      className={`${siteConfig('HEXO_POST_LIST_COVER_HOVER_ENLARGE', null, CONFIG) ? ' hover:scale-102 transition-all duration-300 ease-standard' : ''}`}>
      <div
        key={post.id}
        {...(enableAOS && {
          'data-aos': 'fade-up',
          'data-aos-easing': 'ease-in-out',
          'data-aos-duration': '800',
          'data-aos-once': 'false',
          'data-aos-anchor-placement': 'top-bottom'
        })}
        id='blog-post-card'
        className={`group md:h-56 w-full flex justify-between md:flex-row flex-col-reverse ${siteConfig('HEXO_POST_LIST_IMG_CROSSOVER', null, CONFIG) && index % 2 === 1 ? 'md:flex-row-reverse' : ''}
                    overflow-hidden rounded-2xl backdrop-blur-md bg-white/60 dark:bg-gray-900/50 border border-black/5 dark:border-white/10 shadow-md`}>
        {/* 文字内容 */}
        <BlogPostCardInfo
          index={index}
          post={post}
          showPageCover={showPageCover}
          showPreview={showPreview}
          showSummary={showSummary}
        />

        {/* 图片封面 */}
        {showPageCover && (
          <div className='md:w-5/12 overflow-hidden'>
            <SmartLink href={post?.href}>
              <>
                <LazyImage
                  priority={index === 1}
                  alt={post?.title}
                  src={post?.pageCoverThumbnail}
                  className='h-56 w-full object-cover object-center group-hover:scale-[1.02] duration-300 ease-standard'
                  title={post?.title} // 为图片添加title属性以提高SEO
                />
              </>
            </SmartLink>
          </div>
        )}
      </div>
    </div>
  )
}

export default BlogPostCard

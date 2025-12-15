import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import { BlogPostCardInfo } from './BlogPostCardInfo'
import { getDevicePerformance } from '@/components/PerformanceDetector'

const BlogPostCard = ({ index, post, showSummary, siteInfo }) => {
  const HEXO_POST_LIST_PREVIEW = siteConfig('HEXO_POST_LIST_PREVIEW', null, CONFIG)
  const HEXO_POST_LIST_COVER = siteConfig('HEXO_POST_LIST_COVER', null, CONFIG)
  const HEXO_POST_LIST_IMG_CROSSOVER = siteConfig('HEXO_POST_LIST_IMG_CROSSOVER', null, CONFIG)
  const HEXO_POST_LIST_COVER_HOVER_ENLARGE = siteConfig('HEXO_POST_LIST_COVER_HOVER_ENLARGE', null, CONFIG)
  const HEXO_POST_LIST_COVER_DEFAULT = siteConfig('HEXO_POST_LIST_COVER_DEFAULT', null, CONFIG)
  const showPreviewConfig = HEXO_POST_LIST_PREVIEW && post.blockMap
  if (
    post &&
    !post.pageCoverThumbnail &&
    HEXO_POST_LIST_COVER_DEFAULT
  ) {
    post.pageCoverThumbnail = siteInfo?.pageCover
  }
  const showPageCover =
    HEXO_POST_LIST_COVER && post?.pageCoverThumbnail && !showPreviewConfig
  // 获取设备性能信息
  const { isLowEndDevice } = getDevicePerformance()

  // 在低端设备上禁用AOS动画
  const enableAOS = !isLowEndDevice
  return (
    <div
      className={`${HEXO_POST_LIST_COVER_HOVER_ENLARGE ? ' hover:scale-102 transition-all duration-300 ease-standard' : ''}`}>
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
        className={`group w-full flex justify-between items-stretch md:flex-row flex-col-reverse ${HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 ? 'md:flex-row-reverse' : ''}
                    overflow-hidden rounded-2xl backdrop-blur-md bg-white/60 dark:bg-gray-900/50 border border-black/5 dark:border-white/10 shadow-md`}>
        {/* 文字内容 */}
        <BlogPostCardInfo
          post={post}
          showPageCover={showPageCover}
          showPreview={showSummary ? false : showPreviewConfig}
          showSummary={showSummary}
          dateAlign={showPageCover && HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 ? 'right' : 'left'}
        />

        {/* 图片封面 */}
        {showPageCover && (
          <div className={`md:w-5/12 h-full relative overflow-hidden rounded-2xl 
            ${HEXO_POST_LIST_IMG_CROSSOVER && index % 2 === 1 
              ? 'md:rounded-l-2xl md:rounded-r-3xl'  // 图片在左，右内角更大
              : 'md:rounded-l-3xl md:rounded-r-2xl'  // 图片在右，左内角更大
            }`}>
            <SmartLink href={post?.href}>
              <>
                <LazyImage
                  priority={index === 1}
                  alt={post?.title}
                  src={post?.pageCoverThumbnail}
                  className='absolute inset-0 h-full w-full object-cover object-center group-hover:scale-[1.02] duration-300 ease-standard'
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

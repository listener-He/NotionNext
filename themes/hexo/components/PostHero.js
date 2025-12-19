import LazyImage from '@/components/LazyImage'
import NotionIcon from '@/components/NotionIcon'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { formatDateFmt } from '@/lib/utils/formatDate'
import SmartLink from '@/components/SmartLink'
import TagItemMini from './TagItemMini'
import WordCount from '@/components/WordCount'

/**
 * 文章详情页的Hero块
 */
export default function PostHero({ post, siteInfo }) {
  const { locale, fullWidth, isDarkMode } = useGlobal()

  if (!post) {
    return <></>
  }

  // 文章全屏隐藏标头
  if (fullWidth) {
    return <div className='my-8' />
  }

  const headerImage = post?.pageCover ? post.pageCover : siteInfo?.pageCover

  return (
    <div id='header' className='w-full h-96 relative md:flex-shrink-0 z-10'>
      <LazyImage
        priority={true}
        src={headerImage}
        className='w-full h-full object-cover object-center absolute top-0'
      />

      <header
        id='article-header-cover'
        className={`${isDarkMode ? 'from-black/70 via-black/40 to-transparent' : 'from-white/90 via-white/70 to-transparent'} absolute top-0 w-full h-96 py-10 flex justify-center items-center`}>
        <div className='mt-10'>
          <div className='mb-3 flex justify-center'>
            {post.category && (
              <>
                <SmartLink
                  href={`/category/${post.category}`}
                  className={`cursor-pointer px-3 py-1 mb-2 rounded-full text-sm font-semibold duration-200 shadow-text-md ${isDarkMode ? 'bg-white/10 text-white border border-white/30 hover:bg-white/20' : 'bg-black/10 text-gray-900 border border-gray-700/40 hover:bg-black/20'}`}>
                  {post.category}
                </SmartLink>
              </>
            )}
          </div>

          {/* 文章Title */}
          <div className={`leading-snug font-extrabold tracking-tight xs:text-4xl sm:text-5xl md:text-6xl md:leading-snug text-4xl shadow-text-md flex justify-center text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {siteConfig('POST_TITLE_ICON') && (
              <NotionIcon icon={post.pageIcon} className='text-4xl mx-1' />
            )}
            {post.title}
          </div>

          <section className={`article-meta flex-wrap shadow-text-md flex text-sm justify-center mt-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'} font-medium leading-8 gap-4`}>
            <div className='flex justify-center items-center'>
              {post?.type !== 'Page' && (
                <>
                  <SmartLink
                    href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
                    passHref
                    className='pl-1 mr-2 cursor-pointer hover:underline'>
                    {locale.COMMON.POST_TIME}: {post?.publishDay}
                  </SmartLink>
                </>
              )}
              <div className='pl-1 mr-2'>
                {locale.COMMON.LAST_EDITED_TIME}: {post.lastEditedDay}
              </div>
            </div>

            {JSON.parse(siteConfig('ANALYTICS_BUSUANZI_ENABLE')) && (
              <div className='busuanzi_container_page_pv font-medium mr-2'>
                <span className='mr-2 busuanzi_value_page_pv' />
                {locale.COMMON.VIEWS}
              </div>
            )}
            {/*除了文章页面外不显示阅读统计*/}
            {post?.type && post.type === 'Post' && post?.wordCount && post?.readTime && (
              <WordCount wordCount={post.wordCount} readTime={post.readTime} />
            )}
          </section>

          <div className='mt-4 mb-1'>
            {post.tagItems && (
              <div className='flex justify-center flex-nowrap overflow-x-auto'>
                {post.tagItems.map(tag => (
                  <TagItemMini key={tag.name} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  )
}

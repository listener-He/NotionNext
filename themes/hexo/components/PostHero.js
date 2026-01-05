import LazyImage from '@/components/LazyImage'
import { useGlobal } from '@/lib/global'
import { siteConfig } from '@/lib/config'
import NotionIcon from '@/components/NotionIcon'

/**
 * 文章详情页的Hero块 - 只显示封面图
 */
export default function PostHero({ post, siteInfo }) {
  const { fullWidth, isDarkMode } = useGlobal()

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
        className='absolute bottom-0 w-full h-96 flex justify-center items-end pb-16'>
        <div className='text-center w-full px-4'>
          {/* 带有半透明背景的标题容器 */}
          <div className={`${isDarkMode ? 'bg-black/30 dark:bg-black/50' : 'bg-white/60'} backdrop-blur-sm rounded-xl py-4 px-6 inline-block`}>
            <div className='text-xl text-white font-light'>
              {/* 文章Title */}
              <div className={`leading-tight font-bold tracking-tight text-xl md:text-2xl lg:text-3xl text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {siteConfig('POST_TITLE_ICON') && (
                  <NotionIcon icon={post.pageIcon} className='text-2xl mx-1' />
                )}
                {post.title}
              </div>
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

import LazyImage from '@/components/LazyImage'
import { useGlobal } from '@/lib/global'

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
        className={`${isDarkMode ? 'from-black/70 via-black/40 to-transparent' : 'from-white/90 via-white/70 to-transparent'} absolute top-0 w-full h-96 py-10 flex justify-center items-center`}>
        <div className='mt-10'>
          {/* 原来的标题、分类、标签、日期等信息已移除，只保留封面图 */}
          <div className='text-center'>
            <div className='text-xl text-white font-light'>
              {/* 空白占位，保持布局结构 */}
            </div>
          </div>
        </div>
      </header>
    </div>
  )
}

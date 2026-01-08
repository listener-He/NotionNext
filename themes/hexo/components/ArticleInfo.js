import NotionIcon from '@/components/NotionIcon'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { formatDateFmt } from '@/lib/utils/formatDate'
import SmartLink from '@/components/SmartLink'
import TagItemMini from './TagItemMini'
import WordCount from '@/components/WordCount'

/**
 * 文章详情页的信息组件 - 包含标题、分类、标签、日期、阅读量等
 */
export default function ArticleInfo({ post, siteInfo }) {
  const { locale, isDarkMode } = useGlobal()

  if (!post) {
    return <></>
  }

  return (
    <div className='mb-4'>

      {/* 文章元信息：发布日期、最后编辑日期、阅读量、字数等 */}
      <div className={`flex-wrap flex text-xs sm:text-sm justify-center mb-4 ${isDarkMode ? 'text-gray-100' : 'text-gray-700'} font-medium gap-4`}>
        <div className='flex flex-wrap justify-center gap-4'>
          {post?.type !== 'Page' && (
            <div className='flex items-center'>
              <SmartLink
                href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
                passHref
                className='pl-1 mr-2 cursor-pointer hover:underline'>
                <i className='far fa-calendar mr-1 text-xs' /> {locale.COMMON.POST_TIME}: {post?.publishDay}
              </SmartLink>
            </div>
          )}
          <div className='flex items-center'>
            <i className='far fa-edit mr-1 text-xs' /> {locale.COMMON.LAST_EDITED_TIME}: {post.lastEditedDay}
          </div>
          {JSON.parse(siteConfig('ANALYTICS_BUSUANZI_ENABLE')) && (
            <div className='flex items-center busuanzi_container_page_pv font-medium'>
              <i className='far fa-eye mr-1 text-xs' /> <span className='busuanzi_value_page_pv' /> {locale.COMMON.VIEWS}
            </div>
          )}
          {/* 除了文章页面外不显示阅读统计 */}
          {post?.type && post.type === 'Post' && post?.wordCount && post?.readTime && (
            <div className='flex items-center'>
              <WordCount wordCount={post.wordCount} readTime={post.readTime} />
            </div>
          )}
        </div>
      </div>

      {/* 分类和标签行 - 放在字数下方 */}
      <div className='flex flex-wrap justify-center items-center gap-2 mb-4'>
        {/* 分类 */}
        {post.category && (
          <SmartLink
            href={`/category/${post.category}`}
            className={`cursor-pointer inline-block rounded-md duration-300 ease-standard mr-2 mb-2 py-xs px-sm text-xs whitespace-nowrap font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} shadow-sm hover:shadow-md glass-layer-soft`}
            style={{ border: isDarkMode ? '1px solid rgba(255,255,255,0.18)' : '1px solid rgba(0,0,0,0.12)' }}>
            {post.category}
          </SmartLink>
        )}

        {/* 标签 */}
        {post.tagItems && post.tagItems.length > 0 && (
          <div className='flex flex-wrap gap-2'>
            {post.tagItems.map(tag => (
              <TagItemMini key={tag.name} tag={tag} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import TwikooCommentCount from '@/components/TwikooCommentCount'
import { siteConfig } from '@/lib/config'
import { formatDateFmt } from '@/lib/utils/formatDate'
import SmartLink from '@/components/SmartLink'
import TagItemMini from './TagItemMini'

/**
 * 博客列表的文字内容
 * @param {*} param0
 * @returns
 */
export const BlogPostCardInfo = ({
  post,
  showPreview,
  showPageCover,
  showSummary
}) => {
  return (
    <article
      className={`flex flex-col justify-between lg:p-6 p-4 ${showPageCover && !showPreview ? 'md:w-7/12 w-full md:max-h-60' : 'w-full'}`}>
      <div>
        <header className="rounded-xl px-4 py-3">
          <h2>
            {/* 标题 */}
            <SmartLink
              href={post?.href}
              passHref
              className={`ellipsis replace cursor-pointer text-2xl ${
                showPreview ? 'text-center' : ''
              } leading-tight font-semibold text-gray-700 dark:text-gray-100 hover:text-indigo-700 dark:hover:text-indigo-400`}>
              {siteConfig('POST_TITLE_ICON') && (
                <NotionIcon icon={post.pageIcon} />
              )}
              <span className='menu-link '>{post.title}</span>
            </SmartLink>
          </h2>

          {/* 分类 */}
          {post?.category && (
            <div
              className={`flex mt-3 items-center ${
                showPreview ? 'justify-center' : 'justify-start'
              } flex-wrap text-secondary dark:text-gray-300 `}>
              <SmartLink
                href={`/category/${post.category}`}
                passHref
                className='cursor-pointer font-light text-sm menu-link hover:text-indigo-700 dark:hover:text-indigo-400 transform'>
                <i className='mr-1 far fa-folder' />
                {post.category}
              </SmartLink>

              <TwikooCommentCount
                className='text-sm hover:text-indigo-700 dark:hover:text-indigo-400'
                post={post}
              />
            </div>
          )}
        </header>

        {/* 摘要 */}
        {(!showPreview || showSummary) && !post.results && (
          <main className='ellipsis replace my-4 text-primary dark:text-gray-300 text-[15px] font-normal leading-7'>
            {post.summary}
          </main>
        )}

        {/* 搜索结果 */}
        {post.results && (
          <p className='ellipsis mt-4 text-primary dark:text-gray-300 text-[15px] font-normal leading-7'>
            {post.results.map((r, index) => (
              <span key={index}>{r}</span>
            ))}
          </p>
        )}

        {/* 预览 */}
        {showPreview && (
          <div className='overflow-ellipsis truncate'>
            <NotionPage post={post} />
          </div>
        )}
      </div>

      <div>
        {/* 日期标签 */}
        <div className='text-secondary dark:text-gray-300 justify-between flex flex-wrap gap-2'>
          {/* 日期 */}
          <SmartLink
            href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
            passHref
            className='font-medium menu-link cursor-pointer text-sm leading-4 mr-3'>
            <i className='far fa-calendar-alt mr-1' />
            {post?.publishDay || post.lastEditedDay}
          </SmartLink>

          <div className='md:flex-nowrap flex-wrap md:justify-start inline-flex'>
            <div className='flex flex-wrap gap-2'>
              {' '}
              {post.tagItems?.map(tag => (
                <TagItemMini key={tag.name} tag={tag} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

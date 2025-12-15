import NotionIcon from '@/components/NotionIcon'
import NotionPage from '@/components/NotionPage'
import TwikooCommentCount from '@/components/TwikooCommentCount'
import { siteConfig } from '@/lib/config'
import { formatDateFmt } from '@/lib/utils/formatDate'
import SmartLink from '@/components/SmartLink'

/**
 * 博客列表的文字内容
 * @param {*} param0
 * @returns
 */
export const BlogPostCardInfo = ({
  post,
  showPreview,
  showPageCover,
  showSummary,
  dateAlign = 'right'
}) => {
  return (
    <article
      className={`flex flex-col justify-between lg:p-6 p-4 ${showPageCover && !showPreview ? 'md:w-7/12 w-full md:max-h-60' : 'w-full'}`}>
      <div>
        <header className="relative rounded-xl px-4 py-3">
          <div className={`flex ${showPreview ? 'justify-center' : 'justify-start'} items-start`}>
            <h2 className="mr-3">
              {/* 标题 */}
              <SmartLink
                href={post?.href}
                passHref
                className={`line-clamp-2 replace cursor-pointer text-2xl leading-tight font-semibold text-gray-700 dark:text-gray-100 hover:text-indigo-700 dark:hover:text-indigo-400`}>
                {siteConfig('POST_TITLE_ICON') && (
                  <NotionIcon icon={post.pageIcon} />
                )}
                <span className='menu-link'>{post.title}</span>
              </SmartLink>
            </h2>
            {!showPreview && (
              <SmartLink
                href={`/archive#${formatDateFmt(post?.publishDate, 'yyyy-MM')}`}
                passHref
                className={`absolute top-1 ${dateAlign === 'left' ? 'left-4' : 'right-4'} text-xs leading-5 text-secondary dark:text-gray-400 whitespace-nowrap`}>
                <i className='far fa-calendar-alt mr-1' />
                {post?.publishDay || post.lastEditedDay}
              </SmartLink>
            )}
          </div>

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

              {post.tagItems?.length > 0 && (
                <div className='ml-3 inline-flex flex-wrap gap-x-1 gap-y-1'>
                  {post.tagItems.map(tag => (
                    <SmartLink
                      key={tag.name}
                      href={`/tag/${encodeURIComponent(tag.name)}`}
                      passHref
                      className='px-sm py-xs text-xs font-medium tag-badge-day dark:tag-badge-night hover:opacity-90 transition-all duration-300 ease-standard'>
                      {tag.name}
                    </SmartLink>
                  ))}
                </div>
              )}

              <TwikooCommentCount
                className='text-sm hover:text-indigo-700 dark:hover:text-indigo-400'
                post={post}
              />
            </div>
          )}
        </header>

        {/* 摘要 */}
        {(!showPreview || showSummary) && !post.results && (
          <main className='line-clamp-3 whitespace-normal replace my-4 text-primary dark:text-gray-300 text-[15px] font-normal leading-7'>
            {post.summary}
          </main>
        )}

        {/* 搜索结果 */}
        {post.results && (
          <p className='line-clamp-3 whitespace-normal mt-4 text-primary dark:text-gray-300 text-[15px] font-normal leading-7'>
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

      {/* 底部日期区块移除，避免重复显示 */}
    </article>
  )
}

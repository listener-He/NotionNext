import SmartLink from '@/components/SmartLink'

/**
 * 博客归档列表
 * @param posts 所有文章
 * @param archiveTitle 归档标题
 * @returns {JSX.Element}
 * @constructor
 */
const BlogPostArchive = ({ posts = [], archiveTitle }) => {
  if (!posts || posts.length === 0) {
    return <></>
  } else {
    return (
      <div>
        <div
          className='pt-16 pb-4 text-3xl dark:text-gray-300'
          id={archiveTitle}>
          {archiveTitle}
        </div>
        <ul className='space-y-2'>
          {posts?.map(post => {
            return (
              <li
                key={post.id}
                className='border-l-2 p-2 text-sm md:text-base items-center hover:border-black/20 dark:hover:border-white/30 dark:border-white/20 border-black/10 duration-200'>
                <div id={post?.publishDay}>
                  <span className='text-secondary'>{post.date?.start_date}</span>{' '}
                  &nbsp;
                  <SmartLink
                    href={post?.href}
                    passHref
                    className='text-primary dark:text-gray-200 overflow-x-hidden hover:underline cursor-pointer'>
                    {post.title}
                  </SmartLink>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    )
  }
}

export default BlogPostArchive

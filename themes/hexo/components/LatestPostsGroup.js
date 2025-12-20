import LazyImage from '@/components/LazyImage'
import { useGlobal } from '@/lib/global'
// import Image from 'next/image'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'

/**
 * 最新文章列表
 * @param posts 所有文章数据
 * @param sliceCount 截取展示的数量 默认6
 * @constructor
 */
const LatestPostsGroup = ({ latestPosts, siteInfo }) => {
  // 获取当前路径
  const currentPath = useRouter().asPath
  const { locale } = useGlobal()

  if (!latestPosts) {
    return <></>
  }

  return (
    <>
      <div className='mb-sm px-sm flex flex-nowrap justify-between bg-transparent'>
        <div>
          <i className='mr-2 fas fas fa-history' />
          {locale.COMMON.LATEST_POSTS}
        </div>
      </div>
      {latestPosts.map(post => {
        const headerImage = post?.pageCoverThumbnail
          ? post.pageCoverThumbnail
          : siteInfo?.pageCover
        const selected = currentPath === post?.href

        return (
          <SmartLink
            key={post.id}
            title={post.title}
            href={post?.href}
            passHref
            className={'my-sm flex duration-300 ease-standard bg-transparent'}>
            <div className='w-20 h-14 overflow-hidden relative rounded-md'>
              <LazyImage
                alt={post?.title}
                src={`${headerImage}`}
                className='object-cover w-full h-full'
              />
            </div>
            <div
              className={
                (selected ? ' text-indigo-400 ' : 'dark:text-gray-400 ') +
                ' text-sm overflow-x-hidden hover:text-primary px-sm duration-300 ease-standard w-full rounded ' +
                ' hover:text-primary cursor-pointer items-center flex bg-transparent'
              }>
              <div className='bg-transparent'>
                <div className='line-clamp-2 menu-link'>{post.title}</div>
                <div className='text-gray-500'>{post.lastEditedDay}</div>
              </div>
            </div>
          </SmartLink>
        )
      })}
    </>
  )
}
export default LatestPostsGroup

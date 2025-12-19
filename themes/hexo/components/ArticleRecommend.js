import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

/**
 * 关联推荐文章
 * @param {prev,next} param0
 * @returns
 */
export default function ArticleRecommend({ recommendPosts, siteInfo }) {
  const { locale } = useGlobal()

  if (
    !siteConfig('HEXO_ARTICLE_RECOMMEND', null, CONFIG) ||
    !recommendPosts ||
    recommendPosts.length === 0
  ) {
    return <></>
  }

  return (
    <div className='pt-8'>
      <div className=' mb-2 px-1 flex flex-nowrap justify-between'>
        <div className='dark:text-gray-300 font-semibold'>
          <i className='mr-2 fas fa-thumbs-up' />
          {locale.COMMON.RELATE_POSTS}
        </div>
      </div>
      <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
        {recommendPosts.map(post => {
          const headerImage = post?.pageCoverThumbnail
            ? post.pageCoverThumbnail
            : siteInfo?.pageCover

          return (
            <SmartLink
              key={post.id}
              title={post.title}
              href={post?.href}
              passHref
              className='group block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 h-32'>
              <div className='h-full w-full relative group'>
                <LazyImage
                  src={headerImage}
                  className='absolute top-0 w-full h-full object-cover object-center group-hover:scale-105 transform duration-300'
                />

                <div className='absolute inset-0 bg-gradient-to-b from-black/0 via-black/15 to-black/45 dark:from-black/0 dark:via-black/25 dark:to-black/55' />
                <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-pink-200/20 via-cyan-200/15 to-transparent dark:from-pink-400/10 dark:via-cyan-400/10' />

                <div className='relative z-10 h-full w-full flex items-end'>
                  <div className='p-3 w-full'>
                    <div className='line-clamp-2 text-sm font-semibold text-white'>
                      {post.title}
                    </div>
                  </div>
                </div>
              </div>
            </SmartLink>
          )
        })}
      </div>
    </div>
  )
}

import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import Link from 'next/link'
import LazyImage from '@/components/LazyImage'
import Comment from '@/components/Comment'

/**
 * 友链页面组件
 * @returns {JSX.Element}
 */
const LinksPage = (post) => {

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 py-12' id='article-wrapper'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <h1 className='text-3xl font-bold text-center text-gray-900 dark:text-white mb-8'>
          友情链接
        </h1>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {post.map((link, index) => (
            <Link key={index} href={link.url} passHref legacyBehavior>
              <a
                target='_blank'
                rel='noopener noreferrer'
                className='block bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6 text-center'>
                <div className='flex flex-col items-center space-y-4'>
                  {/* 头像 */}
                  <LazyImage
                    src={link.avatar}
                    alt={link.name}
                    className='w-16 h-16 rounded-full object-cover border-2 border-indigo-500'
                  />
                  {/* 名称 */}
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    {link.name}
                  </h2>
                  {/* 描述 */}
                  <p className='text-sm text-gray-600 dark:text-gray-400'>
                    {link.description}
                  </p>
                </div>
              </a>
            </Link>
          ))}
        </div>
        <div className='pt-4 border-dashed'></div>

        {/* 评论互动 */}
        <div className='duration-200 overflow-x-auto bg-white dark:bg-hexo-black-gray px-3'>
          <Comment frontMatter={post} />
        </div>
      </div>
    </div>
  )
}

export default LinksPage
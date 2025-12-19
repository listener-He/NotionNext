import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'
import { siteConfig } from '@/lib/config'

/**
 * 上一篇，下一篇文章
 * @param {prev,next} param0
 * @returns
 */
export default function ArticleAdjacent({ prev, next }) {
  if (!prev || !next || !siteConfig('HEXO_ARTICLE_ADJACENT', null, CONFIG)) {
    return <></>
  }
  return (
    <section className='pt-8 items-center text-xs md:text-sm flex justify-between m-1 article-adjacent-container gap-3'>
      <SmartLink
        href={`/${prev.slug}`}
        passHref
        className='px-3 py-2 text-xs cursor-pointer justify-start items-center flex w-full duration-200 rounded-full text-gray-800 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-300'>
        <i className='mr-2 fas fa-angle-left text-sm' />
        {prev.title}
      </SmartLink>
      <SmartLink
        href={`/${next.slug}`}
        passHref
        className='px-3 py-2 text-xs cursor-pointer justify-end items-center flex w-full duration-200 rounded-full text-gray-800 hover:text-blue-600 dark:text-gray-100 dark:hover:text-blue-300'>
        {next.title}
        <i className='ml-2 fas fa-angle-right text-sm' />
      </SmartLink>
    </section>
  )
}

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
    <section className='pt-8 text-gray-800 items-center text-xs md:text-sm flex justify-between m-1 article-adjacent-container'>
      <SmartLink
        href={`/${prev.slug}`}
        passHref
        className='py-0.5 text-xs cursor-pointer hover:underline justify-start items-center dark:text-white flex w-full duration-200'>
        <i className='mr-1 fas fa-angle-left text-sm' />
        {prev.title}
      </SmartLink>
      <SmartLink
        href={`/${next.slug}`}
        passHref
        className='py-0.5 text-xs cursor-pointer hover:underline justify-end items-center dark:text-white flex w-full duration-200'>
        {next.title}
        <i className='ml-1 fas fa-angle-right text-sm' />
      </SmartLink>
    </section>
  )
}

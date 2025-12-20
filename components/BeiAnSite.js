import { siteConfig } from '@/lib/config'

/**
 * 站点域名备案
 * @returns
 */
export default function BeiAnSite() {
  const beian = siteConfig('BEI_AN')
  const beianLink = siteConfig('BEI_AN_LINK')
  if (!beian) {
    return null
  }
  return (
    <span className="flex items-center">
      <i className='fas fa-shield-alt' />
      <a href={beianLink} className='mx-1 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'>
        {beian}
      </a>
    </span>
  )
}

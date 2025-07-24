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
    <span>
      <i className='fas fa-shield-alt' />
      <a href={beianLink} className='mx-1'>
        {beian}
      </a> &nbsp;
      <i className='fas fa-shield-alt' />
      <a href="https://icp.gov.moe/?keyword=20257012" target="_blank">萌ICP备20257012号</a>
      <br />
    </span>
  )
}

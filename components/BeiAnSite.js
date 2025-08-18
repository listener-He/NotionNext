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
      <img style="width:32px;height:32px;margin-bottom:-8px" src="https://icp.gov.moe//images/ico64.png" alt="萌ICP备案图标"/>
      <a href="https://icp.gov.moe/?keyword=20257012">萌ICP备20257012号</a>
      <br />
      <img src="https://icp.redcha.cn/static/picture/icplogoi.png" style="height: 20px;" alt="茶ICP备案图标"/>
      <a href="https://icp.redcha.cn/beian/ICP-2025080099.html">茶ICP备2025080099号</a>
    </span>
  )
}

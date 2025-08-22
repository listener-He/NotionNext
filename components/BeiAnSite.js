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
      <img style={{width: '20px', height: '20px'}} src="https://icp.gov.moe//images/ico64.png" alt="萌ICP备案图标"/>
      <a href="https://icp.gov.moe/?keyword=20257012">萌ICP备20257012号</a>
      &nbsp;
      <img src="https://icp.redcha.cn/static/picture/icplogoi.png" style={{width: '20px', height: '20px'}} alt="茶ICP备案图标"/>
      <a href="https://icp.redcha.cn/beian/ICP-2025080099.html">茶ICP备2025080099号</a>
      &nbsp;
      <a href="https://bloginc.cn/18872.html">
        <div style={{
          display: 'inline-flex',
          height: '24px',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          lineHeight: '24px',
          textAlign: 'center',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        }}>
          <div style={{
            backgroundColor: '#04314D',
            color: 'white',
            padding: '0 12px',
            borderTopLeftRadius: '8px',
            borderBottomLeftRadius: '8px',
          }}>
            晓梦羊&reg;
          </div>
          <div style={{
            backgroundColor: '#FF6A00',
            color: 'white',
            padding: '0 12px',
            borderTopRightRadius: '8px',
            borderBottomRightRadius: '8px',
          }}>
            18872号
          </div>
        </div>
      </a>
      <br />
    </span>
  )
}

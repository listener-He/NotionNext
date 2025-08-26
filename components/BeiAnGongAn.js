import { siteConfig } from '@/lib/config'
import LazyImage from './LazyImage'

/**
 * 公安备案号组件
 * @returns
 */
export const BeiAnGongAn = props => {
  const BEI_AN_GONGAN = siteConfig('BEI_AN_GONGAN')
  // 从BEI_AN_GONGAN 字段中利用正则匹配提取出纯数字部分
  const codeMatch = BEI_AN_GONGAN?.match(/\d+/) // 匹配纯数字
  const code = codeMatch ? codeMatch[0] : null // 如果匹配成功则取出数字部分

  const href = `https://beian.mps.gov.cn/#/query/webSearch?code=${code}` // 动态生成链接

  if (!BEI_AN_GONGAN) {
    return null
  }
  return (
    <div className={`${props.className}`}>
      <LazyImage src='/images/gongan.png' width={15} height={15} />
      <a href={href} target='_blank' rel='noopener noreferrer' className='ml-1'>
        {BEI_AN_GONGAN}
      </a> &nbsp;
      <LazyImage src='https://blog-file.hehouhui.cn/20250724094940374.png' width={15} height={15} alt='萌ICP备20257012号'/>
      <a href="https://icp.gov.moe/?keyword=20257012" target="_blank">萌ICP备20257012号</a>
      &nbsp;
      <LazyImage src="https://icp.redcha.cn/static/picture/icplogoi.png" width={20} height={20} alt="茶ICP备案图标"/>
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
    </div>
  )
}

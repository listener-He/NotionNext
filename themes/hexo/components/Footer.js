import { BeiAnGongAn } from '@/components/BeiAnGongAn'
import BeiAnSite from '@/components/BeiAnSite'
import PoweredBy from '@/components/PoweredBy'
import { siteConfig } from '@/lib/config'
import LazyImage from '@/components/LazyImage'

const Footer = ({ title }) => {
  const d = new Date()
  const currentYear = d.getFullYear()
  const since = siteConfig('SINCE')
  const copyrightDate =
    parseInt(since) < currentYear ? since + '-' + currentYear : currentYear

  return (
    <footer style={{zIndex: 0}} className='relative z-10 flex-shrink-0 justify-center text-center m-auto w-full leading-6 text-gray-700 dark:text-gray-300 text-sm p-6 glass-layer-strong rounded-t-2xl'>
      <div className="max-w-screen-xl mx-auto">
        <div className="flex flex-col md:flex-row justify-center items-center text-xs">
          <div className="flex flex-col md:flex-row items-center">
            <span>Copyright&nbsp;</span>
            <i className='fas fa-copyright' />
            <span className="ml-1">{`${copyrightDate}`}</span>
            <i className='mx-1 animate-pulse fas fa-heart' />
            <a
              href={siteConfig('LINK')}
              className='underline font-medium hover:text-gray-900 dark:hover:text-gray-100 transition-colors'>
              {siteConfig('AUTHOR')}
            </a>
            <span className="ml-1">All rights reserved.</span>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center items-center gap-1 mt-2 text-xs">
          <div className="flex flex-col md:flex-row items-center">
            <BeiAnSite />
            <BeiAnGongAn />
          </div>
          <div className='hidden busuanzi_container_site_pv flex items-center'>
            <i className='fas fa-eye' />
            <span className='px-1 busuanzi_value_site_pv'> </span>
          </div>
          <div className='pl-2 hidden busuanzi_container_site_uv flex items-center'>
            <i className='fas fa-users' />
            <span className='px-1 busuanzi_value_site_uv'> </span>
          </div>
        </div>

        {(title || siteConfig('BIO')) && (
          <h1 className='text-xs pt-1 text-gray-500 dark:text-gray-400'>
            {title} {siteConfig('BIO') && <>|</>} {siteConfig('BIO')}
          </h1>
        )}

        <div className="pt-1">
          <PoweredBy className='justify-center' />
        </div>
      </div>

      <div className='flex justify-center items-center gap-1 flex-wrap pt-1 mt-1 border-t border-gray-200 dark:border-gray-700'>
        <a href="https://blogscn.fun/random.html" title="BLOGS·CN" target="_blank"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://photo.xiangming.site/img/blogscn.png" alt="本站已加入BLOGS·CN"
                     width={60} height={16} />
        </a>
        <a href="https://www.blogsclub.org/blog/523.html" target="_blank"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://www.blogsclub.org/badge/blog.hehouhui.cn"
                     height={60} width={130}/>
        </a>
        <a href="https://blogs.quest" target="_blank" title="空间穿梭-随机访问BlogsClub成员博客"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://www.blogsclub.org/images/shuttle_1.png" width={40} height={16}/>
        </a>
        <a href="https://www.travellings.cn/go.html" target="_blank" title="开往-友链接力"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://www.travellings.cn/assets/logo.gif" alt="开往-友链接力" width={120} height={16} />
        </a>
        <a href="https://storeweb.cn/member/o/2336" target="_blank"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://upload.storeweb.cn/image/logo.png" alt="个站商店" height={16}
                     width={16} />
        </a>
        <a href="https://www.boyouquan.com/planet-shuttle" target="_blank"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://www.boyouquan.com/assets/images/sites/logo/planet-shuttle-dark.svg" alt="博友圈" height={20}
                     width={100} />
        </a>
        <a href="https://boke.lu" target="_blank"
           className="transition-transform hover:scale-105">
          <LazyImage src="https://boke.lu/logo/横板新图标透明背景.png" alt="博客录" height={16}
                     width={100} />
        </a>
        &nbsp;
        {/*<LazyImage src='https://blog-file.hehouhui.cn/20250724094940374.png' width={15} height={15} alt='萌20257012号'/>*/}
        {/*<a href="https://icp.gov.moe/?keyword=20257012" target="_blank">萌20257012号</a>*/}
        {/*&nbsp;*/}
        {/*<LazyImage src="https://icp.redcha.cn/static/picture/icplogoi.png" width={20} height={20} alt="茶图标"/>*/}
        {/*<a href="https://icp.redcha.cn/beian/ICP-2025080099.html">茶2025080099号</a>*/}
        {/* &nbsp;*/}
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
    </footer>
  )
}

export default Footer

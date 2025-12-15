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
    <footer style={{zIndex: 0}} className='relative z-10 flex-shrink-0 justify-center text-center m-auto w-full leading-6 text-secondary dark:text-gray-100 text-sm p-6 glass-layer-strong'>
      {/* <DarkModeButton/> */}
      <i className='fas fa-copyright' /> {`${copyrightDate}`}
      <span>
        <i className='mx-1 animate-pulse fas fa-heart' />
        <a
          href={siteConfig('LINK')}
          className='underline font-bold dark:text-gray-300 '>
          {siteConfig('AUTHOR')}
        </a>
        .<br />
        <BeiAnSite />
        <BeiAnGongAn />
        <span className='hidden busuanzi_container_site_pv'>
          <i className='fas fa-eye' />
          <span className='px-1 busuanzi_value_site_pv'> </span>
        </span>
        <span className='pl-2 hidden busuanzi_container_site_uv'>
          <i className='fas fa-users' />
          <span className='px-1 busuanzi_value_site_uv'> </span>
        </span>
        <h1 className='text-xs pt-4 text-light-400 dark:text-gray-400'>
          {title} {siteConfig('BIO') && <>|</>} {siteConfig('BIO')}
        </h1>
        <PoweredBy className='justify-center' />
      </span>
      <br />
      <div className='flex justify-center items-center gap-4 flex-wrap'>
        <a href="https://blogscn.fun/random.html" title="BLOGS·CN" target="_blank">
          <LazyImage src="https://photo.xiangming.site/img/blogscn.png" alt="本站已加入BLOGS·CN"
                     width={60} height={16} />
        </a>
        <a href="https://www.blogsclub.org/blog/523.html" target="_blank">
          <LazyImage src="https://www.blogsclub.org/badge/blog.hehouhui.cn"
                     height={60} width={130}/>
        </a>
        <a href="https://blogs.quest" target="_blank" title="空间穿梭-随机访问BlogsClub成员博客">
          <LazyImage src="https://www.blogsclub.org/images/shuttle_1.png" width={40} height={16}/>
        </a>
        <a href="https://www.travellings.cn/go.html" target="_blank" title="开往-友链接力">
          <LazyImage src="https://www.travellings.cn/assets/logo.gif" alt="开往-友链接力" width={120} height={16} />
        </a>
        {/*<a href="https://www.foreverblog.cn/go.html" target="_blank">*/}
        {/*  <LazyImage src="https://foreverblog.cn/assets/logo/logo_en_default.png" alt="十年之约·虫洞" height={16}*/}
        {/*             width={100} />*/}
        {/*</a>*/}
        <a href="https://storeweb.cn/member/o/2336" target="_blank">
          <LazyImage src="https://upload.storeweb.cn/image/logo.png" alt="个站商店" height={16}
                     width={16} />
        </a>
        <a href="https://www.boyouquan.com/planet-shuttle" target="_blank">
          <LazyImage src="https://www.boyouquan.com/assets/images/sites/logo/planet-shuttle-dark.svg" alt="博友圈" height={20}
                     width={100} />
        </a>
        <a href="https://boke.lu" target="_blank">
          <LazyImage src="https://boke.lu/logo/横板新图标透明背景.png" alt="博客录" height={16}
                     width={100} />
        </a>
      </div>
    </footer>
  )
}

export default Footer

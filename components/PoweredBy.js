import { siteConfig } from '@/lib/config'

/**
 * 驱动版权
 * @returns
 */
export default function PoweredBy(props) {
  return (
    <div className={`inline text-sm font-serif ${props.className || ''}`}>
      <span className='mr-1 text-gray-500 dark:text-indigo-300'>Powered by</span>
      <a
        href='https://github.com/tangly1024/NotionNext'
        className='mr-1 text-gray-500 dark:text-indigo-300'>
        NotionNext {siteConfig('VERSION')}
      </a>
      &nbsp;
      <span className='mr-1 text-gray-500 dark:text-indigo-300'><a href='https://vercel.com/' target="_blank" >Vercel</a> <a href='https://www.netlify.com/' target='_blank'>Netlify</a> <a href='https://zeabur.cn/' target='_blank'>Zeabur</a></span>
    </div>
  )
}

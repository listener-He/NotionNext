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
      <span className='mr-1 text-gray-500 dark:text-indigo-300'>Vercel & Netlify</span>
    </div>
  )
}

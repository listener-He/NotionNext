import { siteConfig } from '@/lib/config'

/**
 * 驱动版权
 * @returns
 */
export default function PoweredBy(props) {
  return (
    <div className={`inline text-sm font-serif ${props.className || ''}`}>
      <span className='mr-1 text-gray-500 dark:text-gray-400'>Powered by</span>
      <a
        href='https://github.com/tangly1024/NotionNext'
        className='underline justify-start text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-xs'>
        NotionNext {siteConfig('VERSION')} Vercel Netlify
      </a>
      .
    </div>
  )
}

import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import LazyImage from '@/components/LazyImage'

/**
 * 驱动版权
 * @returns
 */
export default function PoweredBy(props) {
  const { isDarkMode } = useGlobal()

  return (
    <div className={`flex items-center text-sm font-serif ${props.className || ''}`}>
      <span className='mr-1 text-gray-500 dark:text-indigo-300'>Powered by</span>
      <a
        href='https://github.com/tangly1024/NotionNext'
        className='mr-1 text-gray-500 dark:text-indigo-300 flex items-center'>
        <LazyImage src={ isDarkMode ? '/svg/nextjs-dark.svg' : '/svg/nextjs-light.svg'} alt='NotionNext' width={25} height={25} />
        <span className='ml-1'>NotionNext {siteConfig('VERSION')}</span>
      </a>
      &nbsp;
      <div className='flex items-center space-x-2'>
        <a href='https://vercel.com/' target="_blank" rel="noopener noreferrer">
          <LazyImage src={ isDarkMode ? '/svg/vercel-dark.svg' : '/svg/vercel-light.svg'} alt="Vercel" width={50} height={50} />
        </a>
        <a
          href='https://www.netlify.com/' target='_blank' rel="noopener noreferrer">
          <LazyImage src="/svg/netlify-50.svg" alt="Netlify" width={50} height={50} />
        </a>
        <a href="https://zeabur.com/referral?referralCode=honesty&utm_source=listener-He" target="_blank" rel="noopener noreferrer">
          <LazyImage src="https://zeabur.com/deployed-on-zeabur-dark.svg" height={50} width={100} alt="Deployed on Zeabur"/>
        </a>
      </div>
    </div>
  )
}

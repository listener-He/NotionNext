import { siteConfig } from '@/lib/config'
import SmartLink from '@/components/SmartLink'
/**
 * Logo
 * 实际值支持文字
 * @param {*} props
 * @returns
 */
const Logo = props => {
  const { siteInfo } = props
  return (
    <SmartLink href='/'>
      <div className='flex flex-col justify-center items-center cursor-pointer space-y-3'>
        <div className='font-medium text-lg p-1.5 rounded text-primary dark:text-white menu-link transform duration-200'>
          {siteInfo?.title || siteConfig('TITLE')}
        </div>
      </div>
    </SmartLink>
  )
}
export default Logo

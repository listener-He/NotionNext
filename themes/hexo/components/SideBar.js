import LazyImage from '@/components/LazyImage'
import { siteConfig } from '@/lib/config'
import { useRouter } from 'next/router'
import MenuGroupCard from './MenuGroupCard'
import { MenuListSide } from './MenuListSide'

/**
 * 侧边抽屉
 * @param tags
 * @param currentTag
 * @returns {JSX.Element}
 * @constructor
 */
const SideBar = props => {
  const { siteInfo } = props
  const router = useRouter()
  return (
    <div id='side-bar' className="relative w-full">
      <div className='h-52 w-full flex justify-center items-center'>
        <div className='flex flex-col items-center'>
          <div
            onClick={() => {
              router.push('/')
            }}
            className='justify-center items-center flex hover:rotate-6 transition-transform duration-500 cursor-pointer mb-4'>
            {/* 头像 */}
            <div className="rounded-full border-2 border-white/50 dark:border-gray-700/50 shadow-elevation-md p-1 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
                <LazyImage
                  src={siteInfo?.icon}
                  className='rounded-full'
                  width={80}
                  alt={siteConfig('AUTHOR')}
                />
            </div>
          </div>
          {/* 总览 */}
          <MenuGroupCard {...props} />
        </div>
      </div>
      {/* 侧拉抽屉的菜单 */}
      <div className="px-2">
        <MenuListSide {...props} />
      </div>
    </div>
  )
}

export default SideBar

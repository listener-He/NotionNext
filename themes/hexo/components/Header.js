import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import throttle from 'lodash.throttle'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import CONFIG from '../config'
import ButtonRandomPost from './ButtonRandomPost'
import CategoryGroup from './CategoryGroup'
import Logo from './Logo'
import { MenuListTop } from './MenuListTop'
import SearchButton from './SearchButton'
import SearchDrawer from './SearchDrawer'
import SideBarDrawer from './SideBarDrawer'
import TagGroups from './TagGroups'
import dynamic from 'next/dynamic'

const SideBar = dynamic(() => import('./SideBar'), { ssr: false })

let windowTop = 0

/**
 * 顶部导航
 * @param {*} param0
 * @returns
 */
const Header = props => {
  const searchDrawer = useRef()
  const { tags, currentTag, categories, currentCategory } = props
  const { locale } = useGlobal()
  const router = useRouter()
  const [isOpen, changeShow] = useState(false)
  const showSearchButton = siteConfig('HEXO_MENU_SEARCH', false, CONFIG)
  const showRandomButton = siteConfig('HEXO_MENU_RANDOM', false, CONFIG)

  const toggleMenuOpen = () => {
    changeShow(!isOpen)
  }

  const toggleSideBarClose = () => {
    changeShow(false)
  }

  // 监听滚动
  useEffect(() => {
    window.addEventListener('scroll', topNavStyleHandler, { passive: true })
    router.events.on('routeChangeComplete', topNavStyleHandler)
    topNavStyleHandler()
    return () => {
      router.events.off('routeChangeComplete', topNavStyleHandler)
      window.removeEventListener('scroll', topNavStyleHandler)
    }
  }, [])

  const throttleMs = 200

  const topNavStyleHandler = useCallback(
    throttle(() => {
      const scrollS = window.scrollY
      const nav = document.querySelector('#sticky-nav')
      // 首页和文章页会有头图
      const header = document.querySelector('#header')
      const navHeight = nav?.clientHeight || 0
      const headerHeight = header?.clientHeight || 0
      // 导航栏和头图是否重叠
      const scrollInHeader =
        header &&
        (scrollS < 10 || scrollS < headerHeight - navHeight - 50) // 透明导航条的条件

      if (scrollInHeader) {
        // Remove glass effect, make transparent
        nav && nav.classList.remove('glass-nav')
        nav && nav.classList.add('bg-transparent')
        nav && nav.classList.remove('shadow-elevation-sm')
      } else {
        // Add glass effect
        nav && nav.classList.remove('bg-transparent')
        nav && nav.classList.add('glass-nav')
        nav && nav.classList.add('shadow-elevation-sm')
      }

      if (scrollInHeader) {
        nav && nav.classList.remove('text-primary')
        nav && nav.classList.remove('dark:text-primary')
        nav && nav.classList.add('text-white')
        nav && nav.classList.add('dark:text-white')
      } else {
        nav && nav.classList.remove('text-white')
        nav && nav.classList.remove('dark:text-white')
        nav && nav.classList.add('text-primary')
        nav && nav.classList.add('dark:text-primary')
      }

      // 导航栏不在头图里，且页面向下滚动一定程度 隐藏导航栏
      const showNav =
        scrollS <= windowTop ||
        scrollS < 5 ||
        (header && scrollS <= headerHeight + 100)
      if (!showNav) {
        nav && nav.classList.replace('top-0', '-top-20')
        windowTop = scrollS
      } else {
        nav && nav.classList.replace('-top-20', 'top-0')
        windowTop = scrollS
      }
    }, throttleMs)
  )

  const searchDrawerSlot = (
    <>
      {categories && (
        <section className='mt-8'>
          <div className='text-sm flex flex-nowrap justify-between font-light px-2'>
            <div className='text-primary dark:text-primary'>
              <i className='mr-2 fas fa-th-list' />
              {locale.COMMON.CATEGORY}
            </div>
            <SmartLink
              href={'/category'}
              passHref
              className='mb-3 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:underline cursor-pointer'>
              {locale.COMMON.MORE} <i className='fas fa-angle-double-right' />
            </SmartLink>
          </div>
          <CategoryGroup
            currentCategory={currentCategory}
            categories={categories}
          />
        </section>
      )}

      {tags && (
        <section className='mt-4'>
          <div className='text-sm py-2 px-2 flex flex-nowrap justify-between font-light'>
            <div className='text-primary dark:text-primary'>
              <i className='mr-2 fas fa-tag' />
              {locale.COMMON.TAGS}
            </div>
            <SmartLink
              href={'/tag'}
              passHref
              className='text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:underline cursor-pointer'>
              {locale.COMMON.MORE} <i className='fas fa-angle-double-right' />
            </SmartLink>
          </div>
          <div className='p-2'>
            <TagGroups tags={tags} currentTag={currentTag} />
          </div>
        </section>
      )}
    </>
  )

  return (
    <div id='top-nav' className='z-40'>
      <SearchDrawer cRef={searchDrawer} slot={searchDrawerSlot} />

      {/* 导航栏 */}
      <div
        id='sticky-nav'
        style={{
          willChange: 'top'
        }}
        className={
          'top-0 duration-300 transition-all fixed bg-transparent text-white w-full z-20 transform border-transparent'
        }>
        <div className='w-full flex justify-between items-center px-4 py-1'>
          <div className='flex'>
            <Logo {...props} />
          </div>

          {/* 右侧功能 */}
          <div className='flex justify-end items-center space-x-2 text-xs text-inherit mr-1'>
            <div className='hidden lg:flex'>
              {' '}
              <MenuListTop {...props} />
            </div>
            <div
              onClick={toggleMenuOpen}
              className='w-8 justify-center items-center h-8 cursor-pointer flex lg:hidden text-inherit'
              role='button'
              aria-label='Toggle menu'
              aria-expanded={isOpen}
              aria-controls='mobile-sidebar'>
              {isOpen ? (
                <i className='fas fa-times text-inherit' />
              ) : (
                <i className='fas fa-bars text-inherit' />
              )}
            </div>
            {showSearchButton && <SearchButton />}
            {showRandomButton && <ButtonRandomPost {...props} />}
          </div>
        </div>
      </div>

      {/* 折叠侧边栏 */}
      <SideBarDrawer id='mobile-sidebar' isOpen={isOpen} onClose={toggleSideBarClose}>
        <SideBar {...props} />
      </SideBarDrawer>
    </div>
  )
}

export default Header

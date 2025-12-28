import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import SmartLink from '@/components/SmartLink'
import CONFIG from '../config'

const MenuGroupCard = props => {
  const { postCount, categoryOptions, tagOptions, tagCount } = props
  const { locale } = useGlobal()
  const archiveSlot = <div className='text-center'>{postCount}</div>
  const categorySlot = (
    <div className='text-center'>{categoryOptions?.length}</div>
  )
  const tagSlot = <div className='text-center'>{tagCount ? tagCount : tagOptions?.length}</div>

  const links = [
    {
      name: locale.COMMON.ARTICLE,
      href: '/archive',
      slot: archiveSlot,
      show: siteConfig('HEXO_MENU_ARCHIVE', null, CONFIG)
    },
    {
      name: locale.COMMON.CATEGORY,
      href: '/category',
      slot: categorySlot,
      show: siteConfig('HEXO_MENU_CATEGORY', null, CONFIG)
    },
    {
      name: locale.COMMON.TAGS,
      href: '/tag',
      slot: tagSlot,
      show: siteConfig('HEXO_MENU_TAG', null, CONFIG)
    }
  ]

  for (let i = 0; i < links.length; i++) {
    if (links[i].id !== i) {
      links[i].id = i
    }
  }

  return (
    <nav
      id='nav'
      className='leading-8 flex justify-center  dark:text-gray-200 w-full'>
      {links.map(link => {
        if (link.show) {
          return (
            <SmartLink
              key={`${link.href}`}
              title={link.href}
              href={link.href}
              target={link?.target}
              className={
                'py-sm my-xs px-sm duration-300 ease-standard text-base justify-center items-center cursor-pointer tap-target'
              }>
              <div className='w-full items-center justify-center hover:scale-105 duration-300 ease-standard transform dark:hover:text-indigo-400 hover:text-indigo-600'>
                <div className='text-center truncate'>{link.name}</div>
                <div className='text-center font-semibold truncate'>{link.slot}</div>
              </div>
            </SmartLink>
          )
        } else {
          return null
        }
      })}
    </nav>
  )
}
export default MenuGroupCard

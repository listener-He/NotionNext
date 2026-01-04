import SmartLink from '@/components/SmartLink'
import { useState } from 'react'
/**
 * 支持二级展开的菜单
 * @param {*} param0
 * @returns
 */
export const MenuItemDrop = ({ link }) => {
  const [show, changeShow] = useState(false)
  const hasSubMenu = link?.subMenus?.length > 0

  if (!link || !link.show) {
    return null
  }

  return (
    <div
      onMouseOver={() => changeShow(true)}
      onMouseOut={() => changeShow(false)}>
      {!hasSubMenu && (
        <SmartLink
          href={link?.href}
          target={link?.target}
          className=' menu-link pl-2 pr-4 no-underline tracking-widest pb-1 text-gray-700 hover:text-gray-900 dark:text-indigo-200 dark:hover:text-white'>
          {link?.icon && <i className={link?.icon} />} {link?.name}
          {hasSubMenu && <i className='px-2 fa fa-angle-down'></i>}
        </SmartLink>
      )}

      {hasSubMenu && (
        <>
          <div className='cursor-pointer menu-link pl-2 pr-4 no-underline tracking-widest pb-1 relative text-gray-700 hover:text-gray-900 dark:text-indigo-200 dark:hover:text-white'>
            {link?.icon && <i className={link?.icon} />} {link?.name}
            <i
              className={`px-2 fa fa-angle-down duration-300  ${show ? 'rotate-180' : 'rotate-0'}`}></i>
            {/* 主菜单下方的安全区域 */}
            {show && (
              <div className='absolute w-full h-3 -bottom-1 left-0 bg-transparent z-30'></div>
            )}
          </div>
        </>
      )}

      {/* 子菜单 */}
      {hasSubMenu && (
        <ul
          className={`${show ? 'visible opacity-100 top-12 pointer-events-auto' : 'invisible opacity-0 top-20 pointer-events-none'} overflow-hidden rounded-md transition-all duration-300 z-20 absolute block glass-layer-strong text-gray-700 dark:text-indigo-100`}>
          {link.subMenus.map((sLink, index) => {
            return (
              <li
                key={index}
                className='cursor-pointer tracking-widest transition-all duration-200 py-1 pr-6 pl-3 hover:bg-black/80 hover:text-white dark:hover:bg-indigo-600/30 dark:hover:text-indigo-50'>
                <SmartLink href={sLink.href} target={link?.target}>
                  <span className='text-sm text-nowrap font-medium'>
                    {link?.icon && <i className={sLink?.icon}> &nbsp; </i>}
                    {sLink.title}
                  </span>
                </SmartLink>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

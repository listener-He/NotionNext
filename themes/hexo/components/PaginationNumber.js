import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'

/**
 * 数字翻页插件
 * @param page 当前页码
 * @param showNext 是否有下一页
 * @returns {JSX.Element}
 * @constructor
 */
const PaginationNumber = ({ page, totalPage }) => {
  const router = useRouter()
  const currentPage = +page
  const showNext = page < totalPage
  const pagePrefix = router.asPath
    .split('?')[0]
    .replace(/\/page\/[1-9]\d*/, '')
    .replace(/\/$/, '')
    .replace('.html', '')
  const pages = generatePages(pagePrefix, page, currentPage, totalPage)

  return (
    <div className='mt-xl mb-md flex justify-center items-end font-medium text-secondary duration-300 ease-standard py-sm space-x-sm'>
      {/* 上一页 */}
      <SmartLink
        href={{
          pathname:
            currentPage === 2
              ? `${pagePrefix}/`
              : `${pagePrefix}/page/${currentPage - 1}`,
          query: router.query.s ? { s: router.query.s } : {}
        }}
        rel='prev'
        className={`${currentPage === 1 ? 'invisible' : 'block'} pb-0.5 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white w-6 text-center cursor-pointer duration-300 ease-standard hover:font-bold`}>
        <i className='fas fa-angle-left' />
      </SmartLink>

      {pages}

      {/* 下一页 */}
      <SmartLink
        href={{
          pathname: `${pagePrefix}/page/${currentPage + 1}`,
          query: router.query.s ? { s: router.query.s } : {}
        }}
        rel='next'
        className={`${showNext ? 'block' : 'invisible'} pb-0.5 hover:bg-black/80 dark:hover:bg-white/20 hover:text-white w-6 text-center cursor-pointer duration-300 ease-standard hover:font-bold`}>
        <i className='fas fa-angle-right' />
      </SmartLink>
    </div>
  )
}

/**
 * 获取页码
 * @param {*} page
 * @param {*} currentPage
 * @param {*} pagePrefix
 * @returns
 */
function getPageElement(page, currentPage, pagePrefix) {
  const selected = page + '' === currentPage + ''
  return (
    <SmartLink
      href={page === 1 ? `${pagePrefix}/` : `${pagePrefix}/page/${page}`}
      key={page}
      passHref
      className={`${
        selected
          ? 'font-bold bg-primary text-white dark:bg-white/20 shadow-md'
          : 'text-secondary hover:border-primary hover:bg-primary hover:text-white dark:text-gray-300 glass-layer-soft hover:shadow-md'
      } duration-300 ease-standard cursor-pointer pb-0.5 w-6 text-center rounded-lg`}>
      {page}
    </SmartLink>
  )
}

function generatePages(pagePrefix, page, currentPage, totalPage) {
  const pages = []
  const groupCount = 7 // 最多显示页签数
  if (totalPage <= groupCount) {
    for (let i = 1; i <= totalPage; i++) {
      pages.push(getPageElement(i, page, pagePrefix))
    }
  } else {
    pages.push(getPageElement(1, page, pagePrefix))
    const dynamicGroupCount = groupCount - 2
    let startPage = currentPage - 2
    if (startPage <= 1) {
      startPage = 2
    }
    if (startPage + dynamicGroupCount > totalPage) {
      startPage = totalPage - dynamicGroupCount
    }
    if (startPage > 2) {
      pages.push(<div key={-1}>... </div>)
    }

    for (let i = 0; i < dynamicGroupCount; i++) {
      if (startPage + i < totalPage) {
        pages.push(getPageElement(startPage + i, page, pagePrefix))
      }
    }

    if (startPage + dynamicGroupCount < totalPage) {
      pages.push(<div key={-2}>... </div>)
    }

    pages.push(getPageElement(totalPage, page, pagePrefix))
  }
  return pages
}
export default PaginationNumber
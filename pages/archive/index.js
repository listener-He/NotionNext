import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { isBrowser } from '@/lib/utils'
import { formatDateFmt } from '@/lib/utils/formatDate'
import { DynamicLayout } from '@/themes/theme'
import { useEffect } from 'react'

/**
 * 归档首页
 * @param {*} props
 * @returns
 */
const ArchiveIndex = props => {
  useEffect(() => {
    if (isBrowser) {
      const anchor = window.location.hash
      if (anchor) {
        setTimeout(() => {
          const anchorElement = document.getElementById(anchor.substring(1))
          if (anchorElement) {
            anchorElement.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }
        }, 300)
      }
    }
  }, [])

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutArchive' {...props} />
}

export async function getStaticProps({ locale }) {
  const props = await fetchGlobalAllData({ from: 'archive-index', locale })
  // 优化：只获取归档页需要的数据类型
  // const props = await getGlobalData({
  //   from: 'archive-index',
  //   locale,
  //   dataTypes: ['allPages']
  // })
  // 处理分页
  props.posts = Array.isArray(props.allPages)
    ? props.allPages.filter(
        page => page.type === 'Post' && page.status === 'Published'
      )
    : []

  // 归档页仅展示标题/日期/链接，用更精简的映射（丢弃 summary/cover/tags 等），
  // 大幅缩小 archivePosts 体积
  const leanArchivePost = p => ({
    id: p?.id ?? null,
    title: p?.title ?? null,
    slug: p?.slug ?? null,
    prefix: p?.prefix ?? null,
    href: p?.href ?? null,
    date: p?.date ?? null,
    publishDate: p?.publishDate ?? null,
    publishDay: p?.publishDay ?? null
  })
  const postsSortByDate = Array.isArray(props.posts) ? props.posts.map(leanArchivePost) : [];

  postsSortByDate.sort((a, b) => {
    return b?.publishDate - a?.publishDate
  })

  const archivePosts = {}

  postsSortByDate.forEach(post => {
    const date = formatDateFmt(post.publishDate, 'yyyy-MM')
    if (archivePosts[date]) {
      archivePosts[date].push(post)
    } else {
      archivePosts[date] = [post]
    }
  })

  // 确保 archivePosts 不为 null 或 undefined
  props.archivePosts = archivePosts || {}
  delete props.posts
  delete props.allPages
  delete props.allNavPages

  const revalidate = process.env.EXPORT
    ? undefined
    : siteConfig(
      'NEXT_REVALIDATE_SECOND',
      BLOG.NEXT_REVALIDATE_SECOND,
      props.NOTION_CONFIG
    )  * 3;
  return {
    props,
    revalidate: revalidate
  }
}

export default ArchiveIndex

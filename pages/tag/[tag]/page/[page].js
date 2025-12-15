import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'
import { leanListPost } from '@/lib/utils/leanPost'

const Tag = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export async function getStaticProps({ params: { tag, page }, locale }) {
  const from = 'tag-page-props'
  const props = await getGlobalData({ from, locale })
  // 过滤状态、标签
  props.posts = props.allPages
    ?.filter(page => page.type === 'Post' && page.status === 'Published')
    // 修复标签筛选逻辑，检查tagItems数组中是否存在匹配的标签名称
    .filter(post => post && post?.tagItems && post?.tagItems.some(t => t.name === tag))
  // 处理文章数
  props.postCount = props.posts.length
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  // 处理分页
  props.posts = props.posts.slice(
    POSTS_PER_PAGE * (page - 1),
    POSTS_PER_PAGE * page
  )
  props.posts = props.posts.map(leanListPost)

  props.tag = tag
  props.page = page
  
  // 性能优化：清理不必要的数据
  delete props.allPages
  delete props.latestPosts // 标签分页页面通常不需要最新文章数据
  delete props.allNavPages // 标签分页页面通常不需要导航页面数据
  return {
    props,
    revalidate: process.env.EXPORT
      ? undefined
      : siteConfig(
          'NEXT_REVALIDATE_SECOND',
          BLOG.NEXT_REVALIDATE_SECOND,
          props.NOTION_CONFIG
        )
  }
}

export async function getStaticPaths() {
  const from = 'tag-page-paths'
  const { tagOptions, allPages } = await getGlobalData({ from })
  const paths = []

  tagOptions?.forEach(tag => {
    // 过滤状态类型
    const tagPosts = allPages
      ?.filter(page => page.type === 'Post' && page.status === 'Published')
      // 修复标签筛选逻辑，检查tagItems数组中是否存在匹配的标签名称
      .filter(post => post && post?.tagItems && post?.tagItems.some(t => t.name === tag.name))
    // 处理文章页数
    const postCount = tagPosts.length
    const totalPages = Math.ceil(
      postCount / siteConfig('POSTS_PER_PAGE', 12)
    )
    if (totalPages > 1) {
      for (let i = 2; i <= totalPages; i++) {
        paths.push({ params: { tag: tag.name, page: '' + i } })
      }
    }
  })

  return {
    paths,
    fallback: true
  }
}

export default Tag

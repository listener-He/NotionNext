import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData, getPostBlocks } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'
import { getPreviewConfig } from '@/lib/performance.config'

/**
 * 文章列表分页
 * @param {*} props
 * @returns
 */
const Page = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export async function getStaticPaths({ locale }) {
  const from = 'page-paths'
  // 优化：只获取分页路径生成需要的数据类型
  const { postCount, NOTION_CONFIG } = await getGlobalData({ 
    from, 
    locale,
    dataTypes: ['allPages', 'NOTION_CONFIG'] 
  })
  const totalPages = Math.ceil(
    postCount / siteConfig('POSTS_PER_PAGE', null, NOTION_CONFIG)
  )
  return {
    // remove first page, we 're not gonna handle that.
    paths: Array.from({ length: totalPages - 1 }, (_, i) => ({
      params: { page: '' + (i + 2) }
    })),
    fallback: true
  }
}

export async function getStaticProps({ params: { page }, locale }) {
  const from = `page-${page}`
  // 优化：只获取分页页面需要的数据类型
  const props = await getGlobalData({ 
    from, 
    locale,
    dataTypes: ['allPages', 'NOTION_CONFIG', 'siteInfo'] 
  })
  const { allPages } = props
  const POST_PREVIEW_LINES = siteConfig(
    'POST_PREVIEW_LINES',
    12,
    props?.NOTION_CONFIG
  )

  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  // 处理分页
  props.posts = allPosts.slice(
    POSTS_PER_PAGE * (page - 1),
    POSTS_PER_PAGE * page
  )
  props.page = parseInt(page)

  // 处理预览 - 性能优化：使用配置化的预览限制
  if (siteConfig('POST_LIST_PREVIEW', false, props?.NOTION_CONFIG)) {
    const previewConfig = getPreviewConfig('page')

    // 限制预览内容的加载数量，避免数据过大
    const maxPreviewPosts = Math.min(props.posts.length, previewConfig.maxPosts)
    for (let i = 0; i < maxPreviewPosts; i++) {
      const post = props.posts[i]
      if (post.password && post.password !== '') {
        continue
      }
      // 使用配置化的预览行数
      const previewLines = Math.min(POST_PREVIEW_LINES, previewConfig.maxLines)
      post.blockMap = await getPostBlocks(post.id, 'slug', previewLines)
    }
  }

  // 性能优化：清理不必要的数据
  delete props.allPages
  delete props.latestPosts // 分页页面通常不需要最新文章数据
  delete props.allNavPages // 分页页面通常不需要导航页面数据
  delete props.tagOptions
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

export default Page

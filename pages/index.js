import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData, getPostBlocks } from '@/lib/db/getSiteData'
import { generateRobotsTxt } from '@/lib/robots.txt'
import { DynamicLayout } from '@/themes/theme'
import { generateRedirectJson } from '@/lib/redirect'
import { checkDataFromAlgolia } from '@/lib/plugins/algolia'
import { getPreviewConfig } from '@/lib/performance.config'
import { generateSitemap } from '@/lib/sitemap'

/**
 * 首页布局
 * @param {*} props
 * @returns
 */
const Index = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutIndex' {...props} />
}

/**
 * SSG 获取数据
 * @returns
 */
export async function getStaticProps(req) {
  const { locale } = req
  const from = 'index'
  // 优化：只获取首页需要的数据类型
  const props = await getGlobalData({
    from,
    locale,
    dataTypes: ['allPages', 'siteInfo', 'tagOptions', 'categoryOptions', 'NOTION_CONFIG', 'latestPosts']
  })
  const POST_PREVIEW_LINES = siteConfig(
    'POST_PREVIEW_LINES',
    12,
    props?.NOTION_CONFIG
  )
  props.posts = props.allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )

  // 处理分页
  if (siteConfig('POST_LIST_STYLE') === 'scroll') {
    // 滚动列表默认给前端返回所有数据
  } else if (siteConfig('POST_LIST_STYLE') === 'page') {
    props.posts = props.posts?.slice(
      0,
      siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
    )
  }

  // 预览文章内容 - 性能优化：使用配置化的预览限制
  if (siteConfig('POST_LIST_PREVIEW', false, props?.NOTION_CONFIG)) {
    const previewConfig = getPreviewConfig('index')

    // 限制预览文章数量，避免首页数据过大
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

  // 生成robotTxt
  generateRobotsTxt(props)
  // 生成Feed订阅
  //generateRss(props)
  // 生成
  generateSitemap(props)
  // 检查数据是否需要从algolia删除
  checkDataFromAlgolia(props)
  if (siteConfig('UUID_REDIRECT', false, props?.NOTION_CONFIG)) {
    // 生成重定向 JSON
    generateRedirectJson(props)
  }

  // 生成全文索引 - 仅在 yarn build 时执行 && process.env.npm_lifecycle_event === 'build'
  delete props.allPages
  delete props.allNavPages
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

export default Index

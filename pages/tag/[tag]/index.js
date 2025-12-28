import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'
import { leanListPost } from '@/lib/utils/leanPost'

/**
 * 标签下的文章列表
 * @param {*} props
 * @returns
 */
const Tag = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export async function getStaticProps({ params: { tag }, locale }) {
  const from = 'tag-props'
  // 优化：只获取标签页需要的数据类型
  const props = await getGlobalData({ 
    from, 
    locale,
    dataTypes: ['allPages'] // 标签页只需要文章数据
  })

  // 过滤状态
  props.posts = props.allPages
    ?.filter(page => page.type === 'Post' && page.status === 'Published')
    // 修复标签筛选逻辑，检查tagItems数组中是否存在匹配的标签名称
    .filter(post => post && post?.tagItems && post?.tagItems.some(t => t.name === tag))
    .map(leanListPost)

  // 处理文章页数
  props.postCount = props.posts.length

  // 处理分页
  if (siteConfig('POST_LIST_STYLE') === 'scroll') {
    // 滚动列表 给前端返回所有数据
  } else if (siteConfig('POST_LIST_STYLE') === 'page') {
    props.posts = props.posts?.slice(
      0,
      siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
    )
  }

  props.tag = tag
  delete props.allPages
  delete props.latestPosts
  delete props.allNavPages
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

/**
 * 获取所有的标签
 * @returns
 * @param tags
 */
function getTagNames(tags) {
  const tagNames = []
  tags.forEach(tag => {
    tagNames.push(tag.name)
  })
  return tagNames
}

export async function getStaticPaths() {
  const from = 'tag-static-path'
  // 优化：只获取标签相关的数据
  const { tagOptions } = await getGlobalData({ 
    from,
    dataTypes: ['tagOptions'] 
  })
  const tagNames = getTagNames(tagOptions)

  return {
    paths: Object.keys(tagNames).map(index => ({
      params: { tag: tagNames[index] }
    })),
    fallback: true
  }
}

export default Tag

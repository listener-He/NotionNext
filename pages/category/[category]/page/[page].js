import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'
import { leanListPost } from '@/lib/utils/leanPost'

/**
 * 分类页
 * @param {*} props
 * @returns
 */

export default function Category(props) {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='LayoutPostList' {...props} />
}

export async function getStaticProps({ params: { category, page } }) {
  const from = 'category-page-props'
  let props = await getGlobalData({ from })

  // 过滤状态类型
  props.posts = props.allPages
    ?.filter(page => page.type === 'Post' && page.status === 'Published')
    // 精确匹配分类名称
    .filter(post => post && post.category && post.category === category)
  // 处理文章页数
  props.postCount = props.posts.length
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', 12, props?.NOTION_CONFIG)
  // 处理分页
  props.posts = props.posts.slice(
    POSTS_PER_PAGE * (page - 1),
    POSTS_PER_PAGE * page
  )
  props.posts = props.posts.map(leanListPost)

  // 性能优化：清理不必要的数据
  delete props.allPages
  delete props.latestPosts // 分类分页页面通常不需要最新文章数据
  delete props.allNavPages // 分类分页页面通常不需要导航页面数据
  
  props.page = page
  props = { ...props, category, page }

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
  const from = 'category-page-paths'
  const { categoryOptions, allPages } = await getGlobalData({ from })
  
  const paths = []
  
  // 为每个分类生成分页路径
  categoryOptions?.forEach(category => {
    // 过滤该分类下的文章
    const categoryPosts = allPages
      ?.filter(page => page.type === 'Post' && page.status === 'Published')
      .filter(post => post && post.category && post.category === category.name)
    
    // 计算该分类的文章数量
    const postCount = categoryPosts?.length || 0
    const totalPages = Math.ceil(
      postCount / siteConfig('POSTS_PER_PAGE', 12)
    )
    
    // 为每一页生成路径
    if (totalPages > 1) {
      for (let i = 2; i <= totalPages; i++) {
        paths.push({ 
          params: { 
            category: category.name, 
            page: '' + i 
          } 
        })
      }
    }
  })

  return {
    paths,
    fallback: true
  }
}

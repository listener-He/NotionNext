import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData, getPost } from '@/lib/db/getSiteData'
import { checkSlugHasOneSlash, processPostData } from '@/lib/utils/post'
import { idToUuid } from 'notion-utils'
import Slug from '..'
import { calculatePostCacheTime } from '@/lib/cache/cache_coefficient'

/**
 * 根据notion的slug访问页面
 * 解析二级目录 /article/about
 * @param {*} props
 * @returns
 */
const PrefixSlug = props => {
  return <Slug {...props} />
}

export async function getStaticPaths() {
  if (!BLOG.isProd) {
    return {
      paths: [],
      fallback: true
    }
  }

  const from = 'slug-paths'
  const { allPages } = await getGlobalData({ from })

  // 根据slug中的 / 分割成prefix和slug两个字段 ; 例如 article/test
  // 最终用户可以通过  [domain]/[prefix]/[slug] 路径访问，即这里的 [domain]/article/test
  // 添加空值检查
  const paths = allPages
    ?.filter(row => row?.slug && checkSlugHasOneSlash(row))
    .map(row => ({
      params: { prefix: row.slug.split('/')[0], slug: row.slug.split('/')[1] }
    })) || []

  // 增加一种访问路径 允许通过 [category]/[slug] 访问文章
  // 例如文章slug 是 test ，然后文章的分类category是 production
  // 则除了 [domain]/[slug] 以外，还支持分类名访问: [domain]/[category]/[slug]

  return {
    paths: paths,
    fallback: true
  }
}

export async function getStaticProps({ params: { prefix, slug }, locale }) {
  const fullSlug = prefix + '/' + slug
  const from = `slug-props-${fullSlug}`
  const props = await getGlobalData({ from, locale })

  // 在列表内查找文章
  // 添加额外检查确保 allPages 存在且为数组
  if (Array.isArray(props?.allPages)) {
    props.post = props.allPages.find(p => {
      return (
        p.type.indexOf('Menu') < 0 &&
        (p.slug === slug || p.slug === fullSlug || p.id === idToUuid(fullSlug))
      )
    })
  } else {
    props.post = null
  }

  // 处理非列表内文章的内信息
  if (!props?.post) {
    const pageId = slug.slice(-1)[0]
    if (pageId && pageId.length >= 32) {
      const post = await getPost(pageId)
      props.post = post
    }
  }

  if (!props?.post) {
    // 无法获取文章
    props.post = null
  } else {
    // 确保在处理文章数据前 allPages 是有效数组
    if (!Array.isArray(props.allPages)) {
      props.allPages = []
    }
    await processPostData(props, from)
  }
  
  // 计算文章缓存时间
  let revalidate = process.env.EXPORT
    ? undefined
    : siteConfig(
        'NEXT_REVALIDATE_SECOND',
        BLOG.NEXT_REVALIDATE_SECOND,
        props.NOTION_CONFIG
      )
  
  // 如果是文章页面，根据最后更新时间计算缓存时间
  if (props?.post?.lastEditedDate) {
    const lastEditedTimestamp = new Date(props.post.lastEditedDate).getTime()
    revalidate = calculatePostCacheTime(BLOG.NEXT_REVALIDATE_SECOND, lastEditedTimestamp)
  }
  
  return {
    props,
    revalidate
  }
}

export default PrefixSlug
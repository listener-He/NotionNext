import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData, resolvePostProps } from '@/lib/db/SiteDataApi'
import Slug from '..'
import { checkSlugHasOneSlash } from '@/lib/utils/post'
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
  const { allPages } = await fetchGlobalAllData({ from })
  // 优化：只获取路径生成需要的数据类型
  // const { allPages } = await getGlobalData({
  //   from,
  //   dataTypes: ['allPages']
  // })
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
  console.log('[DEBUG] getStaticProps called with prefix:', prefix, 'slug:', slug)

  const fullSlug = prefix + '/' + slug
  console.log('[DEBUG] Constructed fullSlug:', fullSlug)

  const props = await resolvePostProps({
    prefix,
    slug,
    locale,
  })

  console.log('[DEBUG] resolvePostProps returned, post exists:', !!props.post, 'post title:', props.post?.title)



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
  delete props.allPages
  delete props.allNavPages
  delete props.tagOptions
  return {
    props,
    revalidate
  }
}

export default PrefixSlug

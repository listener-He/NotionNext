import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { DynamicLayout } from '@/themes/theme'

/**
 * 分类首页
 * @param {*} props
 * @returns
 */
export default function Category(props) {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <DynamicLayout theme={theme} layoutName='LayoutCategoryIndex' {...props} />
  )
}

export async function getStaticProps({ locale }) {
  // 优化：只获取分类首页需要的数据类型
  const props = await getGlobalData({ 
    from: 'category-index-props', 
    locale,
    dataTypes: ['siteInfo', 'categoryOptions', 'NOTION_CONFIG', 'latestPosts'] 
  })
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
        ) * 12
  }
}

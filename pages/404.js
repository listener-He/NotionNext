import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData } from '@/lib/db/SiteDataApi'
import { DynamicLayout } from '@/themes/theme'

/**
 * 404
 * @param {*} props
 * @returns
 */
const NoFound = props => {
  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return <DynamicLayout theme={theme} layoutName='Layout404' {...props} />
}

export async function getStaticProps(req) {
  const { locale } = req

  const props = (await fetchGlobalAllData({ from: '404', locale })) || {}
  // 404 只需布局/菜单数据，删除文章列表等大字段（allPages 约 180kB）
  delete props.allPages
  delete props.allLinkPages
  delete props.allMembers
  delete props.allEvents
  return {
    props,
    revalidate: process.env.EXPORT ? undefined : 3600
  }
}

export default NoFound

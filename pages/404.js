import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
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

  // 优化：只获取404页面需要的数据类型
  const props = (await getGlobalData({ 
    from: '404', 
    locale,
    dataTypes: ['siteInfo', 'NOTION_CONFIG'] 
  })) || {}
  return {
        props,
        revalidate: process.env.EXPORT
      ? undefined : 3600}
}

export default NoFound

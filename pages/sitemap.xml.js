// pages/sitemap.xml.js
import BLOG from '@/blog.config'
import { siteConfig } from '@/lib/config'
import { getGlobalData } from '@/lib/db/getSiteData'
import { extractLangId, extractLangPrefix } from '@/lib/utils/pageId'
import { getServerSideSitemap } from 'next-sitemap'
import { generateSiteAllUrl } from '@/lib/sitemap'

export const getServerSideProps = async ctx => {
  let fields = []
  const siteIds = BLOG.NOTION_PAGE_ID.split(',')
  for (let index = 0; index < siteIds.length; index++) {
    const siteId = siteIds[index]
    const id = extractLangId(siteId)
    //const locale = extractLangPrefix(siteId)
    // 第一个id站点默认语言
    const siteData = await getGlobalData({
      pageId: id,
      from: 'sitemap.xml',
      dataTypes: ['allPages', 'siteInfo', 'NOTION_CONFIG']
    })
    const link = siteConfig(
      'LINK',
      siteData?.siteInfo?.link,
      siteData.NOTION_CONFIG
    )
    const urls = generateSiteAllUrl(link, new Date().toISOString(), siteData.allPages) || []
    const localeFields = urls.map(u => ({
      loc: u.url,
      lastmod: (typeof u.lastmod === 'string' ? u.lastmod.split('T')[0] : new Date().toISOString().split('T')[0]),
      changefreq: u.changefreq,
      priority: u.priority
    }))
    fields = fields.concat(localeFields)
  }

  fields = getUniqueFields(fields);

  // 缓存
  ctx.res.setHeader(
    'Cache-Control',
    'public, max-age=7200, stale-while-revalidate=59'
  )
  return getServerSideSitemap(ctx, fields)
}

function generateLocalesSitemap(link, allPages, locale) {
  // 确保链接不以斜杠结尾
  if (link && link.endsWith('/')) {
    link = link.slice(0, -1)
  }

  if (locale && locale.length > 0 && locale.indexOf('/') !== 0) {
    locale = '/' + locale
  }

  // 更安全地获取当前日期的ISO字符串
  let dateNow = new Date().toISOString();
  try {
    dateNow = dateNow.split('T')[0];
  } catch (error) {
    console.warn('Failed to format current date:', error);
    dateNow = new Date().toISOString(); // 回退到完整ISO格式
  }

  const defaultFields = [
    {
      loc: `${link}${locale}`,
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: `${link}${locale}/archive`,
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: `${link}${locale}/category`,
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: `${link}${locale}/rss/feed.xml`,
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: `${link}${locale}/search`,
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    },
    {
      loc: `${link}${locale}/tag`,
      lastmod: dateNow,
      changefreq: 'daily',
      priority: '0.7'
    }
  ]
  const postFields =
    allPages
      ?.filter(p => p.status === BLOG.NOTION_PROPERTY_NAME.status_publish)
      ?.map(post => {
        const slugWithoutLeadingSlash = post?.slug.startsWith('/')
          ? post?.slug?.slice(1)
          : post.slug

        // 更安全地处理文章发布日期
        let postDate = new Date().toISOString().split('T')[0]; // 默认使用当前日期
        if (post?.publishDay) {
          try {
            const date = new Date(post.publishDay);
            if (date instanceof Date && !isNaN(date.getTime())) {
              postDate = date.toISOString().split('T')[0];
            }
          } catch (error) {
            console.warn('Failed to format post publish date:', post?.publishDay, error);
          }
        }

        return {
          loc: `${link}${locale}/${slugWithoutLeadingSlash}`,
          lastmod: postDate,
          changefreq: 'daily',
          priority: '0.7'
        }
      }) ?? []

  return defaultFields.concat(postFields)
}

function getUniqueFields(fields) {
  const uniqueFieldsMap = new Map();

  fields.forEach(field => {
    const existingField = uniqueFieldsMap.get(field.loc);

    if (!existingField || new Date(field.lastmod) > new Date(existingField.lastmod)) {
      uniqueFieldsMap.set(field.loc, field);
    }
  });

  return Array.from(uniqueFieldsMap.values());
}

export default () => {}

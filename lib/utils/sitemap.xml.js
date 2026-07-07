import BLOG from '@/blog.config'
import fs from 'fs'
import { siteConfig } from '../config'
import {
  buildSitemapLoc,
  normalizeSitemapBaseUrl,
  toSitemapDateString
} from '../sitemap-utils'

// Sitemap 生成缓存
let sitemapCache = {
  lastGeneratedTime: 0,
  intervalMinutes: 60 // 60分钟缓存间隔
}
/**
 * 生成站点地图
 * @param {*} param0
 */
export function generateSitemapXml({ allPages, NOTION_CONFIG }) {
  const now = Date.now()
  const timeDiff = (now - sitemapCache.lastGeneratedTime) / (1000 * 60) // 转换为分钟

  // 检查缓存是否有效
  if (timeDiff < sitemapCache.intervalMinutes) {
    // 检查文件是否存在
    const sitemapExists = fs.existsSync('./public/sitemap.xml')
    if (sitemapExists) {
      // console.log(`[Sitemap] 缓存有效，跳过生成 (${timeDiff.toFixed(1)}分钟前已生成)`)
      return
    }
  }
  const link = normalizeSitemapBaseUrl(siteConfig('LINK', BLOG.LINK, NOTION_CONFIG))
  const dateNow = toSitemapDateString(new Date())
  const urls = [
    {
      loc: buildSitemapLoc({ baseUrl: link }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'archive' }),
      lastmod: dateNow,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'category' }),
      lastmod: dateNow,
      changefreq: 'daily'
    },
    {
      loc: buildSitemapLoc({ baseUrl: link, slug: 'tag' }),
      lastmod: dateNow,
      changefreq: 'daily'
    }
  ].filter(item => Boolean(item?.loc))
  // 循环页面生成
  allPages?.forEach(post => {
    const loc = buildSitemapLoc({
      baseUrl: link,
      slug: post?.slug
    })
    if (!loc) return

    urls.push({
      loc,
      lastmod: toSitemapDateString(post?.publishDay, dateNow),
      changefreq: 'daily'
    })
  })
  const xml = createSitemapXml(urls)
  try {
    fs.writeFileSync('sitemap.xml', xml)
    fs.writeFileSync('./public/sitemap.xml', xml)
    console.log('✅ sitemap.xml 生成成功，缓存已更新')
    // 更新缓存时间
    sitemapCache.lastGeneratedTime = Date.now()
  } catch (error) {
    // 在Vercel等只读文件系统环境中，这里会报错，属于正常情况
    if (error.code === 'EROFS') {
      console.log('⚠️ 只读文件系统，sitemap.xml 无法写入，但这是正常的')
    } else {
      console.warn('❌ sitemap.xml 写入失败:', error.message)
    }
    // 即使写入失败也更新缓存时间，避免重复尝试
    sitemapCache.lastGeneratedTime = Date.now()
  }
}

/**
 * 生成站点地图
 * @param {*} urls
 * @returns
 */
function createSitemapXml(urls) {
  let urlsXml = ''
  urls.forEach(u => {
    urlsXml += `<url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    </url>
    `
  })

  return `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml"
    xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0"
    xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    ${urlsXml}
    </urlset>
    `
}

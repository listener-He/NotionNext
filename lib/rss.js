import BLOG from '@/blog.config'
import NotionPage from '@/components/NotionPage'
import { getPostBlocks } from '@/lib/db/getSiteData'
import { Feed } from 'feed'
import ReactDOMServer from 'react-dom/server'
import { decryptEmail } from '@/lib/plugins/mailEncrypt'

// RSS 生成缓存
let rssCache = {
  lastGeneratedTime: 0,
  intervalMinutes: 120 // RSS缓存间隔（分钟）- 增加到120小时
}

let fsObj = null;

function getFs() {
  if (fsObj) {
    return fsObj
  }
  try {
    fsObj = require('fs')
  } catch (error) {
    fsObj = null
  }
  return fsObj
}

/**
 * 生成RSS内容（保留HTML格式）
 * @param {*} post
 * @returns
 */
const createFeedContent = async (post, maxLength = null) => {
  // 加密的文章内容只返回摘要
  if (post.password && post.password !== '') {
    return post.summary
  }
  const blockMap = await getPostBlocks(post.id, 'rss-content')
  if (blockMap) {
    post.blockMap = blockMap
    const content = ReactDOMServer.renderToString(<NotionPage post={post} />)
    const regexExp =
      /<div class="notion-collection-row"><div class="notion-collection-row-body"><div class="notion-collection-row-property"><div class="notion-collection-column-title"><svg.*?class="notion-collection-column-title-icon">.*?<\/svg><div class="notion-collection-column-title-body">.*?<\/div><\/div><div class="notion-collection-row-value">.*?<\/div><\/div><\/div><\/div>/g
    return content.replace(regexExp, '')
  }
}

/**
 * 生成RSS纯文本内容（去除HTML标签）
 * @param {*} post
 * @param {number} maxLength
 * @returns
 */
const createFeedTextContent = async (post, maxLength = null) => {
  // 加密的文章内容只返回摘要
  if (post.password && post.password !== '') {
    return post.summary
  }
  const blockMap = await getPostBlocks(post.id, 'rss-content')
  if (blockMap) {
    post.blockMap = blockMap
    const content = ReactDOMServer.renderToString(<NotionPage post={post} />)
    const regexExp =
      /<div class="notion-collection-row"><div class="notion-collection-row-body"><div class="notion-collection-row-property"><div class="notion-collection-column-title"><svg.*?class="notion-collection-column-title-icon">.*?<\/svg><div class="notion-collection-column-title-body">.*?<\/div><\/div><div class="notion-collection-row-value">.*?<\/div><\/div><\/div><\/div>/g
    let cleanContent = content.replace(regexExp, '')

    // 去除所有HTML标签，只保留纯文本内容
    cleanContent = cleanContent.replace(/<[^>]*>/g, '')

    // 去除多余的空白字符和换行符
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim()

    // 不再限制内容长度，返回完整内容
    if (maxLength && cleanContent && cleanContent.length > maxLength) {
      cleanContent = cleanContent.substring(0, maxLength - 3) + '...'
    }

    return cleanContent
  }
}

/**
 * 生成 Feed 对象（核心逻辑，供文件生成和 API 路由复用）
 * @param {*} props
 * @returns {Feed} Feed 对象
 */
export async function generateRssFeed(props) {
  const { NOTION_CONFIG, siteInfo, latestPosts } = props
  const TITLE = siteInfo?.title
  const DESCRIPTION = siteInfo?.description
  const LINK = siteInfo?.link
  const AUTHOR = NOTION_CONFIG?.AUTHOR || BLOG.AUTHOR
  const LANG = NOTION_CONFIG?.LANG || BLOG.LANG
  const SUB_PATH = NOTION_CONFIG?.SUB_PATH || BLOG.SUB_PATH
  const CONTACT_EMAIL = decryptEmail(
    NOTION_CONFIG?.CONTACT_EMAIL || BLOG.CONTACT_EMAIL
  )

  // RSS 优化配置
  const RSS_MAX_ITEMS = 20 // 限制最多20篇文章
  const RSS_MAX_CONTENT_LENGTH = 500 // 限制内容长度为500字符
  const LOAD_CONTENT = false

  const year = new Date().getFullYear()
  const feed = new Feed({
    title: TITLE,
    description: DESCRIPTION,
    link: `${LINK}/${SUB_PATH}`,
    language: LANG,
    favicon: `${LINK}/favicon.png`,
    copyright: `All rights reserved ${year}, ${AUTHOR}`,
    author: {
      name: AUTHOR,
      email: CONTACT_EMAIL,
      link: LINK
    }
  })

  // 限制文章数量以减少数据大小
  const limitedPosts = latestPosts.slice(0, RSS_MAX_ITEMS)

  // 并行处理文章内容以提高性能
  const feedItems = await Promise.all(
    limitedPosts.map(async (post) => {
      // 获取文章完整内容用于content字段
      let content = `<a href="${LINK}/${post.slug}">点击查看完整内容</a>`
      if (LOAD_CONTENT && LOAD_CONTENT === true) {
        try {
          // 优先获取完整文章内容
          const fullContent = await createFeedContent(post, RSS_MAX_CONTENT_LENGTH)
          if (fullContent) {
            content = fullContent
          }
        } catch (error) {
          console.warn(`[RSS] 获取文章内容失败: ${post.title}`, error)
        }
      }


      // 确保内容不为空
      if (!content) {
        content = `<a href="${LINK}/${post.slug}">点击查看完整内容</a>`
      }

      return {
        title: post.title,
        link: `${LINK}/${post.slug}`,
        description: post.summary || '点击查看完整内容',
        content: content,
        date: new Date(post?.publishDate)
      }
    })
  )

  // 添加所有项目到feed中
  feedItems.forEach(item => {
    feed.addItem(item)
  })
  // try {
  //   writeRssFile(feed).then(() => {
  //     console.log('[RSS订阅] 生成成功')
  //   }).catch((error) => {
  //     console.error('[RSS订阅] 生成失败:', error)
  //   })
  // } catch (error) {
  //   console.error('[RSS订阅] 创建失败:', error)
  // }

  return feed
}


export async function writeRssFile(feed) {
  // 检查 RSS 是否在缓存时间内生成过
  const now = Date.now()
  const fs = getFs()
  const timeDifference = (now - rssCache.lastGeneratedTime) / (1000 * 60) // 转换为分钟
  try {
    // 强制生成一次（如果RSS文件不存在）
    const rssExists = fs.existsSync('/public/rss/feed.xml')

    if (timeDifference < rssCache.intervalMinutes && rssExists) {
      console.log(`[RSS订阅] 缓存有效，跳过生成 (${timeDifference.toFixed(1)}分钟前已生成)`)
      return
    }
  } catch (error) {
    console.error('[RSS订阅] 读取文件失败:', error)
  }

  // 更新缓存时间
  rssCache.lastGeneratedTime = now

  try {
    getFs().mkdirSync('./public/rss', { recursive: true })
    getFs().writeFileSync('./public/rss/feed.xml', feed.rss2())
    getFs().writeFileSync('./public/rss/atom.xml', feed.atom1())
    fs.writeFileSync('./public/rss/feed.json', feed.json1())
    console.log('[RSS订阅] 访问路径: /rss/feed.xml, /rss/atom.xml, /rss/feed.json 生成 success')
  } catch (error) {
    console.error('[RSS订阅] RSS生成失败:', error)
    // 在其他只读文件系统环境中，这里会报错
    if (error.code === 'EROFS') {
      console.log('[RSS订阅] ⚠️ 只读文件系统，RSS文件无法写入，请使用 API 路由: /api/rss')
    } else if (error.code === 'ENOENT') {
      console.log('[RSS订阅] ⚠️ 目录不存在，RSS文件写入失败:', error.message)
    } else {
      console.log('[RSS订阅] ❌ RSS文件写入失败:', error.message)
    }
  }


  console.log('[RSS订阅] 生成/rss/feed.xml')
}

/**
 * 生成RSS数据（文件写入版本）
 * @param {*} props
 */
export async function generateRss(props) {
  // 复用核心 RSS 生成逻辑
  generateRssFeed(props).then(feed => {
    // 检查是否为无服务器环境（如 Vercel）
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
    if (isServerless) {
      console.log('[RSS订阅] 检测到无服务器环境，RSS 将通过 API 路由动态生成')
      return
    }
    console.log('[RSS订阅] 准备生成: /rss/feed.xml, /rss/atom.xml, /rss/feed.json')
    writeRssFile(feed).catch(error => {
      console.error('[RSS订阅] RSS文件写入失败:', error)
    })
  })
}

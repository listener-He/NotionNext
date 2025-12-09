import BLOG from '@/blog.config'
import NotionPage from '@/components/NotionPage'
import { getPostBlocks } from '@/lib/db/getSiteData'
import { Feed } from 'feed'
import fs from 'fs'
import ReactDOMServer from 'react-dom/server'
import { decryptEmail } from '@/lib/plugins/mailEncrypt'

// RSS 生成缓存
let rssCache = {
  lastGeneratedTime: 0,
  intervalMinutes: 60 // RSS缓存间隔（分钟）- 增加到1小时
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
    let cleanContent = content.replace(regexExp, '')
    
    return cleanContent
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
    // if (cleanContent && cleanContent.length > maxLength) {
    //   cleanContent = cleanContent.substring(0, maxLength - 3) + '...'
    // }
    
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
  const RSS_MAX_ITEMS = 50 // 限制最多50篇文章
  // 移除内容长度限制，显示完整内容

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
      // 获取文章完整内容用于content字段（纯文本版本，去除HTML标签）
      let content = ''
      
      try {
        // 优先获取完整文章内容（纯文本版本）
        const fullContent = await createFeedTextContent(post)
        if (fullContent) {
          content = fullContent
        } else {
          // 如果获取失败，使用摘要作为备选
          content = post.summary || '点击查看完整内容'
        }
      } catch (error) {
        console.warn(`[RSS] 获取文章内容失败: ${post.title}`, error)
        content = post.summary || '点击查看完整内容'
      }
      
      // 确保内容不为空
      if (!content) {
        content = post.summary || '点击查看完整内容'
      }
      
      return {
        title: post.title,
        link: `${LINK}/${post.slug}`,
        description: post.summary || '点击查看完整内容',
        content: content,
        date: new Date(post?.publishDay)
      }
    })
  )

  // 添加所有项目到feed中
  feedItems.forEach(item => {
    feed.addItem(item)
  })

  return feed
}

/**
 * 生成RSS数据（文件写入版本）
 * @param {*} props
 */
export async function generateRss(props) {
  // 检查 RSS 是否在缓存时间内生成过
  const now = Date.now()
  const timeDifference = (now - rssCache.lastGeneratedTime) / (1000 * 60) // 转换为分钟
  
  // 强制生成一次（如果RSS文件不存在）
  const rssExists = require('fs').existsSync('./public/rss/feed.xml')
  
  if (timeDifference < rssCache.intervalMinutes && rssExists) {
    // console.log(`[RSS订阅] 缓存有效，跳过生成 (${timeDifference.toFixed(1)}分钟前已生成)`)
    return
  }

  console.log('[RSS订阅] 生成/rss/feed.xml')
  
  try {
    // 复用核心 RSS 生成逻辑
    const feed = await generateRssFeed(props)
    
    // 检查是否为无服务器环境（如 Vercel）
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NETLIFY
    
    if (isServerless) {
      console.log('[RSS订阅] 检测到无服务器环境，RSS 将通过 API 路由动态生成')
      console.log('[RSS订阅] 访问路径: /rss/feed.xml, /rss/atom.xml, /rss/feed.json')
      rssCache.lastGeneratedTime = now
      return
    }

    fs.mkdirSync('./public/rss', { recursive: true })
    fs.writeFileSync('./public/rss/feed.xml', feed.rss2())
    fs.writeFileSync('./public/rss/atom.xml', feed.atom1())
    fs.writeFileSync('./public/rss/feed.json', feed.json1())
    
    // 更新缓存时间
    rssCache.lastGeneratedTime = now
    console.log('[RSS订阅] RSS文件生成成功，缓存已更新')
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
    rssCache.lastGeneratedTime = now
  }
}
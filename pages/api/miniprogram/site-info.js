import { getGlobalData } from '@/lib/db/getSiteData'
import BLOG from '@/blog.config'

/**
 * 微信小程序 - 获取站点信息API
 * 返回站点基本信息、作者信息、统计数据等
 * 用于"关于我"页面
 * 复用现有的数据获取和缓存逻辑
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 直接获取全局数据，复用现有缓存机制
    const globalData = await getGlobalData({
      from: 'miniprogram-site-info'
    })

    if (!globalData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch site data'
      })
    }

        // 统计数据
    const publishedPosts = globalData.allPages?.filter(post => 
      post.type === 'Post' && post.status === 'Published'
    ) || []
    
    const publishedPages = globalData.allPages?.filter(post => 
      post.type === 'Page' && post.status === 'Published'
    ) || []

    // 计算总字数（估算）
    const totalWords = publishedPosts.reduce((total, post) => {
      // 根据摘要长度估算字数，实际项目中可以从数据库获取准确字数
      const estimatedWords = (post.summary || '').length * 3
      return total + estimatedWords
    }, 0)

    // 获取最早和最新的文章日期
    const sortedPosts = publishedPosts
      .filter(post => post.publishDate || post.date?.start_date)
      .sort((a, b) => {
        const dateA = new Date(a.publishDate || a.date?.start_date)
        const dateB = new Date(b.publishDate || b.date?.start_date)
        return dateA - dateB
      })

    const firstPostDate = sortedPosts[0]?.publishDate || sortedPosts[0]?.date?.start_date
    const latestPostDate = sortedPosts[sortedPosts.length - 1]?.publishDate || sortedPosts[sortedPosts.length - 1]?.date?.start_date

    // 计算建站天数
    const siteDays = firstPostDate 
      ? Math.floor((new Date() - new Date(firstPostDate)) / (1000 * 60 * 60 * 24))
      : 0

    // 获取分类和标签数量
    const categoryCount = globalData.categoryOptions?.length || 0
    const tagCount = globalData.tagOptions?.length || 0

    // 构建返回数据
    const siteData = {
      // 站点基本信息
      siteInfo: {
        title: globalData.siteInfo?.title || BLOG.TITLE,
        description: globalData.siteInfo?.description || BLOG.DESCRIPTION,
        author: BLOG.AUTHOR,
        link: globalData.siteInfo?.link || BLOG.LINK,
        avatar: globalData.siteInfo?.icon || BLOG.AVATAR,
        since: BLOG.SINCE || new Date().getFullYear()
      },
      // 统计数据
      statistics: {
        postCount: publishedPosts.length,
        pageCount: publishedPages.length,
        categoryCount,
        tagCount,
        totalWords,
        siteDays,
        firstPostDate,
        latestPostDate
      },
      // 社交链接
      socialLinks: {
        github: BLOG.CONTACT_GITHUB,
        twitter: BLOG.CONTACT_TWITTER,
        telegram: BLOG.CONTACT_TELEGRAM,
        email: BLOG.CONTACT_EMAIL,
        linkedin: BLOG.CONTACT_LINKEDIN
      },
      // 最新文章
      latestPosts: globalData.latestPosts?.slice(0, 5).map(post => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        publishDate: post.publishDate || post.date?.start_date,
        pageCoverThumbnail: post.pageCoverThumbnail
      })) || []
    }

    const result = {
      success: true,
      data: siteData
    }

    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}
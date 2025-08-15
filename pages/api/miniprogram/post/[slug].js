import { getGlobalData, getPost } from '@/lib/db/getSiteData'
import { getPageContentText } from '@/lib/notion/getPageContentText'
import { idToUuid } from 'notion-utils'

/**
 * 微信小程序 - 获取文章详情API
 * 根据slug获取文章详细内容
 * 复用现有的数据获取和缓存逻辑
 * 
 * 路径参数：
 * - slug: 文章slug
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id } = req.query

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Missing id parameter'
      })
    }

    // 直接通过ID获取文章内容，避免查询全局数据提升性能
    let fullPost = null
    try {
      fullPost = await getPost(id)
      if (!fullPost) {
        return res.status(404).json({
          success: false,
          error: 'Post not found'
        })
      }
    } catch (error) {
      console.error('获取文章失败:', error)
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch post'
      })
    }

    // 验证文章是否为页面类型（getPost返回的type是'page'）
    if (fullPost.type !== 'page') {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    // 获取文章纯文本内容（用于搜索和摘要）
    let textContent = ''
    try {
      textContent = getPageContentText(fullPost, fullPost.blockMap)
    } catch (error) {
      console.error('获取文章纯文本内容失败:', error)
      // 静默处理文本内容获取失败
    }

    // 获取相关文章（同分类或同标签）- 需要获取全局数据
    let relatedPosts = []
    try {
      const globalData = await getGlobalData({
        from: 'miniprogram-post-detail-related'
      })
      
      if (globalData && globalData.allPages) {
        relatedPosts = globalData.allPages
          .filter(p => 
            p.id !== fullPost.id && 
            p.type === 'Post' && 
            p.status === 'Published' &&
            (
              p.category === fullPost.category ||
              (fullPost.tags && p.tagItems && 
               fullPost.tags.some(tag1 => 
                 p.tagItems.some(tag2 => tag1 === tag2.name)
               ))
            )
          )
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            summary: p.summary,
            slug: p.slug,
            category: p.category,
            publishDate: p.publishDate || p.date?.start_date,
            // 统一使用pageCover字段，内容为缩略图
            pageCover: p.pageCoverThumbnail || p.pageCover
          }))
      }
    } catch (error) {
      console.warn('获取相关文章失败:', error)
      // 静默处理相关文章获取失败
    }

    // 返回精简的文章数据
    const postData = {
      id: fullPost.id,
      title: fullPost.title,
      summary: '', // getPost返回的数据没有summary字段
      slug: '', // getPost返回的数据没有slug字段
      category: fullPost.category,
      tags: fullPost.tags || [],
      publishDate: fullPost.date?.start_date,
      lastEditedDate: fullPost.lastEditedDay,
      // 使用封面图
      pageCover: fullPost.page_cover,
      pageIcon: '',
      publishDay: fullPost.lastEditedDay,
      // 文章内容相关
      textContent: textContent, // 完整文本内容
      wordCount: textContent.length,
      // 相关文章
      relatedPosts
    }

    const result = {
      success: true,
      data: postData
    }

    res.status(200).json(result)
  } catch (error) {
    if (error.message === 'Post not found') {
      return res.status(404).json({
        success: false,
        error: 'Post not found',
        message: '文章不存在或未发布'
      })
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}
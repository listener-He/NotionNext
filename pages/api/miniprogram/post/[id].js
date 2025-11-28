import { getGlobalData, getPost } from '@/lib/db/getSiteData'
import { getPageContentText } from '@/lib/notion/getPageContentText'
import { getPageContentHtml } from '@/lib/notion/getPageContentHtml'
import { getPageContentMarkdown } from '@/lib/notion/getPageContentMarkdown'
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

    // 获取全局数据以获取完整的文章信息
    let fullPost = null
    let globalData = null
    try {
      globalData = await getGlobalData({
        from: 'miniprogram-post-detail'
      })
      
      if (!globalData || !globalData.allPages) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch site data'
        })
      }
      
      // 从allPages中查找文章（支持通过id或slug查找）
      fullPost = globalData.allPages.find(post => 
        post.id === id || 
        post.slug === id ||
        post.slug === id.startsWith('article/') ? id : `article/${id}`
      )
      
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

    // 验证文章是否为Post类型且已发布
    if (fullPost.type !== 'Post' || fullPost.status !== 'Published') {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    // 获取文章内容（需要先获取blockMap）
    let markdownContent = ''
    try {
      const postWithBlocks = await getPost(fullPost.id)
      if (postWithBlocks && postWithBlocks.blockMap) {
        fullPost.blockMap = postWithBlocks.blockMap
      }
      
      if (fullPost.blockMap) {
        // textContent = getPageContentText(fullPost, fullPost.blockMap)
        // htmlContent = getPageContentHtml(fullPost, fullPost.blockMap)
        markdownContent = getPageContentMarkdown(fullPost, fullPost.blockMap)
      }
    } catch (error) {
      console.error('获取文章内容失败:', error)
      // 静默处理内容获取失败
    }

    // 获取相关文章（同分类或同标签）- 使用已获取的globalData
    let relatedPosts = []
    try { 
      if (globalData && globalData.allPages) {
        relatedPosts = globalData.allPages
          .filter(p => 
            p.id !== fullPost.id && 
            p.type === 'Post' && 
            p.status === 'Published' &&
            (
              p.category === fullPost.category ||
              (fullPost.tagItems && p.tagItems && 
               fullPost.tagItems.some(tag1 => 
                 p.tagItems.some(tag2 => tag1.name === tag2.name)
               ))
            )
          )
          .slice(0, 5)
          .map(p => ({
            id: p.id,
            title: p.title,
            summary: p.summary,
            slug: p.slug?.startsWith('article/') ? p.slug.substring(8) : p.slug,
            category: p.category,
            publishDate: p.publishDate || p.publishDay,
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
      summary: fullPost.summary || '',
      slug: fullPost.slug?.startsWith('article/') ? fullPost.slug.substring(8) : fullPost.slug || '',
      category: fullPost.category || '',
      tags: fullPost.tagItems?.map(tag => tag.name) || [],
      publishDate: fullPost.publishDate || fullPost.publishDay,
      lastEditedDate: fullPost.lastEditedDay,
      // 使用封面图
      pageCover: fullPost.pageCoverThumbnail || fullPost.pageCover || '',
      pageIcon: fullPost.pageIcon || '',
      publishDay: fullPost.publishDay,
      // 文章内容相关
      markdownContent: markdownContent, // Markdown格式内容
      wordCount: markdownContent.length,
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
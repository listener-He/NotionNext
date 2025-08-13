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
    const { slug, id } = req.query

    // 修复空参数处理：当slug为空字符串或只有空格时，应该返回404而不是400
    const hasValidSlug = slug && slug.trim() !== ''
    const hasValidId = id && id.trim() !== ''
    
    if (!hasValidSlug && !hasValidId) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    // 直接获取全局数据，复用现有缓存机制
    const globalData = await getGlobalData({
      from: 'miniprogram-post-detail'
    })

    if (!globalData || !globalData.allPages) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch data'
      })
    }

    // 查找指定slug或notion ID的文章
    // 支持多种查找方式：1. 完整slug匹配 2. 去掉article前缀的slug匹配 3. notion ID匹配 4. ID fallback
    let post = null
    
    // 优先使用slug查找（如果提供了有效的slug）
    if (hasValidSlug) {
      post = globalData.allPages.find(p => {
        if (p.type !== 'Post' || p.status !== 'Published') {
          return false
        }
        
        // 完整slug匹配
        if (p.slug === slug) {
          return true
        }
        
        // notion ID匹配
        if (p.id === idToUuid(slug)) {
          return true
        }
        
        // 匹配去掉article前缀的slug（兼容小程序列表API返回的格式）
        if (p.slug?.startsWith('article/') && p.slug.substring(8) === slug) {
          return true
        }
        
        return false
      })
      
      // 注释掉直接获取功能，避免依赖问题
      // if (!post && slug.length >= 32) {
      //   try {
      //     const directPost = await getPost(slug)
      //     if (directPost && directPost.type === 'Post' && directPost.status === 'Published') {
      //       post = directPost
      //     }
      //   } catch (error) {
      //     console.warn('直接获取文章失败:', error)
      //   }
      // }
    }
    
    // 修复ID fallback机制：如果slug查找失败或没有提供slug，且提供了id参数，则使用id作为备选方案
    if (!post && hasValidId) {
      // 在allPages中查找ID匹配的文章，支持多种ID格式匹配
      post = globalData.allPages.find(p => {
        if (p.type !== 'Post' || p.status !== 'Published') {
          return false
        }
        
        // 直接ID匹配
        if (p.id === id) {
          return true
        }
        
        // 使用idToUuid转换后匹配
        if (p.id === idToUuid(id)) {
          return true
        }
        
        // 反向匹配：如果p.id经过idToUuid转换后等于传入的id
        try {
          if (idToUuid(p.id) === id) {
            return true
          }
        } catch (e) {
          // 忽略转换错误
        }
        
        return false
      })
      
      // 注释掉直接获取功能，避免依赖问题
      // if (!post && id.length >= 32) {
      //   try {
      //     const directPost = await getPost(id)
      //     if (directPost && directPost.type === 'Post' && directPost.status === 'Published') {
      //       post = directPost
      //     }
      //   } catch (error) {
      //     console.warn('通过ID直接获取文章失败:', error)
      //   }
      // }
    }

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Post not found'
      })
    }

    // 获取文章纯文本内容（用于搜索和摘要）
    let textContent = ''
    try {
      textContent = getPageContentText(post.id, post.blockMap)
    } catch (error) {
      // 静默处理文本内容获取失败
    }

    // 获取相关文章（同分类或同标签）
    const relatedPosts = globalData.allPages
      .filter(p => 
        p.id !== post.id && 
        p.type === 'Post' && 
        p.status === 'Published' &&
        (
          p.category === post.category ||
          (post.tagItems && p.tagItems && 
           post.tagItems.some(tag1 => 
             p.tagItems.some(tag2 => tag1.name === tag2.name)
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

    // 返回精简的文章数据
    const postData = {
      id: post.id,
      title: post.title,
      summary: post.summary,
      slug: post.slug,
      category: post.category,
      tags: post.tagItems?.map(tag => tag.name) || [],
      publishDate: post.publishDate || post.date?.start_date,
      lastEditedDate: post.lastEditedDate || post.date?.lastEditedDay,
      // 使用缩略图替代原始封面图，优化小程序加载性能
      pageCover: post.pageCoverThumbnail || post.pageCover,
      pageIcon: post.pageIcon,
      publishDay: post.publishDay,
      // 文章内容相关
      blockMap: post.blockMap, // Notion块数据，用于渲染
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
import { getGlobalData } from '@/lib/db/getSiteData'

/**
 * 微信小程序 - 获取文章列表API
 * 支持分页、分类筛选、标签筛选、搜索
 * 复用现有的数据获取和缓存逻辑
 *
 * 查询参数：
 * - page: 页码（从1开始，默认1）
 * - pageSize: 每页数量（默认10，最大50）
 * - category: 分类筛选
 * - tag: 标签筛选
 * - keyword: 搜索关键词
 * - type: 文章类型（Post/Page，默认Post）
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 获取查询参数
    const {
      page = 1,
      pageSize = 10,
      category = '',
      tag = '',
      keyword = '',
      type = 'Post'
    } = req.query

    // 参数验证
    const pageNum = Math.max(1, parseInt(page) || 1)
    const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize) || 10))

    // 直接获取全局数据，复用现有缓存机制
    const globalData = await getGlobalData({
      from: 'miniprogram-posts'
    })

    if (!globalData || !globalData.allPages) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch data'
      })
    }

    // 筛选文章
    let posts = globalData.allPages.filter(post => {
      // 类型筛选
      if (post.type !== type) {
        return false
      }

      // 状态筛选
      if (post.status !== 'Published') {
        return false
      }

      // 分类筛选
      if (category && post.category !== category) {
        return false
      }

      // 标签筛选
      if (tag && (!post.tagItems || !post.tagItems.some(tagItem => tagItem.name === tag))) {
        return false
      }

      // 关键词搜索（标题和摘要）
      if (keyword) {
        const searchText = `${post.title || ''} ${post.summary || ''}`.toLowerCase()
        if (!searchText.includes(keyword.toLowerCase())) {
          return false
        }
      }

      return true
    })

    // 按发布日期倒序排列
    posts.sort((a, b) => {
      const dateA = new Date(a.publishDate || a.date?.start_date)
      const dateB = new Date(b.publishDate || b.date?.start_date)
      return dateB - dateA
    })

    // 分页处理
    const total = posts.length
    const totalPages = Math.ceil(total / pageSizeNum)
    const startIndex = (pageNum - 1) * pageSizeNum
    const endIndex = startIndex + pageSizeNum
    const paginatedPosts = posts.slice(startIndex, endIndex)

    // 精简数据结构，只返回小程序需要的字段
    const simplifiedPosts = paginatedPosts.map(post => ({
      id: post.id,
      title: post.title,
      summary: post.summary,
      // 去掉slug中的article前缀，方便小程序直接使用
      slug: post.slug?.startsWith('article/') ? post.slug.substring(8) : post.slug,
      category: post.category,
      tags: post.tagItems?.map(tag => tag.name) || [],
      publishDate: post.publishDate || post.date?.start_date,
      lastEditedDate: post.lastEditedDate || post.date?.lastEditedDay,
      // 使用缩略图替代原始封面图，优化小程序加载性能
      pageCover: post.pageCoverThumbnail || post.pageCover,
      pageIcon: post.pageIcon,
      publishDay: post.publishDay
    }))

    const result = {
      success: true,
      data: {
        posts: simplifiedPosts,
        pagination: {
          current: pageNum,
          pageSize: pageSizeNum,
          total,
          totalPages,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    }

    // 设置缓存控制头，优化小程序请求性能
    res.setHeader('Cache-Control', 's-maxage=7200, stale-while-revalidate=600')
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

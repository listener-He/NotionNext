import { getGlobalData } from '@/lib/db/getSiteData'

/**
 * 微信小程序 - 获取分类列表API
 * 返回所有分类及其文章数量
 * 复用现有的数据获取和缓存逻辑
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 直接获取全局数据，复用现有缓存机制
    const globalData = await getGlobalData({
      from: 'miniprogram-categories'
    })

    if (!globalData) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch site data'
      })
    }

    // 获取已发布的文章
    const publishedPosts = globalData.allPages?.filter(post => 
      post.type === 'Post' && post.status === 'Published'
    ) || []

    // 统计每个分类的文章数量
    const categoryStats = {}
    publishedPosts.forEach(post => {
      const category = post.category || '未分类'
      categoryStats[category] = (categoryStats[category] || 0) + 1
    })

    // 构建分类列表
    const categories = globalData.categoryOptions?.map(option => ({
      name: option.name,
      color: option.color,
      count: categoryStats[option.name] || 0
    })) || []

    // 添加未分类项（如果有文章没有分类）
    if (categoryStats['未分类']) {
      categories.push({
        name: '未分类',
        color: 'gray',
        count: categoryStats['未分类']
      })
    }

    // 按文章数量倒序排列
    categories.sort((a, b) => b.count - a.count)

    const result = {
      success: true,
      data: {
        categories,
        total: categories.length
      }
    }

    // 设置缓存控制头，优化小程序请求性能
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=59')
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}
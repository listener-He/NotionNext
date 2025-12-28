import { getGlobalData } from '@/lib/db/getSiteData'

/**
 * 微信小程序 - 获取标签列表API
 * 返回所有标签及其文章数量
 * 复用现有的数据获取和缓存逻辑
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 优化：只获取小程序标签API需要的数据类型
    const globalData = await getGlobalData({
      from: 'miniprogram-tags',
      dataTypes: ['allPages', 'tagOptions']
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

    // 统计每个标签的文章数量
    const tagStats = {}
    publishedPosts.forEach(post => {
      if (post.tagItems && Array.isArray(post.tagItems)) {
        post.tagItems.forEach(tag => {
          if (tag.name) {
            tagStats[tag.name] = (tagStats[tag.name] || 0) + 1
          }
        })
      }
    })

    // 构建标签列表
    const tags = globalData.tagOptions?.map(option => ({
      name: option.name,
      color: option.color,
      count: tagStats[option.name] || 0
    })) || []

    // 过滤掉没有文章的标签
    const validTags = tags.filter(tag => tag.count > 0)

    // 按文章数量倒序排列
    validTags.sort((a, b) => b.count - a.count)

    const result = {
      success: true,
      data: {
        tags: validTags,
        total: validTags.length
      }
    }

    // 设置缓存控制头，优化小程序请求性能
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=500')
    res.status(200).json(result)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    })
  }
}

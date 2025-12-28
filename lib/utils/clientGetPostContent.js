/**
 * 客户端获取文章内容，通过API路由
 * 避免在客户端直接调用notion API，复用现有的服务端逻辑
 * @param {*} id - 文章ID
 * @returns
 */
export async function clientGetPostContent(id) {
  if (!id) {
    throw new Error('文章ID不能为空')
  }

  try {
    const response = await fetch(`/api/post/${id}`)
    if (!response.ok) {
      throw new Error(`获取文章内容失败: ${response.status}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || '获取文章内容失败')
    }

    return result.data
  } catch (error) {
    console.error('获取文章内容失败:', error)
    throw error
  }
}

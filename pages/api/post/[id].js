import { getPost } from '@/lib/db/getSiteData'
import { processPostData } from '@/lib/utils/post'

export default async function handler(req, res) {
  const { id } = req.query

  // 设置缓存头
  res.setHeader('Content-Type', 'application/json')
  res.setHeader(
    'Cache-Control',
    'public, s-maxage=3600, stale-while-revalidate=86400'
  )

  try {
    if (!id) {
      return res.status(400).json({ error: 'Missing post ID' })
    }

    // 获取文章内容
    const post = await getPost(id)

    if (!post) {
      return res.status(404).json({ error: 'Post not found' })
    }
    const props = {post: post}
    await processPostData(props, "client-api")

    res.status(200).json({ success: true, data: props.post })
  } catch (error) {
    console.error('获取文章内容失败:', error)
    res.status(500).json({ success: false, error: error.message })
  }
}

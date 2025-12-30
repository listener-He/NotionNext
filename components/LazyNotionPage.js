/**
 * 懒加载的Notion页面组件
 * 在客户端动态加载文章内容，减少SSG构建大小
 * 通过API路由获取文章内容，复用服务端逻辑
 */
const LazyNotionPage = ({ post, className }) => {
  const [content, setContent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // 使用标志来避免在组件卸载后设置状态
    let isCancelled = false;

    const loadContent = async () => {
      try {
        if (post.requiresContentLoad && post.id) {
          // 通过API路由动态加载文章内容，复用服务端逻辑
          const postContent = await clientGetPostContent(post.id)
          if (!isCancelled) {
            const postWithContent = { ...post, ...postContent }
            setContent(postWithContent)
          }
        } else if (post.blockMap) {
          // 如果内容已经存在，直接使用
          if (!isCancelled) {
            setContent(post)
          }
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('加载文章内容失败:', err)
          setError('加载文章内容失败')
        }
      } finally {
        if (!isCancelled) {
          setLoading(false)
        }
      }
    }

    loadContent().then(() => {
      if (!isCancelled) {
        console.log('文章内容加载完成')
      }
    })

    // 清理函数：在组件卸载时设置标志，避免设置状态
    return () => {
      isCancelled = true;
    }
  }, [post])

  if (loading) {
    return (
      <div className={`flex justify-center items-center ${className || ''}`}>
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center text-red-500 ${className || ''}`}>
        {error}
      </div>
    )
  }

  if (content) {
    return (
      <>
        <NotionPage post={content} className={className} />
      </>
    )
  }

  return <div>没有内容可显示</div>
}
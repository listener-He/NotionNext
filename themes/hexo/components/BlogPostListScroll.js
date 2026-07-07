import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { getListByPage } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import CONFIG from '../config'
import BlogPostCard from './BlogPostCard'
import BlogPostListEmpty from './BlogPostListEmpty'
import { getDevicePerformance } from '@/components/PerformanceDetector'

/**
 * 博客列表滚动分页
 * @param posts 所有文章
 * @param tags 所有标签
 * @returns {JSX.Element}
 * @constructor
 */
const BlogPostListScroll = ({
  posts = [],
  currentSearch,
  showSummary = siteConfig('HEXO_POST_LIST_SUMMARY', null, CONFIG),
  siteInfo
}) => {
  const { NOTION_CONFIG } = useGlobal()
  const [page, updatePage] = useState(1)
  const POSTS_PER_PAGE = siteConfig('POSTS_PER_PAGE', null, NOTION_CONFIG)
  const postsToShow = getListByPage(posts, page, POSTS_PER_PAGE)

  // 获取设备性能信息
  const { isLowEndDevice } = getDevicePerformance()

  let hasMore = false
  if (posts) {
    const totalCount = posts.length
    hasMore = page * POSTS_PER_PAGE < totalCount
  }

  const handleGetMore = () => {
    if (!hasMore) return
    updatePage(page + 1)
  }

  // 用 ref 保存最新的 handleGetMore：避免下方空依赖 effect 里的 observer 捕获首渲染闭包
  // （page 恒为 1 → updatePage(2)，翻页卡在第 2 页的 stale-closure bug）
  const getMoreRef = useRef(handleGetMore)
  getMoreRef.current = handleGetMore

  // 通过 IntersectionObserver 平滑分页：哨兵进入视口即加载下一页。
  // 移除了此前冗余且同样 stale 的 scroll 监听后备（observer 即主机制）。
  const sentinelRef = useRef(null)
  useEffect(() => {
    const rootMargin = isLowEndDevice ? '1200px' : '600px'
    const el = sentinelRef.current
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            getMoreRef.current?.()
          }
        })
      },
      { root: null, rootMargin, threshold: 0 }
    )
    if (el) observer.observe(el)
    return () => {
      if (el) observer.unobserve(el)
      observer.disconnect()
    }
  }, [isLowEndDevice])

  const targetRef = useRef(null)
  const { locale } = useGlobal()

  // 优化加载更多按钮的显示
  const renderLoadMoreButton = () => {
    // 在低端设备上简化按钮样式
    const { isLowEndDevice } = getDevicePerformance()
    
    if (isLowEndDevice) {
      return (
        <div className="w-full my-4 py-4 text-center">
          <button 
            onClick={handleGetMore}
            className="px-4 py-2 rounded-lg glass-layer-soft"
          >
            {hasMore ? locale.COMMON.MORE : `${locale.COMMON.NO_MORE}`}
          </button>
        </div>
      )
    }
    
    return (
      <div>
        <div
          onClick={handleGetMore}
          className='w-full my-4 py-4 text-center cursor-pointer rounded-xl dark:text-gray-200 transition-colors glass-layer-soft'>
          {' '}
          {hasMore ? locale.COMMON.MORE : `${locale.COMMON.NO_MORE}`}{' '}
        </div>
      </div>
    )
  }

  if (!postsToShow || postsToShow.length === 0) {
    return <BlogPostListEmpty currentSearch={currentSearch} />
  } else {
    return (
      <div id='container' ref={targetRef} className='w-full bg-transparent'>
        {/* 文章列表 */}
        <div className='space-y-md px-sm md:px-md lg:px-xl bg-transparent'>
          {postsToShow.map(post => (
            <BlogPostCard
              key={post.id}
              post={post}
              showSummary={true}
              siteInfo={siteInfo}
            />
          ))}
        </div>

        {/* 观察哨，用于提前加载下一页 */}
        <div ref={sentinelRef} className='w-full h-8' />
        {renderLoadMoreButton()}
      </div>
    )
  }
}

export default BlogPostListScroll

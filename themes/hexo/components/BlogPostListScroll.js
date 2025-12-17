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

  // 监听滚动自动分页加载
  const scrollTrigger = () => {
    requestAnimationFrame(() => {
      const scrollS = window.scrollY + window.outerHeight
      const clientHeight = targetRef
        ? targetRef.current
          ? targetRef.current.clientHeight
          : 0
        : 0
      if (scrollS > clientHeight + 100) {
        handleGetMore()
      }
    })
  }

  // 根据设备性能优化滚动事件处理
  const throttleScroll = (() => {
    let lastTime = 0
    // 根据设备性能调整节流延迟
    const { isLowEndDevice, performanceLevel } = getDevicePerformance()
    let throttleDelay = 100
    
    if (isLowEndDevice) {
      throttleDelay = 300
    } else if (performanceLevel === 'high') {
      throttleDelay = 50
    }
    
    return function () {
      const now = Date.now()
      if (now - lastTime >= throttleDelay) {
        lastTime = now
        scrollTrigger()
      }
    }
  })()

  // 监听滚动
  useEffect(() => {
    window.addEventListener('scroll', throttleScroll)
    return () => {
      window.removeEventListener('scroll', throttleScroll)
    }
  }, []) // 添加空依赖数组以避免重复绑定

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
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg"
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
          className='w-full my-4 py-4 text-center cursor-pointer rounded-xl dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'>
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
      <div id='container' ref={targetRef} className='w-full'>
        {/* 文章列表 */}
        <div className='space-y-md px-sm md:px-md lg:px-xl'>
          {postsToShow.map(post => (
            <BlogPostCard
              key={post.id}
              post={post}
              showSummary={true}
              siteInfo={siteInfo}
            />
          ))}
        </div>

        {renderLoadMoreButton()}
      </div>
    )
  }
}

export default BlogPostListScroll

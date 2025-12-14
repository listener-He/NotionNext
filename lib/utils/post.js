/**
 * 文章相关工具
 */
import { isHttpLink } from '.'
import { getPostBlocks } from '@/lib/db/getSiteData'
import { getPageTableOfContents } from '@/lib/notion/getPageTableOfContents'
import { siteConfig } from '@/lib/config'
import { getDataFromCache, setDataToCache } from '@/lib/cache/cache_manager'
import { getAiSummary } from '@/lib/plugins/aiSummary'
import BLOG from '@/blog.config'
import { uploadDataToAlgolia } from '@/lib/plugins/algolia'
import { countWords } from '@/lib/plugins/wordCount'
import { getPageContentText } from '@/lib/notion/getPageContentText'
import { getPerformanceConfig } from '@/lib/performance.config'
import { CACHE_KEY_AI_SUMMARY } from '@/lib/cache/cache_keys'

/**
 * 获取文章的关联推荐文章列表，目前根据标签关联性筛选
 * @param post
 * @param {*} allPosts
 * @param {*} count
 * @returns
 */
export function getRecommendPost(post, allPosts, count = 6) {
  let recommendPosts = []
  const postIds = []
  const currentTags = post?.tags || []

  // 添加保护性检查，确保 allPosts 是数组
  if (!Array.isArray(allPosts)) {
    return recommendPosts
  }

  // 按发布时间倒序排列文章
  const sortedPosts = [...allPosts].sort((a, b) => {
    const dateA = new Date(a.publishDate || a.createdTime)
    const dateB = new Date(b.publishDate || b.createdTime)
    return dateB - dateA
  })

  for (let i = 0; i < sortedPosts.length; i++) {
    const p = sortedPosts[i]
    if (p.id === post.id || p.type.indexOf('Post') < 0) {
      continue
    }

    for (let j = 0; j < currentTags.length; j++) {
      const t = currentTags[j]
      if (postIds.indexOf(p.id) > -1) {
        continue
      }
      if (p.tags && p.tags.indexOf(t) > -1) {
        recommendPosts.push(p)
        postIds.push(p.id)
      }
    }
  }

  if (recommendPosts.length > count) {
    recommendPosts = recommendPosts.slice(0, count)
  }
  return recommendPosts
}

/**
 * 确认slug中不包含 / 符号
 * @param {*} row
 * @returns
 */
export function checkSlugHasNoSlash(row) {
  let slug = row.slug
  if (slug.startsWith('/')) {
    slug = slug.substring(1)
  }
  return (
    (slug.match(/\//g) || []).length === 0 &&
    !isHttpLink(slug) &&
    row.type.indexOf('Menu') < 0
  )
}

/**
 * 检查url中包含一个  /
 * @param {*} row
 * @returns
 */
export function checkSlugHasOneSlash(row) {
  if (!row.slug) {
    return false
  }
  let slug = row.slug
  if (slug.startsWith('/')) {
    slug = slug.substring(1)
  }
  return (
    (slug.match(/\//g) || []).length === 1 &&
    !isHttpLink(slug) &&
    row.type.indexOf('Menu') < 0
  )
}

/**
 * 检查url中包含两个及以上的  /
 * @param {*} row
 * @returns
 */
export function checkSlugHasMorThanTwoSlash(row) {
  let slug = row.slug
  if (slug.startsWith('/')) {
    slug = slug.substring(1)
  }
  return (
    (slug.match(/\//g) || []).length >= 2 &&
    row.type.indexOf('Menu') < 0 &&
    !isHttpLink(slug)
  )
}

/**
 * 获取文章摘要
 * @param props
 * @param pageContentText
 * @returns {Promise<void>}
 */
async function getPageAISummary(props, pageContentText) {
  const aiSummaryAPI = siteConfig('AI_SUMMARY_API')
  if (aiSummaryAPI) {
    const post = props.post
    const cacheKey = CACHE_KEY_AI_SUMMARY(post.id)
    let aiSummary = await getDataFromCache(cacheKey)
    if (aiSummary) {
      props.post.aiSummary = aiSummary
    } else {
      const aiSummaryKey = siteConfig('AI_SUMMARY_KEY')
      const aiSummaryCacheTime = siteConfig('AI_SUMMARY_CACHE_TIME')
      const wordLimit = siteConfig('AI_SUMMARY_WORD_LIMIT', '1000')
      let content = ''
      for (let heading of post.toc) {
        content += heading.text + ' '
      }
      content += pageContentText
      const combinedText = post.title + ' ' + content
      const truncatedText = combinedText.slice(0, wordLimit)
      aiSummary = await getAiSummary(aiSummaryAPI, aiSummaryKey, truncatedText)
      await setDataToCache(cacheKey, aiSummary, aiSummaryCacheTime)
      props.post.aiSummary = aiSummary
    }
  }
}

/**
 * 处理文章数据
 * @param props
 * @param from
 * @returns {Promise<void>}
 */
export async function processPostData(props, from) {
  // 添加空值检查，确保 props.post 存在
  if (!props?.post) {
    console.warn('processPostData: props.post is null or undefined')
    return
  }

  // 文章内容加载
  if (!props.post.blockMap) {
    props.post.blockMap = await getPostBlocks(props.post.id, from)
  }

  if (props.post?.blockMap?.block) {
    // 目录默认加载
    props.post.content = Object.keys(props.post.blockMap.block).filter(
      key => props.post.blockMap.block[key]?.value?.parent_id === props.post.id
    )
    props.post.toc = getPageTableOfContents(props.post, props.post.blockMap)
    const pageContentText = getPageContentText(props.post, props.post.blockMap)
    const { wordCount, readTime } = countWords(pageContentText)
    props.post.wordCount = wordCount
    props.post.readTime = readTime
    await getPageAISummary(props, pageContentText)
  }

  // 生成全文索引 && JSON.parse(BLOG.ALGOLIA_RECREATE_DATA)
  if (BLOG.ALGOLIA_APP_ID) {
    await uploadDataToAlgolia(props?.post)
  }

  // 推荐关联文章处理 - 性能优化
  const allPosts = props.allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )
  
  // 按发布时间倒序排列文章
  if (allPosts && Array.isArray(allPosts)) {
    allPosts.sort((a, b) => {
      const dateA = new Date(a.publishDate || a.createdTime)
      const dateB = new Date(b.publishDate || b.createdTime)
      return dateB - dateA
    })
  }
  
  if (allPosts && allPosts.length > 0) {
    const index = allPosts.indexOf(props.post)

    // 获取上一篇和下一篇文章，只保留必要字段
    const prevNextFields = getPerformanceConfig('DATA_OPTIMIZATION', 'PREV_NEXT_FIELDS', [
      'id', 'title', 'slug', 'pageCoverThumbnail'
    ])

    // 修正上一篇和下一篇文章的逻辑
    // 上一篇应该是比当前文章更新的文章（在数组中索引更小）
    // 下一篇应该是比当前文章更旧的文章（在数组中索引更大）
    const prevPost = index > 0 ? allPosts[index - 1] : null
    const nextPost = index < allPosts.length - 1 ? allPosts[index + 1] : null

    // 优化上一篇文章数据
    props.prev = prevPost ? (() => {
      const optimizedPrev = {}
      prevNextFields.forEach(field => {
        if (prevPost[field] !== undefined) {
          optimizedPrev[field] = prevPost[field]
        }
      })
      return optimizedPrev
    })() : null

    // 优化下一篇文章数据
    props.next = nextPost ? (() => {
      const optimizedNext = {}
      prevNextFields.forEach(field => {
        if (nextPost[field] !== undefined) {
          optimizedNext[field] = nextPost[field]
        }
      })
      return optimizedNext
    })() : null

    // 获取推荐文章，限制数量并只保留必要字段
    const maxRecommendPosts = getPerformanceConfig('DATA_OPTIMIZATION', 'MAX_RECOMMEND_POSTS', 6)
    const recommendCount = Math.min(siteConfig('POST_RECOMMEND_COUNT', 6), maxRecommendPosts)
    const fullRecommendPosts = getRecommendPost(props.post, allPosts, recommendCount)

    // 获取推荐文章需要保留的字段
    const recommendFields = getPerformanceConfig('DATA_OPTIMIZATION', 'RECOMMEND_POST_FIELDS', [
      'id', 'title', 'slug', 'summary', 'pageCoverThumbnail', 'publishDay', 'category'
    ])

    props.recommendPosts = fullRecommendPosts.map(post => {
      const optimizedPost = {}
      recommendFields.forEach(field => {
        if (post[field] !== undefined) {
          optimizedPost[field] = post[field]
        }
      })
      return optimizedPost
    })
  } else {
    props.prev = null
    props.next = null
    props.recommendPosts = []
  }

  // 性能优化：清理大数据对象
  delete props.allPages
  delete props.latestPosts // 文章页面通常不需要最新文章数据
  delete props.allNavPages // 文章页面通常不需要导航页面数据
}

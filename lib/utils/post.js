/**
 * 文章相关工具
 * 此处只能放客户端支持的代码
 */
import { isHttpLink } from '.'
import { siteConfig } from '@/lib/config'
import { uploadDataToAlgolia } from '../plugins/algolia'
import { getPageContentText } from '@/lib/db/notion/getPageContentText'
import { getPageTableOfContents } from '../db/notion/getPageTableOfContents'
import { countWords } from '../plugins/wordCount'
import { getPerformanceConfig } from '@/lib/performance.config'
import { CACHE_KEY_AI_SUMMARY } from '@/lib/cache/cache_keys'
import { getDataFromCache, setDataToCache } from '@/lib/cache/cache_manager'
import { getAiSummary } from '@/lib/plugins/aiSummary'
import BLOG from '@/blog.config'

/**
 * 获取文章的关联推荐文章列表，目前根据标签关联性筛选
 * @param post
 * @param {*} allPosts
 * @param {*} count
 * @returns
 */
export function getRecommendPost(post, allPosts, count = 6) {
  let recommendPosts = []
  if (!allPosts) {
    return recommendPosts;
  }
  const postIds = []
  const currentTags = post?.tags || []
  for (let i = 0; i < allPosts.length; i++) {
    const p = allPosts[i]
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

  if (!props.allPages || props.allPages.length === 0) {
    return
  }
  // 推荐关联文章处理 - 性能优化
  const allPosts = props.allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )

  if (allPosts && allPosts.length > 0) {
    const index = allPosts.indexOf(props.post)

    // 获取上一篇和下一篇文章，只保留必要字段
    const prevNextFields = getPerformanceConfig('DATA_OPTIMIZATION', 'PREV_NEXT_FIELDS', [
      'id', 'title', 'slug', 'prefix', 'href', 'pageCoverThumbnail'
    ])

    props.prev = allPosts.slice(index - 1, index)[0] ?? allPosts.slice(-1)[0]
    props.next = allPosts.slice(index + 1, index + 2)[0] ?? allPosts[0]
    if (props.prev) {
      const prevFiltered = {}
      prevNextFields.forEach(field => {
        if (props.prev[field] !== undefined) {
          prevFiltered[field] = props.prev[field]
        } else {
          prevFiltered[field] = null
        }
      })
      props.prev = prevFiltered
    } else {
      props.prev = null; // 确保 prev 不是 undefined
    }
    if (props.next) {
      const nextFiltered = {}
      prevNextFields.forEach(field => {
        if (props.next[field] !== undefined) {
          nextFiltered[field] = props.next[field]
        } else {
          nextFiltered[field] = null
        }
      })
      props.next = nextFiltered
    } else {
      props.next = null; // 确保 next 不是 undefined
    }

    // 获取推荐文章，限制数量并只保留必要字段
    const recommendCount = siteConfig('POST_RECOMMEND_COUNT', 6)
    const fullRecommendPosts = getRecommendPost(props.post, allPosts, recommendCount)

    // 获取推荐文章需要保留的字段
    const recommendFields = getPerformanceConfig('DATA_OPTIMIZATION', 'RECOMMEND_POST_FIELDS', [
      'id', 'title', 'slug', 'prefix', 'href', 'summary', 'pageCoverThumbnail', 'publishDay', 'category'
    ])

    props.recommendPosts = fullRecommendPosts.map(post => {
      const optimizedPost = {}
      recommendFields.forEach(field => {
        if (post[field] !== undefined) {
          optimizedPost[field] = post[field]
        } else {
          optimizedPost[field] = null
        }
      })
      return optimizedPost
    })
  } else {
    props.prev = null
    props.next = null
    props.recommendPosts = []
  }

  // 生成全文索引 && JSON.parse(BLOG.ALGOLIA_RECREATE_DATA)
  if (props?.post?.type === 'Post' && BLOG.ALGOLIA_APP_ID) {
    uploadDataToAlgolia(props?.post).catch(error => {
      console.error('Error uploading data to Algolia:', error)
    })
  }

  // 性能优化：清理大数据对象，但保留需要的数据
  delete props.allPages
  // 删除下面这行注释，不再删除 latestPosts，这样文章详情页也可以使用
  // delete props.latestPosts // 文章页面通常不需要最新文章数据
  delete props.allNavPages // 文章页面通常不需要导航页面数据
}


/**
 * 按置顶标签对文章进行排序：
 * - 含置顶标签的文章排在前面（保持它们在原列表中的相对顺序）
 * - 其余文章保持原有顺序紧随其后
 * - 不改变传入数组（返回新数组）
 * @param {Array} posts 原始文章列表（已按当前站点策略排序好）
 * @param {string} topTag 置顶标签名，例如 '置顶'
 * @returns {Array} 重排后的文章列表
 */
export function sortPostsByTopTag(posts, topTag) {
  if (!Array.isArray(posts) || !topTag) return posts
  const pinnedPosts = []
  const normalPosts = []
  for (const post of posts) {
    const tags = Array.isArray(post?.tags) ? post.tags : []
    if (tags.includes(topTag)) {
      pinnedPosts.push(post)
    } else {
      normalPosts.push(post)
    }
  }
  return [...pinnedPosts, ...normalPosts]
}

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
    const cacheKey = `ai_summary_${post.id}`
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
  const post = props.post

  // 添加保护性检查
  if (!post) {
    return
  }

  // 处理全文索引
  if (post?.blockMap?.block) {
    post.content = Object.keys(post.blockMap.block).filter(
      key => post.blockMap.block[key]?.value?.parent_id === post.id
    )
    post.toc = getPageTableOfContents(post, post.blockMap)
  }

  // 处理关联文章
  if (post?.relatedPosts) {
    if (Array.isArray(post.relatedPosts)) {
      // 如果已经是数组，直接使用
    } else if (typeof post.relatedPosts === 'object' && post.relatedPosts !== null) {
      // 如果是对象，转换为数组
      post.relatedPosts = Object.values(post.relatedPosts)
    } else {
      // 如果是其他类型或null/undefined，设置为空数组
      post.relatedPosts = []
    }
  } else {
    // 确保 relatedPosts 是数组
    post.relatedPosts = []
  }

  //  处理文章推荐
  if (siteConfig('POST_RECOMMEND_ENABLE', false, props.NOTION_CONFIG)) {
    if (!post.relatedPosts || post.relatedPosts.length === 0) {
      let recommendPosts = []
      // 确保 props.allPages 是有效数组后再调用 getRecommendPost
      if (Array.isArray(props.allPages)) {
        recommendPosts = await getRecommendPost(post, props.allPages, 6)
      }
      post.relatedPosts = recommendPosts
    }
  }

  // 处理预览
  if (post?.blockMap) {
    const postInfo = await getPostBlocks(post.id, from)
    post.blockMap = postInfo?.blockMap
  }

  // 生成页面字数统计
  if (post?.blockMap) {
    post.wordCount = await getPageContentWordCount(post.blockMap)
  }

  // 处理自定义字体
  if (post?.customFont) {
    props.customFont = post.customFont
  }

  // 处理自定义样式
  if (post?.customCss) {
    props.customCss = post.customCss
  }

  // 处理自定义脚本
  if (post?.customJs) {
    props.customJs = post.customJs
  }

  // 处理文章摘要
  if (post?.summary) {
    post.summary = post.summary
  } else {
    post.summary = getTextContent(post?.blockMap?.pageCover || '')
  }

  // 处理标签
  if (post?.tags) {
    if (Array.isArray(post.tags)) {
      // 如果已经是数组，直接使用
    } else if (typeof post.tags === 'string') {
      // 如果是字符串，转换为数组
      post.tags = post.tags.split(',')
    } else if (typeof post.tags === 'object' && post.tags !== null) {
      // 如果是对象，转换为数组
      post.tags = Object.values(post.tags)
    } else {
      // 其他情况设置为空数组
      post.tags = []
    }
  } else {
    post.tags = []
  }

  // 处理分类
  if (post?.category) {
    if (Array.isArray(post.category)) {
      // 如果已经是数组，直接使用
    } else if (typeof post.category === 'string') {
      // 如果是字符串，转换为数组
      post.category = post.category.split(',')
    } else if (typeof post.category === 'object' && post.category !== null) {
      // 如果是对象，转换为数组
      post.category = Object.values(post.category)
    } else {
      // 其他情况设置为空数组
      post.category = []
    }
  } else {
    post.category = []
  }

  // 处理评论
  if (post?.comment) {
    post.comment = post.comment
  }

  // 处理密码
  if (post?.password) {
    post.password = post.password
  }

  // 处理封面图
  if (post?.pageCover) {
    post.pageCover = post.pageCover
  }

  // 处理日期
  if (post?.publishDate) {
    post.publishDate = post.publishDate
  }

  // 处理更新日期
  if (post?.lastEditedDate) {
    post.lastEditedDate = post.lastEditedDate
  }

  // 处理作者
  if (post?.author) {
    post.author = post.author
  }

  // 处理文章类型
  if (post?.type) {
    post.type = post.type
  }

  // 处理文章状态
  if (post?.status) {
    post.status = post.status
  }

  // 处理slug
  if (post?.slug) {
    post.slug = post.slug
  }

  // 处理标题
  if (post?.title) {
    post.title = post.title
  }

  // 处理id
  if (post?.id) {
    post.id = post.id
  }

  // 处理slug
  if (post?.slug) {
    post.slug = post.slug
  }

  // 处理自定义外部脚本
  if (post?.externalJs) {
    props.externalJs = post.externalJs
  }

  // 处理自定义外部样式
  if (post?.externalCss) {
    props.externalCss = post.externalCss
  }

  // 处理自定义元数据
  if (post?.meta) {
    props.meta = post.meta
  }

  // 处理自定义结构化数据
  if (post?.structuredData) {
    props.structuredData = post.structuredData
  }

  // 处理自定义openGraph
  if (post?.openGraph) {
    props.openGraph = post.openGraph
  }

  // 处理自定义twitter
  if (post?.twitter) {
    props.twitter = post.twitter
  }

  return post
}

import BLOG from '@/blog.config'
import { getOrSetDataWithCache } from '@/lib/cache/cache_manager'
import { getAllCategories } from '@/lib/notion/getAllCategories'
import getAllPageIds from '@/lib/notion/getAllPageIds'
import { getAllTags } from '@/lib/notion/getAllTags'
import { getConfigMapFromConfigPage } from '@/lib/notion/getNotionConfig'
import getPageProperties, {
  adjustPageProperties
} from '@/lib/notion/getPageProperties'
import { fetchInBatches, getPage } from '@/lib/notion/getPostBlocks'
import { compressImage, mapImgUrl } from '@/lib/notion/mapImage'
import { deepClone } from '@/lib/utils'
import { idToUuid } from 'notion-utils'
import { siteConfig } from '../config'
import { extractLangId, extractLangPrefix, getShortId } from '../utils/pageId'
import { CACHE_KEY_SITE_DATA } from '@/lib/cache/cache_keys'
export { getAllTags } from '../notion/getAllTags'
export { getPost } from '../notion/getNotionPost'
export { getPage as getPostBlocks } from '../notion/getPostBlocks'

/**
 * 获取博客数据; 基于Notion实现
 * @param {*} pageId
 * @param {*} from
 * @param {*} locale 语言  zh|en|jp 等等
 * @param dataTypes
 * @returns
 *
 */
export async function getGlobalData({
                                      pageId = BLOG.NOTION_PAGE_ID,
                                      from,
                                      locale,
                                      dataTypes = null // 新增参数，指定需要的数据类型
                                    }) {
  // 确保 pageId 是字符串类型
  if (typeof pageId !== 'string') {
    pageId = String(pageId)
  }

  // 获取站点数据 ， 如果pageId有逗号隔开则分次取数据
  const siteIds = pageId?.split(',') || []
  let data = EmptyData(pageId)

  if (BLOG.BUNDLE_ANALYZER) {
    return data
  }

  try {
    for (let index = 0; index < siteIds.length; index++) {
      const siteId = siteIds[index]
      const id = extractLangId(siteId)
      const prefix = extractLangPrefix(siteId)
      // 第一个id站点默认语言
      if (index === 0 || locale === prefix) {
        data = await getSiteDataByPageId({
          pageId: id,
          from,
          dataTypes // 传递数据类型参数
        })
      }
    }
  } catch (error) {
    console.error('异常', error)
  }
  if (!data || typeof data !== 'object') {
     console.warn('notion site data empty.....')
  }
  return handleDataBeforeReturn(deepClone(data), dataTypes) // 传递数据类型进行优化处理
}

/**
 * 获取指定notion的collection数据
 * @param pageId
 * @param from 请求来源
 * @returns {Promise<JSX.Element|*|*[]>}
 */
export async function getSiteDataByPageId({ pageId, from, dataTypes = null }) {
  // 确保 pageId 是字符串类型
  if (typeof pageId !== 'string') {
    pageId = String(pageId)
  }

  // 获取NOTION原始数据，此接支持mem缓存。
  const cacheKey = CACHE_KEY_SITE_DATA(pageId)

  return await getOrSetDataWithCache(
    cacheKey,
    async (pageId, from, dataTypes) => {
      const pageRecordMap = await getPage(pageId, from)
      return convertNotionToSiteData(pageId, from, deepClone(pageRecordMap), dataTypes)
    },
    pageId,
    from,
    dataTypes
  )
}

/**
 * 获取公告
 */
async function getNotice(post) {
  if (!post) {
    return null
  }

  post.blockMap = await getPage(post.id, 'data-notice')
  return post
}

/**
 * 空的默认数据
 * @param {*} pageId
 * @returns
 */
const EmptyData = pageId => {
  const empty = {
    notice: null,
    siteInfo: getSiteInfo({}),
    allPages: [
      {
        id: 1,
        title: `无法获取Notion数据，请检查Notion_ID： \n 当前 ${pageId}`,
        summary:
          '访问文档获取帮助 → https://docs.tangly1024.com/article/vercel-deploy-notion-next',
        status: 'Published',
        type: 'Post',
        slug: 'oops',
        publishDay: '2024-11-13',
        pageCoverThumbnail: BLOG.HOME_BANNER_IMAGE || '/bg_image.jpg',
        date: {
          start_date: '2023-04-24',
          lastEditedDay: '2023-04-24',
          tagItems: []
        }
      }
    ],
    allNavPages: [],
    collection: [],
    collectionQuery: {},
    collectionId: null,
    collectionView: {},
    viewIds: [],
    block: {},
    schema: {},
    tagOptions: [],
    categoryOptions: [],
    rawMetadata: {},
    customNav: [],
    customMenu: [],
    postCount: 1,
    pageIds: [],
    latestPosts: []
  }
  return empty
}

/**
 * 将Notion数据转站点数据
 * 这里统一对数据格式化
 * @returns {Promise<JSX.Element|null|*>}
 */
async function convertNotionToSiteData(pageId, from, pageRecordMap, dataTypes = null) {
  if (!pageRecordMap) {
    console.error('can`t get Notion Data ; Which id is: ', pageId)
    return {}
  }
  pageId = idToUuid(pageId)
  let block = pageRecordMap.block || {}
  const rawMetadata = block[pageId]?.value
  // Check Type Page-Database和Inline-Database
  if (
    rawMetadata?.type !== 'collection_view_page' &&
    rawMetadata?.type !== 'collection_view'
  ) {
    console.error(`pageId "${pageId}" is not a database`)
    return EmptyData(pageId)
  }
  const collection = Object.values(pageRecordMap.collection)[0]?.value || {}
  const collectionId = rawMetadata?.collection_id
  const collectionQuery = pageRecordMap.collection_query
  const collectionView = pageRecordMap.collection_view
  const schema = collection?.schema

  const viewIds = rawMetadata?.view_ids
  const collectionData = []

  const pageIds = getAllPageIds(
    collectionQuery,
    collectionId,
    collectionView,
    viewIds
  )

  if (pageIds?.length === 0) {
    console.error(
      '获取到的文章列表为空，请检查notion模板',
      collectionQuery,
      collection,
      collectionView,
      viewIds,
      pageRecordMap
    )
  } else {
    // console.log('有效Page数量', pageIds?.length)
  }

  // 抓取主数据库最多抓取1000个blocks，溢出的数block这里统一抓取一遍
  const blockIdsNeedFetch = []
  const existingBlockIds = new Set(Object.keys(block));
  if (Array.isArray(pageIds) && pageIds.length > 0) {
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      if (id && !block[id]?.value && !existingBlockIds.has(id)) {
        blockIdsNeedFetch.push(id)
      }
    }
  }

  let fetchedBlocks = {}
  if (blockIdsNeedFetch.length === 0) {
    console.log('[getSiteData] 所有页面数据已缓存，无需重新获取')
  } else {
    console.log('[getSiteData] 需要获取的页面数量:', blockIdsNeedFetch.length)
    fetchedBlocks = await fetchInBatches(blockIdsNeedFetch)
    if (!fetchedBlocks || Object.keys(fetchedBlocks).length === 0) {
      console.warn('[getSiteData] 批量获取页面数据失败', { blockIdsCount: blockIdsNeedFetch.length })
    }
  }
  block = Object.assign({}, block, fetchedBlocks)

  // 获取每篇文章基础数据
  if (Array.isArray(pageIds) && pageIds.length > 0) {
    for (let i = 0; i < pageIds.length; i++) {
      const id = pageIds[i]
      if (!id) {
        console.warn('[getSiteData] 发现空的文章id', { index: i, totalPages: pageIds.length })
        continue
      }

      const value = block[id]?.value || fetchedBlocks[id]?.value
      if (!value) {
        console.warn('[getSiteData] 文章数据为空', { id, hasBlock: !!block[id], blockKeys: Object.keys(block).length })
        continue
      }
      const properties =
        (await getPageProperties(
          id,
          value,
          schema,
          null,
          getTagOptions(schema)
        )) || null

      if (properties) {
        collectionData.push(properties)
      }
    }
  }

  // 站点配置优先读取配置表格，否则读取blog.config.js 文件
  const NOTION_CONFIG = (await getConfigMapFromConfigPage(collectionData)) || {}

  // 处理每一条数据的字段
  collectionData.forEach(function (element) {
    adjustPageProperties(element, NOTION_CONFIG)
  })

  // 站点基础信息
  const siteInfo = getSiteInfo({ collection, block, NOTION_CONFIG })

  // 根据数据类型需求决定是否处理所有页面数据
  let allPages = []
  let postCount = 0

  if (!dataTypes || dataTypes.includes('allPages') || dataTypes.includes('posts') || dataTypes.includes('latestPosts')) {
    // 查找所有的Post和Page
    allPages = collectionData.filter(post => {
      if (post?.type === 'Post' && post.status === 'Published') {
        postCount++
      }

      return (
        post &&
        post?.slug &&
        //   !post?.slug?.startsWith('http') &&
        (post?.status === 'Invisible' || post?.status === 'Published')
      )
    })

    // Sort by date
    if (siteConfig('POSTS_SORT_BY', null, NOTION_CONFIG) === 'date') {
      allPages.sort((a, b) => {
        return b?.publishDate - a?.publishDate
      })
    }
  }

  const notice = dataTypes && !dataTypes.includes('notice') ? null : await getNotice(
    collectionData.filter(post => {
      return (
        post &&
        post?.type &&
        post?.type === 'Notice' &&
        post.status === 'Published'
      )
    })?.[0]
  )

  // 根据数据类型决定是否处理分类数据
  let categoryOptions = []
  if (!dataTypes || dataTypes.includes('categoryOptions')) {
    // 所有分类
    categoryOptions = getAllCategories({
      allPages,
      categoryOptions: getCategoryOptions(schema)
    })
  }

  // 根据数据类型决定是否处理标签数据
  let tagOptions = []
  let tagCount = 0;

  // 所有标签
  const tagSchemaOptions = getTagOptions(schema)
  let allTags = await getAllTags({
    allPages: allPages ?? [],
    tagOptions: tagSchemaOptions ?? [],
    NOTION_CONFIG
  }) ?? null
  if (allTags) {
    tagCount = allTags?.length || 0;
  }
  if (!dataTypes || dataTypes.includes('tagOptions')) {
    tagOptions = allTags;
    tagCount = tagOptions?.length || 0;
  }

  // 自定义导航对所有页面都很重要，始终处理
  const customNav = await getCustomNav({
    allPages: collectionData.filter(
      post => post?.type === 'Page' && post.status === 'Published'
    )
  }) || []

  // 自定义菜单对所有页面都很重要，始终处理
  const customMenu = getCustomMenu({ collectionData, NOTION_CONFIG }) || []

  // 根据数据类型决定是否处理最新文章
  let latestPosts = []
  if (!dataTypes || dataTypes.includes('latestPosts')) {
    latestPosts = getLatestPosts({ allPages, from, latestPostCount: 6 })
  }

  // 根据数据类型决定是否处理导航页面
  let allNavPages = []
  if (!dataTypes || dataTypes.includes('allNavPages')) {
    allNavPages = getNavPages({ allPages })
  }

  return {
    NOTION_CONFIG,
    notice,
    siteInfo,
    allPages,
    allNavPages,
    collection,
    collectionQuery,
    collectionId,
    collectionView,
    viewIds,
    block,
    schema,
    tagOptions,
    categoryOptions,
    rawMetadata,
    customNav,
    customMenu,
    postCount,
    pageIds,
    latestPosts,
    tagCount
  }
}

/**
 * 返回给浏览器前端的数据处理
 * 适当脱敏
 * 减少体积
 * 其它处理
 * @param {*} db
 */
function handleDataBeforeReturn(db, dataTypes = null) {
  // 根据数据类型决定清理哪些数据
  if (!dataTypes || !dataTypes.includes('block')) {
    delete db.block
  }
  if (!dataTypes || !dataTypes.includes('schema')) {
    delete db.schema
  }
  if (!dataTypes || !dataTypes.includes('rawMetadata')) {
    delete db.rawMetadata
  }
  if (!dataTypes || !dataTypes.includes('pageIds')) {
    delete db.pageIds
  }
  if (!dataTypes || !dataTypes.includes('viewIds')) {
    delete db.viewIds
  }
  if (!dataTypes || !dataTypes.includes('collection')) {
    delete db.collection
  }
  if (!dataTypes || !dataTypes.includes('collectionQuery')) {
    delete db.collectionQuery
  }
  if (!dataTypes || !dataTypes.includes('collectionId')) {
    delete db.collectionId
  }
  if (!dataTypes || !dataTypes.includes('collectionView')) {
    delete db.collectionView
  }

  // 清理多余的块
  if (db?.notice) {
    db.notice = cleanBlock(db?.notice)
    delete db.notice?.id
  }
  // 分类选项对导航很重要，不应该被删除，但可以进行清理
  if (db?.categoryOptions) {
    db.categoryOptions = cleanIds(db?.categoryOptions)
  }
  // 自定义菜单对所有页面都很重要，不应该被删除，但可以进行清理
  if (db?.customMenu) {
    db.customMenu = cleanIds(db?.customMenu)
  }

  //   db.latestPosts = shortenIds(db?.latestPosts)
  if (dataTypes && !dataTypes.includes('allNavPages')) {
    delete db.allNavPages
  } else if (!dataTypes || dataTypes.includes('allNavPages')) {
    db.allNavPages = shortenIds(db?.allNavPages)
    //   db.allPages = cleanBlocks(db?.allPages)
    db.allNavPages = cleanPages(db?.allNavPages, db.tagOptions)
    // 性能优化：移除不必要的字段以减少数据传输量
    db.allNavPages = optimizePageData(db.allNavPages)
  }

  if (dataTypes && !dataTypes.includes('allPages')) {
    delete db.allPages
  } else if (!dataTypes || dataTypes.includes('allPages')) {
    db.allPages = cleanPages(db.allPages, db.tagOptions)
    // 性能优化：移除不必要的字段以减少数据传输量
    db.allPages = optimizePageData(db.allPages)
  }

  if (dataTypes && !dataTypes.includes('latestPosts')) {
    delete db.latestPosts
  } else if (!dataTypes || dataTypes.includes('latestPosts')) {
    db.latestPosts = cleanPages(db.latestPosts, db.tagOptions)
    // 性能优化：移除不必要的字段以减少数据传输量
    db.latestPosts = optimizePageData(db.latestPosts)
  }

  // 必须在使用完毕后才能进行清理
  if (dataTypes && !dataTypes.includes('tagOptions')) {
    delete db.tagOptions
  } else if (!dataTypes || dataTypes.includes('tagOptions')) {
    db.tagOptions = cleanTagOptions(db?.tagOptions)
  }

  const POST_SCHEDULE_PUBLISH = siteConfig(
    'POST_SCHEDULE_PUBLISH',
    null,
    db.NOTION_CONFIG
  )
  if (POST_SCHEDULE_PUBLISH) {
    //   console.log('[定时发布] 开启检测')
    db.allPages?.forEach(p => {
      // 新特性，判断文章的发布和下架时间，如果不在有效期内则进行下架处理
      const publish = isInRange(p.title, p.date)
      if (!publish) {
        const currentTimestamp = Date.now()
        const startTimestamp = getTimestamp(
          p.date.start_date,
          p.date.start_time || '00:00',
          p.date.time_zone
        )
        const endTimestamp = getTimestamp(
          p.date.end_date,
          p.date.end_time || '23:59',
          p.date.time_zone
        )
        console.log(
          '[定时发布] 隐藏--> 文章:',
          p.title,
          '当前时间戳:',
          currentTimestamp,
          '目标时间戳:',
          startTimestamp,
          '-',
          endTimestamp
        )
        // 隐藏
        p.status = 'Invisible'
      }
    })
  }

  return db
}

/**
 * 处理文章列表中的异常数据
 * @param {Array} allPages - 所有页面数据
 * @param {Array} tagOptions - 标签选项
 * @returns {Array} 处理后的 allPages
 */
function cleanPages(allPages, tagOptions) {
  // 校验参数是否为数组
  if (!Array.isArray(allPages) || !Array.isArray(tagOptions)) {
    console.warn('Invalid input: allPages and tagOptions should be arrays.')
    return allPages || [] // 返回空数组或原始值
  }

  // 遍历所有的 pages
  allPages.forEach(page => {
    // 确保 tagItems 是数组
    if (Array.isArray(page.tagItems)) {
      // 对每个 page 的 tagItems 进行过滤
      page.tagItems = page.tagItems.filter(
        tagItem =>
         typeof tagItem.name === 'string' // 校验 tagItem.name 是否是字符串
      )
    }
  })

  return allPages
}

/**
 * 清理一组数据的id
 * @param {*} items
 * @returns
 */
function shortenIds(items) {
  if (items && Array.isArray(items)) {
    return deepClone(
      items.map(item => {
        item.short_id = getShortId(item.id)
        delete item.id
        return item
      })
    )
  }
  return items
}

/**
 * 优化页面数据，移除不必要的字段以减少数据传输量
 * @param {Array} pages - 页面数据数组
 * @returns {Array} 优化后的页面数据
 */
function optimizePageData(pages) {
  if (!Array.isArray(pages)) {
    return pages
  }

  // 导入性能配置
  const {
    getPerformanceConfig,
    isDataOptimizationEnabled
  } = require('@/lib/performance.config')

  // 检查是否启用数据优化
  if (!isDataOptimizationEnabled()) {
    return pages
  }

  // 获取需要保留的字段列表
  const keepFields = getPerformanceConfig(
    'DATA_OPTIMIZATION',
    'PAGE_LIST_FIELDS',
    [
      'id',
      'title',
      'slug',
      'type',
      'status',
      'category',
      'summary',
      'publishDate',
      'publishDay',
      'lastEditedDate',
      'lastEditedDay',
      'pageCover',
      'pageCoverThumbnail',
      'pageIcon',
      'tagItems',
      'tags', // 添加 tags 字段，因为 tagItems 依赖于它
      'date',
      'fullWidth',
      'password',
      'ext',
      'musicId',
      'href' // 添加 href，确保链接可用
    ]
  )

  return pages.map(page => {
    if (!page) return page

    // 创建优化后的页面对象，只保留配置中指定的字段
    const optimizedPage = {}
    keepFields.forEach(field => {
      if (page[field] !== undefined) {
        let fieldValue = page[field]
        
        // 确保日期字段是可序列化的格式
        if ((field === 'publishDate' || field === 'lastEditedDate') && fieldValue instanceof Date) {
          fieldValue = fieldValue.getTime()
        }
        
        optimizedPage[field] = fieldValue
      }
    })

    // 特别处理 tagItems，确保即使为空也要保留该字段
    if (optimizedPage.tagItems === undefined) {
      optimizedPage.tagItems = page.tagItems || []
    }

    // 移除空值和未定义的字段以进一步减少数据量
    Object.keys(optimizedPage).forEach(key => {
      if (optimizedPage[key] === undefined || optimizedPage[key] === null) {
        delete optimizedPage[key]
      }
    })

    return optimizedPage
  })
}

/**
 * 清理一组数据的id
 * @param {*} items
 * @returns
 */
function cleanIds(items) {
  if (items && Array.isArray(items)) {
    return deepClone(
      items.map(item => {
        delete item.id
        return item
      })
    )
  }
  return items
}

/**
 * 清理和过滤tagOptions
 * @param {*} tagOptions
 * @returns
 */
function cleanTagOptions(tagOptions) {
  if (tagOptions && Array.isArray(tagOptions)) {
    return deepClone(
      tagOptions
        .filter(tagOption => tagOption.source === 'Published')
        .map(({ id, source, ...newTagOption }) => newTagOption)
    )
  }
  return tagOptions
}

/**
 * 清理block数据
 */
function cleanBlock(item) {
  const post = deepClone(item)
  const pageBlock = post?.blockMap?.block
  //   delete post?.id
  //   delete post?.blockMap?.collection

  if (pageBlock) {
    for (const i in pageBlock) {
      pageBlock[i] = cleanBlock(pageBlock[i])
      delete pageBlock[i]?.role
      delete pageBlock[i]?.value?.version
      delete pageBlock[i]?.value?.created_by_table
      delete pageBlock[i]?.value?.created_by_id
      delete pageBlock[i]?.value?.last_edited_by_table
      delete pageBlock[i]?.value?.last_edited_by_id
      delete pageBlock[i]?.value?.space_id
      delete pageBlock[i]?.value?.version
      delete pageBlock[i]?.value?.format?.copied_from_pointer
      delete pageBlock[i]?.value?.format?.block_locked_by
      delete pageBlock[i]?.value?.parent_table
      delete pageBlock[i]?.value?.copied_from_pointer
      delete pageBlock[i]?.value?.copied_from
      delete pageBlock[i]?.value?.created_by_table
      delete pageBlock[i]?.value?.created_by_id
      delete pageBlock[i]?.value?.last_edited_by_table
      delete pageBlock[i]?.value?.last_edited_by_id
      delete pageBlock[i]?.value?.permissions
      delete pageBlock[i]?.value?.alive
    }
  }
  return post
}

/**
 * 获取最新文章 根据最后修改时间倒序排列
 * @param {*}} param0
 * @returns
 */
function getLatestPosts({ allPages, from, latestPostCount }) {
  const allPosts = allPages?.filter(
    page => page.type === 'Post' && page.status === 'Published'
  )

  const latestPosts = Object.create(allPosts).sort((a, b) => {
    // 确保日期是可序列化的格式
    let dateA = a?.lastEditedDate || a?.publishDate
    let dateB = b?.lastEditedDate || b?.publishDate
    
    // 如果日期是时间戳，直接使用；如果是Date对象，转换为时间戳
    if (dateA instanceof Date) {
      dateA = dateA.getTime()
    }
    if (dateB instanceof Date) {
      dateB = dateB.getTime()
    }
    
    // 如果日期还不是数字（时间戳），尝试转换
    if (typeof dateA === 'string') {
      dateA = new Date(dateA).getTime()
    }
    if (typeof dateB === 'string') {
      dateB = new Date(dateB).getTime()
    }
    
    return dateB - dateA
  })
  return latestPosts.slice(0, latestPostCount)
}

/**
 * 获取用户自定义单页菜单
 * 旧版本，不读取Menu菜单，而是读取type=Page生成菜单
 * @param notionPageData
 * @returns {Promise<[]|*[]>}
 */
function getCustomNav({ allPages }) {
  const customNav = []
  if (allPages && allPages.length > 0) {
    allPages.forEach(p => {
      p.to = p.slug
      customNav.push({
        icon: p.icon || null,
        name: p.title || p.name || '',
        href: p.href,
        target: p.target,
        show: true
      })
    })
  }
  return customNav
}

/**
 * 获取自定义菜单
 * @param {*} allPages
 * @returns
 */
function getCustomMenu({ collectionData, NOTION_CONFIG }) {
  const menuPages = collectionData.filter(
    post =>
      post.status === 'Published' &&
      (post?.type === 'Menu' || post?.type === 'SubMenu')
  )
  const menus = []
  if (menuPages && menuPages.length > 0) {
    menuPages.forEach(e => {
      if (e.lastEditedDate === undefined) {
         e.lastEditedDate = e.publishDate
      }
      // 确保日期字段是可序列化的格式
      if (e.lastEditedDate instanceof Date) {
        e.lastEditedDate = e.lastEditedDate.getTime()
      }
      if (e.publishDate instanceof Date) {
        e.publishDate = e.publishDate.getTime()
      }
      e.show = true
      if (e.type === 'Menu') {
        menus.push(e)
      } else if (e.type === 'SubMenu') {
        const parentMenu = menus[menus.length - 1]
        if (parentMenu) {
          if (parentMenu.subMenus) {
            parentMenu.subMenus.push(e)
          } else {
            parentMenu.subMenus = [e]
          }
        }
      }
    })
  }
  return menus
}

/**
 * 获取标签选项
 * @param schema
 * @returns {undefined}
 */
function getTagOptions(schema) {
  if (!schema) return {}
  const tagSchema = Object.values(schema).find(
    e => e.name === BLOG.NOTION_PROPERTY_NAME.tags
  )
  return tagSchema?.options || []
}

/**
 * 获取分类选项
 * @param schema
 * @returns {{}|*|*[]}
 */
function getCategoryOptions(schema) {
  if (!schema) return {}
  const categorySchema = Object.values(schema).find(
    e => e.name === BLOG.NOTION_PROPERTY_NAME.category
  )
  return categorySchema?.options || []
}

/**
 * 站点信息
 * @param notionPageData
 * @param from
 * @returns {Promise<{title,description,pageCover,icon}>}
 */
function getSiteInfo({ collection, block, NOTION_CONFIG }) {
  const defaultTitle = NOTION_CONFIG?.TITLE || 'Honesty BLOG'
  const defaultDescription =
    NOTION_CONFIG?.DESCRIPTION || '网站维护中....博主正在积极抢救'
  const defaultPageCover = NOTION_CONFIG?.HOME_BANNER_IMAGE || '/bg_image.jpg'
  const defaultIcon = NOTION_CONFIG?.AVATAR || '/avatar.svg'
  const defaultLink = NOTION_CONFIG?.LINK || BLOG.LINK
  // 空数据的情况返回默认值
  if (!collection && !block) {
    return {
      title: defaultTitle,
      description: defaultDescription,
      pageCover: defaultPageCover,
      icon: defaultIcon,
      link: defaultLink
    }
  }

  const title = collection?.name?.[0][0] || defaultTitle
  const description = collection?.description
    ? Object.assign(collection).description[0][0]
    : defaultDescription

  const pageCover = collection?.cover
    ? mapImgUrl(collection?.cover, collection, 'collection')
    : defaultPageCover

  // 用户头像压缩一下
  let icon = compressImage(
    collection?.icon
      ? mapImgUrl(collection?.icon, collection, 'collection')
      : defaultIcon
  )
  // 站点网址
  const link = NOTION_CONFIG?.LINK || defaultLink

  // 站点图标不能是emoji
  const emojiPattern = /\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDE4F]/g
  if (!icon || emojiPattern.test(icon)) {
    icon = defaultIcon
  }
  return { title, description, pageCover, icon, link }
}

/**
 * 判断文章是否在发布时间内
 * @param {string} title - 文章标题
 * @param {Object} date - 时间范围参数
 * @param {string} date.start_date - 开始日期（格式：YYYY-MM-DD）
 * @param {string} date.start_time - 开始时间（可选，格式：HH:mm）
 * @param {string} date.end_date - 结束日期（格式：YYYY-MM-DD）
 * @param {string} date.end_time - 结束时间（可选，格式：HH:mm）
 * @param {string} date.time_zone - 时区（IANA格式，如 "Asia/Shanghai"）
 * @returns {boolean} 是否在范围内
 */
function isInRange(title, date = {}) {
  const {
    start_date,
    start_time = '00:00',
    end_date,
    end_time = '23:59',
    time_zone = 'Asia/Shanghai'
  } = date

  // 获取当前时间的时间戳（基于目标时区）
  const currentTimestamp = Date.now()

  // 获取开始和结束时间的时间戳
  const startTimestamp = getTimestamp(start_date, start_time, time_zone)
  const endTimestamp = getTimestamp(end_date, end_time, time_zone)

  // 判断是否在范围内
  if (startTimestamp && currentTimestamp < startTimestamp) {
    return false
  }

  if (endTimestamp && currentTimestamp > endTimestamp) {
    return false
  }

  return true
}

/**
 * 将指定时区的日期字符串转换为 UTC 时间
 * @param {string} dateStr - 日期字符串，格式为 YYYY-MM-DD HH:mm:ss
 * @param {string} timeZone - 时区名称（如 "Asia/Shanghai"）
 * @returns {Date} - 转换后的 Date 对象（UTC 时间）
 */
function convertToUTC(dateStr, timeZone = 'Asia/Shanghai') {
  // 维护一个时区偏移映射（以小时为单位）
  const timeZoneOffsets = {
    // UTC 基础
    UTC: 0,
    'Etc/GMT': 0,
    'Etc/GMT+0': 0,

    // 亚洲地区
    'Asia/Shanghai': 8, // 中国
    'Asia/Taipei': 8, // 台湾
    'Asia/Tokyo': 9, // 日本
    'Asia/Seoul': 9, // 韩国
    'Asia/Kolkata': 5.5, // 印度
    'Asia/Jakarta': 7, // 印尼
    'Asia/Singapore': 8, // 新加坡
    'Asia/Hong_Kong': 8, // 香港
    'Asia/Bangkok': 7, // 泰国
    'Asia/Dubai': 4, // 阿联酋
    'Asia/Tehran': 3.5, // 伊朗
    'Asia/Riyadh': 3, // 沙特阿拉伯

    // 欧洲地区
    'Europe/London': 0, // 英国（GMT）
    'Europe/Paris': 1, // 法国（CET）
    'Europe/Berlin': 1, // 德国
    'Europe/Moscow': 3, // 俄罗斯
    'Europe/Amsterdam': 1, // 荷兰

    // 美洲地区
    'America/New_York': -5, // 美国东部（EST）
    'America/Chicago': -6, // 美国中部（CST）
    'America/Denver': -7, // 美国山区时间（MST）
    'America/Los_Angeles': -8, // 美国西部（PST）
    'America/Sao_Paulo': -3, // 巴西
    'America/Argentina/Buenos_Aires': -3, // 阿根廷

    // 非洲地区
    'Africa/Johannesburg': 2, // 南非
    'Africa/Cairo': 2, // 埃及
    'Africa/Nairobi': 3, // 肯尼亚

    // 大洋洲地区
    'Australia/Sydney': 10, // 澳大利亚东部
    'Australia/Perth': 8, // 澳大利亚西部
    'Pacific/Auckland': 13, // 新西兰
    'Pacific/Fiji': 12, // 斐济

    // 北极与南极
    'Antarctica/Palmer': -3, // 南极洲帕尔默
    'Antarctica/McMurdo': 13 // 南极洲麦克默多
  }

  // 预设每个大洲的默认时区
  const continentDefaults = {
    Asia: 'Asia/Shanghai',
    Europe: 'Europe/London',
    America: 'America/New_York',
    Africa: 'Africa/Cairo',
    Australia: 'Australia/Sydney',
    Pacific: 'Pacific/Auckland',
    Antarctica: 'Antarctica/Palmer',
    UTC: 'UTC'
  }

  // 获取目标时区的偏移量（以小时为单位）
  let offsetHours = timeZoneOffsets[timeZone]

  // 未被支持的时区采用兼容
  if (offsetHours === undefined) {
    // 获取时区所属大洲（"Continent/City" -> "Continent"）
    const continent = timeZone.split('/')[0]

    // 选择该大洲的默认时区
    const fallbackZone = continentDefaults[continent] || 'UTC'
    offsetHours = timeZoneOffsets[fallbackZone]

    console.warn(
      `Warning: Unsupported time zone "${timeZone}". Using default "${fallbackZone}" for continent "${continent}".`
    )
  }

  // 将日期字符串转换为本地时间的 Date 对象
  const localDate = new Date(`${dateStr.replace(' ', 'T')}Z`)
  if (isNaN(localDate.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`)
  }

  // 计算 UTC 时间的时间戳
  const utcTimestamp = localDate.getTime() - offsetHours * 60 * 60 * 1000
  return new Date(utcTimestamp)
}

// 辅助函数：生成指定日期时间的时间戳（基于目标时区）
function getTimestamp(date, time = '00:00', time_zone) {
  if (!date) return null
  return convertToUTC(`${date} ${time}:00`, time_zone).getTime()
}

/**
 * 获取导航用的精减文章列表
 * gitbook主题用到，只保留文章的标题分类标签分类信息，精减掉摘要密码日期等数据
 * 导航页面的条件，必须是Posts
 * @param {*} param0
 */
export function getNavPages({ allPages }) {
  const allNavPages = allPages?.filter(post => {
    return (
      post &&
      post?.slug &&
      post?.type === 'Post' &&
      post?.status === 'Published'
    )
  })

  return allNavPages.map(item => {
    // 确保日期字段是可序列化的格式
    let lastEditedDate = item.lastEditedDate
    let publishDate = item.publishDate
    
    if (lastEditedDate instanceof Date) {
      lastEditedDate = lastEditedDate.getTime()
    }
    if (publishDate instanceof Date) {
      publishDate = publishDate.getTime()
    }
    
    return {
      id: item.id,
      title: item.title || '',
      pageCoverThumbnail: item.pageCoverThumbnail || '',
      category: item.category || null,
      tags: item.tags || null,
      summary: item.summary || null,
      slug: item.slug,
      href: item.href,
      pageIcon: item.pageIcon || '',
      lastEditedDate: lastEditedDate,
      publishDate: publishDate,
      ext: item.ext || {}
    }
  })
}

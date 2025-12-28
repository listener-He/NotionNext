import BLOG from '@/blog.config'
import { idToUuid } from 'notion-utils'
import { mapImgUrl } from './mapImage'
import formatDate from '../utils/formatDate'
import { getPage } from './getPostBlocks'
import { checkStrIsNotionId, checkStrIsUuid } from '@/lib/utils'

/**
 * 根据页面ID获取内容
 * @param {*} pageId
 * @returns
 */
export async function getPost(pageId) {
  const blockMap = await getPage(pageId, 'slug')
  if (!blockMap) {
    return null
  }
  if (checkStrIsNotionId(pageId)) {
    pageId = idToUuid(pageId)
  }
  if (!checkStrIsUuid(pageId)) {
    return null
  }
  const postInfo = blockMap?.block?.[pageId]?.value
  if (!postInfo) {
    return null
  }
  return {
    id: pageId,
    type: postInfo.type,
    category: '',
    tags: [],
    title: postInfo?.properties?.title?.[0] || null,
    status: 'Published',
    createdTime: formatDate(
      new Date(postInfo.created_time).toString(),
      BLOG.LANG
    ),
    lastEditedDay: formatDate(
      new Date(postInfo?.last_edited_time).toString(),
      BLOG.LANG
    ),

    fullWidth: postInfo?.fullWidth || false,
    page_cover: getPageCover(postInfo)  || null,
    date: {
      start_date: formatDate(
        new Date(postInfo?.last_edited_time).toString(),
        BLOG.LANG
      )
    },
    content: postInfo?.content || [],
    blockMap
  }
}

function getPageCover(postInfo) {
  const pageCover = postInfo.format?.page_cover
  if (pageCover) {
    // Notion 内部相对路径
    if (pageCover.startsWith('/')) {
      return BLOG.NOTION_HOST + pageCover
    }

    // Notion / 外部图片
    if (pageCover.startsWith('http')) {
      return mapImgUrl(pageCover, postInfo)
    }

    return pageCover
  }
  return null
}

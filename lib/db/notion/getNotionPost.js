import BLOG from '@/blog.config'
import { idToUuid } from 'notion-utils'
import ReactNotionX from 'react-notion-x'
import formatDate from '../../utils/formatDate'
import { fetchNotionPageBlocks } from './getPostBlocks'
import { mapImgUrl } from './mapImage'
import { checkStrIsNotionId, checkStrIsUuid } from '@/lib/utils'

/**
 * 根据页面ID获取文章
 * @param {*} pageId
 * @returns
 */
export async function fetchPageFromNotion(pageId) {
  const blockMap = await fetchNotionPageBlocks(pageId, 'slug')
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
    if (pageCover.startsWith('/')) return BLOG.NOTION_HOST + pageCover
    // // Notion / 外部图片
    if (pageCover.startsWith('http')) {
      console.log('ReactNotionX', ReactNotionX)
      return mapImgUrl(pageCover, postInfo)
    }
    // return defaultMapImageUrl(pageCover, postInfo)
    return null
  }
  return null
}

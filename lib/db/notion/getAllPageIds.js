import BLOG from "@/blog.config"

export default function getAllPageIds(collectionQuery, collectionId, collectionView, viewIds) {
  if (!collectionQuery && !collectionView) {
    console.warn('PageIds: 从collectionId获取 empty.', collectionId, viewIds)
    return []
  }
  console.log('PageIds: 从collectionId获取', collectionId, viewIds)
  let pageIds = []
  try {
    // Notion数据库中的第几个视图用于站点展示和排序：
    const groupIndex = BLOG.NOTION_INDEX || 0
    if (viewIds && viewIds.length > 0 && collectionQuery && collectionQuery[collectionId]) {
      const viewData = collectionQuery[collectionId][viewIds[groupIndex]]
      if (!viewData) {
        console.warn('[getAllPageIds] viewData为空', { collectionId, groupIndex, viewIds, availableViews: Object.keys(collectionQuery[collectionId] || {}) })
      }
      const ids = viewData?.collection_group_results?.blockIds || []
      console.log('PageIds: 从collectionId获取', collectionId, ids)
      if (Array.isArray(ids) && ids.length > 0) {
        for (const id of ids) {
          if (id) {
            pageIds.push(id)
          } else {
            console.warn('[getAllPageIds] 发现空的id', { collectionId, totalIds: ids.length })
          }
        }
      } else {
        console.warn('[getAllPageIds] ids数组为空或无效', { collectionId, idsType: typeof ids, idsLength: Array.isArray(ids) ? ids.length : 'not array', viewData: !!viewData })
      }
    } else {
      console.warn('[getAllPageIds] 条件检查失败', { 
        hasViewIds: !!(viewIds && viewIds.length > 0), 
        hasCollectionQuery: !!collectionQuery, 
        hasCollectionData: !!(collectionQuery && collectionQuery[collectionId]),
        collectionId,
        viewIdsLength: viewIds?.length || 0
      })
    }
  } catch (error) {
    console.error('[getAllPageIds] 异常:', { collectionId, viewIds, error: error.message, stack: error.stack });
    return [];
  }

  // 否则按照数据库原始排序
  if (pageIds.length === 0 && collectionQuery && Object.values(collectionQuery).length > 0) {
    const pageSet = new Set()
    // 添加空值检查，确保 collectionQuery[collectionId] 存在
    const collectionQueryData = collectionQuery[collectionId]
    if (collectionQueryData && typeof collectionQueryData === 'object') {
      Object.values(collectionQueryData).forEach(view => {
        view?.blockIds?.forEach(id => pageSet.add(id)) // group视图
        view?.collection_group_results?.blockIds?.forEach(id => pageSet.add(id)) // table视图
      })
    }
    pageIds = [...pageSet]
    // console.log('PageIds: 从collectionQuery获取', collectionQuery, pageIds.length)
  }
  return pageIds
}

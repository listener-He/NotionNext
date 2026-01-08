/**
 * 根据文章最后更新时间计算缓存系数
 * @param {number} lastEditedTimestamp - 文章最后更新时间戳
 * @returns {number} 缓存系数 (1-90)
 */
export function calculateCacheCoefficientByLastEditedTime(lastEditedTimestamp) {
  if (!lastEditedTimestamp) {
    return 1 // 默认系数
  }

  const now = Date.now()
  const diffTime = now - lastEditedTimestamp
  const diffDays = diffTime / (1000 * 60 * 60 * 24) // 转换为天数

  // 根据文章更新时间确定缓存系数
  if (diffDays <= 3) {
    // 最近3天更新的文章，缓存系数为1
    return 1
  } else if (diffDays <= 7) {
     // 最近7天更新的文章，缓存系数为7
    return 7
  } else if (diffDays <= 15) {
    // 最近半个月更新的文章，缓存系数为15
    return 15
  } else if (diffDays <= 30) {
    // 最近一个月更新的文章，缓存系数为5
    return 30
  } else if (diffDays <= 90) {
    // 最近3个月更新的文章，缓存系数为500
    return 500
  } else if (diffDays <= 180) {
    // 最近半年更新的文章，缓存系数为1000
    return 1000
  } else {
    // 更早更新的文章，缓存系数为7800
    return 7800
  }
}

/**
 * 计算文章详情页的缓存时间
 * @param {number} baseRevalidateSecond - 基础缓存时间（秒）
 * @param {number} lastEditedTimestamp - 文章最后更新时间戳
 * @returns {number} 最终缓存时间（秒）
 */
export function calculatePostCacheTime(baseRevalidateSecond, lastEditedTimestamp) {
  const coefficient = calculateCacheCoefficientByLastEditedTime(lastEditedTimestamp)
  return Math.max(Math.trunc(baseRevalidateSecond  * coefficient), 300) // 最少5分钟
}

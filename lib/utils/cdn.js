import { siteConfig } from '@/lib/config'

/**
 * 根据 CHINA_OPTIMIZATION_ENABLED 配置和访问者地理位置，返回最适合的CDN资源链接
 * @param {string} resourceUrl - 原始资源链接
 * @param {string} resourceType - 资源类型，如 'google-fonts', 'jsdelivr', 'unpkg', 'cdnjs' 等
 * @returns {Promise<string>} - 优化后的资源链接
 */
export async function getCDNResource(resourceUrl, resourceType = null) {
  // 如果配置明确启用中国大陆优化，则直接返回国内镜像
  if (siteConfig('CHINA_OPTIMIZATION_ENABLED') === true ||
      siteConfig('CHINA_OPTIMIZATION_ENABLED') === 'true') {
    return getChinaMirror(resourceUrl, resourceType)
  }

  // 如果配置明确禁用中国大陆优化，则返回原始URL
  if (siteConfig('CHINA_OPTIMIZATION_ENABLED') === false ||
      siteConfig('CHINA_OPTIMIZATION_ENABLED') === 'false') {
    return resourceUrl
  }

  // 检查资源URL是否已经包含国内CDN域名
  if (isChinaCDNUrl(resourceUrl)) {
    return resourceUrl
  }

  // 尝试通过IP地理位置判断，如果失败则使用默认配置
  try {
    let result = localStorage.getItem('cdn-detect-result')
    if (result) {
      if (result === 'true') {
        return getChinaMirror(resourceUrl, resourceType)
      }
    } else {
      const isChinaUser = await checkIfChinaUser()
      localStorage.setItem('cdn-detect-result', isChinaUser)
      if (isChinaUser) {
        return getChinaMirror(resourceUrl, resourceType)
      }
    }

  } catch (error) {
    console.warn('无法检测用户地理位置，使用默认配置:', error)
    // 检测失败时，根据配置决定是否使用国内镜像
    return resourceUrl
  }

  return resourceUrl
}

/**
 * 同步版本的CDN资源获取函数，不进行IP检测，仅根据配置
 * @param {string} resourceUrl - 原始资源链接
 * @param {string} resourceType - 资源类型
 * @returns {string} - 优化后的资源链接
 */
export function getCDNResourceSync(resourceUrl, resourceType = null) {
  // 如果配置明确启用中国大陆优化，则直接返回国内镜像
  if (siteConfig('CHINA_OPTIMIZATION_ENABLED') === true ||
      siteConfig('CHINA_OPTIMIZATION_ENABLED') === 'true') {
    return getChinaMirror(resourceUrl, resourceType)
  }

  // 如果没有启用中国优化，返回原始URL
  return resourceUrl
}

/**
 * 检测用户是否在中国大陆
 * @returns {Promise<boolean>} - 如果用户在中国大陆返回true，否则返回false
 */
async function checkIfChinaUser() {
  try {
    // 使用多个IP地理位置服务进行检测，以防止单个服务不可用
    const ipServices = [
      'https://ipapi.co/json/',
      'https://ipinfo.io/json/',
      'https://jsonip.com',
      'https://api.myip.com'
    ]
    for (const service of ipServices) {
      try {
        const response = await fetch(service)
        if (!response.ok) continue

        const data = await response.json()

        // 不同服务返回的数据结构不同，需要分别处理
        let countryCode = null
        if (data.country) {
          countryCode = data.country
        } else if (data.loc) {
          countryCode = data.loc.split(',')[0]
        } else if (data.country_code) {
          countryCode = data.country_code
        } else if (data.cca2) {
          countryCode = data.cca2
        }

        if (countryCode && ['CN', 'CHN', 'China', 'CN '].includes(countryCode.toUpperCase().trim())) {
          return true
        }

        // 如果检测到非中国IP，可以提前返回
        if (countryCode && !['CN', 'CHN', 'China', 'CN '].includes(countryCode.toUpperCase().trim())) {
          return false
        }
      } catch (error) {
        console.warn(`IP地理位置服务 ${service} 请求失败:`, error)
        continue // 尝试下一个服务
      }
    }

    // 如果所有服务都失败，返回false（默认非中国用户）
    return false
  } catch (error) {
    console.error('检测用户地理位置时出错:', error)
    return false
  }
}

/**
 * 判断URL是否已经是中国CDN域名
 * @param {string} url
 * @returns {boolean}
 */
function isChinaCDNUrl(url) {
  if (!url) return false
  const chinaCDNDomains = [
    'bootcdn.net',
    'bootcdn.org',
    'cdn.bootcdn.net',
    'cdn.jsdelivr.net',
    'unpkg.zhimg.com',
    'lf-cdn.com',
    'lf6-cdn-tos.bytecdntp.com',
    'lf3-cdn-tos.bytecdntp.com',
    'npm.elemecdn.com',
    'g.alicdn.com',
    'cdn.staticfile.org',
    'libs.cdnjs.net',
    'npm.webcache.cn',
    'cdn.baomitu.com',
    'lib.baomitu.com',
    'fastly.jsdelivr.net',
    'gcore.jsdelivr.net',
    'cdn.zenless.net',
    'fonts.loli.net',
    'cdnjs.loli.net',
    'npm.loli.net',
    'unpkg.loli.net',
    'raw.githubusercontent.com.cn'
  ]

  return chinaCDNDomains.some(domain => url.includes(domain))
}

/**
 * 获取国内镜像链接
 * @param {string} resourceUrl - 原始资源链接
 * @param {string} resourceType - 资源类型
 * @returns {string} - 国内镜像链接
 */
function getChinaMirror(resourceUrl, resourceType) {
  if (!resourceUrl) return resourceUrl

  // 检查是否已经是国内CDN链接
  if (isChinaCDNUrl(resourceUrl)) {
    return resourceUrl
  }
  if (resourceUrl.startsWith('https://cdnjs.cloudflare.com/ajax/')) {
    return resourceUrl.replace('https://cdnjs.cloudflare.com/ajax/', 'https://cdn.bootcdn.net/ajax/')
  } else if (resourceUrl.startsWith('https://cdn.jsdelivr.net/npm/')) {
    return resourceUrl.replace('https://cdn.jsdelivr.net/npm/', 'https://jsd.cdn.zzko.cn/npm/')
  }
  // 根据资源类型和URL模式进行替换
  if (resourceType === 'google-fonts' || resourceUrl.includes('fonts.googleapis.com') || resourceUrl.includes('fonts.gstatic.com')) {
    const googleFontsMirror = siteConfig('GOOGLE_FONTS_MIRROR', 'https://fonts.loli.net')
    if (resourceUrl.includes('fonts.googleapis.com')) {
      return resourceUrl.replace('https://fonts.googleapis.com', googleFontsMirror)
    } else if (resourceUrl.includes('fonts.gstatic.com')) {
      return resourceUrl.replace('https://fonts.gstatic.com', googleFontsMirror.replace('fonts.loli.net', 'gstatic.loli.net'))
    }
  }

  return resourceUrl
}

/**
 * 批量处理CDN资源
 * @param {Array} resources - 资源数组，每个元素可以是字符串或 {url, type} 对象
 * @returns {Promise<Array>} - 优化后的资源数组
 */
export async function getMultipleCDNResources(resources) {
  if (!Array.isArray(resources)) {
    return resources
  }
  const results = []
  for (const res of resources) {
    if (typeof res === 'string') {
      results.push(await getCDNResource(res))
    } else if (typeof res === 'object' && res.url) {
      results.push({
        ...res,
        url: await getCDNResource(res.url, res.type)
      })
    } else {
      results.push(res)
    }
  }
  return results
}

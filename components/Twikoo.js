import { siteConfig } from '@/lib/config'
import { loadExternalResource } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'

/**
 * Twikoo 评论组件 @see https://twikoo.js.org/
 * @returns {JSX.Element}
 * @constructor
 */
const Twikoo = ({ isDarkMode }) => {
  const envId = siteConfig('COMMENT_TWIKOO_ENV_ID')
  const el = siteConfig('COMMENT_TWIKOO_ELEMENT_ID', '#twikoo')
  const twikooCDNURL = siteConfig('COMMENT_TWIKOO_CDN_URL')
  const lang = siteConfig('LANG')
  const [isInit, setIsInit] = useState(false)
  const initAttempted = useRef(false)

  // 检查必要的配置是否存在
  const isConfigValid = envId && twikooCDNURL

  const loadTwikoo = async () => {
    // 如果已经初始化或没有有效配置，则退出
    if (isInit || initAttempted.current || !isConfigValid) {
      return
    }

    initAttempted.current = true
    
    try {
      // 先加载 cloudbase SDK
      await loadExternalResource('https://imgcache.qq.com/qcloud/cloudbase-js-sdk/1.3.3/cloudbase.full.js', 'js')
      
      // 然后加载 Twikoo
      await loadExternalResource(twikooCDNURL, 'js')
      
      const twikoo = window?.twikoo
      if (
        typeof twikoo !== 'undefined' &&
        twikoo &&
        typeof twikoo.init === 'function'
      ) {
        twikoo.init({
          envId: envId,
          el: el,
          lang: lang
        })
        setIsInit(true)
      }
    } catch (error) {
      console.error('Twikoo 加载失败:', error)
    }
  }

  useEffect(() => {
    // 只有在配置有效的情况下才尝试加载
    if (isConfigValid) {
      loadTwikoo()
    }
  }, [isDarkMode, isConfigValid])

  // 如果没有配置有效的 Twikoo，则不渲染任何内容
  if (!isConfigValid) {
    return null
  }

  return <div id="twikoo"></div>
}

export default Twikoo

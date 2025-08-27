import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useEffect, useRef } from 'react'

/**
 * 夜间模式自动切换组件
 * 根据时间和系统偏好自动切换主题
 */
export default function DarkModeAutoSwitch() {
  const { isDarkMode, toggleDarkMode, NOTION_CONFIG } = useGlobal()
  const intervalRef = useRef(null)
  const lastCheckRef = useRef(null)

  // 获取夜间模式配置
  const appearance = siteConfig('APPEARANCE', 'light', NOTION_CONFIG)
  const darkTime = siteConfig('APPEARANCE_DARK_TIME', [18, 6], NOTION_CONFIG)

  /**
   * 检查是否应该是夜间模式
   */
  const shouldBeDarkMode = () => {
    if (appearance === 'dark') {
      return true
    }
    
    if (appearance === 'light') {
      return false
    }
    
    if (appearance === 'auto') {
      const now = new Date()
      const currentHour = now.getHours()
      
      // 检查系统偏好
      const systemPrefersDark = window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches
      
      // 检查时间范围
      const isNightTime = darkTime && Array.isArray(darkTime) && darkTime.length === 2 &&
        (currentHour >= darkTime[0] || currentHour < darkTime[1])
      
      return systemPrefersDark || isNightTime
    }
    
    return false
  }

  /**
   * 检查并切换主题
   */
  const checkAndToggleTheme = () => {
    const shouldBeDark = shouldBeDarkMode()
    const currentTime = Date.now()
    
    // 避免频繁切换，至少间隔1分钟
    if (lastCheckRef.current && currentTime - lastCheckRef.current < 60000) {
      return
    }
    
    if (shouldBeDark !== isDarkMode) {
      console.log(`Auto switching theme: ${shouldBeDark ? 'dark' : 'light'} mode`)
      toggleDarkMode()
      lastCheckRef.current = currentTime
    }
  }

  /**
   * 监听系统主题变化
   */
  const handleSystemThemeChange = (e) => {
    if (appearance === 'auto') {
      const shouldBeDark = shouldBeDarkMode()
      if (shouldBeDark !== isDarkMode) {
        console.log(`System theme changed: ${e.matches ? 'dark' : 'light'} mode`)
        toggleDarkMode()
      }
    }
  }

  useEffect(() => {
    // 只在auto模式下启用自动切换
    if (appearance !== 'auto') {
      return
    }

    // 初始检查
    checkAndToggleTheme()

    // 设置定时检查（每分钟检查一次）
    intervalRef.current = setInterval(checkAndToggleTheme, 60000)

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else {
      // 兼容旧版浏览器
      mediaQuery.addListener(handleSystemThemeChange)
    }

    // 监听页面可见性变化，当页面重新可见时检查主题
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAndToggleTheme()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // 清理函数
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else {
        mediaQuery.removeListener(handleSystemThemeChange)
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [appearance, isDarkMode, darkTime])

  // 这个组件不渲染任何UI
  return null
}

/**
 * 获取当前应该使用的主题模式
 * @param {string} appearance - 主题设置 ('light', 'dark', 'auto')
 * @param {Array} darkTime - 夜间时间范围 [开始小时, 结束小时]
 * @returns {boolean} 是否应该使用夜间模式
 */
export function getCurrentThemeMode(appearance = 'light', darkTime = [18, 6]) {
  if (appearance === 'dark') {
    return true
  }
  
  if (appearance === 'light') {
    return false
  }
  
  if (appearance === 'auto') {
    const now = new Date()
    const currentHour = now.getHours()
    
    // 检查系统偏好（仅在浏览器环境中）
    const systemPrefersDark = typeof window !== 'undefined' && 
      window.matchMedia && 
      window.matchMedia('(prefers-color-scheme: dark)').matches
    
    // 检查时间范围
    const isNightTime = darkTime && Array.isArray(darkTime) && darkTime.length === 2 &&
      (currentHour >= darkTime[0] || currentHour < darkTime[1])
    
    return systemPrefersDark || isNightTime
  }
  
  return false
}
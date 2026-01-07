import { useEffect, useState } from 'react'
import { siteConfig } from '@/lib/config'

/**
 * 可访问性增强组件
 * 提供键盘导航、屏幕阅读器支持、高对比度模式等功能
 * 优化：使用 styled-jsx 替代原生 style 注入，添加折叠功能，优化事件监听
 */
const Accessibility = () => {
  // 配置检查
  const enabled = siteConfig('ACCESSIBILITY_ENABLED', true)

  const [isHighContrast, setIsHighContrast] = useState(false)
  const [fontSize, setFontSize] = useState('normal')
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shortcutKey, setShortcutKey] = useState('Alt')

  // 初始化设置
  useEffect(() => {
    setMounted(true)
    // 仅在客户端执行
    const savedFontSize = localStorage.getItem('accessibility-font-size')
    const savedHighContrast = localStorage.getItem('accessibility-high-contrast')
    const savedShortcut = localStorage.getItem('accessibility-shortcut-key')

    if (savedFontSize) setFontSize(savedFontSize)
    if (savedHighContrast === 'true') setIsHighContrast(true)

    // 快捷键系统检测
    if (savedShortcut) {
      setShortcutKey(savedShortcut)
    } else {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const key = isMac ? 'Option' : 'Alt'
      setShortcutKey(key)
      localStorage.setItem('accessibility-shortcut-key', key)
    }

    // 媒体查询监听
    const contrastQuery = window.matchMedia('(prefers-contrast: high)')
    const handleContrastChange = (e) => setIsHighContrast(e.matches)

    // 初始化系统偏好
    if (!savedHighContrast && contrastQuery.matches) {
      setIsHighContrast(true)
    }

    contrastQuery.addEventListener('change', handleContrastChange)
    return () => {
      contrastQuery.removeEventListener('change', handleContrastChange)
    }
  }, [])

  // 应用设置到 DOM
  useEffect(() => {
    if (!mounted) return
    const root = document.documentElement

    // 清除旧类名
    root.classList.remove('font-small', 'font-normal', 'font-large', 'font-extra-large')
    // 添加新类名
    root.classList.add(`font-${fontSize}`)

    if (isHighContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    localStorage.setItem('accessibility-font-size', fontSize)
    localStorage.setItem('accessibility-high-contrast', isHighContrast.toString())
  }, [fontSize, isHighContrast, mounted])

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Alt + A: 切换面板
      if (e.altKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const toggleHighContrast = () => setIsHighContrast(!isHighContrast)

  const changeFontSize = (direction) => {
    const sizes = ['small', 'normal', 'large', 'extra-large']
    const currentIndex = sizes.indexOf(fontSize)
    let newIndex = currentIndex + direction

    if (newIndex < 0) newIndex = 0
    if (newIndex >= sizes.length) newIndex = sizes.length - 1

    setFontSize(sizes[newIndex])
  }

  if (!enabled || !mounted) return null

  return (
    <>
      <div className="fixed bottom-40 right-4 z-50 flex flex-col items-end gap-2">
        {/* 控制面板 */}
        <div
          className={`
            transition-all duration-300 ease-out origin-bottom-right overflow-hidden
            ${isOpen ? 'scale-100 opacity-100 mb-2' : 'scale-0 opacity-0 h-0'}
          `}
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 w-64">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200">辅助功能</h3>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{shortcutKey} + E</span>
            </div>

            <div className="space-y-4">
              {/* 对比度开关 */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-300">高对比度</span>
                <button
                  onClick={toggleHighContrast}
                  className={`
                    w-12 h-6 rounded-full transition-colors duration-200 flex items-center px-1
                    ${isHighContrast ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                  aria-pressed={isHighContrast}
                >
                  <div className={`w-4 h-4 bg-white rounded-full transform transition-transform duration-200 ${isHighContrast ? 'translate-x-6' : ''}`} />
                </button>
              </div>

              {/* 字体大小调节 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-100">
                  <span>字体大小</span>
                  <span>{fontSize === 'normal' ? '默认' : fontSize}</span>
                </div>
                <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <button
                    onClick={() => changeFontSize(-1)}
                    disabled={fontSize === 'small'}
                    className="flex-1 py-1 text-sm text-gray-700 dark:text-gray-100 rounded hover:bg-white dark:hover:bg-gray-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all"
                  >
                    A-
                  </button>
                  <button
                    onClick={() => setFontSize('normal')}
                    className="flex-1 py-1 text-xs text-gray-700 dark:text-gray-100 rounded hover:bg-white dark:hover:bg-gray-700 shadow-sm transition-all"
                  >
                    重置
                  </button>
                  <button
                    onClick={() => changeFontSize(1)}
                    disabled={fontSize === 'extra-large'}
                    className="flex-1 py-1 text-lg text-gray-700 dark:text-gray-100 rounded hover:bg-white dark:hover:bg-gray-700 shadow-sm disabled:opacity-50 disabled:shadow-none transition-all leading-none"
                  >
                    A+
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 悬浮开关按钮 */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300
            ${isOpen 
              ? 'bg-gray-200 text-gray-600 rotate-45 dark:bg-gray-700 dark:text-gray-300' 
              : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-110'}
          `}
          aria-label="打开辅助功能菜单"
          title="辅助功能 (Alt + E)"
        >
          {isOpen ? (
            <i className="fas fa-plus text-lg" />
          ) : (
            <i className="fas fa-universal-access text-xl" />
          )}
        </button>
      </div>

      <style jsx global>{`
        /* 字体大小类 */
        html.font-small { font-size: 14px; }
        html.font-normal { font-size: 16px; }
        html.font-large { font-size: 18px; }
        html.font-extra-large { font-size: 20px; }

        /* 高对比度模式 */
        html.high-contrast {
          filter: contrast(1.5);
        }
        html.high-contrast img,
        html.high-contrast video {
          filter: contrast(0.8); /* 防止图片过曝 */
        }
        
        /* 焦点指示器优化 */
        :focus-visible {
          outline: 2px solid #4F46E5;
          outline-offset: 2px;
        }
      `}</style>
    </>
  )
}

export default Accessibility

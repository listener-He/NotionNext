import BLOG from '@/blog.config'
import Document, { Head, Html, Main, NextScript } from 'next/document'

// 预先设置深色模式的脚本内容
const darkModeScript = `
(function() {
  try {
    const defaultAppearance = '${BLOG.APPEARANCE || 'auto'}'
    
    let shouldBeDark = false
    
    // 优先级：localStorage > URL参数 > 系统偏好/时间
    if (darkMode !== null) {
      shouldBeDark = darkMode === 'true' || darkMode === 'dark'
    } else {
      // 检查URL参数
      const urlParams = new URLSearchParams(window.location.search)
      const modeParam = urlParams.get('mode')
      
      if (modeParam) {
        shouldBeDark = modeParam === 'dark'
      } else {
        // 根据配置决定默认模式
        if (defaultAppearance === 'dark') {
          shouldBeDark = true
        } else if (defaultAppearance === 'light') {
          shouldBeDark = false
        } else if (defaultAppearance === 'auto') {
          // 检查系统偏好
          const prefersDark = window.matchMedia && 
            window.matchMedia('(prefers-color-scheme: dark)').matches
          shouldBeDark = prefersDark
        }
      }
    }
    
    // 立即设置 html 元素的类，避免闪烁
    const htmlElement = document.documentElement
    if (shouldBeDark) {
       htmlElement.classList.add('dark')
       htmlElement.classList.remove('light')
    } else {
       htmlElement.classList.add('light')
       htmlElement.classList.remove('dark')
    }
    
    // 设置一个标记，表示主题已经预设
    window.__THEME_PRELOADED__ = true
    window.__INITIAL_DARK_MODE__ = shouldBeDark
    
  } catch (error) {
     console.log('System theme init dark or light mode error', error)
    // 出错时使用默认浅色模式
    document.documentElement.classList.add('light')
    window.__THEME_PRELOADED__ = false
    window.__INITIAL_DARK_MODE__ = false
  }
})()
`

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx)
    return { ...initialProps }
  }

  render() {
    return (
      <Html lang={BLOG.LANG}>
        <Head>
          {/* 预加载字体 */}
          {BLOG.FONT_AWESOME && (
            <>
              <link
                rel='preload'
                href={BLOG.FONT_AWESOME}
                as='style'
                crossOrigin='anonymous'
              />
              <link
                rel='stylesheet'
                href={BLOG.FONT_AWESOME}
                crossOrigin='anonymous'
                referrerPolicy='no-referrer'
              />
            </>
          )}

          {/* 预先设置深色模式，避免闪烁 */}
          <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        </Head>

        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument

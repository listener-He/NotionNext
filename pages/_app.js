import '@/styles/globals.css'
import '@/styles/utility-patterns.css'

// core styles shared by all of react-notion-x (required)
import '@/styles/notion.css' //  重写部分notion样式
import 'react-notion-x/src/styles.css' // 原版的react-notion-x
import useAdjustStyle from '@/hooks/useAdjustStyle'
import { GlobalContextProvider } from '@/lib/global'
import { getBaseLayoutByTheme } from '@/themes/theme'
import { useRouter } from 'next/router'
import { useCallback, useMemo } from 'react'
import { getQueryParam } from '@/lib/utils'

// 各种扩展插件 这个要阻塞引入
import BLOG from '@/blog.config'
import ExternalPlugins from '@/components/ExternalPlugins'
import SEO from '@/components/SEO'
import DarkModeAutoSwitch from '@/components/DarkModeAutoSwitch'

// 根据是否在中国大陆优化启用情况选择字体加载方式
const bitter = BLOG.CHINA_OPTIMIZATION_ENABLED
  ? {} // 如果启用中国优化，使用CSS加载的字体，不需要额外配置
  : (function() {
      try {
        const { Bitter } = require('next/font/google')
        return Bitter({
          subsets: ['latin'],
          weight: ['300', '400', '700'],
          display: 'swap'
        })
      } catch (e) {
        // 如果无法加载Google字体，则返回空对象
        return {}
      }
    })()

/**
 * App挂载DOM 入口文件
 * @param {*} param0
 * @returns
 */
const MyApp = ({ Component, pageProps }) => {
  // 一些可能出现 bug 的样式，可以统一放入该钩子进行调整
  useAdjustStyle()

  const route = useRouter()
  const theme = useMemo(() => {
    return (
      getQueryParam(route.asPath, 'theme') ||
      pageProps?.NOTION_CONFIG?.THEME ||
      BLOG.THEME
    )
  }, [route])

  // 整体布局
  const GLayout = useCallback(
    props => {
      const Layout = getBaseLayoutByTheme(theme)
      return <Layout {...props} />
    },
    [theme]
  )

  return (
    <div className={bitter.className || BLOG?.FONT_STYLE || 'font-sans font-light'}>
      <GlobalContextProvider {...pageProps}>
        <DarkModeAutoSwitch />
        <GLayout {...pageProps}>
          <SEO {...pageProps} />
          <Component {...pageProps} />
        </GLayout>
        <ExternalPlugins {...pageProps} />
      </GlobalContextProvider>
    </div>
  )
}

export default MyApp

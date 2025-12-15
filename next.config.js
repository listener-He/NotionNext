const { THEME } = require('./blog.config')
const fs = require('fs')
const path = require('path')
const BLOG = require('./blog.config')
const { extractLangPrefix } = require('./lib/utils/pageId')

// 打包时是否分析代码
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: BLOG.BUNDLE_ANALYZER
})

// 扫描项目 /themes下的目录名
const themes = scanSubdirectories(path.resolve(__dirname, 'themes'))
// 检测用户开启的多语言
const locales = (function () {
  // 根据BLOG_NOTION_PAGE_ID 检查支持多少种语言数据.
  // 支持如下格式配置多个语言的页面id xxx,zh:xxx,en:xxx
  const langs = [BLOG.LANG]
  if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
    const siteIds = BLOG.NOTION_PAGE_ID.split(',')
    for (let index = 0; index < siteIds.length; index++) {
      const siteId = siteIds[index]
      const prefix = extractLangPrefix(siteId)
      // 如果包含前缀 例如 zh , en 等
      if (prefix) {
        if (!langs.includes(prefix)) {
          langs.push(prefix)
        }
      }
    }
  }
  return langs
})()

// 编译前执行
// eslint-disable-next-line no-unused-vars
const preBuild = (function () {
  if (
    !process.env.npm_lifecycle_event === 'export' &&
    !process.env.npm_lifecycle_event === 'build'
  ) {
    return
  }
  // 删除 public/sitemap.xml 文件 ； 否则会和/pages/sitemap.xml.js 冲突。
  const sitemapPath = path.resolve(__dirname, 'public', 'sitemap.xml')
  if (fs.existsSync(sitemapPath)) {
    fs.unlinkSync(sitemapPath)
    console.log('Deleted existing sitemap.xml from public directory')
  }

  const sitemap2Path = path.resolve(__dirname, 'sitemap.xml')
  if (fs.existsSync(sitemap2Path)) {
    fs.unlinkSync(sitemap2Path)
    console.log('Deleted existing sitemap.xml from root directory')
  }
  const lifecycle = process.env.npm_lifecycle_event || ''
  const isProdBuild = process.env.NODE_ENV === 'production' || lifecycle === 'build' || lifecycle === 'export'
  if (isProdBuild) {
    const maxBytes = 15 * 1024 * 1024
    const candidates = ['public', 'static', 'assets']
      .map(d => path.resolve(__dirname, d))
      .filter(p => fs.existsSync(p))
    function collectOversized(dir, acc) {
      const entries = fs.readdirSync(dir)
      for (const entry of entries) {
        const full = path.join(dir, entry)
        const stat = fs.statSync(full)
        if (stat.isDirectory()) {
          collectOversized(full, acc)
        } else {
          if (stat.size > maxBytes) acc.push({ file: full, size: stat.size })
        }
      }
    }
    const overs = []
    for (const dir of candidates) collectOversized(dir, overs)
    if (overs.length) {
      const details = overs
        .map(o => `${path.relative(__dirname, o.file)} ${(o.size / 1024 / 1024).toFixed(2)}MB`)
        .join('\n')
      throw new Error(`Static assets exceed 15MB:\n${details}`)
    }
  }
})()

/**
 * 扫描指定目录下的文件夹名，用于获取所有主题
 * @param {*} directory
 * @returns
 */
function scanSubdirectories(directory) {
  const subdirectories = []

  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      subdirectories.push(file)
    }

    // subdirectories.push(file)
  })

  return subdirectories
}

/**
 * @type {import('next').NextConfig}
 */

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true
  },
  output: process.env.EXPORT
    ? 'export'
    : process.env.NEXT_BUILD_STANDALONE === 'true'
      ? 'standalone'
      : undefined,
  staticPageGenerationTimeout: 120,

  // 性能优化配置
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // HTTP缓存优化
  onDemandEntries: {
    maxInactiveAge: 60 * 1000, // 1分钟
    pagesBufferLength: 5,
  },

  // 构建优化
  // Next.js 15 默认开启 SWC 优化，无需显式配置
  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}'
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}'
    }
  },
  // 多语言， 在export时禁用
  i18n: process.env.EXPORT
    ? undefined
    : {
        defaultLocale: BLOG.LANG,
        // 支持的所有多语言,按需填写即可
        locales: locales
      },
  images: {
    // 图片压缩和格式优化
    formats: ['image/avif', 'image/webp'],
    // 图片尺寸优化
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 允许next/image加载的图片 域名
    domains: [
      'gravatar.com',
      'www.notion.so',
      'avatars.githubusercontent.com',
      'images.unsplash.com',
      'source.unsplash.com',
      'p1.qhimg.com',
      'webmention.io',
      'ko-fi.com'
    ],
    // 图片加载器优化
    loader: 'default',
    // 图片缓存优化
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7天
    // 危险的允许SVG
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // 默认将feed重定向至 /public/rss/feed.xml
  redirects: process.env.EXPORT
    ? undefined
    : () => {
        return [
          {
            source: '/feed',
            destination: '/rss/feed.xml',
            permanent: true
          }
        ]
      },
  // 重写url
  rewrites: process.env.EXPORT
    ? undefined
    : () => {
        // 处理多语言重定向
        const langsRewrites = []
        if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
          const siteIds = BLOG.NOTION_PAGE_ID.split(',')
          const langs = []
          for (let index = 0; index < siteIds.length; index++) {
            const siteId = siteIds[index]
            const prefix = extractLangPrefix(siteId)
            // 如果包含前缀 例如 zh , en 等
            if (prefix) {
              langs.push(prefix)
            }
            console.log('[Locales]', siteId)
          }

          // 映射多语言
          // 示例： source: '/:locale(zh|en)/:path*' ; :locale() 会将语言放入重写后的 `?locale=` 中。
          langsRewrites.push(
            {
              source: `/:locale(${langs.join('|')})/:path*`,
              destination: '/:path*'
            },
            // 匹配没有路径的情况，例如 [domain]/zh 或 [domain]/en
            {
              source: `/:locale(${langs.join('|')})`,
              destination: '/'
            },
            // 匹配没有路径的情况，例如 [domain]/zh/ 或 [domain]/en/
            {
              source: `/:locale(${langs.join('|')})/`,
              destination: '/'
            }
          )
        }

        return [
          ...langsRewrites,
          // 伪静态重写
          {
            source: '/:path*.html',
            destination: '/:path*'
          }
        ]
      },
  headers: process.env.EXPORT
    ? undefined
    : () => {
        return [
          {
            source: '/:path*{/}?',
            headers: [
              // 为了博客兼容性，不做过多安全限制
              { key: 'Access-Control-Allow-Credentials', value: 'true' },
              { key: 'Access-Control-Allow-Origin', value: '*' },
              {
                key: 'Access-Control-Allow-Methods',
                value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
              },
              {
                key: 'Access-Control-Allow-Headers',
                value:
                  'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
              }
              // 安全头部 相关配置，谨慎开启
            //   { key: 'X-Frame-Options', value: 'DENY' },
            //   { key: 'X-Content-Type-Options', value: 'nosniff' },
            //   { key: 'X-XSS-Protection', value: '1; mode=block' },
            //   { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
            //   { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
            //   {
            //     key: 'Strict-Transport-Security',
            //     value: 'max-age=31536000; includeSubDomains; preload'
            //   },
            //   {
            //     key: 'Content-Security-Policy',
            //     value: [
            //       "default-src 'self'",
            //       "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.googleapis.com *.gstatic.com *.google-analytics.com *.googletagmanager.com",
            //       "style-src 'self' 'unsafe-inline' *.googleapis.com *.gstatic.com",
            //       "img-src 'self' data: blob: *.notion.so *.unsplash.com *.githubusercontent.com *.gravatar.com",
            //       "font-src 'self' *.googleapis.com *.gstatic.com",
            //       "connect-src 'self' *.google-analytics.com *.googletagmanager.com",
            //       "frame-src 'self' *.youtube.com *.vimeo.com",
            //       "object-src 'none'",
            //       "base-uri 'self'",
            //       "form-action 'self'"
            //     ].join('; ')
            //   },

            //   // CORS 配置（更严格）
            //   { key: 'Access-Control-Allow-Credentials', value: 'false' },
            //   {
            //     key: 'Access-Control-Allow-Origin',
            //     value: process.env.NODE_ENV === 'production'
            //       ? siteConfig('LINK') || 'https://yourdomain.com'
            //       : '*'
            //   },
            //   { key: 'Access-Control-Max-Age', value: '86400' }
            ]
          },
            //   {
            //     source: '/api/:path*',
            //     headers: [
            //       // API 特定的安全头部
            //       { key: 'X-Frame-Options', value: 'DENY' },
            //       { key: 'X-Content-Type-Options', value: 'nosniff' },
            //       { key: 'Cache-Control', value: 'no-store, max-age=0' },
            //       {
            //         key: 'Access-Control-Allow-Methods',
            //         value: 'GET,POST,PUT,DELETE,OPTIONS'
            //       }
            //     ]
            //   }
          {
            source: '/rss/feed.xml',
            headers: [
              { key: 'Content-Type', value: 'application/rss+xml; charset=utf-8' }
            ]
          },
          {
            source: '/rss/atom.xml',
            headers: [
              { key: 'Content-Type', value: 'application/atom+xml; charset=utf-8' }
            ]
          },
          {
            source: '/rss/feed.json',
            headers: [
              { key: 'Content-Type', value: 'application/json; charset=utf-8' }
            ]
          }
        ]
      },
  webpack: (config, { dev, isServer }) => {
    // 动态主题：添加 resolve.alias 配置，将动态路径映射到实际路径
    config.resolve.alias['@'] = path.resolve(__dirname)
    if (isServer) {
      // 服务端排除客户端库
      config.externals.push('@clerk/clerk-react', 'algoliasearch');
    }

    if (!isServer) {
      console.log('[默认主题]', path.resolve(__dirname, 'themes', THEME))
    }
    config.resolve.alias['@theme-components'] = path.resolve(
      __dirname,
      'themes',
      THEME
    )

    if (!config.output) config.output = {}
    config.output.globalObject = 'globalThis'
    if (isServer) {
      config.plugins.push(
        new (require('webpack').DefinePlugin)({
          self: 'globalThis'
        })
      )
    }

    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        usedExports: true,
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          minSize: 20000,
          maxInitialRequests: 25,
          automaticNameDelimiter: '-',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 200000, // 限制单个包大小
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true
            }
          }
        }
      }
      config.performance = {
        hints: 'error',
        maxEntrypointSize: 100 * 1024 * 1024,
        maxAssetSize: 15 * 1024 * 1024
      }
      class SizeLimitPlugin {
        apply(compiler) {
          compiler.hooks.emit.tap('SizeLimitPlugin', compilation => {
            const maxAssetSize = 15 * 1024 * 1024
            const oversized = []
            for (const filename of Object.keys(compilation.assets)) {
              const asset = compilation.assets[filename]
              const size =
                typeof asset.size === 'function' ? asset.size() : Buffer.byteLength(asset.source(), 'utf8')
              if (size > maxAssetSize) {
                oversized.push({ filename, size })
              }
            }
            if (oversized.length) {
              const details = oversized
                .map(o => `${o.filename} ${(o.size / 1024 / 1024).toFixed(2)}MB`)
                .join('\n')
              throw new Error(`Assets exceed 15MB:\n${details}`)
            }
          })
          compiler.hooks.afterEmit.tap('EntrypointSizeLimitPlugin', compilation => {
            const maxEntrypointSize = 100 * 1024 * 1024
            const overs = []
            for (const [name, entry] of compilation.entrypoints) {
              let total = 0
              for (const file of entry.getFiles()) {
                const asset = compilation.assets[file]
                if (!asset) continue
                const size =
                  typeof asset.size === 'function' ? asset.size() : Buffer.byteLength(asset.source(), 'utf8')
                total += size
              }
              if (total > maxEntrypointSize) overs.push({ name, total })
            }
            if (overs.length) {
              const details = overs
                .map(o => `${o.name} ${(o.total / 1024 / 1024).toFixed(2)}MB`)
                .join('\n')
              throw new Error(`Entrypoints exceed 100MB:\n${details}`)
            }
          })
        }
      }
      config.plugins.push(new SizeLimitPlugin())
    }

    // 保持默认 devtool，避免开发模式性能退化

    // 优化模块解析
    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ]

    return config
  },
  experimental: {
    scrollRestoration: true,
    // 性能优化实验性功能
    optimizePackageImports: ['@heroicons/react', 'lodash'],
    // 启用并发功能
  },
  // Next.js 15: serverComponentsExternalPackages 移至顶层配置
  serverExternalPackages: ['notion-utils'],
  exportPathMap: function (
    defaultPathMap,
    { dev, dir, outDir, distDir, buildId }
  ) {
    // export 静态导出时 忽略/pages/sitemap.xml.js ， 否则和getServerSideProps这个动态文件冲突
    const pages = { ...defaultPathMap }
    delete pages['/sitemap.xml']
    delete pages['/auth']
    return pages
  },
  publicRuntimeConfig: {
    // 这里的配置既可以服务端获取到，也可以在浏览器端获取到
    THEMES: themes
  }
}

module.exports = process.env.ANALYZE
  ? withBundleAnalyzer(nextConfig)
  : nextConfig

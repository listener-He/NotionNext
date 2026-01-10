const { THEME } = require('./blog.config')
const fs = require('fs')
const path = require('path')
const BLOG = require('./blog.config')
const { extractLangPrefix } = require('./lib/utils/pageId')

/* ---------------- 平台识别（新增，不影响原逻辑） ---------------- */
function detectPlatform() {
  if (process.env.CF_PAGES) return 'cloudflare'
  if (process.env.NETLIFY) return 'netlify'
  if (process.env.EDGEONE_REGION) return 'edgeone'
  if (process.env.VERCEL) return 'vercel'
  return 'unknown'
}
const PLATFORM = detectPlatform()

/* ---------------- Bundle Analyzer ---------------- */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: BLOG.BUNDLE_ANALYZER
})

/* ---------------- 主题扫描 ---------------- */
function scanSubdirectories(directory) {
  const subdirectories = []
  if (!fs.existsSync(directory)) return subdirectories

  fs.readdirSync(directory).forEach(file => {
    const fullPath = path.join(directory, file)
    const stats = fs.statSync(fullPath)
    if (stats.isDirectory()) {
      subdirectories.push(file)
    }
  })
  return subdirectories
}
const themes = scanSubdirectories(path.resolve(__dirname, 'themes'))

/* ---------------- 多语言 ---------------- */
const locales = (function () {
    const langs = [BLOG.LANG]
    if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
      const siteIds = BLOG.NOTION_PAGE_ID.split(',')
      for (let index = 0; index < siteIds.length; index++) {
        const siteId = siteIds[index]
        const prefix = extractLangPrefix(siteId)
        if (prefix && !langs.includes(prefix)) {
          langs.push(prefix)
        }
      }
    }
    return langs
  })()

  /* ---------------- preBuild（仅修正判断 bug） ---------------- */
;(function preBuild() {
  const lifecycle = process.env.npm_lifecycle_event || ''
  if (!['build', 'export'].includes(lifecycle)) {
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

  const isProdBuild =
    process.env.NODE_ENV === 'production' ||
    lifecycle === 'build' ||
    lifecycle === 'export'

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
        } else if (stat.size > maxBytes) {
          acc.push({ file: full, size: stat.size })
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
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },

  output: process.env.EXPORT
    ? 'export'
    : process.env.NEXT_BUILD_STANDALONE === 'true' || process.env.BUILD_MODE === 'true'
      ? 'standalone'
      : undefined,

  staticPageGenerationTimeout: 120,

  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  onDemandEntries: {
    maxInactiveAge: 60 * 1000,
    pagesBufferLength: 5
  },

  modularizeImports: {
    '@heroicons/react/24/outline': {
      transform: '@heroicons/react/24/outline/{{member}}'
    },
    '@heroicons/react/24/solid': {
      transform: '@heroicons/react/24/solid/{{member}}'
    }
  },

  i18n: process.env.EXPORT
    ? undefined
    : {
      defaultLocale: BLOG.LANG,
      locales
    },

  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      { hostname: 'gravatar.com' },
      { hostname: 'www.notion.so' },
      { hostname: 'avatars.githubusercontent.com' },
      { hostname: 'images.unsplash.com' },
      { hostname: 'source.unsplash.com' },
      { hostname: 'p1.qhimg.com' },
      { hostname: 'webmention.io' },
      { hostname: 'ko-fi.com' },
      { hostname: 'blog-file.hehouhui.cn' },
      { hostname: 'cdn.jsdelivr.net' },
    ],
    loader: 'default',
    minimumCacheTTL: 60 * 60 * 24 * 7,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  env: {
    NEXT_PUBLIC_THEMES: JSON.stringify(themes),
    NEXT_PUBLIC_PLATFORM: PLATFORM
  },

  redirects: process.env.EXPORT
    ? undefined
    : async () => [
      { source: '/:path*.html', destination: '/:path*', permanent: false},
      { source: '/.well-known/:path*.txt', destination: '/well-known/:path*.txt', permanent: true},
      // RSS 路由重写：确保 RSS 请求始终走 API 路由
      { source: '/rss/feed.xml', destination: '/api/rss' , permanent: true},
      { source: '/rss/atom.xml', destination: '/api/rss?format=atom' , permanent: true},
      { source: '/rss/feed.json', destination: '/api/rss?format=json' , permanent: true},
      { source: '/feed', destination: '/rss/feed.xml' , permanent: true},
      { source: '/rss', destination: '/rss/feed.xml' , permanent: true},
      { source: '/atom', destination: '/rss/atom.xml' , permanent: true}
    ],

  rewrites: process.env.EXPORT
    ? undefined
    : async () => {
      const langsRewrites = []
      if (BLOG.NOTION_PAGE_ID.indexOf(',') > 0) {
        const siteIds = BLOG.NOTION_PAGE_ID.split(',')
        const langs = []
        for (const siteId of siteIds) {
          const prefix = extractLangPrefix(siteId)
          if (prefix) langs.push(prefix)
        }
        langsRewrites.push(
          {
            source: `/:locale(${langs.join('|')})/:path*`,
            destination: '/:path*'
          },
          { source: `/:locale(${langs.join('|')})`, destination: '/' },
          { source: `/:locale(${langs.join('|')})/`, destination: '/' }
        )
      }
      return [
        ...langsRewrites,
        { source: '/:path*.html', destination: '/:path*' },
        // RSS 路由重写：确保 RSS 请求始终走 API 路由
        { source: '/feed', destination: '/rss/feed.xml' },
        { source: '/rss', destination: '/rss/feed.xml' },
        { source: '/atom', destination: '/rss/atom.xml' }
      ]
    },

  headers: process.env.EXPORT
    ? undefined
    : async () => [
      {
        source: '/:path*{/}?',
        headers: [
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
        ]
      },
      {
        source: '/rss/feed.xml',
        headers: [{ key: 'Content-Type', value: 'application/rss+xml; charset=utf-8' }]
      },
      {
        source: '/rss/atom.xml',
        headers: [{ key: 'Content-Type', value: 'application/atom+xml; charset=utf-8' }]
      },
      {
        source: '/rss/feed.json',
        headers: [{ key: 'Content-Type', value: 'application/json; charset=utf-8' }]
      }
    ],

  webpack: (config, { dev, isServer }) => {
    config.resolve.alias['@'] = path.resolve(__dirname)
    config.resolve.alias['@theme-components'] = path.resolve(
      __dirname,
      'themes',
      THEME
    )


    if (isServer) {
      config.externals.push(
        'algoliasearch',
        'canvas',
        'jsdom',
        'puppeteer'
      )
    }

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
          maxSize: 244000,
          maxInitialRequests: 25,
          automaticNameDelimiter: '-',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              maxSize: 244000
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              maxSize: 100000 // 限制common chunk大小
            },
            // 新增：针对特定库的分割
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom|react-dom-server|react-is)[\\/]/,
              name: 'react',
              chunks: 'all',
              priority: 20
            },
            notion: {
              test: /[\\/]node_modules[\\/](notion-client|notion-utils|react-notion-x)[\\/]/,
              name: 'notion',
              chunks: 'all',
              priority: 15
            }
          }
        }
      }
      config.performance = {
        hints: 'error',
        maxEntrypointSize: 100 * 1024 * 1024,
        maxAssetSize: 15 * 1024 * 1024
      }
    }

    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules'
    ]

    return config
  },

  experimental: {
    scrollRestoration: true,
    optimizePackageImports: [
      '@heroicons/react',
      'lodash',
      'react-notion-x'
    ],
  },

  serverExternalPackages:
    PLATFORM === 'vercel' ? ['notion-utils'] : [],

  exportPathMap(defaultPathMap) {
    const pages = { ...defaultPathMap }
    delete pages['/sitemap.xml']
    delete pages['/auth']
    return pages
  }
}

module.exports = process.env.ANALYZE
  ? withBundleAnalyzer(nextConfig)
  : nextConfig

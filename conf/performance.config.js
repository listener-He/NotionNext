/**
 * 性能优化配置
 */
module.exports = {
  // 预加载配置
  PRELOAD_CRITICAL_RESOURCES: process.env.NEXT_PUBLIC_PRELOAD_CRITICAL_RESOURCES || true,
  
  // 懒加载配置
  LAZY_LOAD_IMAGES: process.env.NEXT_PUBLIC_LAZY_LOAD_IMAGES || true,
  LAZY_LOAD_THRESHOLD: process.env.NEXT_PUBLIC_LAZY_LOAD_THRESHOLD || '200px',
  
  // 代码分割配置
  ENABLE_CODE_SPLITTING: process.env.NEXT_PUBLIC_ENABLE_CODE_SPLITTING || true,
  CHUNK_SIZE_LIMIT: process.env.NEXT_PUBLIC_CHUNK_SIZE_LIMIT || 244000, // 244KB
  
  // 资源优化配置
  OPTIMIZE_BUNDLE_SIZE: process.env.NEXT_PUBLIC_OPTIMIZE_BUNDLE_SIZE || true,
  TREE_SHAKING: process.env.NEXT_PUBLIC_TREE_SHAKING || true,
  MINIFY_CSS: process.env.NEXT_PUBLIC_MINIFY_CSS || true,
  MINIFY_JS: process.env.NEXT_PUBLIC_MINIFY_JS || true,
  
  // 缓存配置
  BROWSER_CACHE_TTL: process.env.NEXT_PUBLIC_BROWSER_CACHE_TTL || 86400, // 24小时
  CDN_CACHE_TTL: process.env.NEXT_PUBLIC_CDN_CACHE_TTL || 604800, // 7天
  
  // 压缩配置
  ENABLE_GZIP: process.env.NEXT_PUBLIC_ENABLE_GZIP || true,
  ENABLE_BROTLI: process.env.NEXT_PUBLIC_ENABLE_BROTLI || true,
  
  // 字体优化
  FONT_DISPLAY: process.env.NEXT_PUBLIC_FONT_DISPLAY || 'swap',
  PRELOAD_FONTS: process.env.NEXT_PUBLIC_PRELOAD_FONTS || true,
  
  // 第三方脚本优化
  DEFER_THIRD_PARTY_SCRIPTS: process.env.NEXT_PUBLIC_DEFER_THIRD_PARTY_SCRIPTS || true,
  
  // 图片优化
  WEBP_SUPPORT: process.env.NEXT_PUBLIC_WEBP_SUPPORT || true,
  AVIF_SUPPORT: process.env.NEXT_PUBLIC_AVIF_SUPPORT || true,
  
  // 预取配置
  PREFETCH_LINKS: process.env.NEXT_PUBLIC_PREFETCH_LINKS || true,
  PREFETCH_IMAGES: process.env.NEXT_PUBLIC_PREFETCH_IMAGES || false,
  
  // 性能监控
  ENABLE_WEB_VITALS: process.env.NEXT_PUBLIC_ENABLE_WEB_VITALS || true,
  PERFORMANCE_BUDGET: {
    FCP: 1800, // First Contentful Paint (ms)
    LCP: 2500, // Largest Contentful Paint (ms)
    FID: 100,  // First Input Delay (ms)
    CLS: 0.1   // Cumulative Layout Shift
  },
  
  // 内存优化
  MEMORY_OPTIMIZATION: {
    ENABLE_GARBAGE_COLLECTION: process.env.NEXT_PUBLIC_ENABLE_GC || true,
    MAX_MEMORY_USAGE: process.env.NEXT_PUBLIC_MAX_MEMORY || '512MB',
    CLEANUP_INTERVAL: process.env.NEXT_PUBLIC_CLEANUP_INTERVAL || 300000 // 5分钟
  },
  
  // 网络优化
  NETWORK_OPTIMIZATION: {
    ENABLE_HTTP2_PUSH: process.env.NEXT_PUBLIC_HTTP2_PUSH || true,
    CONNECTION_TIMEOUT: process.env.NEXT_PUBLIC_CONNECTION_TIMEOUT || 10000,
    REQUEST_TIMEOUT: process.env.NEXT_PUBLIC_REQUEST_TIMEOUT || 30000
  },
  
  // 预览优化配置
  getPreviewConfig: (pageType) => {
    const configs = {
      index: {
        maxPosts: 10,
        maxLines: 8
      },
      category: {
        maxPosts: 8,
        maxLines: 6
      },
      tag: {
        maxPosts: 8,
        maxLines: 6
      },
      archive: {
        maxPosts: 20,
        maxLines: 4
      }
    }
    return configs[pageType] || { maxPosts: 5, maxLines: 5 }
  }
}

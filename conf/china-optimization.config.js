/**
 * 中国大陆访问优化配置
 * 通过使用国内镜像和CDN加速提升在中国大陆的访问速度
 */

module.exports = {
  // 是否启用中国大陆优化
  CHINA_OPTIMIZATION_ENABLED: process.env.NEXT_PUBLIC_CHINA_OPTIMIZATION_ENABLED || true,
  
  // Google Fonts 国内镜像
  GOOGLE_FONTS_MIRROR: process.env.NEXT_PUBLIC_GOOGLE_FONTS_MIRROR || 'https://fonts.loli.net',
  
  // FontAwesome 国内镜像
  FONT_AWESOME_MIRROR: process.env.NEXT_PUBLIC_FONT_AWESOME_MIRROR || 'https://cdn.bootcdn.net/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  
  // AOS 动画库国内镜像
  AOS_CSS_MIRROR: process.env.NEXT_PUBLIC_AOS_CSS_MIRROR || '/css/aos.css',
  AOS_JS_MIRROR: process.env.NEXT_PUBLIC_AOS_JS_MIRROR || '/js/aos.js',
  
  // NProgress 进度条国内镜像
  NPROGRESS_CSS_MIRROR: process.env.NEXT_PUBLIC_NPROGRESS_CSS_MIRROR || 'https://cdn.bootcdn.net/ajax/libs/nprogress/0.2.0/nprogress.min.css',
  NPROGRESS_JS_MIRROR: process.env.NEXT_PUBLIC_NPROGRESS_JS_MIRROR || 'https://cdn.bootcdn.net/ajax/libs/nprogress/0.2.0/nprogress.min.js',
  
  // Notion API 代理地址（如有）
  NOTION_API_PROXY: process.env.NEXT_PUBLIC_NOTION_API_PROXY || '',
  
  // 图片资源优化
  IMAGE_CDN_ENABLED: process.env.NEXT_PUBLIC_IMAGE_CDN_ENABLED || false,
  IMAGE_CDN_PROVIDER: process.env.NEXT_PUBLIC_IMAGE_CDN_PROVIDER || '', // 如: 'upyun', 'qiniu'
  
  // 第三方库加载策略
  THIRD_PARTY_LOAD_STRATEGY: process.env.NEXT_PUBLIC_THIRD_PARTY_LOAD_STRATEGY || 'local_first', // 'local_first' | 'cdn_first' | 'china_cdn'
  
  // 预加载关键资源
  PRELOAD_CRITICAL_RESOURCES: process.env.NEXT_PUBLIC_PRELOAD_CRITICAL_RESOURCES || true,
}
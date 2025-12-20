/* eslint-disable react/no-unknown-property */
import { siteConfig } from '@/lib/config'
import CONFIG from './config'

/**
 * 这里的css样式只对当前主题生效
 * 主题客制化css
 * @returns
 */
const Style = () => {
  // 从配置中获取主题色，如果没有配置则使用默认值 #928CEE
  const themeColor = siteConfig('HEXO_THEME_COLOR', '#928CEE', CONFIG)

  return (
    <style jsx global>{`
        :root {
            --theme-color: ${themeColor};
        }

        // 底色
        #theme-hexo body {
            background-color: #f5f5f5;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }

        .dark #theme-hexo body {
            background-color: #121212;
        }

        /*  菜单下划线动画 */
        #theme-hexo .menu-link {
            text-decoration: none;
            background-image: linear-gradient(
                    var(--theme-color),
                    var(--theme-color)
            );
            background-repeat: no-repeat;
            background-position: bottom center;
            background-size: 0 2px;
            transition: background-size 100ms ease-in-out;
        }

        #theme-hexo .menu-link:hover {
            background-size: 100% 2px;
            color: var(--theme-color);
        }

        /* 文章列表中标题行悬浮时的文字颜色 */
        #theme-hexo h2:hover .menu-link {
            color: var(--theme-color) !important;
        }

        .dark #theme-hexo h2:hover .menu-link {
            color: var(--theme-color) !important;
        }

        /* 下拉菜单悬浮背景色 */
        #theme-hexo li[class*='hover:bg-indigo-500']:hover {
            background-color: var(--theme-color) !important;
        }

        /* tag标签悬浮背景色 */
        #theme-hexo a[class*='hover:bg-indigo-400']:hover {
            background-color: var(--theme-color) !important;
        }

        /* 社交按钮悬浮颜色 */
        #theme-hexo i[class*='hover:text-indigo-600']:hover {
            color: var(--theme-color) !important;
        }

        .dark #theme-hexo i[class*='dark:hover:text-indigo-400']:hover {
            color: var(--theme-color) !important;
        }

        /* MenuGroup 悬悬颜色 */
        #theme-hexo #nav div[class*='hover:text-indigo-600']:hover {
            color: var(--theme-color) !important;
        }

        .dark #theme-hexo #nav div[class*='dark:hover:text-indigo-400']:hover {
            color: var(--theme-color) !important;
        }

        /* 最新发布文章悬浮颜色 */
        #theme-hexo div[class*='hover:text-indigo-600']:hover,
        #theme-hexo div[class*='hover:text-indigo-400']:hover {
            color: var(--theme-color) !important;
        }

        /* 分页组件颜色 */
        #theme-hexo .text-indigo-400 {
            color: var(--theme-color) !important;
        }

        #theme-hexo .border-indigo-400 {
            border-color: var(--theme-color) !important;
        }

        #theme-hexo a[class*='hover:bg-indigo-400']:hover {
            background-color: var(--theme-color) !important;
            color: white !important;
        }

        /* 移动设备下，搜索组件中选中分类的高亮背景色 */
        #theme-hexo div[class*='hover:bg-indigo-400']:hover {
            background-color: var(--theme-color) !important;
        }

        #theme-hexo .hover\:bg-indigo-400:hover {
            background-color: var(--theme-color) !important;
        }

        #theme-hexo .bg-indigo-400 {
            background-color: var(--theme-color) !important;
        }

        #theme-hexo a[class*='hover:bg-indigo-600']:hover {
            background-color: var(--theme-color) !important;
            color: white !important;
        }

        /* 右下角悬浮按钮背景色 */
        #theme-hexo .bg-indigo-500 {
            background-color: var(--theme-color) !important;
        }

        .dark #theme-hexo .dark\:bg-indigo-500 {
            background-color: var(--theme-color) !important;
        }

        // 移动设备菜单栏选中背景色
        #theme-hexo div[class*='hover:bg-indigo-500']:hover {
            background-color: var(--theme-color) !important;
        }

        /* 文章浏览进度条颜色 */
        #theme-hexo .bg-indigo-600 {
            background-color: var(--theme-color) !important;
        }

        /* 当前浏览位置标题高亮颜色 */
        #theme-hexo .border-indigo-800 {
            border-color: var(--theme-color) !important;
        }

        #theme-hexo .text-indigo-800 {
            color: var(--theme-color) !important;
        }

        .dark #theme-hexo .dark\:text-indigo-400 {
            color: var(--theme-color) !important;
        }

        .dark #theme-hexo .dark\:border-indigo-400 {
            border-color: var(--theme-color) !important;
        }

        .dark #theme-hexo .dark\:border-white {
            border-color: var(--theme-color) !important;
        }

        /* 目录项悬浮时的字体颜色 */
        #theme-hexo a[class*='hover:text-indigo-800']:hover {
            color: var(--theme-color) !important;
        }

        /* 深色模式下目录项的默认文字颜色和边框线颜色 */
        .dark #theme-hexo .catalog-item {
            color: white !important;
            border-color: white !important;
        }

        .dark #theme-hexo .catalog-item:hover {
            color: var(--theme-color) !important;
        }

        /* 深色模式下当前高亮标题的边框线颜色 */
        .dark #theme-hexo .catalog-item.font-bold {
            border-color: var(--theme-color) !important;
        }

        /* 文章底部版权声明组件左侧边框线颜色 */
        #theme-hexo .border-indigo-500 {
            border-color: var(--theme-color) !important;
        }

        /* 归档页面文章列表项悬浮时左侧边框线颜色 */
        #theme-hexo li[class*='hover:border-indigo-500']:hover {
            border-color: var(--theme-color) !important;
        }

        /* 自定义右键菜单悬浮高亮颜色 */
        #theme-hexo .hover\:bg-blue-600:hover {
            background-color: var(--theme-color) !important;
        }

        .dark #theme-hexo li[class*='dark:hover:border-indigo-300']:hover {
            border-color: var(--theme-color) !important;
        }

        /* 深色模式下，归档页面文章列表项默认状态左侧边框线颜色 */
        .dark #theme-hexo li[class*='dark:border-indigo-400'] {
            border-color: var(--theme-color) !important;
        }

        /* 深色模式下，归档页面文章标题悬浮时的文字颜色 */
        .dark #theme-hexo a[class*='dark:hover:text-indigo-300']:hover {
            color: var(--theme-color) !important;
        }

        /* 设置了从上到下的渐变黑色 */
        #theme-hexo .header-cover::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(
                    to bottom,
                    rgba(0, 0, 0, 0.4) 0%,
                    rgba(0, 0, 0, 0.1) 15%,
                    rgba(0, 0, 0, 0) 35%,
                    rgba(0, 0, 0, 0.1) 75%,
                    rgba(0, 0, 0, 0.4) 100%
            );
            will-change: transform;
        }

        /* Custem */
        .tk-footer {
            opacity: 0;
        }

        // 选中字体颜色
        ::selection {
            background: color-mix(in srgb, var(--theme-color) 25%, transparent);
        }

        // 自定义滚动条 - 更细更高效
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background-color: var(--theme-color);
            border-radius: 2px;
        }

        * {
            scrollbar-width: thin;
            scrollbar-color: var(--theme-color) transparent;
        }

        // 把宠物永久浮动在屏幕右下角 - 添加性能优化属性
        #live2d {
            will-change: transform, opacity;
            position: fixed;
            right: 0;
            bottom: 0;
            width: 300px;
            height: 250px;
            z-index: 9999 !important;
            transform: translateZ(0); /* 启用硬件加速 */
        }

        // 导航栏 右侧 
        .mr-1 {
            font-size: 0.7em;
            color: black;
        }

        /* 推荐文章卡片间距 */
        #theme-hexo .grid-cols-2.md\\:grid-cols-3.gap-4 {
            gap: 1rem !important;
        }

        /* 响应式优化：移动端展示单列及适配 */
        @media (max-width: 640px) {
            #theme-hexo .grid-cols-2.md\\:grid-cols-3 {
                grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
            }
            
            #theme-hexo .article-adjacent-container i {
                font-size: 0.75rem;
            }

            #theme-hexo .article-adjacent-container .text-xs {
                font-size: 0.65rem;
            }
        }

        /* 友链页面样式 */
        #theme-hexo .links-page-card {
            background-color: var(--card-bg-color);
            border-radius: 0.5rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;
            will-change: transform;
        }

        #theme-hexo .links-page-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 12px rgba(0, 0, 0, 0.2);
        }

        #theme-hexo .links-page-avatar {
            width: 64px;
            height: 64px;
            border-radius: 50%;
            object-fit: cover;
            border: 2px solid var(--theme-color);
        }

        #theme-hexo .links-page-name {
            font-size: 1.25rem;
            font-weight: bold;
            color: var(--text-primary-color);
        }

        #theme-hexo .links-page-description {
            font-size: 0.875rem;
            color: var(--text-secondary-color);
        }

        // 针对低性能设备的优化
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }

            #live2d {
                display: none !important;
            }
        }

        // 为动画元素启用硬件加速
        [data-aos] {
            will-change: transform, opacity;
            transform: translateZ(0);
        }

        // 优化文章卡片悬停效果
        #theme-hexo #blog-post-card {
            will-change: transform;
            transform: translateZ(0);
        }

        // 针对高分辨率屏幕优化渐变
        @media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
            #theme-hexo .header-cover::before {
                background: linear-gradient(
                        to bottom,
                        rgba(0, 0, 0, 0.3) 0%,
                        rgba(0, 0, 0, 0.075) 15%,
                        rgba(0, 0, 0, 0) 35%,
                        rgba(0, 0, 0, 0.075) 75%,
                        rgba(0, 0, 0, 0.3) 100%
                );
            }
        }

        // 提升视觉层次感的阴影效果
        #theme-hexo .card-shadow {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24);
            transition: all 0.3s cubic-bezier(.25, .8, .25, 1);
        }

        #theme-hexo .card-shadow:hover {
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.18), 0 6px 12px rgba(0, 0, 0, 0.22);
        }

        // 优化文本可读性
        #theme-hexo .article-content {
            line-height: 1.9;
            font-size: clamp(1rem, 0.98rem + 0.25vw, 1.125rem);
            letter-spacing: 0.003em;
            color: #111827;
            text-rendering: optimizeLegibility;
            -webkit-font-smoothing: antialiased;
            font-family: "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif;
        }

        .dark #theme-hexo .article-content {
            color: #e5e7eb;
        }

        #theme-hexo .article-content p {
            margin: 0.75rem 0;
        }

        #theme-hexo .article-content li {
            margin: 0.3rem 0;
        }

        #theme-hexo .article-content strong,
        #theme-hexo .article-content b {
            font-weight: 700;
        }

        #theme-hexo .article-content a {
            text-decoration-thickness: 0.08em;
            text-underline-offset: 3px;
        }

        #theme-hexo .article-content blockquote {
            border-left: 4px solid color-mix(in srgb, var(--theme-color) 55%, #888);
            background: color-mix(in srgb, var(--theme-color) 6%, transparent);
            padding: 0.6rem 0.9rem;
            border-radius: 0.25rem;
        }

        #theme-hexo .article-content h1,
        #theme-hexo .article-content .notion-h1 {
            font-size: clamp(1.75rem, 1.4rem + 1.2vw, 2.25rem);
            line-height: 1.25;
            font-weight: 800;
            margin: 1.25rem 0 0.75rem 0;
            letter-spacing: -0.02em;
            color: #111827;
        }

        .dark #theme-hexo .article-content h1,
        .dark #theme-hexo .article-content .notion-h1 {
            color: #f9fafb;
        }

        #theme-hexo .article-content h2,
        #theme-hexo .article-content .notion-h2 {
            font-size: clamp(1.5rem, 1.25rem + 0.8vw, 2rem);
            font-weight: 700;
            margin: 1rem 0 0.5rem 0;
            letter-spacing: -0.01em;
            color: #111827;
        }

        .dark #theme-hexo .article-content h2,
        .dark #theme-hexo .article-content .notion-h2 {
            color: #f3f4f6;
        }

        #theme-hexo .article-content h3,
        #theme-hexo .article-content .notion-h3 {
            font-size: clamp(1.25rem, 1.1rem + 0.6vw, 1.5rem);
            font-weight: 700;
            margin: 0.75rem 0 0.5rem 0;
            letter-spacing: -0.005em;
            color: #111827;
        }

        .dark #theme-hexo .article-content h3,
        .dark #theme-hexo .article-content .notion-h3 {
            color: #e5e7eb;
        }

        #theme-hexo .article-content p,
        #theme-hexo .article-content .notion-text {
            color: #111827;
        }

        .dark #theme-hexo .article-content p,
        .dark #theme-hexo .article-content .notion-text {
            color: #e5e7eb;
        }

        #theme-hexo .article-content a,
        #theme-hexo .article-content .notion-link {
            color: #1f2937;
            text-decoration-thickness: 0.08em;
            text-underline-offset: 3px;
        }

        #theme-hexo .article-content a:hover,
        #theme-hexo .article-content .notion-link:hover {
            color: var(--theme-color);
        }

        .dark #theme-hexo .article-content a,
        .dark #theme-hexo .article-content .notion-link {
            color: #93c5fd;
        }

        .dark #theme-hexo .article-content .notion-link {
            border-color: #60a5fa !important;
        }

        // 优化代码块显示
        #theme-hexo pre[class*="language-"] {
            line-height: 1.6;
            font-size: 0.95rem;
            border-radius: 0.5rem;
            overflow: auto;
            background-color: #f8fafc;
            border: 1px solid #e5e7eb;
        }

        .dark #theme-hexo pre[class*="language-"] {
            background-color: #0b0f14;
            border: 1px solid #1f2937;
        }

        #theme-hexo .code-toolbar {
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
        }

        .dark #theme-hexo .code-toolbar {
            box-shadow: 0 1px 2px rgba(255, 255, 255, 0.06);
        }

        #theme-hexo .pre-mac > span:nth-child(1) {
            background: #ef4444;
        }

        #theme-hexo .pre-mac > span:nth-child(2) {
            background: #f59e0b;
        }

        #theme-hexo .pre-mac > span:nth-child(3) {
            background: #10b981;
        }

        // 优化标签显示
        #theme-hexo .tag-item {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.875rem;
            font-weight: 500;
            transition: all 0.2s ease-in-out;
        }

        #theme-hexo .tag-item {
            background-color: rgba(17, 24, 39, 0.06);
            color: #111827;
            border: 1px solid rgba(17, 24, 39, 0.12);
        }

        .dark #theme-hexo .tag-item {
            background-color: rgba(255, 255, 255, 0.08);
            color: #e5e7eb;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }

        // 优化文章标题
        #theme-hexo .post-title {
            letter-spacing: -0.025em;
            line-height: 1.2;
        }

        /* Mermaid 容器 - 移除卡片，仅增强可见度 */
        #theme-hexo .article-content .mermaid {
            display: block;
            width: 100%;
            overflow-x: auto;
            padding: 0; /* 去掉卡片内边距 */
            border: 0; /* 去掉边框 */
            background: transparent; /* 去掉卡片背景 */
            color: inherit;
        }

        .dark #theme-hexo .article-content .mermaid {
            background: #0b0f14;
            color: #e5e7eb;
        }

        #theme-hexo .article-content .mermaid svg {
            height: auto;
        }

        #theme-hexo .article-content .mermaid svg text {
            fill: currentColor !important;
        }

        /* 文章详情页元信息样式优化 */
        #theme-hexo #header .article-meta {
            gap: 0.5rem;
            font-size: 0.95rem;
            line-height: 1.75;
            letter-spacing: 0.01em;
        }

        #theme-hexo #header .article-meta > * {
            display: inline-flex;
            align-items: center;
            padding: 0.25rem 0.6rem;
            border-radius: 9999px;
            backdrop-filter: saturate(120%) blur(2px);
        }

        #theme-hexo #header .article-meta a,
        #theme-hexo #header .article-meta div,
        #theme-hexo #header .article-meta span {
            text-decoration: none;
        }

        #theme-hexo #header .article-meta > * {
            background-color: rgba(255, 255, 255, 0.35);
            color: #111827;
            border: 1px solid rgba(17, 24, 39, 0.12);
        }

        .dark #theme-hexo #header .article-meta > * {
            background-color: rgba(17, 24, 39, 0.35);
            color: #f3f4f6;
            border: 1px solid rgba(255, 255, 255, 0.18);
        }

        /* 字数与阅读时长胶囊 */
        #theme-hexo #header .article-meta #wordCountWrapper > span {
            padding: 0.25rem 0.6rem;
            border-radius: 9999px;
        }

        /* 目录标题与条目美化 */
        #theme-hexo .catalog-title {
            display: flex;
            align-items: center;
            gap: .5rem;
            font-weight: 700;
        }

        #theme-hexo .catalog-item {
            border-left-width: 2px;
            padding-left: .75rem;
            border-color: rgba(17, 24, 39, .1);
            color: #374151;
        }

        .dark #theme-hexo .catalog-item {
            border-color: rgba(255, 255, 255, .15);
            color: #cbd5e1;
        }

        #theme-hexo .catalog-item:hover {
            color: var(--theme-color);
        }

        #theme-hexo .catalog-item-active {
            background: color-mix(in srgb, var(--theme-color) 12%, transparent);
            border-color: var(--theme-color);
            color: var(--theme-color);
            border-radius: .375rem;
        }

        .dark #theme-hexo .catalog-item-active {
            background: color-mix(in srgb, var(--theme-color) 18%, transparent);
        }

        // 优化分页导航
        #theme-hexo .pagination-number {
            font-weight: 600;
            transition: all 0.2s ease-in-out;
        }

        /* 顶部阅读进度条美化 */
        #theme-hexo .reading-progress-track {
            height: 8px;
            border-radius: 9999px;
            background: rgba(17, 24, 39, .08);
            backdrop-filter: blur(3px);
        }

        .dark #theme-hexo .reading-progress-track {
            background: rgba(255, 255, 255, .12);
        }

        #theme-hexo .reading-progress-bar {
            height: 8px;
            border-radius: 9999px;
            background: linear-gradient(90deg, color-mix(in srgb, var(--theme-color) 90%, white), color-mix(in srgb, var(--theme-color) 70%, #67e8f9));
            position: relative;
        }

        #theme-hexo .reading-progress-dot {
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            border-radius: 9999px;
            background: white;
            box-shadow: 0 0 0 2px color-mix(in srgb, var(--theme-color) 60%, #93c5fd);
        }

        .dark #theme-hexo .reading-progress-dot {
            background: #0b0f14;
        }

        /* 作者信息卡片美化 */
        #theme-hexo .author-info-card {
            border: 1px solid rgba(0, 0, 0, 0.05);
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(10px);
        }

        .dark #theme-hexo .author-info-card {
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        #theme-hexo .author-name-gradient {
            font-weight: 700;
            letter-spacing: 0.5px;
            background-size: 200% 200%;
            animation: gradientPulse 3s ease infinite;
        }
        
        /* 白天模式下的作者名字使用纯色 */
        .author-name-gradient {
            color: #374151;
        }

        .dark #theme-hexo .author-name-gradient {
            background: linear-gradient(45deg, #c7d2fe, #ddd6fe, #fbcfe8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        #theme-hexo .author-bio-gradient {
            background: linear-gradient(45deg, #4b5563, #6b7280, #9ca3af);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            font-weight: 500;
            background-size: 200% 200%;
            animation: gradientPulse 4s ease infinite;
        }
        
        /* 白天模式下的作者简介使用纯色 */
        .author-bio-gradient {
            color: #6b7280;
        }

        .dark #theme-hexo .author-bio-gradient {
            background: linear-gradient(45deg, #94a3b8, #cbd5e1, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        @keyframes gradientPulse {
            0% {
                background-position: 0% 50%;
            }
            50% {
                background-position: 100% 50%;
            }
            100% {
                background-position: 0% 50%;
            }
        }
    `}</style>
  )
}

export { Style }

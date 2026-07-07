/* eslint-disable react/no-unknown-property */
import { siteConfig } from '@/lib/config'
import CONFIG from './config'

/**
 * 这里的css样式只对当前主题生效
 * 主题客制化css
 * @returns
 */
// 将 hex 主题色转为 "R G B" 通道，供 Tailwind 的 rgb(var(...) / <alpha-value>) 使用（支持透明度修饰）
const hexToRgbChannels = hex => {
  const m = String(hex || '').trim().replace('#', '')
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m
  const int = parseInt(full, 16)
  if (full.length !== 6 || Number.isNaN(int)) return '99 102 241' // 回退 indigo-500
  return `${(int >> 16) & 255} ${(int >> 8) & 255} ${int & 255}`
}

const Style = () => {
  // Crystal Sky Blue as default fallback
  const themeColor = siteConfig('HEXO_THEME_COLOR', '#38BDF8', CONFIG)
  const themeColorRgb = hexToRgbChannels(themeColor)

  return (
    <style jsx global>{`
        :root {
            --theme-color: ${themeColor};
            --theme-color-rgb: ${themeColorRgb};
        }

        /* 菜单下划线动画 - 极细极简 */
        #theme-hexo .menu-link {
            text-decoration: none;
            background-image: linear-gradient(
                    var(--theme-color),
                    var(--theme-color)
            );
            background-repeat: no-repeat;
            background-position: bottom center;
            background-size: 0 1px;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #theme-hexo .menu-link:hover {
            background-size: 100% 1px;
            color: var(--theme-color);
        }

        /* 自定义滚动条 - 极简透明 */
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background-color: var(--color-neutral-300);
            border-radius: 10px;
            transition: background-color 0.3s;
        }

        ::-webkit-scrollbar-thumb:hover {
             background-color: var(--theme-color);
        }

        // 把宠物永久浮动在屏幕右下角 - 优化视觉重量
        #live2d {
            will-change: transform, opacity;
            position: fixed;
            right: 0;
            bottom: 0;
            width: 280px;
            height: 230px;
            z-index: 9999 !important;
            transform: translateZ(0);
            pointer-events: none;
        }

        // 优化文本高清度
        #theme-hexo .article-content {
            line-height: 1.8;
            font-size: 1.05rem;
            letter-spacing: 0.015em;
            color: var(--color-text-primary);
            font-weight: 400;
            font-family: 'Inter', 'Noto Sans SC', sans-serif;
        }

        .dark #theme-hexo .article-content {
            color: var(--color-text-secondary);
        }

        /* Modern Typography: Serif Headings */
        #theme-hexo .article-content h1,
        #theme-hexo .article-content .notion-h1 {
            font-family: 'Playfair Display', 'Noto Serif SC', serif;
            font-size: 2.5rem;
            line-height: 1.2;
            font-weight: 700;
            letter-spacing: -0.01em;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            color: var(--color-text-primary);
        }

        .dark #theme-hexo .article-content h1,
        .dark #theme-hexo .article-content .notion-h1 {
            color: var(--color-text-primary);
        }
        
        #theme-hexo .article-content h2,
        #theme-hexo .article-content .notion-h2 {
            font-family: 'Playfair Display', 'Noto Serif SC', serif;
            font-size: 1.875rem;
            line-height: 1.3;
            font-weight: 600;
            letter-spacing: -0.01em;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            color: var(--color-text-primary);
        }

        .dark #theme-hexo .article-content h2,
        .dark #theme-hexo .article-content .notion-h2 {
            color: var(--color-text-primary);
        }

        /* 选中态优化 - 晶莹蓝 */
        ::selection {
            background: rgba(56, 189, 248, 0.15);
            color: inherit;
        }
        
        /* 目录样式优化 - 极简高清 */
        #theme-hexo .catalog-item {
            border-left: 1px solid var(--color-border);
            color: var(--color-text-secondary);
            transition: all 0.3s ease;
            padding: 6px 16px;
            font-size: 0.8rem;
            line-height: 1.5;
        }
        
        .dark #theme-hexo .catalog-item {
            border-left: 1px solid var(--color-border);
            color: var(--color-text-secondary);
        }
        
        #theme-hexo .catalog-item:hover {
            color: var(--theme-color);
            background: var(--color-primary-50);
        }
        
        #theme-hexo .catalog-item-active {
            color: var(--theme-color);
            background: var(--color-primary-100);
            border-left: 2px solid var(--theme-color);
            font-weight: 600;
        }

        /* TOC Progress Bar - Crystal Blue */
        .reading-progress-bar {
            background: linear-gradient(90deg, transparent 0%, var(--theme-color) 100%);
            height: 3px;
            border-radius: 0 4px 4px 0;
        }
        
        .dark .reading-progress-bar {
            background: linear-gradient(90deg, transparent 0%, var(--theme-color) 100%);
        }

        /*
         * 已移除此前 .text-indigo-* / .bg-indigo-* → --theme-color 的 !important 补丁。
         * 改为在 tailwind.config.js 里把 indigo 强调档（400-800）直接定义为
         * rgb(var(--theme-color-rgb) / <alpha-value>)，从源头让 indigo 跟随主题色（含透明度），
         * 无需 !important 覆盖，主题色变更可自动传播。
         */

        /* 底部友链徽章：统一高度、等比缩放、垂直居中，消除上下错乱与大小不一致 */
        #theme-hexo .footer-badges > a {
            display: inline-flex;
            align-items: center;
            height: 20px;
        }
        #theme-hexo .footer-badges img {
            height: 20px !important;
            width: auto !important;
            max-width: 120px;
            object-fit: contain !important;
            border-radius: 4px;
        }
    `}</style>
  )
}

export { Style }

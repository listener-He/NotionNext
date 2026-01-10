/* eslint-disable react/no-unknown-property */
import { siteConfig } from '@/lib/config'
import CONFIG from './config'

/**
 * 这里的css样式只对当前主题生效
 * 主题客制化css
 * @returns
 */
const Style = () => {
  // Crystal Sky Blue as default fallback
  const themeColor = siteConfig('HEXO_THEME_COLOR', '#38BDF8', CONFIG)

  return (
    <style jsx global>{`
        :root {
            --theme-color: ${themeColor};
        }

        // 底色 - 极致清新纯净 (Apple Style Gray)
        #theme-hexo body {
            background-color: #F9FAFB;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            -webkit-font-smoothing: antialiased;
            color: #1F2937;
        }

        .dark #theme-hexo body {
            background-color: #020617;
            color: #F3F4F6;
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

        /* 高清悬浮效果 */
        #theme-hexo .hover-scale {
            transition: all 0.4s cubic-bezier(0.23, 1, 0.32, 1);
        }
        #theme-hexo .hover-scale:hover {
            transform: translateY(-4px);
            filter: brightness(1.02);
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
            background-color: rgba(148, 163, 184, 0.2);
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
            color: #374151;
            font-weight: 400;
            font-family: 'Inter', 'Noto Sans SC', sans-serif;
        }

        .dark #theme-hexo .article-content {
            color: #CBD5E1;
        }

        #theme-hexo .article-content h1,
        #theme-hexo .article-content .notion-h1 {
            font-family: 'Inter', 'Noto Sans SC', sans-serif; /* 换回无衬线，更现代HD */
            font-size: 2.5rem;
            line-height: 1.2;
            font-weight: 800;
            letter-spacing: -0.025em;
            margin-top: 3rem;
            margin-bottom: 1.5rem;
            color: #111827;
        }

        .dark #theme-hexo .article-content h1,
        .dark #theme-hexo .article-content .notion-h1 {
            color: #F9FAFB;
        }
        
        #theme-hexo .article-content h2,
        #theme-hexo .article-content .notion-h2 {
            font-size: 1.875rem;
            line-height: 1.3;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-top: 2.5rem;
            margin-bottom: 1.25rem;
            color: #1F2937;
        }

        .dark #theme-hexo .article-content h2,
        .dark #theme-hexo .article-content .notion-h2 {
            color: #F3F4F6;
        }

        /* 选中态优化 - 晶莹蓝 */
        ::selection {
            background: rgba(56, 189, 248, 0.15);
            color: inherit;
        }
        
        /* 目录样式优化 - 极简高清 */
        #theme-hexo .catalog-item {
            border-left: 1px solid rgba(226, 232, 240, 0.5);
            color: #64748B;
            transition: all 0.3s ease;
            padding: 6px 16px;
            font-size: 0.8rem;
            line-height: 1.5;
        }
        
        .dark #theme-hexo .catalog-item {
            border-left: 1px solid rgba(30, 41, 59, 0.5);
            color: #94A3B8;
        }
        
        #theme-hexo .catalog-item:hover {
            color: var(--theme-color);
            background: rgba(56, 189, 248, 0.03);
        }
        
        #theme-hexo .catalog-item-active {
            color: var(--theme-color);
            background: rgba(56, 189, 248, 0.06);
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
            background: linear-gradient(90deg, transparent 0%, #38BDF8 100%);
        }

        /* Override Tailwind Colors to Sky Blue */
        #theme-hexo .text-indigo-400,
        #theme-hexo .text-indigo-500,
        #theme-hexo .text-indigo-600,
        #theme-hexo .text-indigo-800 {
            color: var(--theme-color) !important;
        }

        #theme-hexo .bg-indigo-400,
        #theme-hexo .bg-indigo-500,
        #theme-hexo .bg-indigo-600 {
            background-color: var(--theme-color) !important;
        }
        
        /* Card Shadows - Diffused & Soft */
        #theme-hexo .card-shadow {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02);
            border: 1px solid rgba(0,0,0,0.02);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #theme-hexo .card-shadow:hover {
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
            transform: translateY(-2px);
            border-color: rgba(0,0,0,0.04);
        }

    `}</style>
  )
}

export { Style }

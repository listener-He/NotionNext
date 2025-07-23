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
      }
      .dark #theme-hexo body {
        background-color: black;
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

      /* MenuGroup 悬浮颜色 */
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
          rgba(0, 0, 0, 0.5) 0%,
          rgba(0, 0, 0, 0.2) 10%,
          rgba(0, 0, 0, 0) 25%,
          rgba(0, 0, 0, 0.2) 75%,
          rgba(0, 0, 0, 0.5) 100%
        );
      }

      /* Custem */
      .tk-footer {
        opacity: 0;
      }

      // 选中字体颜色
      ::selection {
        background: color-mix(in srgb, var(--theme-color) 30%, transparent);
      }

      // 自定义滚动条
      ::-webkit-scrollbar {
        width: 5px;
        height: 5px;
      }

      ::-webkit-scrollbar-track {
        background: transparent;
      }

      ::-webkit-scrollbar-thumb {
        background-color: var(--theme-color);
      }

      * {
        scrollbar-width: thin;
        scrollbar-color: var(--theme-color) transparent;
      }
      
      // 把宠物永久浮动在屏幕右下角
      #live2d {
          will-change: transform, opacity;
          position: fixed;
          right: 0;
          bottom: 0;
          width: 300px;
          height: 250px;
          z-index: 9999; !important;
      }

      // 导航栏 右侧 
      .mr-1 {
          font-size: 0.7em;
          color: black;
      }


      // 基础字体与质感设计
      .shadow-text.text-lg {
          /* 等宽字体模拟打字机机械感，带复古粗糙边缘 */
          font-family: "Special Elite", "Courier New", monospace;
          font-weight: 500; /* 中等字重增强清晰度 */
          color: #f5f5f0; /* 柔和米白色，接近纸张颜色 */
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1); /* 增强文字立体感 */
          letter-spacing: 0.05em; /* 等宽字间距微调，提升可读性 */
          position: relative;
          overflow: hidden; /* 隐藏未显示的字符 */
          white-space: nowrap; /* 确保文本不换行 */
      }
      


      // 核心样式：强化粗体质感与真诚调性
      .font-black.text-4xl.md:text-5xl.shadow-text {
          /* 柔和白色选择：带暖调的奶白色，比纯白更温润 */
          color: #f8f6f0; /* 主色：奶白色，含微量黄调，柔和不刺眼 */

          /* 轻量阴影：强化文字边界，与玻璃背景自然融合（避免重阴影破坏通透感） */
          text-shadow:
                  0 1px 2px rgba(0, 0, 0, 0.08), /* 底层轻阴影：增加细微立体感 */
                  0 0 1px rgba(0, 0, 0, 0.1); /* 极轻描边感：防止文字边缘与玻璃背景"融在一起" */

          /* 文字通透感微调：轻微降低不透明度，增强与玻璃背景的融合度 */
          opacity: 0.95;

          /* 保留原字体特性，强化柔和质感 */
          font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
          font-weight: 900;
          letter-spacing: -0.02em;
      }


      /* 入场动画：更柔和的淡入，避免突兀 */
      @keyframes fadeInSoft {
          0% {
              opacity: 0;
              transform: translateY(8px);
              text-shadow: none;
          }
          100% {
              opacity: 0.95;
              transform: translateY(0);
          }
      }

      /* 绑定动画：缓慢自然的出现节奏 */
      .font-black.text-4xl.md:text-5xl.shadow-text {
          animation: fadeInSoft 1s ease-out forwards;
      }

      /* 交互反馈：hover时保持柔和过渡，不破坏整体氛围 */
      .font-black.text-4xl.md:text-5xl.shadow-text:hover {
          transform: translateY(-1px); /* 极轻微上移，避免大幅动效 */
          text-shadow:
                  0 1px 3px rgba(0, 0, 0, 0.12), /* 阴影略深一点，增强互动感 */
                  0 0 2px rgba(0, 0, 0, 0.15);
          opacity: 1; /*  hover时轻微提升透明度，增加"聚焦感" */
      }

      /* 响应式调整：移动端保持柔和度 */
      @media (max-width: 768px) {
          .font-black.text-4xl.md:text-5xl.shadow-text {
              letter-spacing: -0.01em; /* 字距略松，避免小字拥挤 */
              opacity: 0.98; /* 移动端适当提高清晰度 */
          }
      }

      /* 推荐文章卡片间距 */
      #theme-hexo .grid-cols-2.md\\:grid-cols-3.gap-4 {
          gap: 1rem !important;
      }

      /* 响应式优化：移动端展示单列 */
      @media (max-width: 640px) {
          #theme-hexo .grid-cols-2.md\\:grid-cols-3 {
              grid-template-columns: repeat(1, minmax(0, 1fr)) !important;
          }
      }
      /* 适配移动端 */
      @media (max-width: 640px) {
          #theme-hexo .article-adjacent-container i {
              font-size: 0.75rem;
          }
          #theme-hexo .article-adjacent-container .text-xs {
              font-size: 0.65rem;
          }
      }
    `}</style>
  )
}

export { Style }

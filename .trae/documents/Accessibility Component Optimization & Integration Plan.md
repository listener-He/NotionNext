# Accessibility 组件优化与集成计划

我将根据你的要求，优化 `Accessibility.js` 组件，修复未使用的变量问题，提升性能，并将其集成到文章详情页。

## 1. 代码分析与优化 (`components/Accessibility.js`)

**当前问题：**
*   **未使用的变量**：`motionQuery` 和 `contrastQuery` 在 `useEffect` 的清理函数中被引用，但由于 `useEffect` 的闭包特性，如果它们是在 effect 内部定义的，可能无法在 cleanup 中正确引用（实际上代码中是在 effect 内部定义的，这是正确的，但可以优化逻辑）。更重要的是，`isReducedMotion` 等状态似乎没有被充分利用或有冗余。
*   **DOM 操作**：直接操作 `document.documentElement` 是可行的，但样式注入方式 (`document.createElement('style')`) 不够优雅，且在组件卸载时没有清理样式标签。
*   **性能**：频繁的 `localStorage` 读写和 DOM 操作可以优化。
*   **UI**：目前是一个固定的面板，可能遮挡内容。我将添加一个**折叠/展开**按钮，并美化 UI 以匹配当前的 "Crystal Clear" 风格。

**优化方案：**
1.  **移除冗余**：清理未使用的变量。
2.  **样式优化**：使用 `<style jsx global>` 替代 `document.createElement('style')`，确保样式随组件生命周期管理，且支持 SSR。
3.  **UI 改进**：
    *   默认折叠为一个可访问性图标按钮（类似悬浮球）。
    *   展开后显示控制面板。
    *   使用 Glassmorphism 风格。
4.  **功能增强**：
    *   保留字体大小、高对比度功能。
    *   确保键盘导航 (Tab) 能顺畅使用。

## 2. 集成到文章详情 (`themes/hexo/index.js`)

**目标**：在 `LayoutSlug` (文章详情布局) 中引入并使用该组件。

**步骤**：
1.  在 `themes/hexo/index.js` 中引入 `Accessibility` 组件。
2.  将其放置在 `LayoutSlug` 的合适位置（通常作为页面的浮动工具，或者放在文章底部的工具栏区域）。考虑到可访问性工具通常是全局的，放在 Layout 的最外层或 `RightFloatArea` 附近可能更合适，但用户指定要在“文章详情中”，我会将其放在 `LayoutSlug` 的返回 JSX 中，确保只在详情页加载（或者根据需求全局加载）。*注：通常 A11y 工具是全局的，但既然要求在文章详情添加，我会确保它在详情页可见。*

## 执行计划

1.  **重构 `components/Accessibility.js`**：
    *   实现折叠状态。
    *   优化事件监听和清理。
    *   使用 `styled-jsx` 管理样式。
2.  **修改 `themes/hexo/index.js`**：
    *   引入组件。
    *   在 `LayoutSlug` 中渲染。

我将从重构组件开始。

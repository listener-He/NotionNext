# UI/UX Polish & Bug Fix Plan

I will address the user's feedback on aesthetics, details, fonts, and fix the reported bugs.

## 1. Bug Fixes (High Priority)
*   **Fix Hydration Mismatch in `LazyImage.js`**:
    *   The `adjustImgSize` function uses `window` during the initial render, causing a mismatch between server and client HTML.
    *   **Fix**: Initialize `src` with a stable value (server-compatible) and update it to the device-optimized version inside a `useEffect` hook.
*   **Fix Hook Violations in `AlgoliaSearchModal.js`**:
    *   The `siteConfig` function appears to use React Hooks (`useGlobal` -> `useContext`), but it is being called inside `useMemo` and `useCallback`. This violates the Rules of Hooks.
    *   **Fix**: Move all `siteConfig` calls to the top level of the component body.

## 2. Design System Upgrade ("Modern Light Luxury")
*   **Refine Color Palette (`tailwind.config.js`)**:
    *   **Day Mode**: Shift from pure white to "Cream/Porcelain" (`#FAF9F6`) and "Warm Gray" for a softer, more elegant look.
    *   **Night Mode**: Shift from pure black to "Deep Midnight/Navy" (`#0F172A`) for depth.
    *   **Accents**: Introduce a "Champagne Gold" (`#C5A059`) and "Muted Slate" palette.
*   **Typography (`tailwind.config.js`)**:
    *   Introduce a **Dual-Font System**:
        *   **Headings**: Use Elegant Serif fonts (`Playfair Display`, `Noto Serif SC`, `Times New Roman`) for a classic, authoritative feel.
        *   **Body**: Use Modern Sans-Serif fonts (`Inter`, `Noto Sans SC`, system-ui) for readability.

## 3. Component Polishing
*   **Blog Post Card (`themes/hexo/components/BlogPostCard.js`)**:
    *   **Refine Details**: Adjust padding, border radius, and shadow diffusion.
    *   **Hover Effects**: Make the "levitation" effect smoother (`cubic-bezier`).
    *   **Typography**: Improve contrast and spacing in `BlogPostCardInfo.js`.
*   **Article Detail & TOC (`themes/hexo/style.js`)**:
    *   **Article Content**: Optimize line-height (`leading-relaxed`) and letter-spacing. Use the new Serif font for headings.
    *   **TOC**: Reduce font size by ~40% (as requested "smaller 3/5", interpreting as "make it petite/elegant") and use a lighter font weight.

## 4. Execution Steps
1.  **Refactor `LazyImage.js`** to fix hydration bugs.
2.  **Refactor `AlgoliaSearchModal.js`** to fix hook errors.
3.  **Update `tailwind.config.js`** with the new color palette and font families.
4.  **Update `themes/hexo/style.js`** to apply global styles (fonts, TOC, article layout).
5.  **Update `BlogPostCard.js`** for visual polishing.

I will proceed with these changes immediately.

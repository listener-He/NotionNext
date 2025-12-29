## 即刻执行项

1. 扩展 Tailwind 扫描到 js/ts/jsx/tsx，并加入必要 safelist
2. SEO Head 增补 canonical、prev/next，统一 og/twitter 图片为绝对地址与 secure_url
3. 关键图片（首页 Banner、文章缩略图）逐步迁移到 next/image，设置 sizes/priority/fetchPriority
4. 字体加载由 WebFontLoader 迁移到 next/font（英文用可变字体，中文用系统栈），避免 CLS
5. 第三方脚本按可见性触发并用 next/script 管理关键统计脚本

## 验证

- 跑 Lighthouse 与 Web Vitals，记录首页/文章页 LCP/INP/CLS
- 比对打包体积与路由首屏用时；确认无回归后继续按清单推进更大范围迁移
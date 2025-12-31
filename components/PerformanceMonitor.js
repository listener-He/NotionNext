import { useEffect } from 'react'
import BLOG from '@/blog.config'

/**
 * 性能监控组件
 * 监控Web Vitals指标并上报
 */
const PerformanceMonitor = () => {
  useEffect(() => {
    if (!BLOG.ENABLE_WEB_VITALS || typeof window === 'undefined') {
      return
    }

    // 动态导入web-vitals库以避免编译错误
    import('web-vitals')
      .then(({ getCLS, getFID, getFCP, getLCP, getTTFB, getINP }) => {
        // 监控Core Web Vitals
        const reportWebVitals = (metric) => {
          const { name, value, id } = metric
          
          // 检查是否超出性能预算
          const budget = BLOG.PERFORMANCE_BUDGET
          let isOverBudget = false
          
          switch (name) {
            case 'FCP':
              isOverBudget = value > budget.FCP
              break
            case 'LCP':
              isOverBudget = value > budget.LCP
              break
            case 'FID':
              isOverBudget = value > budget.FID
              break
            case 'CLS':
              isOverBudget = value > budget.CLS
              break
            case 'TBT':
              isOverBudget = value > budget.TBT || value > 300 // 默认TBT预算为300ms
              break
            case 'INP': // Interaction to Next Paint - 新增核心指标
              isOverBudget = value > 200 // INP预算为200ms
              break
          }

          // 控制台输出性能指标
          if (process.env.NODE_ENV === 'development') {
            console.log(`[Performance] ${name}: ${value}${isOverBudget ? ' ⚠️ Over Budget' : ' ✅'}`)
          }

          // 可以在这里添加性能数据上报逻辑
          // 例如发送到Google Analytics、Vercel Analytics等
          if (window.gtag) {
            window.gtag('event', name, {
              event_category: 'Web Vitals',
              event_label: id,
              value: Math.round(name === 'CLS' ? value * 1000 : value),
              non_interaction: true
            })
          }
        }

        getCLS(reportWebVitals)
        getFID(reportWebVitals)
        getFCP(reportWebVitals)
        getLCP(reportWebVitals)
        getTTFB(reportWebVitals)
        
        // 如果支持INP指标，也进行监控
        if (getINP) {
          getINP(reportWebVitals)
        }
      })
      .catch(err => {
        console.warn('Failed to load web-vitals:', err)
      })

    // 监控资源加载性能
    const monitorResourceTiming = () => {
      if (!window.performance || !window.performance.getEntriesByType) {
        return
      }

      const resources = window.performance.getEntriesByType('resource')
      const slowResources = resources.filter(resource => resource.duration > 1000)
      
      if (slowResources.length > 0 && process.env.NODE_ENV === 'development') {
        console.warn('[Performance] Slow resources detected:', slowResources)
      }
    }

    // 延迟执行资源监控
    setTimeout(monitorResourceTiming, 5000)

    // 监控布局偏移事件
    const monitorLayoutShifts = () => {
      let cls = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cls += entry.value
            // 检查布局偏移源
            for (const source of entry.sources) {
              const node = source.node
              if (node) {
                console.warn(`Layout shift detected from element:`, node.tagName, node.className)
              }
            }
          }
        }
        if (cls > 0.1) { // 超过CLS预算
          console.warn(`[Performance] Cumulative Layout Shift: ${cls}`)
        }
      })
      
      observer.observe({entryTypes: ['layout-shift']})
    }
    
    monitorLayoutShifts()

  }, [])

  return null
}

export default PerformanceMonitor
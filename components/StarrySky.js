import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import { getDevicePerformance } from '@/components/PerformanceDetector'

const StarrySky = () => {
  const { isLowEndDevice, performanceLevel } = getDevicePerformance();

  useEffect(() => {
    // 在低端设备或性能较差的设备上禁用星空动画
    if (isLowEndDevice || performanceLevel === 'low') {
      return;
    }

    let scriptLoaded = false;

    // 使用 requestIdleCallback 延迟加载动画，避免阻塞主线程
    const loadStarrySky = async () => {
      if (scriptLoaded) return; // 防止重复加载

      try {
        await loadExternalResource('/js/starrySky.js', 'js');
        scriptLoaded = true;

        if (window.renderStarrySky) {
          // 确保在加载时检查设备性能
          if (!isLowEndDevice && performanceLevel !== 'low') {
            window.renderStarrySky();
          }
        }
      } catch (error) {
        console.error('Failed to load starry sky:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loadStarrySky();
      }, { timeout: 2000 });
    } else {
      // 兼容不支持 requestIdleCallback 的浏览器
      setTimeout(() => {
        loadStarrySky();
      }, 100);
    }

    // 清理函数
    return () => {
      // 如果存在全局销毁函数，则调用它
      if (window.destroyStarrySky && typeof window.destroyStarrySky === 'function') {
        window.destroyStarrySky();
      }

      // 重置加载标志
      scriptLoaded = false;
    };
  }, [isLowEndDevice, performanceLevel]);

  return (
    <></>
  )
}

export default StarrySky

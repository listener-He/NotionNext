import { useEffect } from 'react'
import { loadExternalResource } from '@/lib/utils'
import { getDevicePerformance } from '@/components/PerformanceDetector'
import { useGlobal } from '@/lib/global'

const StarrySky = () => {
  const { isLowEndDevice} = getDevicePerformance();
  const { isDarkMode } = useGlobal()
  useEffect(() => {
    // 在低端设备或性能较差的设备上禁用星空动画
    if (isLowEndDevice || !isDarkMode) {
      return;
    }

    let scriptLoaded = false;

    // 使用 requestIdleCallback 延迟加载动画，避免阻塞主线程
    const loadStarrySky = async () => {
      if (scriptLoaded) return; // 防止重复加载

      try {
        // 加载原有的星空背景
        if (isLowEndDevice && isDarkMode && typeof window !== 'undefined') {
          loadExternalResource('/js/starrySky.js', 'js').then(() => {
            if (window.renderStarrySky) {
              window.renderStarrySky()
            }
          })
        }
        // 优化：仅在非低端性能设备上加载增强版星空背景
        if (!isLowEndDevice && isDarkMode && typeof window !== 'undefined') {
          loadExternalResource('/js/enhancedStarrySky.js', 'js').then(() => {
            if (window.createEnhancedStarrySky) {
              window.createEnhancedStarrySky()
            }
          })
        }
      } catch (error) {
        console.error('Failed to load starry sky:', error);
      }
    };

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(() => {
        loadStarrySky().then(() => {
          scriptLoaded = true;
        });
      }, { timeout: 2000 });
    } else {
      // 兼容不支持 requestIdleCallback 的浏览器
      setTimeout(() => {
        loadStarrySky().then(() => {
          scriptLoaded = true;
        });
      }, 100);
    }

    // 清理函数
    return () => {
      // 如果存在全局销毁函数，则调用它
      if (window.destroyEnhancedStarrySky && typeof window.destroyEnhancedStarrySky === 'function') {
        window.destroyEnhancedStarrySky();
      }

      // 重置加载标志
      scriptLoaded = false;
    };
  }, [isLowEndDevice]);

  return (
    <></>
  )
}

export default StarrySky

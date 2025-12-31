import { siteConfig } from '@/lib/config'
import Head from 'next/head'
import { useEffect, useRef, useState, useMemo, useCallback } from 'react'

// 抽离工具函数，避免在组件内部重复定义
// 注意：为了避免服务端和客户端渲染不一致(Hydration Mismatch)，
// 初始渲染最好不要依赖 window.screen.width，或者接受 src 变化带来的重新渲染。
const adjustImgSize = (src, maxWidth) => {
  if (!src) return ''

  // 在服务端或未挂载前，仅使用配置的 maxWidth
  // 只有在明确需要针对客户端屏幕优化时才读取 window
  const isClient = typeof window !== 'undefined'
  const screenWidth = isClient && window.screen?.width ? window.screen.width : maxWidth

  // 如果屏幕尺寸大于压缩限制，则不处理（或者逻辑根据需求调整）
  if (screenWidth > maxWidth) {
    return src
  }

  // 正则替换
  return src
    .replace(/width=\d+/, `width=${screenWidth}`)
    .replace(/w=\d+/, `w=${screenWidth}`)
}

/**
 * 图片懒加载组件
 */
export default function LazyImage({
                                    priority = false, // 默认为 false
                                    id,
                                    src,
                                    alt,
                                    placeholderSrc,
                                    className,
                                    width,
                                    height,
                                    title,
                                    onLoad,
                                    onClick,
                                    style,
                                    ...restProps // 捕获其他未显式解构的属性
                                  }) {
  const imageRef = useRef(null)

  // 配置项
  const maxWidth = siteConfig('IMAGE_COMPRESS_WIDTH') || 800
  const defaultPlaceholderSrc = siteConfig('IMG_LAZY_LOAD_PLACEHOLDER')
  const lazyLoadThreshold = siteConfig('LAZY_LOAD_THRESHOLD', '200px')

  // 状态管理
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // 决定初始显示的图片：如果有优先级，直接尝试显示原图（稍后会被 effect 处理），否则显示占位图
  const initialSrc = placeholderSrc || defaultPlaceholderSrc
  const [currentSrc, setCurrentSrc] = useState(priority ? src : initialSrc)

  // 计算最终的目标图片地址（使用 useMemo 避免重复计算）
  const finalSrc = useMemo(() => {
    return adjustImgSize(src, maxWidth)
  }, [src, maxWidth])

  // 图片加载完成的处理逻辑
  const handleLoadSuccess = useCallback(() => {
    setIsLoaded(true)
    setHasError(false)
    if (typeof onLoad === 'function') {
      onLoad()
    }
  }, [onLoad])

  // 图片加载失败的处理逻辑
  const handleError = useCallback(() => {
    setHasError(true)
    // 失败时回退策略：优先用传入的 placeholder，没有则用默认 placeholder
    const fallbackSrc = placeholderSrc || defaultPlaceholderSrc
    setCurrentSrc(fallbackSrc)
    // 即便失败，也移除 loading 状态的样式，展示回退图
    setIsLoaded(true)
  }, [placeholderSrc, defaultPlaceholderSrc])

  // 核心加载逻辑：预加载图片
  const preloadImage = useCallback((targetSrc) => {
    const img = new Image()

    // 现代浏览器解码优化
    if ('decoding' in img) {
      img.decoding = 'async'
    }

    img.src = targetSrc

    img.onload = () => {
      setCurrentSrc(targetSrc)
      handleLoadSuccess()
    }

    img.onerror = () => {
      handleError()
    }
  }, [handleLoadSuccess, handleError])

  useEffect(() => {
    if (!src) return

    let isMounted = true
    const observerTarget = imageRef.current

    // 策略1: 优先级图片或不支持 Observer 的环境，直接加载
    if (priority || typeof window !== 'undefined' && !window.IntersectionObserver) {
      preloadImage(finalSrc)
      return
    }

    // 策略2: 使用 IntersectionObserver 懒加载
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isMounted) {
            preloadImage(finalSrc)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: lazyLoadThreshold,
        threshold: 0.1
      }
    )

    if (observerTarget) {
      observer.observe(observerTarget)
    }

    return () => {
      isMounted = false
      if (observerTarget) {
        observer.unobserve(observerTarget)
      }
    }
  }, [src, finalSrc, priority, lazyLoadThreshold, preloadImage])

  // 如果没有 src，直接不渲染
  if (!src) return null

  // 组合类名：加载完成前保留 placeholder 类，加载完成后移除
  const combinedClassName = [
    className,
    !isLoaded ? 'lazy-image-placeholder' : '',
    hasError ? 'lazy-image-error' : ''
  ].filter(Boolean).join(' ')

  const imgProps = {
    ref: imageRef,
    src: currentSrc,
    alt: alt || 'Lazy loaded image',
    id,
    title,
    width: width || 'auto',
    height: height || 'auto',
    className: combinedClassName,
    style: {
      objectFit: 'cover',
      objectPosition: 'center',
      ...style // 允许外部样式覆盖默认样式
    },
    onClick,
    loading: priority ? 'eager' : 'lazy',
    fetchpriority: priority ? 'high' : 'low',
    decoding: 'async',
    // 数据属性
    'data-src': src,
    ...(siteConfig('WEBP_SUPPORT') && { 'data-webp': 'true' }),
    ...(siteConfig('AVIF_SUPPORT') && { 'data-avif': 'true' }),
    ...(width && height && {
      'data-width': width,
      'data-height': height
    }),
    ...restProps // 透传其他属性
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...imgProps} />

      {/* 优先级图片进行 SEO 预加载优化 */}
      {priority && (
        <Head>
          <link rel="preload" as="image" href={finalSrc} />
        </Head>
      )}
    </>
  )
}

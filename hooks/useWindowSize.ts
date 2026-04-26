import { useEffect, useState } from 'react'

interface WindowSize {
  width: number,
  height: number
}

const useWindowSize = () => {
  const [size, setSize] = useState<WindowSize>({
    width: typeof document !== 'undefined' ? document.documentElement.clientWidth : 0,
    height: typeof document !== 'undefined' ? document.documentElement.clientHeight : 0
  })

  useEffect(() => {
    const onResize = () => {
      setSize({
        width: document.documentElement.clientWidth,
        height: document.documentElement.clientHeight
      })
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [])
  return size
}

export default useWindowSize

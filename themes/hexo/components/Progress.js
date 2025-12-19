import { useEffect, useState } from 'react'
import { isBrowser } from '@/lib/utils'

/**
 * 顶部页面阅读进度条
 * @returns {JSX.Element}
 * @constructor
 */
const Progress = ({ targetRef, showPercent = true }) => {
  const currentRef = targetRef?.current || targetRef
  const [percent, changePercent] = useState(0)
  const scrollListener = () => {
    const target = currentRef || (isBrowser && document.getElementById('article-wrapper'))
    if (target) {
      const clientHeight = target.clientHeight
      const scrollY = window.pageYOffset
      const fullHeight = clientHeight - window.outerHeight
      let per = parseFloat(((scrollY / fullHeight) * 100).toFixed(0))
      if (per > 100) per = 100
      if (per < 0) per = 0
      changePercent(per)
    }
  }

  useEffect(() => {
    document.addEventListener('scroll', scrollListener)
    return () => document.removeEventListener('scroll', scrollListener)
  }, [])

  return (
    <div className='w-full reading-progress-track'>
      <div
        className='reading-progress-bar duration-200'
        style={{ width: `${percent}%` }}
      >
        <span className='reading-progress-dot' />
        {showPercent && (
          <div className='text-right text-xs px-1 select-none'>
            {percent}%
          </div>
        )}
      </div>
    </div>
  )
}

export default Progress

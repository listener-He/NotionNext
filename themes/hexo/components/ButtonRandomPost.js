import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'

/**
 * 随机跳转到一个文章
 */
export default function ButtonRandomPost(props) {
  const { latestPosts } = props
  const router = useRouter()
  const { locale } = useGlobal()
  /**
   * 随机跳转文章
   */
  function handleClick() {
    const randomIndex = Math.floor(Math.random() * latestPosts.length)
    const randomPost = latestPosts[randomIndex]
    router.push(`${siteConfig('SUB_PATH', '')}/${randomPost?.slug}`)
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }

  return (
    <div
      role='button'
      tabIndex={0}
      aria-label={locale.MENU.WALK_AROUND}
      className='cursor-pointer a11y-focus tap-target hover:bg-black hover:bg-opacity-10 focus:ring-2 focus:ring-indigo-500 rounded-full w-11 h-11 flex justify-center items-center duration-200 transition-all ease-out'
      onClick={handleClick}
      onKeyDown={handleKeyDown}>
      <i className='fa-solid fa-podcast'></i>
    </div>
  )
}

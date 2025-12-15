import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { useRouter } from 'next/router'
import { useHexoGlobal } from '..'

/**
 * 搜索按钮
 * @returns
 */
export default function SearchButton(props) {
  const { locale } = useGlobal()
  const router = useRouter()
  const { searchModal } = useHexoGlobal()

  function handleSearch() {
    if (siteConfig('ALGOLIA_APP_ID')) {
      searchModal.current.openSearch()
    } else {
      router.push('/search')
    }
  }
  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      handleSearch()
    }
  }

  return <>
        <div onClick={handleSearch} onKeyDown={handleKeyDown} role='button' tabIndex={0} aria-label={locale.NAV.SEARCH} className='cursor-pointer a11y-focus tap-target dark:text-white hover:bg-black hover:bg-opacity-10 focus:ring-2 focus:ring-indigo-500 rounded-full w-11 h-11 flex justify-center items-center duration-200 transition-all ease-out'>
            <i title={locale.NAV.SEARCH} className="fa-solid fa-magnifying-glass" />
        </div>
    </>
}

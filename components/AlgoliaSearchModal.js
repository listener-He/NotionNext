import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import algoliasearch from 'algoliasearch'
import throttle from 'lodash.throttle'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import {
  Fragment,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  memo,
  useCallback,
  useMemo
} from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

const ShortCutActions = [
  {
    key: '↑ ↓',
    action: '选择'
  },
  {
    key: 'Enter',
    action: '跳转'
  },
  {
    key: 'Esc',
    action: '关闭'
  }
]

/**
 * 结合 Algolia 实现的弹出式搜索框
 * 打开方式 cRef.current.openSearch()
 * https://www.algolia.com/doc/api-reference/search-api-parameters/
 */
export default function AlgoliaSearchModal({ cRef }) {
  const [searchResults, setSearchResults] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [page, setPage] = useState(0)
  const [keyword, setKeyword] = useState(null)
  const [totalPage, setTotalPage] = useState(0)
  const [totalHit, setTotalHit] = useState(0)
  const [useTime, setUseTime] = useState(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  
  // 添加缓存机制以提高性能
  const searchCache = useRef(new Map())
  const lastSearchRef = useRef({ keyword: '', page: 0 })

  const inputRef = useRef(null)
  const router = useRouter()

  /**
   * 快捷键设置
   */
  useHotkeys('ctrl+k', e => {
    e.preventDefault()
    setIsModalOpen(true)
  })
  // 修改快捷键的使用逻辑
  useHotkeys(
    'down',
    e => {
      if (isInputFocused) {
        // 只有在聚焦时才触发
        e.preventDefault()
        if (activeIndex < searchResults.length - 1) {
          setActiveIndex(activeIndex + 1)
        }
      }
    },
    { enableOnFormTags: true }
  )
  useHotkeys(
    'up',
    e => {
      if (isInputFocused) {
        e.preventDefault()
        if (activeIndex > 0) {
          setActiveIndex(activeIndex - 1)
        }
      }
    },
    { enableOnFormTags: true }
  )
  useHotkeys(
    'esc',
    e => {
      if (isInputFocused) {
        e.preventDefault()
        setIsModalOpen(false)
      }
    },
    { enableOnFormTags: true }
  )
  useHotkeys(
    'enter',
    e => {
      if (isInputFocused && searchResults.length > 0) {
        e.preventDefault()
        onJumpSearchResult()
      }
    },
    { enableOnFormTags: true }
  )
  // 跳转Search结果
  const onJumpSearchResult = useCallback(() => {
    if (searchResults.length > 0) {
      const searchResult = searchResults[activeIndex]
      window.location.href = `${siteConfig('SUB_PATH', '')}/${searchResult.slug || searchResult.objectID}`
    }
  }, [searchResults, activeIndex])

  const resetSearch = () => {
    setActiveIndex(0)
    setKeyword('')
    setSearchResults([])
    setUseTime(0)
    setTotalPage(0)
    setTotalHit(0)
    if (inputRef.current) inputRef.current.value = ''
  }

  /**
   * 页面路径变化后，自动关闭此modal
   */
  useEffect(() => {
    setIsModalOpen(false)
  }, [router])

  /**
   * 自动聚焦搜索框
   */
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      resetSearch()
    }
  }, [isModalOpen])

  /**
   * 对外暴露方法
   **/
  useImperativeHandle(cRef, () => {
    return {
      openSearch: () => {
        setIsModalOpen(true)
      }
    }
  })

  const client = algoliasearch(
    siteConfig('ALGOLIA_APP_ID'),
    siteConfig('ALGOLIA_SEARCH_ONLY_APP_KEY')
  )
  const index = client.initIndex(siteConfig('ALGOLIA_INDEX'))

  /**
   * 搜索
   * @param {*} query
   */
  const handleSearch = async (query, page) => {
    setKeyword(query)
    setPage(page)
    setSearchResults([])
    setUseTime(0)
    setTotalPage(0)
    setTotalHit(0)
    setActiveIndex(0)
    if (!query || query === '') {
      return
    }
    
    // 检查缓存
    const cacheKey = `${query}-${page}`
    if (searchCache.current.has(cacheKey)) {
      const cachedResult = searchCache.current.get(cacheKey)
      setSearchResults(cachedResult.hits)
      setTotalPage(cachedResult.nbPages)
      setTotalHit(cachedResult.nbHits)
      setUseTime(cachedResult.processingTimeMS)
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    try {
      const res = await index.search(query, { page, hitsPerPage: 10 })
      const { hits, nbHits, nbPages, processingTimeMS } = res
      setUseTime(processingTimeMS)
      setTotalPage(nbPages)
      setTotalHit(nbHits)
      setSearchResults(hits)
      
      // 添加到缓存
      searchCache.current.set(cacheKey, {
        hits,
        nbPages,
        nbHits,
        processingTimeMS
      })
      
      // 限制缓存大小，防止内存泄漏
      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value
        searchCache.current.delete(firstKey)
      }
      
      setIsLoading(false)
      
    } catch (error) {
      console.error('Algolia search error:', error)
      setIsLoading(false)
    }
  }

  // 定义节流函数，确保在用户停止输入一段时间后才会调用处理搜索的方法
  const throttledHandleInputChange = useRef(
    throttle((query, page = 0) => {
      handleSearch(query, page)
    }, 500) // 减少搜索延迟，提升响应速度
  )

  // 用于存储搜索延迟的计时器
  const searchTimer = useRef(null)

  // 修改input的onChange事件处理函数
  const handleInputChange = e => {
    const query = e.target.value

    // 如果已经有计时器在等待搜索，先清除之前的计时器
    if (searchTimer.current) {
      clearTimeout(searchTimer.current)
    }

    // 设置新的计时器，在用户停止输入一段时间后触发搜索
    searchTimer.current = setTimeout(() => {
      throttledHandleInputChange.current(query)
    }, 300) // 减少用户输入延迟
  }

  /**
   * 切换页码
   * @param {*} page
   */
  const switchPage = page => {
    throttledHandleInputChange.current(keyword, page)
  }

  /**
   * 关闭弹窗
   */
  const closeModal = () => {
    setIsModalOpen(false)
  }

  if (!siteConfig('ALGOLIA_APP_ID')) {
    return <></>
  }
  
  // 使用 useMemo 优化搜索结果的渲染
  const memoizedSearchResults = useMemo(() => {
    return searchResults.map((result, index) => (
      <SearchResultItem 
        key={result.objectID} 
        result={result} 
        index={index}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
        onJumpSearchResult={onJumpSearchResult}
      />
    ))
  }, [searchResults, activeIndex, setActiveIndex, onJumpSearchResult])

  return (
    <div
      id='search-wrapper'
      className={`${
        isModalOpen ? 'opacity-100' : 'invisible opacity-0 pointer-events-none'
      } z-30 fixed h-screen w-screen left-0 top-0 sm:mt-[10vh] flex items-start justify-center mt-0`}>
      {/* 模态框 */}
      <div
        className={`${
          isModalOpen ? 'opacity-100' : 'invisible opacity-0 translate-y-10'
        } max-h-[80vh] flex flex-col justify-between w-full min-h-[10rem] h-full md:h-fit max-w-2xl lg:max-w-3xl dark:bg-hexo-black-gray dark:border-gray-700 bg-white dark:bg-gray-900 p-6 rounded-xl z-50 shadow-2xl border border-gray-200 dark:border-gray-700 duration-300 transition-all glass-layer-soft`}>
        <div className='flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700'>
          <div className='text-xl font-bold text-gray-800 dark:text-white flex items-center'>
            <i className='fas fa-search text-blue-500 mr-2'></i>
            搜索
          </div>
          <button
            onClick={closeModal}
            className='text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200'>
            <i className='fas fa-times text-base'></i>
          </button>
        </div>

        <div className='relative mb-4'>
          <i className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 fas fa-search'></i>
          <input
            type='text'
            placeholder='在这里输入搜索关键词...'
            onChange={e => handleInputChange(e)}
            onFocus={() => setIsInputFocused(true)} // 聚焦时
            onBlur={() => setIsInputFocused(false)} // 失去焦点时
            className='text-black dark:text-indigo-100 bg-gray-50 dark:bg-gray-800/70 outline-blue-500 w-full px-10 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200'
            ref={inputRef}
          />
        </div>

        {/* 标签组 */}
        <div className='mb-4'>
          <TagGroups />
        </div>
        {searchResults.length === 0 && keyword && !isLoading && (
          <div>
            <p className=' text-slate-600 text-center my-4 text-base'>
              {' '}
              无法找到相关结果
              <span className='font-semibold'>&quot;{keyword}&quot;</span>
            </p>
          </div>
        )}
        <div className='flex-1 overflow-auto max-h-64 md:max-h-80'>
          {searchResults.length > 0 && (
            <ul className='space-y-1'>
              {memoizedSearchResults}
            </ul>
          )}
        </div>
        <div className='mt-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
          <Pagination totalPage={totalPage} page={page} switchPage={switchPage} />
          <div className='flex flex-col sm:flex-row sm:items-center justify-between mt-3 gap-2 sm:gap-0'>
            <div className='flex items-center space-x-3'>
              {totalHit > 0 ? (
                <div className='text-sm text-gray-600 dark:text-gray-400'>
                  共搜索到 <span className='font-semibold text-gray-800 dark:text-indigo-200'>{totalHit}</span> 条结果，用时 <span className='font-semibold text-gray-800 dark:text-indigo-200'>{useTime}</span> 毫秒
                </div>
              ) : (
                <div className='flex items-center space-x-4'>
                  {ShortCutActions.map((action, index) => (
                    <Fragment key={index}>
                      <div className='flex items-center'>
                        <kbd className='px-2 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200'>
                          {action.key}
                        </kbd>
                        <span className='ml-1 text-sm text-gray-600 dark:text-gray-400'>
                          {action.action}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
            <div className='text-xs text-gray-500 dark:text-gray-500 flex items-center'>
              <i className='fa-brands fa-algolia mr-1'></i> <span>Algolia 搜索</span>
            </div>
          </div>
        </div>
      </div>

      {/* 遮罩 */}
      <div
        onClick={closeModal}
        className='z-30 fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm dark:bg-black/40'
      />
    </div>
  )
}

/**
 * 搜索结果项组件
 */
const SearchResultItem = memo(({ result, index, activeIndex, setActiveIndex, onJumpSearchResult }) => {
  const handleClick = useCallback(() => {
    onJumpSearchResult()
  }, [onJumpSearchResult])

  const handleMouseEnter = useCallback(() => {
    setActiveIndex(index)
  }, [setActiveIndex, index])

  return (
    <li
      key={result.objectID}
      onMouseEnter={handleMouseEnter}
      onClick={handleClick}
      className={`cursor-pointer p-3 duration-150 
      rounded-lg transition-all border border-transparent
      ${activeIndex === index 
        ? 'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-300' 
        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50'}`}>
      <a
        className={`block font-medium ${activeIndex === index ? 'text-blue-600 dark:text-blue-300' : 'text-gray-800 dark:text-indigo-100'}`}>
        <div className='flex items-start'>
          <i className={`mr-2 mt-0.5 text-sm ${activeIndex === index ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'} fas fa-file-alt`}></i>
          <span className='truncate flex-1'>{result.title}</span>
        </div>
        {result.summary && (
          <p className='text-sm mt-1 text-gray-600 dark:text-gray-400 truncate pl-6'>
            {result.summary}
          </p>
        )}
      </a>
    </li>
  )
})
SearchResultItem.displayName = 'SearchResultItem'

/**
 * 标签组
 */
function TagGroups() {
  const { tagOptions } = useGlobal()
  //  获取tagOptions数组前十个
  const firstTenTags = tagOptions?.slice(0, 10)

  return (
    <div id='tags-group' className='dark:border-gray-700 space-y-2'>
      {firstTenTags?.map((tag, index) => {
        return (
          <SmartLink
            passHref
            key={index}
            href={`/tag/${encodeURIComponent(tag.name)}`}
            className={'cursor-pointer inline-block whitespace-nowrap'}>
            <div
              className={
                'flex items-center text-gray-700 dark:text-indigo-200 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg px-3 py-1.5 duration-150 transition-all text-sm'
              }>
              <div className='text-lg'>{tag.name} </div>
              {tag.count ? (
                <sup className='relative ml-1'>{tag.count}</sup>
              ) : (
                <></>
              )}
            </div>
          </SmartLink>
        )
      })}
    </div>
  )
}

/**
 * 分页
 * @param {*} param0
 */
function Pagination(props) {
  const { totalPage, page, switchPage } = props
  if (totalPage <= 0) {
    return <></>
  }
  return (
    <div className='flex space-x-1 w-full justify-center py-2'>
      {Array.from({ length: totalPage }, (_, i) => {
        const isActive = page === i;
        const classNames = isActive
          ? 'font-bold text-white bg-blue-600 dark:bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center'
          : 'hover:text-blue-600 hover:font-bold dark:text-indigo-200 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800'

        return (
          <div
            onClick={() => switchPage(i)}
            className={`${classNames} transition-colors duration-200 cursor-pointer`}
            key={i}>
            {i + 1}
          </div>
        )
      })}
    </div>
  )
}
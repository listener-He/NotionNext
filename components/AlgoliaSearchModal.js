import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import algoliasearch from 'algoliasearch/lite' // 优化：使用 lite 版本减少包体积
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  memo,
  useMemo,
  useCallback
} from 'react'
import { useHotkeys } from 'react-hotkeys-hook'

/**
 * 快捷键配置
 */
const SHORTCUTS = [
  { key: '↑ ↓', action: '选择' },
  { key: 'Enter', action: '跳转' },
  { key: 'Esc', action: '关闭' },
  { key: 'Ctrl + K', action: '唤起' }
]

/**
 * Algolia 搜索组件
 */
export default function AlgoliaSearchModal({ cRef }) {
  const router = useRouter()
  const { tagOptions } = useGlobal()

  // -- 状态管理 --
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [debouncedKeyword, setDebouncedKeyword] = useState('') // 用于防抖
  const [searchResults, setSearchResults] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [page, setPage] = useState(0)
  const [totalPage, setTotalPage] = useState(0)
  const [totalHit, setTotalHit] = useState(0)
  const [useTime, setUseTime] = useState(0)

  // -- Refs --
  const inputRef = useRef(null)
  const resultsContainerRef = useRef(null) // 用于滚动控制
  // 会话级缓存 (Session Cache in Memory)
  const searchCache = useRef(new Map())

  // -- 初始化 Algolia Client (Memoized) --
  const searchClient = useMemo(() => {
    const appId = siteConfig('ALGOLIA_APP_ID')
    const apiKey = siteConfig('ALGOLIA_SEARCH_ONLY_APP_KEY')
    if (!appId || !apiKey) return null
    return algoliasearch(appId, apiKey)
  }, [])

  // -- 核心搜索逻辑 --
  const performSearch = useCallback(async (query, pageIndex = 0) => {
    if (!query || !searchClient) {
      setSearchResults([])
      setTotalHit(0)
      return
    }

    const cacheKey = `${query}-${pageIndex}`

    // 1. 检查缓存
    if (searchCache.current.has(cacheKey)) {
      const cached = searchCache.current.get(cacheKey)
      setSearchResults(cached.hits)
      setTotalPage(cached.nbPages)
      setTotalHit(cached.nbHits)
      setUseTime(cached.processingTimeMS)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    try {
      const index = searchClient.initIndex(siteConfig('ALGOLIA_INDEX'))
      const res = await index.search(query, { page: pageIndex, hitsPerPage: 10 })

      const { hits, nbHits, nbPages, processingTimeMS } = res

      // 更新状态
      setSearchResults(hits)
      setTotalPage(nbPages)
      setTotalHit(nbHits)
      setUseTime(processingTimeMS)

      // 2. 写入缓存
      searchCache.current.set(cacheKey, { hits, nbPages, nbHits, processingTimeMS })
      // 防止内存无限增长，保留最近 50 条
      if (searchCache.current.size > 50) {
        const firstKey = searchCache.current.keys().next().value
        searchCache.current.delete(firstKey)
      }
    } catch (err) {
      console.error('Algolia Search Error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [searchClient])

  // -- 防抖 (Debounce) 处理 --
  // 相比 throttle，debounce 更适合输入搜索，用户停止打字后再请求
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword)
    }, 300) // 300ms 延迟
    return () => clearTimeout(timer)
  }, [keyword])

  // 当防抖后的关键词或页码变化时，触发搜索
  useEffect(() => {
    // 重置 activeIndex
    setActiveIndex(0)
    performSearch(debouncedKeyword, page)
  }, [debouncedKeyword, page, performSearch])

  // 重置页码逻辑：当关键词改变时，重置回第一页
  useEffect(() => {
    setPage(0)
  }, [debouncedKeyword])

  // -- 交互逻辑 --

  // 1. 打开/关闭
  const openSearch = () => setIsModalOpen(true)
  const closeModal = () => {
    setIsModalOpen(false)
    // 稍微延迟清空，避免 UI 闪烁
    setTimeout(() => {
      setKeyword('')
      setSearchResults([])
      setPage(0)
    }, 300)
  }

  useImperativeHandle(cRef, () => ({ openSearch }))

  // 2. 路由变化自动关闭
  useEffect(() => {
    setIsModalOpen(false)
  }, [router])

  // 3. 自动聚焦
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isModalOpen])

  // 4. 跳转处理
  const handleJump = useCallback((indexToJump = activeIndex) => {
    const result = searchResults[indexToJump]
    if (result) {
      // 优先使用 slug，没有则用 objectID，结合配置的前缀
      const path = `${siteConfig('SUB_PATH', '')}/${result.slug || result.objectID}`
      router.push(path).then(() => closeModal())
    }
  }, [searchResults, activeIndex, router])

  // -- 快捷键 (Hotkeys) --
  // 合并管理，更清晰
  useHotkeys('ctrl+k, cmd+k', (e) => { e.preventDefault(); setIsModalOpen(true) }, { enableOnFormTags: true })
  useHotkeys('esc', (e) => { if(isModalOpen) { e.preventDefault(); closeModal() } }, { enableOnFormTags: true })
  useHotkeys('enter', (e) => {
    if (isModalOpen && searchResults.length > 0) {
      e.preventDefault()
      handleJump()
    }
  }, { enableOnFormTags: true }, [isModalOpen, searchResults, activeIndex])

  // 键盘导航
  useHotkeys('up', (e) => {
    if (!isModalOpen) return
    e.preventDefault()
    if (activeIndex > 0) setActiveIndex(prev => prev - 1)
  }, { enableOnFormTags: true }, [isModalOpen, activeIndex])

  useHotkeys('down', (e) => {
    if (!isModalOpen) return
    e.preventDefault()
    if (activeIndex < searchResults.length - 1) setActiveIndex(prev => prev + 1)
  }, { enableOnFormTags: true }, [isModalOpen, searchResults, activeIndex])

  // 监听 activeIndex 变化，实现滚动条自动跟随 (Scroll into View)
  useEffect(() => {
    if (!resultsContainerRef.current) return
    const activeItem = resultsContainerRef.current.querySelector(`[data-index="${activeIndex}"]`)
    if (activeItem) {
      activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [activeIndex])

  if (!siteConfig('ALGOLIA_APP_ID')) return null

  // -- 渲染 --
  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-center pt-[10vh] sm:pt-[15vh] transition-all duration-300 ${
        isModalOpen ? 'visible' : 'invisible pointer-events-none'
      }`}
    >
      {/* 遮罩层 (Backdrop) */}
      <div
        className={`absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeModal}
      />

      {/* 主体容器 (Modal) */}
      <div className={`
        relative w-full max-w-2xl mx-4 lg:mx-auto flex flex-col 
        bg-white/90 dark:bg-gray-900/90 
        backdrop-blur-md 
        rounded-2xl shadow-2xl 
        border border-gray-200/50 dark:border-gray-700/50
        overflow-hidden
        transform transition-all duration-300 ease-out
        ${isModalOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'}
      `}>

        {/* 头部搜索框 */}
        <div className="flex items-center p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-center w-10 h-10 text-gray-400 dark:text-gray-500">
            {isLoading ? <Spinner /> : <i className="fas fa-search text-lg"></i>}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="搜索文章、标签..."
            className="flex-1 h-12 bg-transparent text-lg text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none ml-2"
          />
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">ESC</span>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 max-h-[60vh] overflow-y-auto custom-scrollbar" ref={resultsContainerRef}>

          {/* 默认状态：标签云 */}
          {!keyword && (
            <div className="py-2">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">推荐标签</h3>
              <TagGroups tags={tagOptions} />
            </div>
          )}

          {/* 空状态 */}
          {keyword && !isLoading && searchResults.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <i className="fas fa-inbox text-4xl mb-3 opacity-50"></i>
              <p>未找到与 <span className="font-bold text-gray-800 dark:text-gray-200">"{keyword}"</span> 相关的内容</p>
            </div>
          )}

          {/* 搜索结果列表 */}
          {searchResults.length > 0 && (
            <ul className="space-y-1">
              {searchResults.map((hit, index) => (
                <SearchResultItem
                  key={hit.objectID}
                  result={hit}
                  isActive={index === activeIndex}
                  index={index}
                  onSelect={() => setActiveIndex(index)}
                  onClick={() => handleJump(index)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* 底部信息 */}
        {searchResults.length > 0 && (
          <div className="px-4 py-3 bg-gray-50/80 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
            <div className="flex gap-2 items-center mb-2 sm:mb-0">
              <span>找到 {totalHit} 条结果 ({useTime}ms)</span>
              <Pagination totalPage={totalPage} page={page} setPage={setPage} />
            </div>
            <div className="flex items-center gap-3 opacity-70">
              <div className="flex items-center gap-1"><i className="fab fa-algolia"></i> Algolia</div>
              <div className="hidden sm:flex gap-3">
                {SHORTCUTS.slice(0, 2).map(k => (
                  <span key={k.key}><kbd className="font-sans bg-gray-200 dark:bg-gray-700 px-1 rounded mr-1">{k.key}</kbd>{k.action}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * 结果项组件 - 使用 memo 优化渲染
 */
const SearchResultItem = memo(({ result, isActive, index, onSelect, onClick }) => {
  return (
    <li
      data-index={index}
      onMouseEnter={onSelect}
      onClick={onClick}
      className={`
        group flex items-start p-3 rounded-xl cursor-pointer transition-all duration-200
        ${isActive
        ? 'bg-blue-50 dark:bg-blue-900/20 shadow-sm ring-1 ring-blue-500/20'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800/50 transparent'}
      `}
    >
      <div className={`
        mt-1 mr-3 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg
        ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}
      `}>
        <i className="fas fa-file-alt text-sm"></i>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className={`
          text-sm font-medium truncate transition-colors
          ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-800 dark:text-gray-200'}
        `}>
          {/* 如果 Algolia 返回高亮字段，可以在这里解析，暂用 title */}
          {result._highlightResult?.title?.value ? (
            <span dangerouslySetInnerHTML={{ __html: result._highlightResult.title.value }} />
          ) : result.title}
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
          {result.summary || result.description || '暂无描述'}
        </p>
      </div>

      {isActive && (
        <div className="hidden sm:block text-gray-400 ml-2 self-center">
          <i className="fas fa-arrow-right text-xs transform -rotate-45"></i>
        </div>
      )}
    </li>
  )
})
SearchResultItem.displayName = 'SearchResultItem'

/**
 * 标签组
 */
const TagGroups = memo(({ tags }) => {
  if (!tags?.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {tags.slice(0, 10).map((tag, i) => (
        <SmartLink key={i} href={`/tag/${encodeURIComponent(tag.name)}`}>
          <span className="
            inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium
            bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300
            hover:bg-blue-100 hover:text-blue-700 dark:hover:bg-blue-900/30 dark:hover:text-blue-300
            transition-colors duration-200 cursor-pointer border border-transparent hover:border-blue-200 dark:hover:border-blue-800
          ">
            {tag.name}
            {tag.count > 0 && <span className="ml-1.5 opacity-60 text-[10px]">{tag.count}</span>}
          </span>
        </SmartLink>
      ))}
    </div>
  )
})
TagGroups.displayName = 'TagGroups'

/**
 * 简易分页器
 */
const Pagination = ({ totalPage, page, setPage }) => {
  if (totalPage <= 1) return null
  return (
    <div className="flex items-center gap-1 ml-2">
      {Array.from({ length: Math.min(totalPage, 5) }).map((_, i) => (
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`
            w-5 h-5 flex items-center justify-center rounded text-[10px] transition-all
            ${page === i
            ? 'bg-blue-500 text-white shadow-sm'
            : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}
          `}
        >
          {i + 1}
        </button>
      ))}
    </div>
  )
}

/**
 * Loading Spinner
 */
const Spinner = () => (
  <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

import replaceSearchResult from '@/components/Mark'
import NotionPage from '@/components/NotionPage'
import ShareBar from '@/components/ShareBar'
import { siteConfig } from '@/lib/config'
import { useGlobal } from '@/lib/global'
import { isBrowser } from '@/lib/utils'
import { Transition } from '@headlessui/react'
import dynamic from 'next/dynamic'
import SmartLink from '@/components/SmartLink'
import { useRouter } from 'next/router'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import ArticleAdjacent from './components/ArticleAdjacent'
import ArticleCopyright from './components/ArticleCopyright'
import { ArticleLock } from './components/ArticleLock'
import ArticleRecommend from './components/ArticleRecommend'
import BlogPostArchive from './components/BlogPostArchive'
import BlogPostListPage from './components/BlogPostListPage'
import BlogPostListScroll from './components/BlogPostListScroll'
import ButtonJumpToComment from './components/ButtonJumpToComment'
import ButtonRandomPostMini from './components/ButtonRandomPostMini'
import Card from './components/Card'
import Footer from './components/Footer'
import Header from './components/Header'
import Hero from './components/Hero'
import PostHero from './components/PostHero'
import RightFloatArea from './components/RightFloatArea'
import SearchNav from './components/SearchNav'
import SideRight from './components/SideRight'
import SlotBar from './components/SlotBar'
import TagItemMini from './components/TagItemMini'
import TocDrawer from './components/TocDrawer'
import TocDrawerButton from './components/TocDrawerButton'
import CONFIG from './config'
import { Style } from './style'
import LinksPage from './components/LinksPage'
import { getDevicePerformance } from '@/components/PerformanceDetector'
import PerformanceDetector from '@/components/PerformanceDetector'
import Comment from '@/components/Comment'
import ArticleInfo from './components/ArticleInfo'

// 使用 useMemo 优化动态导入
const AlgoliaSearchModal = dynamic(
  () => import('@/components/AlgoliaSearchModal'),
  {
    ssr: false,
    loading: () => <div className="hidden">Loading...</div> // 添加加载状态
  }
)


// 主题全局状态
const ThemeGlobalHexo = createContext()
export const useHexoGlobal = () => useContext(ThemeGlobalHexo)

/**
 * 基础布局 采用左右两侧布局，移动端使用顶部导航栏
 * @param props
 * @returns {JSX.Element}
 * @constructor
 */
const LayoutBase = props => {
  const { post, children, slotTop, className } = props
  const { onLoading, fullWidth } = useGlobal()
  const router = useRouter()
  const showRandomButton = siteConfig('HEXO_MENU_RANDOM', false, CONFIG)
  const homeBannerEnable = siteConfig('HEXO_HOME_BANNER_ENABLE', null, CONFIG)
  const fontStyle = siteConfig('FONT_STYLE')

  // 获取设备性能信息
  const { isLowEndDevice } = getDevicePerformance()

  const drawerRight = useRef(null)
  const tocRef = isBrowser ? document.getElementById('article-wrapper') : null

  // 悬浮按钮内容
  const floatSlot = (
    <>
      {post?.toc?.length > 1 && (
        <div className='block lg:hidden'>
          <TocDrawerButton
            onClick={() => {
              drawerRight?.current?.handleSwitchVisible()
            }}
          />
        </div>
      )}
      {post && <ButtonJumpToComment />}
      {showRandomButton && <ButtonRandomPostMini {...props} />}
    </>
  )

  // Algolia搜索框
  const searchModal = useRef(null)

  return (
    <ThemeGlobalHexo.Provider value={{ searchModal }}>
      <div
        id='theme-hexo'
        className={`${fontStyle} scroll-smooth ${isLowEndDevice ? 'reduce-motion' : ''} bg-day-gradient dark:bg-night-gradient`}>
        <Style />

        {/* 性能检测组件 */}
        <PerformanceDetector />

        {/* 顶部导航 */}
        <Header {...props} />

        {/* 顶部嵌入 - 添加性能优化 */}
        <Transition
          show={!onLoading}
          appear={true}
          enter='transition ease-in-out duration-300 transform order-first'
          enterFrom='opacity-0 -translate-y-4'
          enterTo='opacity-100'
          leave='transition ease-in-out duration-200 transform'
          leaveFrom='opacity-100'
          leaveTo='opacity-0 translate-y-4'
          unmount={false}>
          {post ? (
            <PostHero {...props} />
          ) : router.route === '/' && homeBannerEnable ? (
            <Hero {...props} />
          ) : null}
        </Transition>

        {/* 主区块 */}
        <main
          id='wrapper'
          className={`${homeBannerEnable ? '' : 'pt-16'} w-full py-8 md:px-8 lg:px-24 min-h-screen relative bg-gradient-to-b from-transparent via-gray-50/10 to-transparent dark:via-gray-900/10`}>
          <div
            id='container-inner'
            className={
              (JSON.parse(siteConfig('LAYOUT_SIDEBAR_REVERSE'))
                ? 'flex-row-reverse'
                : '') +
              ' w-full mx-auto lg:flex lg:space-x-4 justify-center relative z-10'
            }>
            <div
              className={`${className || ''} w-full ${fullWidth ? '' : 'max-w-4xl'} h-full overflow-hidden`}>
              <Transition
                show={!onLoading}
                appear={true}
                enter='transition ease-in-out duration-300 transform order-first'
                enterFrom='opacity-0 translate-y-4'
                enterTo='opacity-100'
                leave='transition ease-in-out duration-200 transform'
                leaveFrom='opacity-100 translate-y-0'
                leaveTo='opacity-0 -translate-y-4'
                unmount={false}>
                {/* 主区上部嵌入 */}
                {slotTop}

                {children}
              </Transition>
            </div>

            {/* 右侧栏 - 延迟加载优化 */}
            <SideRight {...props} />
          </div>
        </main>

        <div className='block lg:hidden'>
          <TocDrawer post={post} cRef={drawerRight} targetRef={tocRef} />
        </div>

        {/* 悬浮菜单 */}
        <RightFloatArea floatSlot={floatSlot} />

        {/* 全文搜索 */}
        <AlgoliaSearchModal cRef={searchModal} {...props} />

        {/* 页脚 */}
        <Footer title={siteConfig('TITLE')} />
      </div>
    </ThemeGlobalHexo.Provider>
  )
}


/**
 * 首页
 * 是一个博客列表，嵌入一个Hero大图
 * @param {*} props
 * @returns
 */
const LayoutIndex = props => {
  return <LayoutPostList {...props} className='pt-8' />
}

/**
 * 博客列表
 * @param {*} props
 * @returns
 */
const LayoutPostList = props => {
  return (
    <div className='pt-8'>
      <SlotBar {...props} />
      {siteConfig('POST_LIST_STYLE') === 'page' ? (
        <BlogPostListPage {...props} />
      ) : (
        <BlogPostListScroll {...props} />
      )}
    </div>
  )
}

/**
 * 搜索
 * @param {*} props
 * @returns
 */
const LayoutSearch = props => {
  const { keyword } = props
  const router = useRouter()
  const currentSearch = keyword || router?.query?.s

  useEffect(() => {
    if (currentSearch) {
      replaceSearchResult({
        doms: document.getElementsByClassName('replace'),
        search: keyword,
        target: {
          element: 'span',
          className: 'text-red-500 border-b border-dashed'
        }
      })
    }
  })

  return (
    <div className='pt-8'>
      {!currentSearch ? (
        <SearchNav {...props} />
      ) : (
        <div id='posts-wrapper'>
          {' '}
          {siteConfig('POST_LIST_STYLE') === 'page' ? (
            <BlogPostListPage {...props} />
          ) : (
            <BlogPostListScroll {...props} />
          )}{' '}
        </div>
      )}
    </div>
  )
}

/**
 * 归档
 * @param {*} props
 * @returns
 */
  const LayoutArchive = props => {
  const { archivePosts } = props
  return (
    <div className='pt-8'>
      <Card className='w-full'>
        <div className='mb-md pb-xl bg-day-gradient dark:bg-night-gradient md:p-12 p-sm min-h-full rounded-xl'>
          {Object.keys(archivePosts).map(archiveTitle => (
            <BlogPostArchive
              key={archiveTitle}
              posts={archivePosts[archiveTitle]}
              archiveTitle={archiveTitle}
            />
          ))}
        </div>
      </Card>
    </div>
  )
}

/**
 * 文章详情
 * @param {*} props
 * @returns
 */
const LayoutSlug = props => {
  const { post, lock, validPassword } = props
  const router = useRouter()
  const waiting404 = siteConfig('POST_WAITING_TIME_FOR_404') * 1000
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 检查是否为友情链接页面 - 从路由和post数据中判断
  const isLinksPage = router.asPath === '/links' || router.asPath.startsWith('/links?') ||
                      post?.slug === 'links' || post?.title === '友链' || post?.title === '友情链接'

  useEffect(() => {
    // 404检测 - 但排除友情链接页面
    if (!post && !isLinksPage) {
      const timeoutId = setTimeout(
        () => {
          if (isBrowser) {
            const article = document.querySelector('#article-wrapper #notion-article')
            if (!article) {
              router.push('/404').then(() => {
                console.warn('找不到页面', router.asPath)
              })
            }
          }
        },
        waiting404
      )
      return () => clearTimeout(timeoutId) // 清理定时器
    }
  }, [post, isLinksPage])

  // 如果是友情链接页面，使用特殊的LinksPage组件
  if (isLinksPage) {
    return (
      <>
        <div className='w-full lg:hover:shadow rounded-t-xl lg:rounded-xl lg:px-2 lg:py-4 glass-layer-strong article'>
          {lock && <ArticleLock validPassword={validPassword} />}
          {!lock && <LinksPage post={post || { title: '友情链接', slug: 'links' }} />}
        </div>
      </>
    )
  }

  return (
    <>
      <div className='w-full lg:hover:shadow rounded-t-xl lg:rounded-xl lg:px-2 lg:py-4 glass-layer-strong article'>
        {lock && <ArticleLock validPassword={validPassword} />}

        {!lock && post && (
          <div className='overflow-x-auto flex-grow mx-auto md:w-full md:px-5 '>
            <article
              id='article-wrapper'
              itemScope
              itemType='https://schema.org/Movie'
              className='subpixel-antialiased overflow-y-hidden'>
              {/* 文章信息 - 包含标题、分类、标签、日期、阅读量等 */}
              <section className='px-5 justify-center mx-auto max-w-2xl lg:max-w-full'>
                <ArticleInfo post={post} />
              </section>

              {/* Notion文章主体 */}
              <section className='px-5 justify-center mx-auto max-w-2xl lg:max-w-full'>
                {post && <NotionPage post={post} />}
              </section>

              {/* 分享 - 延迟渲染 */}
              <ShareBar post={post} />
              {post?.type === 'Post' && (
                <>
                  <ArticleCopyright {...props} />
                  <ArticleRecommend {...props} />
                  <ArticleAdjacent {...props} />
                </>
              )}
            </article>

            <div className='pt-4 border-dashed'></div>

            {/* 评论互动 */}
            <div className='duration-200 overflow-x-auto glass-layer-soft px-3 rounded-xl'>
               <Comment frontMatter={post} />
            </div>
          </div>
        )}
      </div>
    </>
  )
}

/**
 * 404
 * @param {*} props
 * @returns
 */
const Layout404 = props => {
  const router = useRouter()
  const { locale } = useGlobal()
  useEffect(() => {
    // 延时3秒如果加载失败就返回首页
    setTimeout(() => {
      if (isBrowser) {
        const article = document.querySelector('#article-wrapper #notion-article')
        if (!article) {
          router.push('/').then(() => {
            // console.log('找不到页面', router.asPath)
          })
        }
      }
    }, 3000)
  })
  return (
    <>
      <div className='text-black w-full h-screen text-center justify-center content-center items-center flex flex-col'>
        <div className='dark:text-gray-200'>
          <h2 className='inline-block border-r-2 border-gray-600 mr-2 px-3 py-2 align-top'>
            404
          </h2>
          <div className='inline-block text-left h-32 leading-10 items-center'>
            <h2 className='m-0 p-0'>{locale.COMMON.NOT_FOUND}</h2>
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * 分类列表
 * @param {*} props
 * @returns
 */
const LayoutCategoryIndex = props => {
  const { categoryOptions } = props
  const { locale } = useGlobal()
  return (
    <div className='mt-8'>
      <Card className='w-full min-h-screen'>
        <div className='dark:text-gray-200 mb-5 mx-3'>
          <i className='mr-4 fas fa-th' /> {locale.COMMON.CATEGORY}:
        </div>
        <div id='category-list' className='duration-200 flex flex-wrap mx-8'>
          {categoryOptions?.map(category => {
            return (
              <SmartLink
                key={category.name}
                href={`/category/${category.name}`}
                passHref
                legacyBehavior>
                <div
                  className={
                    ' duration-300 dark:hover:text-white px-5 cursor-pointer py-2 hover:text-indigo-400'
                  }>
                  <i className='mr-4 fas fa-folder' /> {category.name}(
                  {category.count})
                </div>
              </SmartLink>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

/**
 * 标签列表
 * @param {*} props
 * @returns
 */
const LayoutTagIndex = props => {
  const { tagOptions } = props
  const { locale } = useGlobal()
  return (
    <div className='mt-8'>
      <Card className='w-full'>
        <div className='dark:text-gray-200 mb-5 ml-4'>
          <i className='mr-4 fas fa-tag' /> {locale.COMMON.TAGS}:
        </div>
        <div id='tags-list' className='duration-200 flex flex-wrap ml-8'>
          {tagOptions.map(tag => (
            <div key={tag.name} className='p-2'>
              <TagItemMini key={tag.name} tag={tag} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export {
  Layout404,
  LayoutArchive,
  LayoutBase,
  LayoutCategoryIndex,
  LayoutIndex,
  LayoutPostList,
  LayoutSearch,
  LayoutSlug,
  LayoutTagIndex,
  CONFIG as THEME_CONFIG
}
import BLOG from '@/blog.config'
import useNotification from '@/components/Notification'
import OpenWrite from '@/components/OpenWrite'
import { siteConfig } from '@/lib/config'
import { fetchGlobalAllData, resolvePostProps } from '@/lib/db/SiteDataApi'
import { useGlobal } from '@/lib/global'
import { getPageTableOfContents } from '@/lib/db/notion/getPageTableOfContents'
import { getPasswordQuery } from '@/lib/utils/password'
import { checkSlugHasMorThanTwoSlash, checkSlugHasNoSlash, processPostData } from '@/lib/utils/post'
import { DynamicLayout } from '@/themes/theme'
import md5 from 'js-md5'
import { useRouter } from 'next/router'
import { idToUuid } from 'notion-utils'
import { useEffect, useState } from 'react'
import { calculatePostCacheTime } from '@/lib/cache/cache_coefficient'

/**
 * 根据notion的slug访问页面
 * 只解析一级目录例如 /about
 * @param {*} props
 * @returns
 */
const Slug = props => {
  const { post } = props
  const router = useRouter()
  const { locale } = useGlobal()

  // 文章锁🔐
  const [lock, setLock] = useState(post?.password && post?.password !== '')
  const { showNotification, Notification } = useNotification()

  /**
   * 验证文章密码
   * @param {*} passInput
   */
  const validPassword = passInput => {
    if (!post) {
      return false
    }
    const encrypt = md5(post?.slug + passInput)
    if (passInput && encrypt === post?.password) {
      setLock(false)
      // 输入密码存入localStorage，下次自动提交
      localStorage.setItem('password_' + router.asPath, passInput)
      showNotification(locale.COMMON.ARTICLE_UNLOCK_TIPS) // 设置解锁成功提示显示
      return true
    }
    return false
  }

  // 文章加载
  useEffect(() => {
    // 文章加密
    if (post?.password && post?.password !== '') {
      setLock(true)
    } else {
      setLock(false)
    }

    // 读取上次记录 自动提交密码
    const passInputs = getPasswordQuery(router.asPath)
    if (passInputs.length > 0) {
      for (const passInput of passInputs) {
        if (validPassword(passInput)) {
          break // 密码验证成功，停止尝试
        }
      }
    }
  }, [post])

  // 文章加载
  useEffect(() => {
    if (lock) {
      return
    }
    // 文章解锁后生成目录与内容
    if (post?.blockMap?.block) {
      post.content = Object.keys(post.blockMap.block).filter(
        key => post.blockMap.block[key]?.value?.parent_id === post.id
      )
      post.toc = getPageTableOfContents(post, post.blockMap)
    }
  }, [router, lock])


  props = { ...props, lock, validPassword }

  const theme = siteConfig('THEME', BLOG.THEME, props.NOTION_CONFIG)
  return (
    <>
      {/* 文章布局 */}
      <DynamicLayout theme={theme} layoutName='LayoutSlug' {...props} />
      {/* 解锁密码提示框 */}
      {post?.password && post?.password !== '' && !lock && <Notification />}
      {/* 导流工具 */}
      <OpenWrite />
    </>
  )
}

export async function getStaticPaths() {
  if (!BLOG.isProd) {
    return {
      paths: [],
      fallback: true
    }
  }

  const from = 'slug-paths'
  const { allPages } = await fetchGlobalAllData({ from })
  // 优化：只获取路径生成需要的数据类型
  // const { allPages } = await getGlobalData({
  //   from,
  //   dataTypes: ['allPages']
  // })
  const paths = allPages
    ?.filter(row => checkSlugHasNoSlash(row))
    .map(row => ({ params: { prefix: row.slug } }))
  return {
    paths: paths,
    fallback: true
  }
}

export async function getStaticProps({ params: { prefix }, locale }) {

  let fullSlug = prefix
  const from = `slug-props-${fullSlug}`
  // 优化：只获取文章页需要的数据类型
  // const props = await getGlobalData({
  //   from,
  //   locale,
  //   dataTypes: ['allPages', 'NOTION_CONFIG', 'siteInfo', 'latestPosts']
  // })
  const props = await resolvePostProps({
    prefix,
    locale,
  })
  if (siteConfig('PSEUDO_STATIC', false, props.NOTION_CONFIG)) {
    if (!fullSlug.endsWith('.html')) {
      fullSlug += '.html'
    }
  }

  // 在列表内查找文章
  // 添加额外检查确保 allPages 存在且为数组
  if (Array.isArray(props?.allPages)) {
    props.post = props.allPages.find(p => {
      return (
        p.type.indexOf('Menu') < 0 &&
        (p.slug === prefix || p.id === idToUuid(prefix))
      )
    })
  } else {
    props.post = null
  }

  // 处理非列表内文章的内信息
  if (!props?.post) {
    const pageId = prefix
    if (pageId.length >= 32) {
      const post = await getPost(pageId)
      props.post = post
    }
  }
  if (!props?.post) {
    // 无法获取文章
    props.post = null
  } else {
    // 确保在处理文章数据前 allPages 是有效数组
    if (!Array.isArray(props.allPages)) {
      props.allPages = []
    }
    await processPostData(props, from)
  }

  // 确保 prev 和 next 不是 undefined，防止序列化错误
  if (!props.prev) {
    props.prev = null
  }
  if (!props.next) {
    props.next = null
  }

  // 计算文章缓存时间
  let revalidate = process.env.EXPORT
    ? undefined
    : siteConfig(
        'NEXT_REVALIDATE_SECOND',
        BLOG.NEXT_REVALIDATE_SECOND,
        props.NOTION_CONFIG
      )

  // 如果是文章页面，根据最后更新时间计算缓存时间
  if (props?.post?.lastEditedDate) {
    const lastEditedTimestamp = new Date(props.post.lastEditedDate).getTime()
    revalidate = calculatePostCacheTime(BLOG.NEXT_REVALIDATE_SECOND, lastEditedTimestamp)
  }

  delete props.allPages
  delete props.allNavPages
  delete props.tagOptions

  return {
    props,
    revalidate
  }
}

export default Slug

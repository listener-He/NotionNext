import Link from 'next/link'
import LazyImage from '@/components/LazyImage'
import Comment from '@/components/Comment'
import { getTextContent } from 'notion-utils'
import { siteConfig } from '@/lib/config'

// 友情链接缓存
let linksCache = null
let cacheTimestamp = 0
const CACHE_DURATION = 3 * 60 * 60 * 1000 // 3小时

// 全局标签颜色映射，确保相同标签使用相同颜色
const tagColorMap = new Map()
const tagColors = [
  'bg-gradient-to-r from-blue-500 to-blue-600 text-white',
  'bg-gradient-to-r from-purple-500 to-purple-600 text-white',
  'bg-gradient-to-r from-pink-500 to-pink-600 text-white',
  'bg-gradient-to-r from-green-500 to-green-600 text-white',
  'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white',
  'bg-gradient-to-r from-red-500 to-red-600 text-white',
  'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white',
  'bg-gradient-to-r from-teal-500 to-teal-600 text-white',
  'bg-gradient-to-r from-orange-500 to-orange-600 text-white',
  'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white',
  'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white',
  'bg-gradient-to-r from-violet-500 to-violet-600 text-white'
]

/**
 * 获取标签颜色，确保相同标签使用相同颜色
 * @param {string} tagName - 标签名称
 * @returns {string} 颜色类名
 */
const getTagColor = (tagName) => {
  if (tagColorMap.has(tagName)) {
    return tagColorMap.get(tagName)
  }

  const hash = tagName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)

  const colorClass = tagColors[Math.abs(hash) % tagColors.length]
  tagColorMap.set(tagName, colorClass)
  return colorClass
}

/**
 * 从Notion页面中提取友情链接数据
 * @param {Object} post - Notion页面数据
 * @returns {Array} 友情链接数组
 */
const extractLinksFromNotionPage = (post) => {
  // 检查缓存
  const now = Date.now()
  if (linksCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return linksCache
  }

  if (!post?.blockMap) {
    return []
  }

  const { block: blocks, collection } = post.blockMap
  const links = []

  if (!blocks) {
    return []
  }

  // 查找页面中的collection_view块
  Object.values(blocks).forEach(blockWrapper => {
    const block = blockWrapper?.value
    if (!block) return

    if (block.type === 'collection_view' || block.type === 'collection_view_page') {
      const collectionId = block.collection_id
      const collectionData = collection?.[collectionId]?.value

      if (collectionData && collectionData.schema) {
        const schema = collectionData.schema

        // 查找collection中的所有记录
        Object.values(blocks).forEach(recordWrapper => {
          const record = recordWrapper?.value
          if (!record) return

          // 检查是否是collection的子项
          if (record.parent_id === collectionId && record.type === 'page') {
            const properties = record.properties || {}
            const link = {
              id: record.id
            }

            // 从属性中解析字段
            Object.entries(schema).forEach(([schemaKey, schemaValue]) => {
              const fieldName = schemaValue.name?.toLowerCase() || ''
              const fieldType = schemaValue.type
              const propertyValue = properties[schemaKey]

              if (propertyValue) {
                try {
                  switch (fieldType) {
                    case 'title':
                      link.name = getTextContent(propertyValue)
                      break

                    case 'multi_select':
                      if (fieldName.includes('tag') || fieldName.includes('标签') || fieldName.includes('分类')) {
                        if (Array.isArray(propertyValue)) {
                          link.tags = propertyValue.map(tag => tag[0]).filter(Boolean)
                        }
                      }
                      break

                    case 'select':
                      if (fieldName.includes('tag') || fieldName.includes('标签') || fieldName.includes('分类')) {
                        if (propertyValue[0]) {
                          link.tags = [propertyValue[0][0]]
                        }
                      }
                      break

                    case 'rich_text':
                    case 'text':
                      const textContent = getTextContent(propertyValue)
                      if (fieldName.includes('avatar') || fieldName.includes('头像')) {
                        link.avatar = textContent
                      } else if (fieldName.includes('tag') || fieldName.includes('标签') || fieldName.includes('分类')) {
                        // 支持逗号分隔的标签
                        if (textContent && textContent.trim()) {
                          link.tags = textContent.split(',').map(tag => tag.trim()).filter(Boolean)
                        }
                      } else if (fieldName.includes('summary') || fieldName.includes('摘要') || fieldName.includes('简介')) {
                        link.summary = textContent
                      } else if (fieldName.includes('description') || fieldName.includes('描述') || fieldName.includes('介绍')) {
                        link.description = textContent
                      } else if (fieldName.includes('url') || fieldName.includes('link') || fieldName.includes('链接') || fieldName.includes('地址') || fieldName.includes('网址')) {
                        link.url = textContent
                      }
                      break
                    case 'url':
                      if (fieldName.includes('url') || fieldName.includes('link') || fieldName.includes('链接') || fieldName.includes('地址') || fieldName.includes('网址')) {
                        link.url = getTextContent(propertyValue)
                      }
                      break
                  }
                } catch (error) {
                  console.warn('解析字段时出错:', fieldName, error)
                }
              }
            })

            // 头像降级逻辑：优先使用avatar属性，否则使用内容图片
            if (!link.avatar) {
              const pageBlocks = Object.values(blocks).filter(b =>
                b?.value?.parent_id === record.id && b?.value?.type === 'image'
              )

              if (pageBlocks.length > 0) {
                const imageBlock = pageBlocks[0].value
                if (imageBlock.properties?.source) {
                  link.avatar = imageBlock.properties.source[0][0]
                }
              }
            }

            // 从页面封面中提取背景图
            if (record.format?.page_cover) {
              link.cover = record.format.page_cover
            }

            // 确保必要字段存在
            if (link.name && link.url) {
              // 设置默认头像
              if (!link.avatar) {
                link.avatar = '/avatar.png'
              }

              // 校验头像URL格式
              if (link.avatar && !link.avatar.startsWith('http')) {
                if (link.avatar.startsWith('/')) {
                  link.avatar = link.avatar
                } else {
                  link.avatar = 'https://' + link.avatar
                }
              }

              // 设置描述优先级
              link.description = link.summary || link.description || '暂无介绍'

              // 确保tags数组存在
              if (!link.tags) {
                link.tags = []
              }

              // 设置背景图优先级
              if (link.cover && !link.cover.includes('notion-static.com/page-cover')) {
                link.backgroundImage = link.cover
              } else if (link.avatar) {
                link.backgroundImage = link.avatar
              }

              // 校验URL格式
              if (!link.url.startsWith('http')) {
                link.url = 'https://' + link.url
              }

              // 兜底处理：额外检查所有标签是否包含分隔符，如果有则重新分割
              if (link.tags && link.tags.length > 0) {
                const processedTags = []
                link.tags.forEach(tag => {
                  if (typeof tag === 'string' && (tag.includes(',') || tag.includes('，'))) {
                    // 如果标签包含逗号，则分割
                    const splitTags = tag.split(/[,，]/).map(t => t.trim()).filter(Boolean)
                    processedTags.push(...splitTags)
                  } else {
                    processedTags.push(tag)
                  }
                })
                link.tags = [...new Set(processedTags)] // 去重
              }

              links.push(link)
            }
          }
        })
      }
    }
  })

  // 更新缓存
  linksCache = links
  cacheTimestamp = Date.now()

  return links
}

/**
 * 友链页面组件
 * @param {Object} props - 组件属性
 * @returns {JSX.Element}
 */
const LinksPage = ({ post }) => {
  // 直接计算链接数据，避免状态管理导致的水合错误
  const links = post ? extractLinksFromNotionPage(post) : []

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900' id='article-wrapper'>
      <div className='max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8'>
        {/* 页面标题 */}
        <div className='text-center py-8 sm:py-12 lg:py-16 mb-8 sm:mb-12'>
          <div className='relative'>
            {/* 标题背景装饰 */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl'></div>
            </div>

            <h1 className='relative text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-200 bg-clip-text text-transparent mb-3 sm:mb-4'>
              友情链接
            </h1>
            <p className='relative text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-4'>
              发现更多优秀的博客和网站，一起分享知识与创意。
            </p>
          </div>
        </div>

        {links.length === 0 ? (
          <div className='text-center py-20'>
            <div className='text-gray-500 dark:text-gray-400 text-xl mb-4'>
              暂无友情链接
            </div>
            <p className='text-gray-400 dark:text-gray-500'>
              欢迎添加友链，一起分享知识与创意
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8'>
            {links.map((link, index) => (
              <Link key={link.id || index} href={link.url} passHref legacyBehavior>
                <a
                   target='_blank'
                   rel='noopener noreferrer'
                   className='group block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-[1.05] bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600'
                   style={{
                     animation: `fadeInUp 0.6s ease-out ${index * 0.08}s both`
                   }}
                 >
                   {/* 背景装饰层 */}
                   <div className='absolute inset-0 bg-gradient-to-br from-blue-50/50 via-purple-50/30 to-pink-50/50 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-pink-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />

                   {/* 卡片内容 - 左右布局 */}
                   <div className='relative flex items-stretch min-h-[96px]'>
                     {/* 右侧内容区域背景层 - 完整覆盖 */}
                     <div className='absolute inset-0 rounded-2xl overflow-hidden'
                          style={{
                            background: link.cover ? `url(${link.cover})` :
                                       link.avatar ? `url(${link.avatar})` :
                                       'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                          }}>
                       {/* 内容遮罩层 - 确保文字可读性 */}
                       <div className='absolute inset-0 bg-white/85 dark:bg-gray-800/85 backdrop-blur-sm' />
                     </div>

                     {/* 左侧图片区域 - 3.5份宽度，左直线右圆弧 */}
                     <div className='flex-shrink-0 w-[35%] relative z-10 overflow-hidden'
                          style={{
                            clipPath: 'polygon(0 0, calc(100% - 20px) 0, 100% 50%, calc(100% - 20px) 100%, 0 100%)'
                          }}>
                       {/* 图片优先级：封面图 > 头像 > 默认渐变 */}
                       {link.backgroundImage ? (
                         <LazyImage
                           src={link.backgroundImage}
                           alt={link.name}
                           className='absolute inset-0 w-full h-full object-cover'
                           onError={(e) => {
                             e.target.src = '/avatar.png'
                           }}
                         />
                       ) : link.avatar ? (
                         <LazyImage
                           src={link.avatar}
                           alt={link.name}
                           className='absolute inset-0 w-full h-full object-cover'
                           onError={(e) => {
                             e.target.src = '/avatar.png'
                           }}
                         />
                       ) : (
                         <div className='absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500' />
                       )}
                     </div>

                     {/* 右侧内容区域 - 6.5份宽度 */}
                     <div className='flex-1 relative z-10 p-4 flex flex-col justify-center min-w-0'>
                       <div className='relative z-10'>
                       {/* 站点名称 */}
                       <h3 className='text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300 line-clamp-1'>
                         {link.name}
                       </h3>

                       {/* 描述 */}
                       <p className='text-gray-600 dark:text-gray-400 text-xs leading-relaxed line-clamp-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300 mb-3'>
                         {link.summary || link.description}
                       </p>

                       {/* 标签区域 - 单行显示 */}
                       {link.tags && link.tags.length > 0 && (
                         <div className='flex items-center gap-1.5 overflow-hidden'>
                           {link.tags.slice(0, 6).map((tag, tagIndex) => {
                             const colorClass = getTagColor(tag);
                             return (
                               <span
                                 key={tagIndex}
                                 className={`px-2 py-0.5 text-xs font-medium rounded-md shadow-sm flex-shrink-0 ${colorClass}`}
                               >
                                 {tag}
                               </span>
                             );
                           })}
                           {link.tags.length > 6 && (
                             <span className='px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md shadow-sm flex-shrink-0'>
                               +{link.tags.length - 6}
                             </span>
                           )}
                         </div>
                       )}
                       </div>
                     </div>
                   </div>
                 </a>
              </Link>
            ))}
          </div>
        )}

        {/* 申请条件和规范说明 */}
        <div className='bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-12 mb-8 border border-gray-150 dark:border-gray-700'>
          <h2 className='text-2xl font-bold text-gray-800 dark:text-white mb-6 pb-2 border-b border-gray-200 dark:border-gray-700'>申请友链</h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* 申请条件 */}
            <div>
              <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center'>
                <svg className='w-6 h-6 mr-2 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'></path>
                </svg>
                申请条件
              </h3>
              <ul className='space-y-3'>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <span className='text-gray-700 dark:text-gray-300 text-base leading-relaxed'>网站内容符合中国大陆法律法规</span>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <span className='text-gray-700 dark:text-gray-300 text-base leading-relaxed'>原创内容占比较高，有自己的独特见解</span>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <span className='text-gray-700 dark:text-gray-300 text-base leading-relaxed'>网站稳定运行，有一定的更新频率</span>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <span className='text-gray-700 dark:text-gray-300 text-base leading-relaxed'>网站设计美观，内容质量较高</span>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <span className='text-gray-700 dark:text-gray-300 text-base leading-relaxed'>如果您满足这些条件，并愿意与本站建立友链，请在评论区留下贵站信息。我期待与您建立友好的互联网连接！如果暂时不符合条件，我会通过邮件或留言通知您，并期待未来有机会交朋友！</span>
                </li>
              </ul>
            </div>

            {/* 申请规范 */}
            <div>
              <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center'>
                <svg className='w-6 h-6 mr-2 text-blue-500' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z'></path>
                </svg>
                申请规范
              </h3>
              <ul className='space-y-3'>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <div>
                    <span className='text-gray-700 dark:text-gray-300 text-base'>网站名称：</span>
                    <span className='text-gray-900 dark:text-white text-base font-medium'>{siteConfig('TITLE') || siteConfig('AUTHOR') || 'Honesty'}</span>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <div>
                    <span className='text-gray-700 dark:text-gray-300 text-base'>网站链接：</span>
                    <span className='text-gray-900 dark:text-white text-base font-medium'>{siteConfig('LINK') || 'https://www.hehouhui.cn'}</span>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <div>
                    <span className='text-gray-700 dark:text-gray-300 text-base'>网站描述：</span>
                    <span className='text-gray-900 dark:text-white text-base font-medium'>{siteConfig('BIO') || '请提供一句简洁的介绍'}</span>
                  </div>
                </li>
                <li className='flex items-start'>
                  <span className='text-blue-500 mr-2 mt-1'>•</span>
                  <div>
                    <span className='text-gray-700 dark:text-gray-300 text-base'>头像地址：</span>
                    <span className='text-gray-900 dark:text-white text-base font-medium'>https://www.hehouhui.cn/images/avatar.jpeg</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center'>
            <p className='text-gray-600 dark:text-gray-400 text-base'>
              请在下方评论区按照上述规范提交友链申请，我会尽快审核并与您互换链接。
            </p>
          </div>
        </div>

        {/* 评论区域 */}
        <div className='mt-12 sm:mt-16 lg:mt-20 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8'>
          <Comment frontMatter={post} />
        </div>
      </div>

      {/* CSS动画定义 */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* 自定义滚动条 */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </div>
  )
}

export default LinksPage

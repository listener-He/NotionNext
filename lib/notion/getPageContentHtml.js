import { getTextContent } from 'notion-utils'
import { mapImgUrl } from './mapImage'

/**
 * 将Notion页面内容转换为HTML格式
 * @param {*} post 
 * @param {*} pageBlockMap 
 * @returns {string} HTML字符串
 */
export function getPageContentHtml(post, pageBlockMap) {
  if (!post?.content || !pageBlockMap) {
    return ''
  }

  const postId = post.id
  const htmlParts = []

  // 遍历页面内容
  for (const blockId of post.content) {
    const html = getBlockContentHtml(blockId)
    if (html) {
      htmlParts.push(html)
    }
  }

  return htmlParts.join('<br/>')

  /**
   * 将单个block转换为HTML
   * @param {string} id 
   * @returns {string}
   */
  function getBlockContentHtml(id) {
    const block = pageBlockMap?.block[id]?.value
    if (!block) {
      return ''
    }

    const blockType = block.type
    const properties = block.properties || {}
    
    switch (blockType) {
      case 'text':
        return `<p>${getTextHtml(properties.title)}</p>`
      
      case 'header':
        return `<h1>${getTextHtml(properties.title)}</h1>`
      
      case 'sub_header':
        return `<h2>${getTextHtml(properties.title)}</h2>`
      
      case 'sub_sub_header':
        return `<h3>${getTextHtml(properties.title)}</h3>`
      
      case 'bulleted_list':
      case 'numbered_list':
        const listTag = blockType === 'numbered_list' ? 'ol' : 'ul'
        const listItems = getListItems(block)
        return `<${listTag}>${listItems}</${listTag}>`
      
      case 'quote':
        return `<blockquote>${getTextHtml(properties.title)}</blockquote>`
      
      case 'callout':
        return `<div class="callout">${getTextHtml(properties.title)}</div>`
      
      case 'code':
        const language = properties.language?.[0]?.[0] || 'text'
        const code = getTextHtml(properties.title)
        return `<pre><code class="language-${language}">${escapeHtml(code)}</code></pre>`
      
      case 'image':
        const imageUrl = getImageUrl(block)
        const caption = properties.caption ? getTextHtml(properties.caption) : ''
        return `<figure><img src="${imageUrl}" alt="${caption}" />${caption ? `<figcaption>${caption}</figcaption>` : ''}</figure>`
      
      case 'divider':
        return '<hr />'
      
      case 'bookmark':
        const bookmarkUrl = properties.link?.[0]?.[0] || ''
        const bookmarkTitle = properties.title ? getTextHtml(properties.title) : bookmarkUrl
        const bookmarkDescription = properties.description ? getTextHtml(properties.description) : ''
        return `<div class="bookmark"><a href="${bookmarkUrl}" target="_blank"><h4>${bookmarkTitle}</h4>${bookmarkDescription ? `<p>${bookmarkDescription}</p>` : ''}</a></div>`
      
      case 'equation':
        const equation = properties.title?.[0]?.[0] || ''
        return `<div class="equation">$$${equation}$$</div>`
      
      case 'table':
        return getTableHtml(block)
      
      case 'toggle':
        const toggleTitle = getTextHtml(properties.title)
        const toggleContent = getChildrenHtml(block)
        return `<details><summary>${toggleTitle}</summary>${toggleContent}</details>`
      
      case 'column_list':
        const columns = getChildrenHtml(block)
        return `<div class="columns">${columns}</div>`
      
      case 'column':
        const columnContent = getChildrenHtml(block)
        return `<div class="column">${columnContent}</div>`
      
      case 'page':
        if (id !== postId) {
          const pageTitle = getTextHtml(properties.title)
          return `<a href="/${id}">${pageTitle}</a>`
        }
        return ''
      
      case 'breadcrumb':
      case 'external_object_instance':
        return ''
      
      default:
        // 对于未处理的类型，尝试获取title属性
        if (properties.title) {
          return `<p>${getTextHtml(properties.title)}</p>`
        }
        return ''
    }
  }

  /**
   * 获取子元素的HTML
   * @param {*} block 
   * @returns {string}
   */
  function getChildrenHtml(block) {
    if (!block.content || !Array.isArray(block.content)) {
      return ''
    }
    
    const childrenHtml = []
    for (const childId of block.content) {
      const childHtml = getBlockContentHtml(childId)
      if (childHtml) {
        childrenHtml.push(childHtml)
      }
    }
    
    return childrenHtml.join('\n')
  }

  /**
   * 获取列表项HTML
   * @param {*} block 
   * @returns {string}
   */
  function getListItems(block) {
    const title = getTextHtml(block.properties?.title)
    let html = `<li>${title}</li>`
    
    // 处理嵌套列表项
    if (block.content && Array.isArray(block.content)) {
      for (const childId of block.content) {
        const childBlock = pageBlockMap?.block[childId]?.value
        if (childBlock && (childBlock.type === 'bulleted_list' || childBlock.type === 'numbered_list')) {
          html += getListItems(childBlock)
        }
      }
    }
    
    return html
  }

  /**
   * 获取表格HTML
   * @param {*} block 
   * @returns {string}
   */
  function getTableHtml(block) {
    if (!block.content || !Array.isArray(block.content)) {
      return ''
    }
    
    const rows = []
    let isFirstRow = true
    
    for (const rowId of block.content) {
      const rowBlock = pageBlockMap?.block[rowId]?.value
      if (rowBlock && rowBlock.type === 'table_row') {
        const cells = []
        const cellTag = isFirstRow ? 'th' : 'td'
        
        if (rowBlock.properties) {
          // 表格行的属性是按列索引存储的
          const cellKeys = Object.keys(rowBlock.properties).sort()
          for (const key of cellKeys) {
            const cellContent = getTextHtml(rowBlock.properties[key])
            cells.push(`<${cellTag}>${cellContent}</${cellTag}>`)
          }
        }
        
        rows.push(`<tr>${cells.join('')}</tr>`)
        isFirstRow = false
      }
    }
    
    return `<table>${rows.join('')}</table>`
  }

  /**
   * 将Notion富文本转换为HTML
   * @param {*} textArray 
   * @returns {string}
   */
  function getTextHtml(textArray) {
    if (!textArray || !Array.isArray(textArray)) {
      return ''
    }
    
    return textArray.map(item => {
      if (!Array.isArray(item) || item.length < 1) {
        return ''
      }
      
      let text = item[0] || ''
      const formatting = item[1] || []
      
      // 处理特殊字符
      if (text === '⁍') {
        // 检查是否有公式
        const equation = formatting?.find(d => d[0] === 'e')
        if (equation) {
          return `$${equation[1]}$` // 内联公式
        }
        return ''
      }
      
      // 转义HTML字符
      text = escapeHtml(text)
      
      // 应用格式化
      for (const format of formatting) {
        if (!Array.isArray(format) || format.length < 1) continue
        
        const formatType = format[0]
        const formatValue = format[1]
        
        switch (formatType) {
          case 'b': // 粗体
            text = `<strong>${text}</strong>`
            break
          case 'i': // 斜体
            text = `<em>${text}</em>`
            break
          case 's': // 删除线
            text = `<del>${text}</del>`
            break
          case 'c': // 代码
            text = `<code>${text}</code>`
            break
          case 'a': // 链接
            text = `<a href="${formatValue}" target="_blank">${text}</a>`
            break
          case 'h': // 高亮
            text = `<mark>${text}</mark>`
            break
          // 颜色格式
          case '_': // 下划线
            text = `<u>${text}</u>`
            break
        }
      }
      
      return text
    }).join('')
  }

  /**
   * 获取图片URL
   * @param {*} block 
   * @returns {string}
   */
  function getImageUrl(block) {
    const imageUrl = block.properties?.source?.[0]?.[0] ||
                   block.format?.display_source ||
                   ''
    
    if (imageUrl) {
      try {
        return mapImgUrl(imageUrl, block)
      } catch (error) {
        return imageUrl
      }
    }
    
    return ''
  }

  /**
   * 转义HTML字符
   * @param {string} text 
   * @returns {string}
   */
  function escapeHtml(text) {
    const htmlEscapes = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }
    
    return text.replace(/[&<>"']/g, match => htmlEscapes[match])
  }
}
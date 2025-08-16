import { getTextContent } from 'notion-utils'
import { mapImgUrl } from './mapImage'

/**
 * 将Notion页面内容转换为Markdown格式
 * @param {*} post 
 * @param {*} pageBlockMap 
 * @returns {string} Markdown字符串
 */
export function getPageContentMarkdown(post, pageBlockMap) {
  if (!post?.content || !pageBlockMap) {
    return ''
  }

  const postId = post.id
  const markdownParts = []

  // 遍历页面内容
  for (const blockId of post.content) {
    const markdown = getBlockContentMarkdown(blockId)
    if (markdown) {
      markdownParts.push(markdown)
    }
  }

  return markdownParts.join('\n\n')

  /**
   * 将单个block转换为Markdown
   * @param {string} id 
   * @returns {string}
   */
  function getBlockContentMarkdown(id) {
    const block = pageBlockMap?.block[id]?.value
    if (!block) {
      return ''
    }

    const blockType = block.type
    const properties = block.properties || {}
    
    switch (blockType) {
      case 'text':
        return getTextMarkdown(properties.title)
      
      case 'header':
        return `# ${getTextMarkdown(properties.title)}`
      
      case 'sub_header':
        return `## ${getTextMarkdown(properties.title)}`
      
      case 'sub_sub_header':
        return `### ${getTextMarkdown(properties.title)}`
      
      case 'bulleted_list':
        return `- ${getTextMarkdown(properties.title)}${getChildrenMarkdown(block, '  ')}`
      
      case 'numbered_list':
        return `1. ${getTextMarkdown(properties.title)}${getChildrenMarkdown(block, '   ')}`
      
      case 'quote':
        return `> ${getTextMarkdown(properties.title)}`
      
      case 'callout':
        const calloutIcon = block.format?.page_icon || '💡'
        return `> ${calloutIcon} ${getTextMarkdown(properties.title)}`
      
      case 'code':
        const language = properties.language?.[0]?.[0] || ''
        const code = getTextMarkdown(properties.title, false) // 不应用格式化到代码内容
        return `\`\`\`${language}\n${code}\n\n\`\`\``
      case 'image':
        const imageUrl = getImageUrl(block)
        const caption = properties.caption ? getTextMarkdown(properties.caption) : ''
        return `![${caption}](${imageUrl})`
      
      case 'divider':
        return '---'
      
      case 'bookmark':
        const bookmarkUrl = properties.link?.[0]?.[0] || ''
        const bookmarkTitle = properties.title ? getTextMarkdown(properties.title) : bookmarkUrl
        const bookmarkDescription = properties.description ? getTextMarkdown(properties.description) : ''
        return `[${bookmarkTitle}](${bookmarkUrl})${bookmarkDescription ? `\n\n${bookmarkDescription}` : ''}`
      
      case 'equation':
        const equation = properties.title?.[0]?.[0] || ''
        return `$$${equation}$$`
      
      case 'table':
        return getTableMarkdown(block)
      
      case 'toggle':
        const toggleTitle = getTextMarkdown(properties.title)
        const toggleContent = getChildrenMarkdown(block)
        return `<details>\n<summary>\n${toggleTitle}\n</summary>\n${toggleContent}\n</details>`
      
      case 'column_list':
        // Markdown不直接支持列，使用HTML
        const columns = getChildrenMarkdown(block)
        return `<div style="display: flex;">\n${columns}\n</div>`
      
      case 'column':
        const columnContent = getChildrenMarkdown(block)
        return `<div style="flex: 1; margin-right: 1rem;">\n${columnContent}\n</div>`
      
      case 'page':
        if (id !== postId) {
          const pageTitle = getTextMarkdown(properties.title)
          return `[${pageTitle}](/${id})`
        }
        return ''
      
      case 'breadcrumb':
      case 'external_object_instance':
        return ''
      
      default:
        // 对于未处理的类型，尝试获取title属性
        if (properties.title) {
          return getTextMarkdown(properties.title)
        }
        return ''
    }
  }

  /**
   * 获取子元素的Markdown
   * @param {*} block 
   * @param {string} indent 缩进字符串
   * @returns {string}
   */
  function getChildrenMarkdown(block, indent = '') {
    if (!block.content || !Array.isArray(block.content)) {
      return ''
    }
    
    const childrenMarkdown = []
    for (const childId of block.content) {
      const childMarkdown = getBlockContentMarkdown(childId)
      if (childMarkdown) {
        // 为子内容添加缩进
        const indentedMarkdown = childMarkdown.split('\n').map(line => 
          line.trim() ? indent + line : line
        ).join('\n')
        childrenMarkdown.push(indentedMarkdown)
      }
    }
    
    return childrenMarkdown.length > 0 ? '\n' + childrenMarkdown.join('\n\n') : ''
  }

  /**
   * 获取表格Markdown
   * @param {*} block 
   * @returns {string}
   */
  function getTableMarkdown(block) {
    if (!block.content || !Array.isArray(block.content)) {
      return ''
    }
    
    const rows = []
    let isFirstRow = true
    let columnCount = 0
    
    for (const rowId of block.content) {
      const rowBlock = pageBlockMap?.block[rowId]?.value
      if (rowBlock && rowBlock.type === 'table_row') {
        const cells = []
        
        if (rowBlock.properties) {
          // 表格行的属性是按列索引存储的
          const cellKeys = Object.keys(rowBlock.properties).sort()
          columnCount = Math.max(columnCount, cellKeys.length)
          
          for (const key of cellKeys) {
            const cellContent = getTextMarkdown(rowBlock.properties[key])
            cells.push(cellContent || ' ')
          }
        }
        
        rows.push(`| ${cells.join(' | ')} |`)
        
        // 添加表头分隔符
        if (isFirstRow) {
          const separator = Array(columnCount).fill('---').join(' | ')
          rows.push(`| ${separator} |`)
          isFirstRow = false
        }
      }
    }
    
    return rows.join('\n')
  }

  /**
   * 将Notion富文本转换为Markdown
   * @param {*} textArray 
   * @param {boolean} applyFormatting 是否应用格式化
   * @returns {string}
   */
  function getTextMarkdown(textArray, applyFormatting = true) {
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
      
      if (!applyFormatting) {
        return text
      }
      
      // 应用格式化
      for (const format of formatting) {
        if (!Array.isArray(format) || format.length < 1) continue
        
        const formatType = format[0]
        const formatValue = format[1]
        
        switch (formatType) {
          case 'b': // 粗体
            text = `**${text}**`
            break
          case 'i': // 斜体
            text = `*${text}*`
            break
          case 's': // 删除线
            text = `~~${text}~~`
            break
          case 'c': // 代码
            text = `\`${text}\``
            break
          case 'a': // 链接
            text = `[${text}](${formatValue})`
            break
          case 'h': // 高亮（Markdown不直接支持，使用HTML）
            text = `<mark>${text}</mark>`
            break
          case '_': // 下划线（Markdown不直接支持，使用HTML）
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
}
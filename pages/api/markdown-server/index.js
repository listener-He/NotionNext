/**
 * Markdown Server API
 * 参考 https://github.com/sbfkcel/markdown-server
 * 完全兼容原项目的API格式
 * 
 * API参数 (GET查询参数):
 * - tex: LaTeX数学公式内容
 * - yuml: yUML流程图内容 (暂不支持，使用mermaid替代)
 * - theme: 主题 ('dark' | 其他为默认主题)
 */

import katex from 'katex'

// LaTeX数学公式渲染为SVG
function renderLatexToSvg(tex, theme) {
  try {
    // KaTeX 渲染为 HTML
    const html = katex.renderToString(tex, {
      displayMode: true,
      throwOnError: false,
      output: 'html'
    })
    
    // 将 HTML 包装在 SVG 的 foreignObject 中
    const textColor = theme === 'dark' ? '#ffffff' : '#000000'
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="auto" height="auto" viewBox="0 0 400 100">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="color: ${textColor}; font-family: 'KaTeX_Main', 'Times New Roman', serif; padding: 10px;">
          ${html}
        </div>
      </foreignObject>
    </svg>`
    
    return svg
  } catch (error) {
    const textColor = theme === 'dark' ? '#ffffff' : '#000000'
    return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50">
      <text x="10" y="30" fill="${textColor}">LaTeX Error: ${error.message}</text>
    </svg>`
  }
}

// yUML/Mermaid流程图渲染为SVG (简化版本)
function renderYumlToSvg(yuml, theme) {
  // 原项目使用yuml2svg，这里暂时返回占位符
  const fillColor = theme === 'dark' ? '#ffffff' : '#000000'
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
    <text x="20" y="30" fill="${fillColor}">yUML渲染需要额外配置</text>
    <text x="20" y="60" fill="gray" font-size="12">${yuml.substring(0, 50)}...</text>
  </svg>`
}

export default function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    res.writeHead(404, {'Content-type': 'text/html;charset=utf-8'})
    res.write('Only GET method is supported')
    return res.end()
  }

  try {
    const { tex, yuml, theme } = req.query
    
    const errFn = (msg) => {
      res.writeHead(404, {'Content-type': 'text/html;charset=utf-8'})
      res.write(msg)
      res.end()
    }
    
    const successFn = (result) => {
      res.writeHead(200, {'Content-type': 'image/svg+xml;charset=utf-8'})
      res.write(result)
      res.end()
    }
    
    if (yuml) {
      // 处理yUML流程图
      try {
        const svgResult = renderYumlToSvg(yuml, theme)
        successFn(svgResult)
      } catch (e) {
        errFn('Yuml formula is wrong!')
      }
    } else if (tex) {
      // 处理LaTeX数学公式
      try {
        const svgResult = renderLatexToSvg(tex, theme)
        successFn(svgResult)
      } catch (e) {
        errFn('LaTeX formula is wrong!')
      }
    } else {
      // 请通过`tex`参数传入LaTeX公式，或使用`yuml`参数传入`yuml`表达式。
      errFn('Please pass LaTeX formula via `tex` parameter or `Yuml` expression using `yuml` parameter.')
    }

  } catch (error) {
    console.error('SVG rendering error:', error)
    res.writeHead(500, {'Content-type': 'text/html;charset=utf-8'})
    res.write('Internal server error')
    res.end()
  }
}
import * as React from 'react'

import Katex from '@/components/KatexReact'
import { getBlockTitle } from 'notion-utils'
// katex 样式随本组件（动态导入）按需加载，避免打进所有文章页的核心 CSS
import 'katex/dist/katex.min.css'

const katexSettings = {
  throwOnError: false,
  strict: false
}

/**
 * 数学公式
 * @param {} param0
 * @returns
 */
export const Equation = ({ block, math, inline = false, className, ...rest }) => {
  math = math || getBlockTitle(block, null)
  if (!math) return null

  return (
    <span
      role='button'
      tabIndex={0}
      className={`notion-equation ${inline ? 'notion-equation-inline' : 'notion-equation-block'}`}
    >
      <Katex math={math} settings={katexSettings} {...rest} />
    </span>
  )
}

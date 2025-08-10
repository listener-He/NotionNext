#!/usr/bin/env node

/**
 * 性能监控脚本
 * 用于监控和分析 NotionNext 博客的页面数据大小和性能指标
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 配置
const CONFIG = {
  baseUrl: 'http://localhost:3000',
  testPages: [
    '/',
    '/page/2',
    '/page/3',
    '/category/技术/page/1',
    '/tag/JavaScript/page/1',
    '/search/test/page/1'
  ],
  outputFile: 'performance-report.json'
}

/**
 * 测试单个页面的数据大小
 * @param {string} url - 页面URL
 * @returns {Promise<object>} 测试结果
 */
async function testPageSize(url) {
  try {
    const fullUrl = `${CONFIG.baseUrl}${url}`
    console.log(`测试页面: ${url}`)
    
    // 测试未压缩大小
    const uncompressedCmd = `curl -s -w "%{size_download}" "${fullUrl}" -o /dev/null`
    const uncompressedSize = parseInt(execSync(uncompressedCmd, { encoding: 'utf8' }).trim())
    
    // 测试压缩大小
    const compressedCmd = `curl -s -w "%{size_download}" -H "Accept-Encoding: gzip" "${fullUrl}" -o /dev/null`
    const compressedSize = parseInt(execSync(compressedCmd, { encoding: 'utf8' }).trim())
    
    // 计算压缩率
    const compressionRatio = ((uncompressedSize - compressedSize) / uncompressedSize * 100).toFixed(2)
    
    return {
      url,
      uncompressedSize,
      compressedSize,
      compressionRatio: `${compressionRatio}%`,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error(`测试页面 ${url} 时出错:`, error.message)
    return {
      url,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} 格式化后的大小
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 生成性能报告
 * @param {Array} results - 测试结果数组
 */
function generateReport(results) {
  console.log('\n=== 性能监控报告 ===')
  console.log(`测试时间: ${new Date().toLocaleString()}`)
  console.log('\n页面数据大小分析:')
  console.log('─'.repeat(80))
  console.log('页面路径'.padEnd(30) + '未压缩大小'.padEnd(15) + '压缩大小'.padEnd(15) + '压缩率')
  console.log('─'.repeat(80))
  
  let totalUncompressed = 0
  let totalCompressed = 0
  let validResults = 0
  
  results.forEach(result => {
    if (result.error) {
      console.log(`${result.url.padEnd(30)} 错误: ${result.error}`)
    } else {
      const uncompressed = formatSize(result.uncompressedSize)
      const compressed = formatSize(result.compressedSize)
      console.log(
        result.url.padEnd(30) + 
        uncompressed.padEnd(15) + 
        compressed.padEnd(15) + 
        result.compressionRatio
      )
      totalUncompressed += result.uncompressedSize
      totalCompressed += result.compressedSize
      validResults++
    }
  })
  
  if (validResults > 0) {
    console.log('─'.repeat(80))
    const avgUncompressed = totalUncompressed / validResults
    const avgCompressed = totalCompressed / validResults
    const avgCompressionRatio = ((avgUncompressed - avgCompressed) / avgUncompressed * 100).toFixed(2)
    
    console.log(
      '平均大小'.padEnd(30) + 
      formatSize(avgUncompressed).padEnd(15) + 
      formatSize(avgCompressed).padEnd(15) + 
      `${avgCompressionRatio}%`
    )
  }
  
  // 性能建议
  console.log('\n=== 性能优化建议 ===')
  results.forEach(result => {
    if (!result.error) {
      if (result.uncompressedSize > 100 * 1024) { // 大于100KB
        console.log(`⚠️  ${result.url}: 页面较大 (${formatSize(result.uncompressedSize)})，建议进一步优化`)
      } else if (result.uncompressedSize > 50 * 1024) { // 大于50KB
        console.log(`⚡ ${result.url}: 页面中等 (${formatSize(result.uncompressedSize)})，可考虑优化`)
      } else {
        console.log(`✅ ${result.url}: 页面大小良好 (${formatSize(result.uncompressedSize)})`)
      }
    }
  })
  
  console.log('\n=== 优化提示 ===')
  console.log('1. 启用 gzip 压缩可显著减少传输数据量')
  console.log('2. 考虑使用 CDN 加速静态资源加载')
  console.log('3. 优化图片大小和格式（使用 WebP 等现代格式）')
  console.log('4. 减少不必要的数据字段传输')
  console.log('5. 实施懒加载和分页策略')
}

/**
 * 主函数
 */
async function main() {
  console.log('开始性能监控测试...')
  console.log(`测试目标: ${CONFIG.baseUrl}`)
  console.log(`测试页面数量: ${CONFIG.testPages.length}`)
  
  const results = []
  
  for (const page of CONFIG.testPages) {
    const result = await testPageSize(page)
    results.push(result)
    // 添加延迟避免请求过于频繁
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  // 生成报告
  generateReport(results)
  
  // 保存详细结果到文件
  const reportData = {
    timestamp: new Date().toISOString(),
    baseUrl: CONFIG.baseUrl,
    results: results,
    summary: {
      totalPages: results.length,
      successfulTests: results.filter(r => !r.error).length,
      failedTests: results.filter(r => r.error).length
    }
  }
  
  fs.writeFileSync(CONFIG.outputFile, JSON.stringify(reportData, null, 2))
  console.log(`\n详细报告已保存到: ${CONFIG.outputFile}`)
}

// 检查是否有开发服务器运行
function checkServer() {
  try {
    execSync(`curl -s ${CONFIG.baseUrl} > /dev/null`, { stdio: 'ignore' })
    return true
  } catch (error) {
    return false
  }
}

// 运行脚本
if (require.main === module) {
  if (!checkServer()) {
    console.error(`❌ 无法连接到 ${CONFIG.baseUrl}`)
    console.error('请确保开发服务器正在运行 (npm run dev)')
    process.exit(1)
  }
  
  main().catch(error => {
    console.error('性能监控测试失败:', error)
    process.exit(1)
  })
}

module.exports = { testPageSize, formatSize, generateReport }
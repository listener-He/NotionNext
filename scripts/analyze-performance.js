#!/usr/bin/env node
/**
 * NotionNext 性能分析脚本
 * 用于分析和诊断性能问题
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 启用性能监控
process.env.PERFORMANCE_MONITOR = 'true'
process.env.NODE_ENV = 'development'

console.log('🔍 NotionNext 性能分析工具')
console.log('=' .repeat(50))

/**
 * 分析构建性能
 */
function analyzeBuildPerformance() {
  console.log('\n📦 分析构建性能...')
  
  try {
    const startTime = Date.now()
    
    // 运行构建命令并捕获输出
    const buildOutput = execSync('npm run build', { 
      encoding: 'utf8',
      cwd: process.cwd(),
      timeout: 300000 // 5分钟超时
    })
    
    const buildTime = Date.now() - startTime
    
    console.log(`✅ 构建完成，耗时: ${(buildTime / 1000).toFixed(2)}s`)
    
    // 分析构建输出
    const lines = buildOutput.split('\n')
    const performanceLines = lines.filter(line => 
      line.includes('[性能') || 
      line.includes('定时发布') ||
      line.includes('缓存')
    )
    
    if (performanceLines.length > 0) {
      console.log('\n⚠️  构建过程中的性能信息:')
      performanceLines.forEach(line => console.log(`  ${line}`))
    }
    
    return {
      buildTime,
      performanceIssues: performanceLines.length
    }
    
  } catch (error) {
    console.error('❌ 构建失败:', error.message)
    return null
  }
}

/**
 * 分析代码中的潜在性能问题
 */
function analyzeCodePatterns() {
  console.log('\n🔍 分析代码模式...')
  
  const issues = []
  const projectRoot = process.cwd()
  
  // 检查可能的性能问题模式
  const patterns = [
    {
      name: '重复的 getGlobalData 调用',
      regex: /getGlobalData.*getGlobalData/g,
      severity: 'high',
      description: '在同一文件中多次调用 getGlobalData 可能导致重复数据获取'
    },
    {
      name: '未缓存的数据获取',
      regex: /await.*notion.*(?!cache)/gi,
      severity: 'medium', 
      description: '直接调用 Notion API 而未使用缓存'
    },
    {
      name: '同步的 forEach 循环',
      regex: /\.forEach\(.*=>.*await/g,
      severity: 'medium',
      description: 'forEach 中使用 await 可能导致串行执行'
    },
    {
      name: '大量的 console.log',
      regex: /console\.log/g,
      severity: 'low',
      description: '过多的日志输出可能影响性能'
    }
  ]
  
  // 扫描关键文件
  const filesToScan = [
    'lib/db/getSiteData.js',
    'lib/cache/cache_manager.js',
    'pages/api/**/*.js',
    'pages/**/*.js'
  ]
  
  filesToScan.forEach(pattern => {
    try {
      const files = execSync(`find ${projectRoot} -path "*/${pattern}" -type f`, { encoding: 'utf8' })
        .split('\n')
        .filter(f => f.trim())
      
      files.forEach(file => {
        if (fs.existsSync(file)) {
          const content = fs.readFileSync(file, 'utf8')
          
          patterns.forEach(pattern => {
            const matches = content.match(pattern.regex)
            if (matches && matches.length > 0) {
              issues.push({
                file: path.relative(projectRoot, file),
                pattern: pattern.name,
                severity: pattern.severity,
                count: matches.length,
                description: pattern.description
              })
            }
          })
        }
      })
    } catch (error) {
      // 忽略文件扫描错误
    }
  })
  
  return issues
}

/**
 * 分析依赖包大小
 */
function analyzeDependencies() {
  console.log('\n📦 分析依赖包...')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    // 获取包大小信息（如果安装了 bundlephobia-cli）
    const largeDeps = []
    
    Object.keys(dependencies).forEach(dep => {
      // 检查一些已知的大包
      const knownLargePackages = {
        'next': '> 20MB',
        'react': '> 5MB', 
        'notion-client': '> 10MB',
        'lodash': '> 5MB'
      }
      
      if (knownLargePackages[dep]) {
        largeDeps.push({
          name: dep,
          version: dependencies[dep],
          estimatedSize: knownLargePackages[dep]
        })
      }
    })
    
    return {
      totalDeps: Object.keys(dependencies).length,
      largeDeps
    }
    
  } catch (error) {
    console.error('无法分析依赖包:', error.message)
    return null
  }
}

/**
 * 生成性能报告
 */
function generateReport(buildResult, codeIssues, depAnalysis) {
  console.log('\n' + '='.repeat(50))
  console.log('📊 性能分析报告')
  console.log('='.repeat(50))
  
  // 构建性能
  if (buildResult) {
    console.log('\n🏗️  构建性能:')
    console.log(`  构建时间: ${(buildResult.buildTime / 1000).toFixed(2)}s`)
    console.log(`  性能问题数: ${buildResult.performanceIssues}`)
    
    if (buildResult.buildTime > 60000) {
      console.log('  ⚠️  构建时间较长，建议优化')
    }
  }
  
  // 代码问题
  if (codeIssues.length > 0) {
    console.log('\n🔍 代码分析:')
    
    const highIssues = codeIssues.filter(i => i.severity === 'high')
    const mediumIssues = codeIssues.filter(i => i.severity === 'medium')
    const lowIssues = codeIssues.filter(i => i.severity === 'low')
    
    if (highIssues.length > 0) {
      console.log('\n  🔴 高优先级问题:')
      highIssues.forEach(issue => {
        console.log(`    - ${issue.file}: ${issue.pattern} (${issue.count}次)`)
        console.log(`      ${issue.description}`)
      })
    }
    
    if (mediumIssues.length > 0) {
      console.log('\n  🟡 中优先级问题:')
      mediumIssues.forEach(issue => {
        console.log(`    - ${issue.file}: ${issue.pattern} (${issue.count}次)`)
      })
    }
    
    if (lowIssues.length > 0) {
      console.log(`\n  🟢 低优先级问题: ${lowIssues.length} 个`)
    }
  } else {
    console.log('\n✅ 未发现明显的代码性能问题')
  }
  
  // 依赖分析
  if (depAnalysis) {
    console.log('\n📦 依赖分析:')
    console.log(`  总依赖数: ${depAnalysis.totalDeps}`)
    
    if (depAnalysis.largeDeps.length > 0) {
      console.log('\n  📊 大型依赖包:')
      depAnalysis.largeDeps.forEach(dep => {
        console.log(`    - ${dep.name}@${dep.version}: ${dep.estimatedSize}`)
      })
    }
  }
  
  // 优化建议
  console.log('\n💡 优化建议:')
  
  const suggestions = []
  
  if (buildResult && buildResult.buildTime > 60000) {
    suggestions.push('考虑启用增量构建和并行处理')
  }
  
  if (codeIssues.some(i => i.severity === 'high')) {
    suggestions.push('优先修复高优先级的性能问题')
  }
  
  if (codeIssues.some(i => i.pattern.includes('getGlobalData'))) {
    suggestions.push('实现数据获取的去重和缓存机制')
  }
  
  if (depAnalysis && depAnalysis.largeDeps.length > 3) {
    suggestions.push('考虑减少大型依赖包的使用')
  }
  
  if (suggestions.length === 0) {
    suggestions.push('当前性能表现良好，继续保持！')
  }
  
  suggestions.forEach((suggestion, index) => {
    console.log(`  ${index + 1}. ${suggestion}`)
  })
  
  console.log('\n' + '='.repeat(50))
}

/**
 * 主函数
 */
function main() {
  try {
    // 分析构建性能
    const buildResult = analyzeBuildPerformance()
    
    // 分析代码模式
    const codeIssues = analyzeCodePatterns()
    
    // 分析依赖
    const depAnalysis = analyzeDependencies()
    
    // 生成报告
    generateReport(buildResult, codeIssues, depAnalysis)
    
  } catch (error) {
    console.error('❌ 分析过程中出现错误:', error.message)
    process.exit(1)
  }
}

// 运行分析
if (require.main === module) {
  main()
}

module.exports = {
  analyzeBuildPerformance,
  analyzeCodePatterns,
  analyzeDependencies,
  generateReport
}
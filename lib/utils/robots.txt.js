import fs from 'fs'

export function generateRobotsTxt(props) {
  const { siteInfo } = props
  const LINK = siteInfo?.link
  const content = `
    # *
    User-agent: *
    Allow: /
  
    # Host
    Host: ${LINK}
  
    # Sitemaps
    Sitemap: ${LINK}/sitemap.xml
  
    `
  try {
    fs.mkdirSync('./public', { recursive: true })
    fs.writeFileSync('./public/robots.txt', content)
    console.log('✅ robots.txt 生成成功')
  } catch (error) {
    // 在Vercel等只读文件系统环境中，这里会报错，属于正常情况
    // 但在编译阶段或VPS等其他平台这行代码会成功执行
    if (error.code === 'EROFS') {
      console.log('⚠️ 只读文件系统，robots.txt 无法写入，但这是正常的')
    } else {
      console.warn('❌ robots.txt 写入失败:', error.message)
    }
  }
}

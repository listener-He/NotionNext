# 腾讯云EdgeOne部署指南

## 概述

本文档提供将NotionNext博客系统部署到腾讯云EdgeOne的详细步骤。EdgeOne是腾讯云的边缘安全加速平台，提供全球CDN加速、安全防护和静态网站托管服务。

## 部署前准备

### 1. 环境变量配置

在部署前，需要在EdgeOne控制台配置以下环境变量：

- `NOTION_PAGE_ID`: 你的Notion页面ID
- `NEXT_PUBLIC_TITLE`: 网站标题
- `NEXT_PUBLIC_DESCRIPTION`: 网站描述
- `NEXT_PUBLIC_AUTHOR`: 作者名称
- `NEXT_PUBLIC_LINK`: 网站URL

### 2. Next.js 静态导出配置

项目已配置为静态导出模式，需要在 `next.config.js` 中启用：

```js
const nextConfig = {
  output: 'export',  // 启用静态导出
  images: {
    unoptimized: true  // 静态导出时禁用图片优化
  },
  trailingSlash: true  // 添加尾部斜杠，提高兼容性
}
```

## 部署步骤

### 1. 代码仓库准备

1. 将项目代码推送到GitHub/Gitee仓库
2. 确保仓库包含所有必需的配置文件
3. 检查 `package.json` 中的构建命令

### 2. EdgeOne控制台配置

1. **登录EdgeOne控制台**
   - 访问 [腾讯云EdgeOne控制台](https://console.cloud.tencent.com/edgeone)
   - 登录你的腾讯云账号

2. **创建新项目**
   - 在控制台中选择"边缘网页 (Pages)"
   - 点击"创建项目"
   - 选择"从代码库创建"

3. **连接代码仓库**
   - 选择你的GitHub/Gitee账户
   - 授权并选择NotionNext仓库
   - 确认仓库连接成功

4. **配置构建设置**
   - 构建命令: `cross-env EXPORT=true yarn build`
   - 输出目录: `out`
   - 根目录: `.`
   - Node版本: `22` (根据package.json配置)

5. **环境变量配置**
   - 在"环境变量"部分添加必要的环境变量
   - 确保 `EXPORT` 设置为 `true`

### 3. 部署配置文件说明

`edgeone-deploy.json` 文件包含以下关键配置：

#### 构建配置
- `build.command`: 构建命令，使用静态导出模式
- `outputDir`: 构建输出目录
- `rootDir`: 项目根目录

#### 边缘规则 (Edge Rules)
- RSS重定向规则：将RSS相关路径重定向到API
- 静态资源缓存：为不同类型的静态资源设置缓存策略
- 安全头配置：添加安全相关的HTTP头

#### 缓存策略
- 静态资源 (JS/CSS/图片): 31536000秒 (1年) 缓存
- API响应: 合理的缓存时间
- HTML页面: 短期缓存

## 部署后的配置

### 1. 域名配置

1. **添加自定义域名**
   - 在"域名管理"中添加你的自定义域名
   - 添加CNAME记录到EdgeOne提供的域名

2. **SSL证书**
   - EdgeOne会自动为域名申请SSL证书
   - 确保证书状态为"已签发"

### 2. 安全配置

1. **Web应用防火墙 (WAF)**
   - 在安全防护中启用WAF
   - 配置适当的防护等级

2. **访问控制**
   - 根据需要配置IP黑白名单
   - 设置访问频率限制

### 3. 缓存配置

1. **缓存规则**
   - 静态资源: 长期缓存
   - API响应: 合理缓存
   - HTML页面: 短期缓存

2. **缓存预热**
   - 根据需要配置缓存预热

## 高级配置

### 1. 自定义边缘规则

EdgeOne的规则引擎支持自定义规则，可以在控制台中配置：

- URL重写规则
- 访问控制规则
- 缓存控制规则
- 安全防护规则

### 2. 性能优化

- 启用HTTP/2和HTTP/3
- 配置Brotli和Gzip压缩
- 优化缓存策略

## 故障排除

### 常见问题

1. **构建失败**
   ```
   解决方案：
   - 检查环境变量配置
   - 确认Node.js版本兼容性
   - 检查依赖包版本
   ```

2. **RSS功能异常**
   ```
   解决方案：
   - 检查RSS重定向规则
   - 确认API路由配置
   ```

3. **静态资源加载缓慢**
   ```
   解决方案：
   - 检查缓存配置
   - 优化资源大小
   ```

### 调试方法

1. **查看构建日志**
   - 在EdgeOne控制台查看详细的构建日志
   - 检查是否有错误信息

2. **网络请求分析**
   - 使用浏览器开发者工具分析网络请求
   - 检查HTTP头和缓存状态

## 监控和维护

### 1. 性能监控

- 配置访问日志
- 监控页面加载速度
- 跟踪错误率

### 2. 安全监控

- 监控安全事件
- 检查异常访问模式
- 定期审查访问日志

## 更新和维护

### 1. 代码更新

- 代码推送后会自动触发重新构建
- 可以在控制台手动触发构建

### 2. 配置更新

- 修改 `edgeone-deploy.json` 后需要重新部署
- 在控制台中修改的配置会立即生效

## 最佳实践

1. **安全优先**
   - 始终启用HTTPS
   - 配置适当的安全头
   - 定期更新依赖包

2. **性能优化**
   - 合理配置缓存策略
   - 优化静态资源大小
   - 使用CDN加速

3. **监控和日志**
   - 启用访问日志
   - 监控关键指标
   - 设置告警规则

## 注意事项

- 静态导出模式下，动态功能可能受限
- API路由在静态导出模式下可能无法正常工作
- 某些服务器端功能需要特殊处理
- 定期检查部署配置以确保安全性和性能

## 参考资源

- [腾讯云EdgeOne官方文档](https://cloud.tencent.com/document/product/1552)
- [Next.js静态导出文档](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)
- [NotionNext官方文档](https://docs.tangly1024.com/)
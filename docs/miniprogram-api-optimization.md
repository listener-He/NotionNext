# 小程序API优化说明

## 变更概述

为了优化小程序的加载性能和减少数据传输量，我们对小程序API进行了以下优化：

### API变更内容

1. **移除重复字段**：删除了 `pageCoverThumbnail` 字段
2. **字段优化**：`pageCover` 字段现在返回缩略图版本（原 `pageCoverThumbnail` 的内容）
3. **向下兼容**：当缩略图不存在时，自动回退到原始封面图
4. **增强兼容性**：文章详情API现在支持通过slug或notion ID访问文章
5. **slug格式优化**：文章列表API返回的slug已去掉article前缀，详情API自动兼容处理

### 受影响的API端点

- `/api/miniprogram/posts` - 文章列表API
- `/api/miniprogram/post/[slug]` - 文章详情API

## 小程序端代码调整

### 1. 文章列表页面调整

**调整前：**
```javascript
// 可能同时使用了两个字段
const coverImage = item.pageCoverThumbnail || item.pageCover || '/default-cover.jpg'
```

**调整后：**
```javascript
// 统一使用pageCover字段
const coverImage = item.pageCover || '/default-cover.jpg'
```

### 2. 文章详情页面调整

**调整前：**
```javascript
// 详情页可能优先使用原始封面图
const headerImage = post.pageCover || post.pageCoverThumbnail || '/default-header.jpg'
```

**调整后：**
```javascript
// 统一使用pageCover字段（现在是优化后的缩略图）
const headerImage = post.pageCover || '/default-header.jpg'
```

### 3. 相关文章组件调整

**调整前：**
```javascript
// 相关文章使用pageCoverThumbnail
const relatedCover = relatedPost.pageCoverThumbnail || '/default-thumb.jpg'
```

**调整后：**
```javascript
// 统一使用pageCover字段
const relatedCover = relatedPost.pageCover || '/default-thumb.jpg'
```

### 4. 图片组件优化建议

```javascript
// 推荐的图片组件使用方式
const ImageComponent = ({ post, className }) => {
  return (
    <image 
      src={post.pageCover || '/default-cover.jpg'}
      className={className}
      mode="aspectFill"
      lazy-load
    />
  )
}
```

## 性能优化效果

1. **数据传输量减少**：每个文章对象减少一个图片URL字段
2. **加载速度提升**：使用缩略图版本，图片文件更小
3. **代码简化**：统一字段名，减少条件判断
4. **向下兼容**：现有代码无需大幅修改

## 迁移检查清单

- [ ] 检查所有使用 `pageCoverThumbnail` 的地方
- [ ] 将 `pageCoverThumbnail` 替换为 `pageCover`
- [ ] 移除不必要的字段判断逻辑
- [ ] 测试图片显示是否正常
- [ ] 验证加载性能是否有提升

## Notion ID兼容性

### 支持的访问方式

小程序文章详情API现在支持两种访问方式：

1. **通过slug访问**（推荐）
   ```
   GET /api/miniprogram/post/my-article-slug
   ```

2. **通过notion ID访问**（兼容性支持）
   ```
   GET /api/miniprogram/post/24e0c7d0-9e17-80d2-9362-e89eef47204c
   ```

### 查找逻辑

1. **优先在缓存中查找**：首先在allPages中通过slug或ID查找文章
2. **直接获取支持**：如果缓存中没找到且参数看起来像notion ID（长度≥32），会尝试直接从Notion获取
3. **类型和状态验证**：确保返回的是已发布的文章类型

### 小程序端适配

```javascript
// 小程序端可以灵活使用两种方式
const getArticle = async (identifier) => {
  // identifier 可以是 slug 或 notion ID
  const response = await wx.request({
    url: `${API_BASE}/api/miniprogram/post/${identifier}`,
    method: 'GET'
  })
  return response.data
}

// 使用示例
const article1 = await getArticle('my-article-slug')  // 通过slug
const article2 = await getArticle('24e0c7d0-9e17-80d2-9362-e89eef47204c')  // 通过ID
```

## Slug格式优化

### 问题背景

之前小程序文章列表API返回的slug包含"article/"前缀（如：`article/my-post`），但文章详情API无法直接处理这种格式，导致小程序需要额外处理slug格式。

### 优化方案

1. **文章列表API优化**：自动去掉返回slug中的"article/"前缀
2. **文章详情API兼容**：支持处理带前缀和不带前缀的slug格式

### 代码示例

**文章列表API返回格式（优化后）：**
```json
{
  "success": true,
  "data": {
    "posts": [
      {
        "id": "xxx",
        "title": "文章标题",
        "slug": "my-article-slug",  // 已去掉article前缀
        "category": "分类"
      }
    ]
  }
}
```

**小程序端使用（无需修改）：**
```javascript
// 获取文章列表
const listResponse = await wx.request({
  url: `${API_BASE}/api/miniprogram/posts`,
  method: 'GET'
})

// 直接使用返回的slug访问详情
const detailResponse = await wx.request({
  url: `${API_BASE}/api/miniprogram/post/${listResponse.data.posts[0].slug}`,
  method: 'GET'
})
```

### 兼容性保证

文章详情API现在支持以下所有格式：
- 不带前缀的slug：`my-article-slug`
- 带前缀的slug：`article/my-article-slug`
- Notion ID：`24e0c7d0-9e17-80d2-9362-e89eef47204c`

## 注意事项

1. **图片质量**：现在的 `pageCover` 是缩略图版本，适合小程序使用
2. **缓存更新**：如果小程序有本地缓存，建议清理旧数据
3. **错误处理**：保持图片加载失败的兜底逻辑
4. **ID格式**：notion ID应为32位以上的UUID格式
5. **slug格式**：现在列表API返回的slug已优化，无需额外处理

## 技术支持

如果在迁移过程中遇到问题，请参考：
- API文档：`/pages/api/miniprogram/`
- 示例代码：本文档中的代码片段
- 测试端点：`http://localhost:3000/api/miniprogram/posts?page=1&pageSize=5`
# 构建问题修复说明

## 问题描述
在 Next.js 构建过程中出现以下错误：
```
Module not found: Can't resolve 'dns'
Module not found: Can't resolve 'net'  
Module not found: Can't resolve 'tls'
Module not found: Can't resolve 'fs'
```

## 问题原因
1. `ioredis` 库是 Node.js 服务器端库，包含 `dns`、`net`、`tls` 等核心模块
2. `fs` 模块是 Node.js 文件系统模块
3. 这些模块在浏览器环境中不存在
4. 当 Next.js 在客户端打包时，会尝试包含这些服务器端专用模块，导致构建失败

## 解决方案
修改 `/lib/cache/cache_manager.js` 文件，使用动态导入和环境判断：

### 主要改动：
1. **动态导入服务端模块**：只有在服务端环境 (`typeof window === 'undefined'`) 才导入 Redis 和文件缓存模块
2. **环境感知的缓存选择**：在客户端环境自动使用内存缓存，避免引用服务端专用模块
3. **保持功能完整性**：服务端仍然可以正常使用所有缓存类型

### 修改要点：
```javascript
// 动态导入服务端专用模块，避免在客户端打包时报错
let FileCache, RedisCache, RedisCompressedCache;
if (typeof window === 'undefined') {
  // 仅在服务端导入文件和Redis模块
  FileCache = require('./local_file_cache').default;
  RedisCache = require('./redis_cache').default;
  RedisCompressedCache = require('./redis_cache_compressed').default;
}

// 环境感知的缓存API选择
export function getApi() {
  // 在客户端环境或没有Redis配置时，使用内存缓存
  if (typeof window !== 'undefined' || !BLOG.REDIS_URL) {
    if (process.env.ENABLE_FILE_CACHE) {
      return FileCache
    } else {
      return MemoryCache
    }
  }
  
  // 在服务端且有Redis配置时，使用Redis缓存
  // ... Redis相关逻辑
}
```

## 验证结果
构建成功完成，所有页面正常生成，没有出现模块未找到的错误。

## 注意事项
- 此修复不会影响服务端的功能，Redis 缓存仍然可以在服务端正常工作
- 客户端会自动使用内存缓存作为降级方案
- 保持了原有的缓存策略和配置选项
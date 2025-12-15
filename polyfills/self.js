// polyfills/self.js
// 为服务器环境提供 self 的 polyfill
module.exports = typeof self !== 'undefined' ? self : globalThis;
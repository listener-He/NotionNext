import React from 'react'

/**
 * 全局错误边界 (Error Boundary)
 * 捕获子组件树中的渲染错误、生命周期错误等，防止整个 React 树被卸载导致白屏
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    // 更新 state 以致于下一次渲染能显示降级后的 UI
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // 你同样可以将错误日志上报给服务器 (如 Sentry)
    console.error('全局组件渲染崩溃:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // 你可以自定义降级后的 UI
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
          <div className="p-8 bg-white dark:bg-black rounded-xl shadow-xl max-w-lg text-center">
            <h1 className="text-4xl font-bold text-red-500 mb-4">Oops! 页面崩溃了</h1>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              渲染组件时遇到了未处理的异常。为了您的体验，我们拦截了这次白屏。
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-left text-sm font-mono overflow-auto mb-6 max-h-32 text-red-400">
              {this.state.error?.toString() || 'Unknown Error'}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full transition-colors duration-200"
            >
              刷新页面重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
/* eslint-disable */
const { loadExternalResource } = require('@/lib/utils')
let bszCaller, bszTag, scriptTag, ready

let intervalId;
let executeCallbacks;
let onReady;
let isReady = false;
let callbacks = [];

// 修复Node同构代码的问题
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  ready = function (callback) {
    if (isReady || document.readyState === 'interactive' || document.readyState === 'complete') {
      callback.call(document);
    } else {
      callbacks.push(function () {
        return callback.call(this);
      });
    }
    return this;
  };

  executeCallbacks = function () {
    for (let i = 0, len = callbacks.length; i < len; i++) {
      callbacks[i].apply(document);
    }
    callbacks = [];
  };

  onReady = function () {
    if (!isReady) {
      isReady = true;
      executeCallbacks.call(window);
      if (document.removeEventListener) {
        document.removeEventListener('DOMContentLoaded', onReady, false);
      } else if (document.attachEvent) {
        document.detachEvent('onreadystatechange', onReady);
        if (window == window.top && intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }
  };

  if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', onReady, false);
  } else if (document.attachEvent) {
    document.attachEvent('onreadystatechange', function () {
      if (/loaded|complete/.test(document.readyState)) {
        onReady();
      }
    });
    if (window == window.top) {
      intervalId = setInterval(function () {
        try {
          if (!isReady) {
            document.documentElement.doScroll('left');
          }
        } catch (e) {
          if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
          }
          return;
        }
        onReady();
      }, 5);
    }
  }
}

bszCaller = {
  fetch: function (url, callback, timeout = 2000) { // 添加timeout参数，默认2秒
    const callbackName = 'BusuanziCallback_' + Math.floor(1099511627776 * Math.random())
    url = url.replace('=BusuanziCallback', '=' + callbackName)
    scriptTag = document.createElement('SCRIPT');
    scriptTag.type = 'text/javascript';
    scriptTag.defer = true;
    scriptTag.src = url;
    scriptTag.referrerPolicy = "no-referrer-when-downgrade";

    // 设置超时处理
    const timeoutId = setTimeout(() => {
      // 超时后清理资源
      if (scriptTag && scriptTag.parentElement) {
        scriptTag.parentElement.removeChild(scriptTag);
      }
      // 清理window上的回调函数
      if (window[callbackName]) {
        delete window[callbackName];
      }
      // 可选：执行错误回调
      if (typeof callback === 'function') {
        callback(null); // 或者传递错误信息
      }
    }, timeout);

    // 成功加载后清除超时定时器
    scriptTag.onload = function() {
      clearTimeout(timeoutId);
    };

    scriptTag.onerror = function() {
      clearTimeout(timeoutId);
      // 清理资源
      if (scriptTag && scriptTag.parentElement) {
        scriptTag.parentElement.removeChild(scriptTag);
      }
      if (window[callbackName]) {
        delete window[callbackName];
      }
      // 可选：执行错误回调
      if (typeof callback === 'function') {
        callback(null); // 或传递错误信息
      }
    };

    document.getElementsByTagName('HEAD')[0].appendChild(scriptTag);
    window[callbackName] = this.evalCall(callback, timeoutId)
  },
  evalCall: function (callback) {
    return function (data) {
      ready(function () {
        try {
          callback(data);
          if (scriptTag && scriptTag.parentElement && scriptTag.parentElement.contains(scriptTag)) {
            scriptTag.parentElement.removeChild(scriptTag);
          }
        } catch (e) {
          // console.log(e);
          // bszTag.hides();
        }
      })
    }
  }
}

const fetch = () => {
  if (bszTag) {
    bszTag.hides();
  }
  loadExternalResource("https://events.vercount.one/js").catch(err => {
    console.log(err)
  })
  // 设置超时时间为2秒
  bszCaller.fetch('//busuanzi.ibruce.info/busuanzi?jsonpCallback=BusuanziCallback', function (data) {
    if (data) {
      bszTag.texts(data);
      bszTag.shows();
    }
  })
}

bszTag = {
  bszs: ['site_pv', 'page_pv', 'site_uv', 'today_pv', 'today_uv'],
  texts: function (data) {
    this.bszs.map(function (key) {
      const elements = document.getElementsByClassName('busuanzi_value_' + key)
      if (elements) {
        for (var element of elements) {
          element.innerHTML = data[key];
        }
      }
    })
  },
  hides: function () {
    this.bszs.map(function (key) {
      const elements = document.getElementsByClassName('busuanzi_container_' + key)
      if (elements) {
        for (var element of elements) {
          element.style.display = 'none';
        }
      }
    })
  },
  shows: function () {
    this.bszs.map(function (key) {
      const elements = document.getElementsByClassName('busuanzi_container_' + key)
      if (elements) {
        for (var element of elements) {
          element.style.display = 'inline';
        }
      }
    })
  }
}

module.exports = {
  fetch
}

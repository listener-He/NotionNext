/* eslint-disable */
/**
 * 创建星空雨 (优化版)
 * @description 性能优化、高清屏适配、自动暂停机制
 */
function renderStarrySky() {
  // 防止重复初始化
  if (document.getElementById('starry-sky-vixcity')) {
    return;
  }

  // --- 配置参数 ---
  const CONFIG = {
    amount: 0.1, // 降低星星密度因子 (相对于屏幕宽度)，减少性能开销
    colors: {
      star: '226,225,142',   // 普通星星颜色
      giant: '180,184,240',  // 巨型星星颜色
      comet: '226,225,224'   // 流星颜色
    },
    speed: {
      min: 0.2,
      max: 0.8, // 降低最大速度以减少计算开销
      comet: 2.0 // 降低流星速度
    }
  };

  // --- 初始化 DOM ---
  const div = document.createElement('div');
  div.className = 'relative'; // 确保父级定位
  const canvas = document.createElement('canvas');
  canvas.id = 'starry-sky-vixcity';
  canvas.className = 'fixed top-0 left-0 pointer-events-none w-full h-full';
  canvas.style.zIndex = '1'; // 适当调整层级，避免遮挡内容
  div.appendChild(canvas);
  document.body.appendChild(div);

  const ctx = canvas.getContext('2d');
  const htmlRoot = document.documentElement;

  let width, height, starCount;
  let stars = [];
  let animationFrameId = null;
  let isRunning = false;

  // --- 核心类定义 ---
  class Star {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      // 随机决定类型：3%概率是巨星，非巨星且非初始化时极低概率是流星
      this.isGiant = Math.random() < 0.03;
      // 流星逻辑：只有在非初始化时产生，且概率较低
      this.isComet = !this.isGiant && !initial && Math.random() < 0.03; // 降低流星概率

      this.x = Math.random() * width;
      this.y = Math.random() * height;

      // 半径
      this.r = this.isGiant ? random(1.5, 2.5) : random(0.8, 1.5); // 减小半径以提升性能

      // 速度 (dx, dy)
      const baseSpeed = random(CONFIG.speed.min, CONFIG.speed.max);
      this.dx = baseSpeed;
      this.dy = -baseSpeed; // 往右上方飘

      // 流星特有属性
      if (this.isComet) {
        this.dx *= random(CONFIG.speed.comet, CONFIG.speed.comet * 1.5); // 降低流星速度范围
        this.dy *= random(CONFIG.speed.comet, CONFIG.speed.comet * 1.5);
        this.r = random(1.0, 1.8); // 减小流星半径
        this.x -= 200; // 让流星从更左侧开始，划过更长距离
      }

      // 透明度控制
      this.opacity = 0;
      this.opacityTresh = random(0.3, 0.7); // 降低最大透明度
      this.fadeSpeed = random(0.002, 0.008); // 调整淡入淡出速度
      this.fadingIn = true;
      this.fadingOut = false;
    }

    update() {
      this.x += this.dx;
      this.y += this.dy;

      // 透明度淡入淡出逻辑
      if (this.fadingIn) {
        this.opacity += this.fadeSpeed;
        if (this.opacity >= this.opacityTresh) {
          this.fadingIn = false;
        }
      } else if (this.fadingOut) {
        this.opacity -= this.fadeSpeed;
        if (this.opacity < 0) {
          this.opacity = 0;
          this.reset();
        }
      } else {
        // 处于保持状态，检测边界
        // 提前一点开始淡出，避免边界突兀消失
        if (this.x > width - width / 5 || this.y < height / 5) {
          this.fadingOut = true;
        }
      }

      // 硬边界重置（防止跑到屏幕外太远）
      if (this.x > width + 50 || this.y < -50) {
        this.reset();
      }
    }

    draw() {
      if (this.opacity <= 0) return;

      if (this.isComet) {
        // 高性能流星绘制：使用预计算和最少的绘制操作
        const angle = Math.atan2(this.dy, this.dx);
        const cosA = Math.cos(angle);
        const sinA = Math.sin(angle);
        const r = this.r;

        // 预先计算坐标以减少重复计算
        const headX = this.x;
        const headY = this.y;
        const tailLen = 60; // 缩短流星轨迹
        const tailWid = r * 1.5; // 缩小流星宽度

        // 流星头部 - 亮点
        ctx.fillStyle = `rgba(${CONFIG.colors.comet}, ${Math.min(1, this.opacity * 1.5)})`;
        ctx.beginPath();
        ctx.arc(headX, headY, r * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 计算流星锥形的顶点
        const x1 = headX - 0.3 * tailLen * cosA - 0.5 * tailWid * sinA;
        const y1 = headY - 0.3 * tailLen * sinA + 0.5 * tailWid * cosA;
        const x2 = headX - 0.8 * tailLen * cosA;
        const y2 = headY - 0.8 * tailLen * sinA;
        const x3 = headX - 0.3 * tailLen * cosA + 0.5 * tailWid * sinA;
        const y3 = headY - 0.3 * tailLen * sinA - 0.5 * tailWid * cosA;

        // 绘制流星主体（锥形）
        ctx.fillStyle = `rgba(${CONFIG.colors.comet}, ${this.opacity * 0.5})`;
        ctx.beginPath();
        ctx.moveTo(headX, headY);
        ctx.lineTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.closePath();
        ctx.fill();

        // 绘制拖尾效果
        const trailX1 = x2 - 0.3 * tailLen * cosA - 0.3 * tailWid * sinA;
        const trailY1 = y2 - 0.3 * tailLen * sinA + 0.3 * tailWid * cosA;
        const trailX2 = x2 - 0.8 * tailLen * cosA;
        const trailY2 = y2 - 0.8 * tailLen * sinA;
        const trailX3 = x2 - 0.3 * tailLen * cosA + 0.3 * tailWid * sinA;
        const trailY3 = y2 - 0.3 * tailLen * sinA - 0.3 * tailWid * cosA;

        ctx.fillStyle = `rgba(${CONFIG.colors.comet}, ${this.opacity * 0.15})`; // 降低拖尾透明度
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(trailX1, trailY1);
        ctx.lineTo(trailX2, trailY2);
        ctx.lineTo(trailX3, trailY3);
        ctx.closePath();
        ctx.fill();
      } else {
        // 普通星星/巨星 - 保持高性能实现
        ctx.fillStyle = `rgba(${this.isGiant ? CONFIG.colors.giant : CONFIG.colors.star}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // --- 工具函数 ---
  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  // --- 调整尺寸 (含 Retina 屏适配) ---
  function resize() {
    const dpr = window.devicePixelRatio || 1;
    width = window.innerWidth;
    height = window.innerHeight;

    // 设置 Canvas 实际像素大小
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    // 缩放 Context 以匹配 CSS 尺寸
    ctx.scale(dpr, dpr);

    // 根据屏幕宽度动态计算星星数量
    starCount = Math.floor(width * CONFIG.amount);

    // 重新填充星星数组（如果数量不足）
    if (stars.length < starCount) {
      for (let i = stars.length; i < starCount; i++) {
        stars.push(new Star());
      }
    } else if (stars.length > starCount) {
      stars.splice(starCount); // 移除多余的
    }
  }

  // --- 渲染循环 ---
  function animate() {
    if (!isRunning) return;

    // 检查暗色模式 (Tailwind dark mode class)
    // 如果不是暗色模式，清空画布并挂起，节省性能
    if (!htmlRoot.classList.contains('dark')) {
      ctx.clearRect(0, 0, width, height);
      // 稍微延迟再次检查，而不是每秒60次
      setTimeout(() => {
        if (isRunning) requestAnimationFrame(animate);
      }, 1000);
      return;
    }

    ctx.clearRect(0, 0, width, height);

    // 批量绘制：先绘制所有普通星星，再绘制巨星，最后绘制流星（减少状态切换）
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      if (!star.isGiant && !star.isComet) {
        star.draw();
      }
    }

    // 绘制巨星
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      if (star.isGiant && !star.isComet) {
        star.draw();
      }
    }

    // 最后绘制流星（避免频繁的状态切换）
    for (let i = 0; i < stars.length; i++) {
      const star = stars[i];
      if (star.isComet) {
        star.draw();
      }
    }

    animationFrameId = requestAnimationFrame(animate);
  }

  // --- 事件监听与控制 ---

  // 1. 启动
  function start() {
    if (!isRunning) {
      isRunning = true;
      resize();
      animate();
    }
  }

  // 2. 窗口大小改变 (使用防抖优化)
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(resize, 200);
  });

  // 3. 页面可见性改变 (切到后台时完全停止，省电)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      isRunning = false;
      cancelAnimationFrame(animationFrameId);
    } else {
      start();
    }
  });

  // 4. 初始化逻辑
  // 判断当前是否需要立即启动
  if (htmlRoot.classList.contains('dark')) {
    start();
  }

  // 监听 DOM 变化以检测主题切换 (针对动态切换 class='dark' 的情况)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        const isDark = htmlRoot.classList.contains('dark');
        if (isDark && !isRunning) {
          start();
        }
        // 如果切回亮色，animate() 内部逻辑会处理暂停渲染
      }
    });
  });
  observer.observe(htmlRoot, { attributes: true });

  // 确保在组件卸载时断开MutationObserver连接
  window.addEventListener('beforeunload', () => {
    observer.disconnect();
  });
}
// 挂载到 window
window.renderStarrySky = renderStarrySky;

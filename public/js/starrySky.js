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
    amount: 0.15, // 星星密度因子 (相对于屏幕宽度)
    colors: {
      star: '226,225,142',   // 普通星星颜色
      giant: '180,184,240',  // 巨型星星颜色
      comet: '226,225,224'   // 流星颜色
    },
    speed: {
      min: 0.2,
      max: 1.0,
      comet: 3.0 // 流星倍速
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
      this.isComet = !this.isGiant && !initial && Math.random() < 0.05;

      this.x = Math.random() * width;
      this.y = Math.random() * height;

      // 半径
      this.r = this.isGiant ? random(1.5, 3) : random(1, 1.8);

      // 速度 (dx, dy)
      const baseSpeed = random(CONFIG.speed.min, CONFIG.speed.max);
      this.dx = baseSpeed;
      this.dy = -baseSpeed; // 往右上方飘

      // 流星特有属性
      if (this.isComet) {
        this.dx *= random(CONFIG.speed.comet, CONFIG.speed.comet * 2);
        this.dy *= random(CONFIG.speed.comet, CONFIG.speed.comet * 2);
        this.r = random(1.2, 2);
        this.x -= 200; // 让流星从更左侧开始，划过更长距离
      }

      // 透明度控制
      this.opacity = 0;
      this.opacityTresh = random(0.3, 0.9); // 目标最大透明度
      this.fadeSpeed = random(0.003, 0.01);
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

      ctx.beginPath();

      if (this.isComet) {
        // 优化：流星尾巴使用渐变绘制，性能远好于循环画30个矩形
        const tailLength = 60;
        const gradient = ctx.createLinearGradient(
          this.x, this.y,
          this.x - this.dx * tailLength, this.y - this.dy * tailLength
        );
        gradient.addColorStop(0, `rgba(${CONFIG.colors.comet}, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(${CONFIG.colors.comet}, 0)`);

        ctx.fillStyle = gradient;
        // 绘制流星头和尾巴
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.dx * tailLength * 0.5, this.y - this.dy * tailLength * 0.5);
        ctx.lineWidth = this.r * 2;
        ctx.strokeStyle = gradient;
        ctx.stroke();
      } else {
        // 普通星星/巨星
        const color = this.isGiant ? CONFIG.colors.giant : CONFIG.colors.star;
        ctx.fillStyle = `rgba(${color}, ${this.opacity})`;
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

    for (let i = 0; i < stars.length; i++) {
      stars[i].update();
      stars[i].draw();
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
}

// 挂载到 window
window.renderStarrySky = renderStarrySky;

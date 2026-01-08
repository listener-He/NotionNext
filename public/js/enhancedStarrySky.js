/* eslint-disable */
/* eslint-env browser */
// @ts-nocheck
/**
 * 增强版星空背景 - 优化版
 * 包含：流星雨、星座连线、闪烁星星、渐变色彩、粒子轨迹等效果
 * 优化：利用查表法计算三角函数，减少每帧GC对象创建，优化渲染层级逻辑
 */
function createEnhancedStarrySky() {
  // 检查是否已存在，防止重复创建
  const existingCanvas = document.getElementById('enhanced-starry-sky')
  if (existingCanvas) {
    return window.destroyEnhancedStarrySky // 如果存在则返回销毁函数
  }

  const canvas = document.createElement('canvas')
  canvas.id = 'enhanced-starry-sky'
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10;
    pointer-events: none;
    opacity: 0;
    transition: opacity 2s ease-in-out;
  `

  // 插入到 body 最前面作为背景
  if (document.body.firstChild) {
    document.body.insertBefore(canvas, document.body.firstChild);
  } else {
    document.body.appendChild(canvas);
  }

  const ctx = canvas.getContext('2d', { alpha: true }) // 明确开启alpha
  let width, height
  let meteors = []
  let staticEntities = [] // 将星星、星云、粒子合并管理的静态数组
  let animationId
  let globalTime = 0 // 替代 Date.now() 用于计算平滑动画

  // 配置参数
  const config = {
    starCount: 120,
    meteorCount: 5,
    nebulaCount: 2,
    floatingParticleCount: 15,
    depthLayers: 5,
    colors: {
      stars: ['#ffffff', '#b4c7ff', '#ffffcc', '#ffcc99', '#ff9999'],
      meteors: ['#ffffff', '#87ceeb', '#ffd700'],
      nebulae: ['rgba(138, 43, 226, 0.3)', 'rgba(30, 144, 255, 0.25)', 'rgba(255, 20, 147, 0.2)', 'rgba(0, 191, 255, 0.25)'],
      particles: '#87ceeb'
    }
  }

  // --- 优化1：利用预计算三角函数表 ---
  const sinTable = new Float32Array(360);
  const cosTable = new Float32Array(360);
  const PI_2 = Math.PI * 2;
  const RAD_TO_DEG = 180 / Math.PI;

  for (let i = 0; i < 360; i++) {
    const rad = (i * Math.PI) / 180;
    sinTable[i] = Math.sin(rad);
    cosTable[i] = Math.cos(rad);
  }

  // 查表辅助函数：输入弧度，返回近似 Sin/Cos 值
  function getFastSin(rad) {
    // 将弧度转换为 0-359 的整数索引
    let deg = (rad * RAD_TO_DEG) % 360;
    if (deg < 0) deg += 360;
    return sinTable[deg | 0]; // | 0 取整
  }

  function getFastCos(rad) {
    let deg = (rad * RAD_TO_DEG) % 360;
    if (deg < 0) deg += 360;
    return cosTable[deg | 0];
  }

  // 基类：提供通用属性
  class CelestialObject {
    constructor() {
      this.depth = Math.random();
      this.depthLayer = Math.floor(this.depth * config.depthLayers);
      this.x = 0;
      this.y = 0;
    }

    // 验证数值有效性
    isValid() {
      return isFinite(this.x) && isFinite(this.y);
    }
  }

  // 星星类
  class Star extends CelestialObject {
    constructor() {
      super();
      // 初始化属性
      this.colorHex = this.getStarColor(); // 保存原始 Hex
      this.colorRgb = this.hexToRgbStr(this.colorHex); // 预计算 RGB 字符串 (例如 "255,255,255")
      this.reset();
      this.opacity = Math.random();
      this.twinkleSpeed = 0.02 + Math.random() * 0.03;
      this.parallaxFactor = 0.2 + this.depth * 0.8;
      this.color = this.getStarColor();
      this.originalX = 0;
      this.originalY = 0;
      // 初始化位置
      this.originalX = this.x = Math.random() * width;
      this.originalY = this.y = Math.random() * height;
    }

    reset() {
      // 根据深度层级调整大小和透明度
      const depthScale = 0.3 + this.depthLayer;
      this.size = Math.max(0.1, (0.3 + Math.random() * 1.8) * depthScale);
      this.baseOpacity = Math.max(0.05, Math.min(1, (0.15 + Math.random() * 0.7) * depthScale));
      this.blur = (1 - this.depth) * 2;
      this.twinklePhase = Math.random() * PI_2;
    }

    getStarColor() {
      const colors = config.colors.stars;
      return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.twinklePhase += this.twinkleSpeed;
      // 优化：使用查表法
      this.opacity = this.baseOpacity + getFastSin(this.twinklePhase) * 0.3;

      // 视差滚动：使用 globalTime
      this.x = this.originalX + getFastSin(globalTime * 0.05) * this.parallaxFactor * 10;
      this.y = this.originalY + getFastCos(globalTime * 0.05) * this.parallaxFactor * 5;
    }

    // 辅助函数：将 hex 颜色转为 "r, g, b" 字符串，方便后续拼接 rgba
    hexToRgbStr(hex) {
      let c;
      if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        c = hex.substring(1).split('');
        if (c.length === 3) {
          c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return +((c >> 16) & 255) + ',' + +((c >> 8) & 255) + ',' + +(c & 255);
      }
      // 如果解析失败或已经是rgb格式，返回默认白色（防止崩溃）
      return '255,255,255';
    }

    draw() {
      if (!this.isValid()) return;

      ctx.save();
      const depthOpacity = this.opacity * (0.4 + this.depth * 0.6);
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity));

      // 移除滤镜效果以提高性能

      // 简化绘制：直接使用圆形代替径向渐变
      const coreSize = Math.max(0.1, this.size * (0.8 + this.depth * 0.4));

      // 绘制核心
      ctx.fillStyle = this.colorHex;
      ctx.beginPath();
      ctx.arc(this.x, this.y, coreSize, 0, PI_2);
      ctx.fill();

      // 移除十字光芒效果以提高性能

      ctx.restore();
    }
  }

  // 流星类
  class Meteor extends CelestialObject {
    constructor() {
      super();
      this.reset();
    }

    reset() {
      this.depth = Math.random(); // 流星每次重置深度随机
      this.x = Math.random() * width * 0.8;
      this.y = -50;
      this.angle = Math.random() * Math.PI / 3 + Math.PI / 6;

      const depthScale = 0.4 + this.depth * 0.6;
      this.speed = (4 + Math.random() * 3) * depthScale; // 稍微调快一点
      this.curve = Math.random() * 0.002 - 0.001;
      this.size = (0.8 + Math.random() * 1.5) * depthScale;
      this.opacity = 1;
      this.trail = [];
      this.color = config.colors.meteors[Math.floor(Math.random() * config.colors.meteors.length)];
      this.life = (100 + Math.random() * 100) * (0.8 + this.depth * 0.4);
      this.maxLife = this.life;
      this.blur = (1 - this.depth) * 1.5;
    }

    update() {
      this.angle += this.curve;
      // 优化：查表法
      this.x += getFastCos(this.angle) * this.speed;
      this.y += getFastSin(this.angle) * this.speed;
      this.life--;

      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > 15) this.trail.shift();

      this.opacity = this.life / this.maxLife;

      if (this.life <= 0 || this.x < -100 || this.y > height + 100) {
        this.reset();
      }
    }

    draw() {
      if (!this.isValid()) return;

      ctx.save();

      // 简化流星绘制，移除滤镜和径向渐变
      const depthOpacity = this.opacity * (0.5 + this.depth * 0.5);

      // 绘制轨迹 - 简化为直线
      const trailLength = this.trail.length;
      if (trailLength > 1) {
        ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity * 0.6));
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (let i = 1; i < trailLength; i++) {
          ctx.lineTo(this.trail[i].x, this.trail[i].y);
        }
        ctx.stroke();
      }

      // 头部 - 简化为普通圆形
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity));
      const headSize = Math.max(0.1, this.size * (1.5 + this.depth));

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, headSize, 0, PI_2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 星云类
  class Nebula extends CelestialObject {
    constructor() {
      super();
      this.x = Math.random() * width;
      this.y = Math.random() * height;

      const depthScale = 0.5 + this.depth * 0.5;
      this.radius = (100 + Math.random() * 150) * depthScale;
      this.opacity = (0.05 + Math.random() * 0.15) * (0.6 + this.depth * 0.4);
      this.color = config.colors.nebulae[Math.floor(Math.random() * config.colors.nebulae.length)];
      this.pulseSpeed = (0.002 + Math.random() * 0.008) * (0.8 + this.depth * 0.4);
      this.pulsePhase = Math.random() * PI_2;
      this.drift = {
        x: (Math.random() - 0.5) * 0.2,
        y: (Math.random() - 0.5) * 0.2
      };
      this.blur = (1 - this.depth) * 3;
    }

    update() {
      this.pulsePhase += this.pulseSpeed;
      this.x += this.drift.x;
      this.y += this.drift.y;

      // 循环边界
      if (this.x < -this.radius) this.x = width + this.radius;
      if (this.x > width + this.radius) this.x = -this.radius;
      if (this.y < -this.radius) this.y = height + this.radius;
      if (this.y > height + this.radius) this.y = -this.radius;
    }

    draw() {
      if (!this.isValid()) return;

      ctx.save();

      // 移除滤镜效果以提高性能

      // 简化星云绘制，使用普通圆形代替径向渐变
      const pulseOpacity = this.opacity + getFastSin(this.pulsePhase) * 0.05;
      const depthOpacity = pulseOpacity * (0.4 + this.depth * 0.6);
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity));

      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.3, 0, PI_2); // 缩小星云大小以提高性能
      ctx.fill();

      ctx.restore();
    }
  }

  // 漂浮粒子类
  class FloatingParticle extends CelestialObject {
    constructor() {
      super();
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;

      const depthScale = 0.3 + this.depth * 0.7;
      this.size = (0.2 + Math.random() * 0.8) * depthScale;
      this.baseOpacity = (0.1 + Math.random() * 0.3) * (0.5 + this.depth * 0.5);

      this.drift = {
        x: (Math.random() - 0.5) * 0.3 * (0.6 + this.depth * 0.4),
        y: (Math.random() - 0.5) * 0.3 * (0.6 + this.depth * 0.4)
      };
      this.pulseSpeed = 0.02 + Math.random() * 0.03;
      this.pulsePhase = Math.random() * PI_2;
      this.blur = (1 - this.depth);
    }

    update() {
      this.x += this.drift.x;
      this.y += this.drift.y;
      this.pulsePhase += this.pulseSpeed;

      if (this.x < 0) this.x = width;
      if (this.x > width) this.x = 0;
      if (this.y < 0) this.y = height;
      if (this.y > height) this.y = 0;
    }

    draw() {
      if (!this.isValid()) return;

      ctx.save();

      // 移除滤镜效果以提高性能

      const pulseOpacity = this.baseOpacity + getFastSin(this.pulsePhase) * 0.1;
      ctx.globalAlpha = Math.max(0, Math.min(1, pulseOpacity * (0.3 + this.depth * 0.7)));
      ctx.fillStyle = config.colors.particles;
      ctx.beginPath();
      // 简化绘制，减小粒子大小
      ctx.arc(this.x, this.y, Math.max(0.1, this.size * 0.5), 0, PI_2);
      ctx.fill();

      ctx.restore();
    }
  }

  // 初始化
  function init() {
    resize();

    staticEntities = [];
    meteors = [];

    // 批量创建对象
    for (let i = 0; i < config.nebulaCount; i++) staticEntities.push(new Nebula());
    for (let i = 0; i < config.starCount; i++) staticEntities.push(new Star());
    for (let i = 0; i < config.floatingParticleCount; i++) staticEntities.push(new FloatingParticle());

    // --- 优化2：预先排序，避免在 animate 中每帧 sort ---
    // 根据 depth 从小到大排序 (远的先画)
    staticEntities.sort((a, b) => a.depth - b.depth);

    // 流星单独处理
    for (let i = 0; i < config.meteorCount; i++) meteors.push(new Meteor());

    // 渐现效果
    setTimeout(() => {
      canvas.style.opacity = '1';
    }, 100);
  }

  // 调整画布大小
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;

    // 只有尺寸真正变化时才重置 canvas 属性，避免闪烁
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    // 确保静态实体不在视口外（简单修正）
    if (staticEntities.length > 0) {
      staticEntities.forEach(entity => {
        if (entity.x > width) entity.x = Math.random() * width;
        if (entity.y > height) entity.y = Math.random() * height;
      });
    }
  }

  let lastTime = 0;
  const targetFPS = 20; // 降低帧率以提高性能
  const frameInterval = 1000 / targetFPS;

  // 动画循环
  function animate(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const deltaTime = timestamp - lastTime;

    if (deltaTime > frameInterval) {
      // 调整 globalTime 步进，使其与实际时间流逝挂钩，而不是帧数
      // 乘数控制整体动画速度
      globalTime += deltaTime * 0.05;

      lastTime = timestamp - (deltaTime % frameInterval);

      ctx.clearRect(0, 0, width, height);

      // 1. 更新并绘制静态实体 (已预排序)
      // 使用 for 循环比 forEach 性能略好
      for (let i = 0, len = staticEntities.length; i < len; i++) {
        const entity = staticEntities[i];
        entity.update();
        entity.draw();
      }

      // 2. 更新并绘制流星 (流星通常在最上层或穿插，这里为了性能放在最上层)
      for (let i = 0, len = meteors.length; i < len; i++) {
        const meteor = meteors[i];
        meteor.update();
        meteor.draw();
      }
    }

    animationId = requestAnimationFrame(animate);
  }

  // 销毁函数
  function destroy() {
    if (animationId) cancelAnimationFrame(animationId);
    window.removeEventListener('resize', resize);
    const existingCanvas = document.getElementById('enhanced-starry-sky');
    if (existingCanvas) {
      existingCanvas.style.opacity = '0';
      setTimeout(() => existingCanvas.remove(), 2000);
    }
  }

  // 事件监听
  window.addEventListener('resize', resize);

  // 启动
  init();
  animationId = requestAnimationFrame(animate);

  return destroy;
}

// 销毁函数 (全局暴露)
function destroyEnhancedStarrySky() {
  const canvas = document.getElementById('enhanced-starry-sky');
  if (canvas) {
    canvas.style.opacity = '0';
    setTimeout(() => {
      canvas.remove();
    }, 2000);
  }
}

// 导出到全局
window.createEnhancedStarrySky = createEnhancedStarrySky;
window.destroyEnhancedStarrySky = destroyEnhancedStarrySky;

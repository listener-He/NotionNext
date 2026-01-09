/**
 * 增强版星空背景 - 重构优化版
 * 特性：高性能离屏渲染、星座连线、物理透视流星、查表法数学优化
 * @param {number} gpuScore - GPU 分数
 */
function createEnhancedStarrySky(gpuScore) {
  // 1. 单例模式检查：防止重复创建 Canvas
  const CANVS_ID = 'enhanced-starry-sky';
  const existingCanvas = document.getElementById(CANVS_ID);
  if (existingCanvas) {
    return window.destroyEnhancedStarrySky;
  }
  // 判断是否有钱人
  const rich = gpuScore >= 10;
  // 2. 基础配置参数
  const config = {
    amount: {
      stars: rich ? 256 : 128,         // 星星数量
      meteors: rich ? 12 : 7,         // 同时存在的流星数量
      nebulae: rich ? 5 : 3,         // 星云数量
    },
    colors: {
      stars: ['#FFFFFF', '#C7D9FF', '#FFF6CC', '#FFDDCC'], // 冷暖色调混合
      meteors: ['#FFFFFF', '#E0F6FF'],
      nebulae: [
        'rgba(72, 61, 139, 0.15)',  // 深岩蓝
        'rgba(30, 144, 255, 0.10)', // 道奇蓝
        'rgba(199, 21, 133, 0.08)',  // 这种紫红色
        'rgba(100, 200, 255, 0.09)', // 浅蓝
        'rgba(150, 80, 255, 0.1)' // 浅紫色

      ]
    },
    speed: {
      rotation: 0.005,    // 整体旋转速度
      meteor: 1.2,        // 流星速度倍率
    },
    render: {
      maxConnectDistance: 120, // 星座连线最大距离
      starBaseSize: 1.5,
    }
  };

  // 3. 核心工具与数学优化

  // 预计算 Sin/Cos 表 (0-360度)，减少 Math 函数调用开销
  const TABLE_SIZE = 360;
  const sinTable = new Float32Array(TABLE_SIZE);
  const cosTable = new Float32Array(TABLE_SIZE);
  const PI_2 = Math.PI * 2;
  const DEG_TO_IDX = TABLE_SIZE / 360;

  for (let i = 0; i < TABLE_SIZE; i++) {
    const rad = (i * Math.PI) / 180;
    sinTable[i] = Math.sin(rad);
    cosTable[i] = Math.cos(rad);
  }

  // 快速获取 Sin 值
  const fastSin = (angle) => {
    let idx = (angle * DEG_TO_IDX) | 0; // 取整
    idx = idx % TABLE_SIZE;
    if (idx < 0) idx += TABLE_SIZE;
    return sinTable[idx];
  };

  // 快速获取 Cos 值
  const fastCos = (angle) => {
    let idx = (angle * DEG_TO_IDX) | 0;
    idx = idx % TABLE_SIZE;
    if (idx < 0) idx += TABLE_SIZE;
    return cosTable[idx];
  };

  // 颜色转换工具
  const hexToRgb = (hex) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}` : '255,255,255';
  };

  // 4. 离屏渲染缓存系统 (性能核心)
  // 预先绘制星星的模糊光晕形态，避免每帧都在主 Canvas 上使用高消耗的径向渐变
  const starCache = {}; // 缓存 Key: color -> Canvas

  const getStarImage = (color) => {
    if (starCache[color]) return starCache[color];

    const size = 10; // 缓存图像尺寸 (2x半径)
    const half = size / 2;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    // 绘制光晕星星
    const grad = ctx.createRadialGradient(half, half, 1, half, half, half);
    const rgb = hexToRgb(color);
    grad.addColorStop(0, `rgba(${rgb}, 1)`);      // 核心亮
    grad.addColorStop(0.4, `rgba(${rgb}, 0.3)`); // 光晕中
    grad.addColorStop(1, `rgba(${rgb}, 0)`);      // 边缘透明

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size); // fillRect 比 arc 快

    starCache[color] = c;
    return c;
  };

  // 5. 初始化 DOM
  const canvas = document.createElement('canvas');
  canvas.id = CANVS_ID;
  canvas.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    z-index: 10; pointer-events: none; opacity: 0; transition: opacity 1.5s ease-out;
  `;
  document.body.insertBefore(canvas, document.body.firstChild);

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = window.innerWidth;
  let height = window.innerHeight;
  let globalTime = 0;
  let frameId = null;

  // 实体数组
  const entities = {
    stars: [],
    meteors: [],
    nebulae: []
  };

  // 6. 实体类定义

  // 星星类：包含视差滚动、闪烁、缓存绘制
  class Star {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.z = Math.random(); // 深度：0(远) -> 1(近)

      // 属性计算
      this.size = (0.5 + this.z * 1.5) * config.render.starBaseSize;
      this.opacityBase = 0.3 + this.z * 0.7;
      this.twinkleSpeed = (Math.random() * 0.05 + 0.01) * (Math.random() > 0.5 ? 1 : -1);
      this.twinklePhase = Math.random() * 360;

      // 颜色与缓存
      const colorList = config.colors.stars;
      this.color = colorList[Math.floor(Math.random() * colorList.length)];
      this.image = getStarImage(this.color);

      // 运动偏移量 (视差)
      this.dx = (Math.random() - 0.5) * 0.2 * (1 + this.z);
      this.dy = (Math.random() - 0.5) * 0.2 * (1 + this.z);

      // 如果不是初始化，重置到屏幕外随机位置，让进入更自然
      if (!initial) {
        if (Math.random() > 0.5) {
          this.x = Math.random() > 0.5 ? -10 : width + 10;
        } else {
          this.y = Math.random() > 0.5 ? -10 : height + 10;
        }
      }
    }

    update() {
      // 缓慢漂移
      this.x += this.dx;
      this.y += this.dy;

      // 闪烁计算 (查表)
      this.twinklePhase += this.twinkleSpeed * 100;
      const twinkle = fastSin(this.twinklePhase) * 0.2;
      this.opacity = Math.max(0.1, Math.min(1, this.opacityBase + twinkle));

      // 边界检查 (环绕)
      const buffer = 20;
      if (this.x < -buffer) this.x = width + buffer;
      else if (this.x > width + buffer) this.x = -buffer;
      if (this.y < -buffer) this.y = height + buffer;
      else if (this.y > height + buffer) this.y = -buffer;
    }

    draw() {
      ctx.globalAlpha = this.opacity;
      // 使用 drawImage 绘制预渲染的星星，性能极佳
      // 将图像中心对准 x,y
      const drawSize = this.size * 2; // 缓存图是半径的2倍
      ctx.drawImage(this.image, this.x - this.size, this.y - this.size, drawSize, drawSize);
    }
  }

  // 流星类：模拟物理抛射和拖尾
  class Meteor {
    constructor() {
      this.reset();
      // 让流星初始位置在屏幕外，避免一开始就看到
      this.y = -100;
      this.wait = Math.random() * 200; // 随机延迟发射
    }

    reset() {
      this.x = Math.random() * width * 1.5 - width * 0.25; // 宽范围覆盖
      this.y = -50;
      this.z = Math.random(); // 深度影响速度和大小

      // 角度：从右上/正上 向下掉落
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.5;
      const randomSpeed = Math.random() * 10;
      this.speed = randomSpeed * (1 + this.z * 0.5) * config.speed.meteor;

      // 速度向量
      this.vx = Math.cos(angle) * this.speed;
      this.vy = Math.sin(angle) * this.speed;

      this.length = (20 + Math.random() * 30) * (1 + this.z);
      this.size = (1 + this.z) * 1.5;
      this.color = config.colors.meteors[Math.floor(Math.random() * config.colors.meteors.length)];
      this.active = false;
      this.wait = Math.random() * 300; // 每一轮结束后的冷却时间
    }

    update() {
      if (this.wait > 0) {
        this.wait--;
        return;
      }
      this.active = true;
      this.x += this.vx;
      this.y += this.vy;

      // 如果飞出边界，重置
      if (this.y > height + 100 || this.x < -100 || this.x > width + 100) {
        this.active = false;
        this.reset();
      }
    }

    draw() {
      if (!this.active) return;

      // 模拟拖尾：画一条渐变线
      // 尾部坐标计算：反向延伸速度向量
      const tailX = this.x - this.vx * (this.length / this.speed);
      const tailY = this.y - this.vy * (this.length / this.speed);

      const grad = ctx.createLinearGradient(this.x, this.y, tailX, tailY);
      grad.addColorStop(0, this.color); // 头亮
      grad.addColorStop(1, 'rgba(255,255,255,0)'); // 尾透

      ctx.globalAlpha = 0.8 * (0.5 + this.z * 0.5);
      ctx.strokeStyle = grad;
      ctx.lineWidth = this.size;
      ctx.lineCap = 'round';

      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();

      // 头部高光
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 0.6, 0, PI_2);
      ctx.fill();
    }
  }

  // 星云类：由于使用 fillRect 覆盖整个屏幕太慢，这里使用大的柔和光斑
  class Nebula {
    constructor(index) {
      this.index = index;
      this.reset();
    }

    reset() {
      this.x = Math.random() * width;
      this.y = Math.random() * height;
      this.radius = Math.min(width, height) * (0.4 + Math.random() * 0.3);
      this.color = config.colors.nebulae[this.index % config.colors.nebulae.length];
      this.phase = Math.random() * 360;
      this.speed = 0.2 + Math.random() * 0.3;
    }

    update() {
      this.phase += this.speed;
      // 简单的来回漂浮
      this.driftX = fastSin(this.phase) * 20;
      this.driftY = fastCos(this.phase * 0.7) * 20;
    }

    draw() {
      ctx.globalAlpha = 1;
      // 径向渐变模拟弥散气体
      const gx = this.x + this.driftX;
      const gy = this.y + this.driftY;
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, this.radius);
      grad.addColorStop(0, this.color);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = grad;
      // 只绘制该区域，比全屏清除后绘制更优
      // 为了融合效果，使用 globalCompositeOperation
      ctx.globalCompositeOperation = 'screen';
      ctx.beginPath();
      ctx.arc(gx, gy, this.radius, 0, PI_2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; // 还原混合模式
    }
  }

  // 7. 初始化逻辑
  function init() {
    entities.stars = Array.from({ length: config.amount.stars }, () => new Star());
    entities.meteors = Array.from({ length: config.amount.meteors }, () => new Meteor());
    entities.nebulae = Array.from({ length: config.amount.nebulae }, (_, i) => new Nebula(i));

    // 渐显 Canvas
    requestAnimationFrame(() => {
      canvas.style.opacity = '1';
    });

    resize();
    loop();
  }

  // 8. 绘制循环
  function loop() {
    globalTime++;

    // 清除画布
    ctx.clearRect(0, 0, width, height);

    // 绘制背景星云
    entities.nebulae.forEach(n => {
      n.update();
      n.draw();
    });

    // 绘制星星和连线
    // 技巧：为了性能，先更新所有数据，再一次性绘制
    // 连线逻辑：O(N^2) 复杂度，但 N=100 时只有 5000 次计算，JS 处理非常快
    const stars = entities.stars;
    const len = stars.length;

    // 1. 绘制连线 (位于星星下方)
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();

    for (let i = 0; i < len; i++) {
      const starA = stars[i];
      starA.update(); // 更新位置

      // 只对近处的星星连线，增加层次感
      if (starA.z < 0.5) continue;

      for (let j = i + 1; j < len; j++) {
        const starB = stars[j];
        if (starB.z < 0.5) continue;

        const dx = starA.x - starB.x;
        const dy = starA.y - starB.y;
        // 快速距离检查（先不平方根）
        const distSq = dx * dx + dy * dy;
        const maxDist = config.render.maxConnectDistance * (starA.z); // 越近连线距离允许越长

        if (distSq < maxDist * maxDist) {
          ctx.moveTo(starA.x, starA.y);
          ctx.lineTo(starB.x, starB.y);
        }
      }
    }
    ctx.stroke();

    // 2. 绘制星星实体
    for (let i = 0; i < len; i++) {
      stars[i].draw();
    }

    // 3. 绘制流星 (最上层)
    entities.meteors.forEach(m => {
      m.update();
      m.draw();
    });

    frameId = requestAnimationFrame(loop);
  }

  // 窗口调整
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
    // 重置部分实体位置防止拉伸错位
    entities.nebulae.forEach(n => n.reset());
  }

  window.addEventListener('resize', resize);
  init();

  // 9. 销毁逻辑 (闭包导出)
  function destroy() {
    if (frameId) cancelAnimationFrame(frameId);
    window.removeEventListener('resize', resize);
    if (canvas) {
      canvas.style.opacity = '0';
      setTimeout(() => {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }, 1500);
    }
  }

  return destroy;
}

// 全局导出与旧代码保持一致
window.createEnhancedStarrySky = createEnhancedStarrySky;
window.destroyEnhancedStarrySky = function() {
  const canvas = document.getElementById('enhanced-starry-sky');
  if (canvas) {
    // 这一步有点多余，因为 createEnhancedStarrySky 返回了 destroy 函数
    // 但为了兼容可能的直接调用，保留此逻辑
    canvas.style.opacity = '0';
    setTimeout(() => canvas.remove(), 1500);
  }
};

/* eslint-disable */
/* eslint-env browser */
// @ts-nocheck
/**
 * 增强版星空背景 - 为hexo主题夜间模式首页添加优雅浪漫的动画效果
 * 包含：流星雨、星座连线、闪烁星星、渐变色彩、粒子轨迹等效果
 */
function createEnhancedStarrySky() {
  // 检查是否已存在
  if (document.getElementById('enhanced-starry-sky')) {
    return
  }

  const canvas = document.createElement('canvas')
  canvas.id = 'enhanced-starry-sky'
  canvas.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 3;
    pointer-events: none;
    opacity: 0;
    transition: opacity 2s ease-in-out;
  `
  
  document.body.appendChild(canvas)
  
  const ctx = canvas.getContext('2d')
  let width, height
  let stars = []
  let meteors = []
  let nebulae = []  // 星云替代星座连线
  let galaxies = []  // 银河效果
  let floatingParticles = []  // 漂浮粒子替代上升粒子
  let animationId
  
  // 配置参数 - 优化密度和效果
  const config = {
    starCount: 120,  // 增加星星数量以支持多层深度
    meteorCount: 2,  // 减少流星数量
    nebulaCount: 3,  // 新增星云效果

    floatingParticleCount: 25,  // 增加漂浮粒子
    depthLayers: 5,  // 深度层级数量
    colors: {
      stars: ['#ffffff', '#b4c7ff', '#ffffcc', '#ffcc99', '#ff9999'],
      meteors: ['#ffffff', '#87ceeb', '#ffd700'],
      nebulae: ['rgba(138, 43, 226, 0.3)', 'rgba(30, 144, 255, 0.25)', 'rgba(255, 20, 147, 0.2)', 'rgba(0, 191, 255, 0.25)'],
      particles: '#87ceeb'
    }
  }
  
  // 星星类 - 增强深度层次和立体感
  class Star {
    constructor() {
      this.reset()
      this.opacity = Math.random()
      this.twinkleSpeed = 0.005 + Math.random() * 0.015  // 更慢的闪烁
      this.depth = Math.random()  // 深度层次 (0-1)
      this.depthLayer = Math.floor(this.depth * config.depthLayers)  // 离散深度层级
      this.parallaxFactor = 0.2 + this.depth * 0.8  // 视差因子
      this.color = this.getStarColor()
      this.originalX = 0
      this.originalY = 0
    }
    
    reset() {
       this.originalX = this.x = Math.random() * width
       this.originalY = this.y = Math.random() * height
       
       // 根据深度层级调整大小和透明度，创造景深效果
       const depthScale = 0.3 + this.depth * 0.7
       this.size = Math.max(0.1, (0.3 + Math.random() * 1.8) * depthScale)
       this.baseOpacity = Math.max(0.05, Math.min(1, (0.15 + Math.random() * 0.7) * depthScale))
       
       // 远处的星星更模糊，近处的更清晰
       this.blur = (1 - this.depth) * 2
       this.twinklePhase = Math.random() * Math.PI * 2
       
       // 确保所有数值都是有限的
       if (!isFinite(this.x)) this.x = width / 2
       if (!isFinite(this.y)) this.y = height / 2
       if (!isFinite(this.size)) this.size = 1
       if (!isFinite(this.baseOpacity)) this.baseOpacity = 0.5
     }
    
    getStarColor() {
      const colors = config.colors.stars
      return colors[Math.floor(Math.random() * colors.length)]
    }
    
    update() {
      this.twinklePhase += this.twinkleSpeed
      this.opacity = this.baseOpacity + Math.sin(this.twinklePhase) * 0.3
      
      // 添加轻微的视差滚动效果（模拟鼠标移动或页面滚动）
      const mouseInfluence = 0.001
      this.x = this.originalX + Math.sin(Date.now() * 0.0001) * this.parallaxFactor * 10
      this.y = this.originalY + Math.cos(Date.now() * 0.0001) * this.parallaxFactor * 5
    }
    
    draw() {
      // 数值验证，防止 NaN 或 Infinity
      if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.size) || !isFinite(this.opacity)) {
        return
      }
      
      ctx.save()
      
      // 根据深度调整透明度和模糊效果
      const depthOpacity = this.opacity * (0.4 + this.depth * 0.6)
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity))
      
      // 添加景深模糊效果（远处的星星更模糊）
      if (this.blur > 0.5) {
        ctx.filter = `blur(${this.blur}px)`
      }
      
      // 绘制增强的星星光晕，根据深度调整大小
      const haloSize = Math.max(0.1, this.size * (2 + this.depth * 2))
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloSize)
      
      // 近处的星星光晕更强烈
      const coreIntensity = 0.3 + this.depth * 0.4
      gradient.addColorStop(0, this.color.replace(')', `, ${coreIntensity})`))
      gradient.addColorStop(0.3, this.color.replace(')', `, ${coreIntensity * 0.5})`))
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(this.x, this.y, haloSize, 0, Math.PI * 2)
      ctx.fill()
      
      // 绘制星星核心，近处的更亮更大
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity * 1.2))
      ctx.fillStyle = this.color
      ctx.beginPath()
      ctx.arc(this.x, this.y, Math.max(0.1, this.size * (0.8 + this.depth * 0.4)), 0, Math.PI * 2)
      ctx.fill()
      
      // 为最前景的星星添加十字光芒效果
      if (this.depth > 0.8 && this.opacity > 0.7) {
        ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity * 0.6))
        ctx.strokeStyle = this.color
        ctx.lineWidth = 0.5
        const rayLength = this.size * 4
        
        ctx.beginPath()
        ctx.moveTo(this.x - rayLength, this.y)
        ctx.lineTo(this.x + rayLength, this.y)
        ctx.moveTo(this.x, this.y - rayLength)
        ctx.lineTo(this.x, this.y + rayLength)
        ctx.stroke()
      }
      
      ctx.restore()
    }
  }
  
  // 流星类 - 更自然的曲线轨迹和深度效果
  class Meteor {
    constructor() {
      this.depth = Math.random()  // 深度层次
      this.reset()
    }
    
    reset() {
      this.x = Math.random() * width * 0.3  // 从左上区域开始
      this.y = -50
      this.angle = Math.random() * Math.PI / 3 + Math.PI / 6  // 30-60度角
      
      // 根据深度调整速度和大小
      const depthScale = 0.4 + this.depth * 0.6
      this.speed = (1.5 + Math.random() * 2) * depthScale  // 近处的流星移动更快
      this.curve = Math.random() * 0.002 - 0.001  // 轻微的曲线
      this.size = (0.8 + Math.random() * 1.5) * depthScale
      this.opacity = 1
      this.trail = []
      this.color = config.colors.meteors[Math.floor(Math.random() * config.colors.meteors.length)]
      this.life = (100 + Math.random() * 200) * (0.8 + this.depth * 0.4)  // 近处的流星生命更长
      this.maxLife = this.life
      this.blur = (1 - this.depth) * 1.5  // 远处的流星更模糊
    }
    
    update() {
      // 使用角度和曲线计算位置
      this.angle += this.curve
      this.x += Math.cos(this.angle) * this.speed
      this.y += Math.sin(this.angle) * this.speed
      this.life--
      
      // 添加轨迹点
      this.trail.push({ x: this.x, y: this.y, opacity: this.opacity })
      if (this.trail.length > 20) {
        this.trail.shift()
      }
      
      // 更新透明度
      this.opacity = this.life / this.maxLife
      
      // 重置条件
      if (this.life <= 0 || this.x < -100) {
        this.reset()
      }
    }
    
    draw() {
      // 数值验证
      if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.size) || !isFinite(this.opacity)) {
        return
      }
      
      ctx.save()
      
      // 根据深度添加模糊效果
      if (this.blur > 0.5) {
        ctx.filter = `blur(${this.blur}px)`
      }
      
      // 根据深度调整整体透明度
      const depthOpacity = this.opacity * (0.5 + this.depth * 0.5)
      
      // 绘制轨迹，近处的轨迹更长更亮
      const trailLength = Math.floor(20 * (0.7 + this.depth * 0.3))
      for (let i = 0; i < Math.min(this.trail.length, trailLength); i++) {
        const point = this.trail[i]
        if (!isFinite(point.x) || !isFinite(point.y)) continue
        
        const trailOpacity = (i / this.trail.length) * depthOpacity * 0.6
        const trailSize = Math.max(0.1, this.size * (i / this.trail.length) * (0.8 + this.depth * 0.4))
        
        ctx.globalAlpha = Math.max(0, Math.min(1, trailOpacity))
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(point.x, point.y, trailSize, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // 绘制流星头部，近处的更大更亮
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity))
      const headSize = Math.max(0.1, this.size * (1.5 + this.depth * 1))
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, headSize)
      
      // 近处的流星光晕更强烈
      const coreIntensity = 0.4 + this.depth * 0.4
      gradient.addColorStop(0, this.color.replace(')', `, ${coreIntensity})`) || this.color)
      gradient.addColorStop(0.4, this.color.replace(')', `, ${coreIntensity * 0.3})`) || this.color)
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(this.x, this.y, headSize, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
  }
  
  // 星云类 - 增加深空感和层次
  class Nebula {
    constructor() {
      this.depth = Math.random()  // 深度层次
      this.x = Math.random() * width
      this.y = Math.random() * height
      
      // 根据深度调整大小和透明度
      const depthScale = 0.5 + this.depth * 0.5
      this.radius = (100 + Math.random() * 150) * depthScale
      this.opacity = (0.05 + Math.random() * 0.15) * (0.6 + this.depth * 0.4)  // 近处的星云更明显
      this.color = config.colors.nebulae[Math.floor(Math.random() * config.colors.nebulae.length)]
      this.pulseSpeed = (0.002 + Math.random() * 0.008) * (0.8 + this.depth * 0.4)
      this.pulsePhase = Math.random() * Math.PI * 2
      this.drift = {
        x: (Math.random() - 0.5) * 0.2 * (0.5 + this.depth * 0.5),
        y: (Math.random() - 0.5) * 0.2 * (0.5 + this.depth * 0.5)
      }
      this.blur = (1 - this.depth) * 3  // 远处的星云更模糊
    }
    
    update() {
      // 脉动效果
      this.pulsePhase += this.pulseSpeed
      
      // 缓慢漂移
      this.x += this.drift.x
      this.y += this.drift.y
      
      // 边界检查
      if (this.x < -this.radius) this.x = width + this.radius
      if (this.x > width + this.radius) this.x = -this.radius
      if (this.y < -this.radius) this.y = height + this.radius
      if (this.y > height + this.radius) this.y = -this.radius
    }
    
    draw() {
      // 数值验证
      if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.radius) || !isFinite(this.opacity)) {
        return
      }
      
      ctx.save()
      
      // 根据深度添加模糊效果
      if (this.blur > 1) {
        ctx.filter = `blur(${this.blur}px)`
      }
      
      const pulseOpacity = this.opacity + Math.sin(this.pulsePhase) * 0.05
      const depthOpacity = pulseOpacity * (0.4 + this.depth * 0.6)
      ctx.globalAlpha = Math.max(0, Math.min(1, depthOpacity))
      
      // 创建多层径向渐变，增强立体感
      const safeRadius = Math.max(0.1, this.radius)
      const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, safeRadius)
      
      // 近处的星云有更复杂的渐变
      if (this.depth > 0.6) {
        const alpha1 = Math.max(0, Math.min(1, 0.3 + this.depth * 0.2))
        const alpha2 = Math.max(0, Math.min(1, 0.15 + this.depth * 0.1))
        const alpha3 = Math.max(0, Math.min(1, 0.05 + this.depth * 0.05))
        gradient.addColorStop(0, this.color.replace(/[\d\.]+\)$/, `${alpha1})`))
        gradient.addColorStop(0.3, this.color.replace(/[\d\.]+\)$/, `${alpha2})`))
        gradient.addColorStop(0.7, this.color.replace(/[\d\.]+\)$/, `${alpha3})`))
      } else {
        gradient.addColorStop(0, this.color)
        const alpha = Math.max(0, Math.min(1, 0.05 + this.depth * 0.05))
        gradient.addColorStop(0.5, this.color.replace(/[\d\.]+\)$/, `${alpha})`))
      }
      gradient.addColorStop(1, 'transparent')
      
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(this.x, this.y, safeRadius, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
  }
  

  
  // 漂浮粒子类 - 营造深空氛围和立体感
  class FloatingParticle {
    constructor() {
      this.depth = Math.random()  // 深度层次
      this.reset()
    }
    
    reset() {
      this.x = Math.random() * width
      this.y = Math.random() * height
      
      // 根据深度调整大小和透明度
      const depthScale = 0.3 + this.depth * 0.7
      this.size = (0.2 + Math.random() * 0.8) * depthScale
      this.baseOpacity = (0.1 + Math.random() * 0.3) * (0.5 + this.depth * 0.5)
      
      // 近处的粒子移动更快
      this.drift = {
        x: (Math.random() - 0.5) * 0.3 * (0.6 + this.depth * 0.4),
        y: (Math.random() - 0.5) * 0.3 * (0.6 + this.depth * 0.4)
      }
      this.pulseSpeed = (0.005 + Math.random() * 0.01) * (0.8 + this.depth * 0.4)
      this.pulsePhase = Math.random() * Math.PI * 2
      this.blur = (1 - this.depth) * 1  // 远处的粒子更模糊
    }
    
    update() {
      // 缓慢漂移
      this.x += this.drift.x
      this.y += this.drift.y
      
      // 脉动效果
      this.pulsePhase += this.pulseSpeed
      
      // 边界检查
      if (this.x < 0) this.x = width
      if (this.x > width) this.x = 0
      if (this.y < 0) this.y = height
      if (this.y > height) this.y = 0
    }
    
    draw() {
      // 数值验证
      if (!isFinite(this.x) || !isFinite(this.y) || !isFinite(this.size) || !isFinite(this.baseOpacity)) {
        return
      }
      
      ctx.save()
      
      // 根据深度添加模糊效果
      if (this.blur > 0.3) {
        ctx.filter = `blur(${this.blur}px)`
      }
      
      const pulseOpacity = this.baseOpacity + Math.sin(this.pulsePhase) * 0.1
      const depthOpacity = pulseOpacity * (0.3 + this.depth * 0.7)
      const finalOpacity = Math.max(0, Math.min(1, depthOpacity))
      
      ctx.globalAlpha = finalOpacity
      
      // 近处的粒子有光晕效果
      if (this.depth > 0.7) {
        const haloSize = this.size * 2
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, haloSize)
        gradient.addColorStop(0, config.colors.particles)
        gradient.addColorStop(1, 'transparent')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(this.x, this.y, haloSize, 0, Math.PI * 2)
        ctx.fill()
      }
      
      // 绘制粒子核心
      ctx.fillStyle = config.colors.particles
      ctx.beginPath()
      ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2)
      ctx.fill()
      
      ctx.restore()
    }
  }
  
  // 初始化
  function init() {
    resize()
    
    // 创建星星
    stars = []
    for (let i = 0; i < config.starCount; i++) {
      stars.push(new Star())
    }
    
    // 创建流星
    meteors = []
    for (let i = 0; i < config.meteorCount; i++) {
      meteors.push(new Meteor())
    }
    
    // 创建星云
    nebulae = []
    for (let i = 0; i < config.nebulaCount; i++) {
      nebulae.push(new Nebula())
    }
    

    
    // 创建漂浮粒子
    floatingParticles = []
    for (let i = 0; i < config.floatingParticleCount; i++) {
      floatingParticles.push(new FloatingParticle())
    }
    
    // 渐现效果
    setTimeout(() => {
      canvas.style.opacity = '1'
    }, 500)
  }
  
  // 调整画布大小
  function resize() {
    width = window.innerWidth
    height = window.innerHeight
    canvas.width = width
    canvas.height = height
    
    // 重新定位现有元素
    stars.forEach(star => {
      if (star.x > width) star.x = width - 10
      if (star.y > height) star.y = height - 10
    })
  }
  
  // 性能优化变量
  let frameCount = 0
  const targetFPS = 30 // 降低帧率以提升性能
  
  // 动画循环
  function animate() {
    frameCount++
    
    // 性能优化：降低更新频率
    if (frameCount % 2 === 0) {
      // 清除画布
      ctx.clearRect(0, 0, width, height)
      
      // 不绘制背景渐变，让原有星空背景显示
      
      // 更新所有元素
      nebulae.forEach(nebula => nebula.update())

      stars.forEach(star => star.update())
      floatingParticles.forEach(particle => particle.update())
      meteors.forEach(meteor => meteor.update())
      
      // 按深度分层渲染 - 从远到近
      const allElements = [
        ...nebulae.map(n => ({element: n, depth: n.depth, type: 'nebula'})),

        ...stars.map(s => ({element: s, depth: s.depth, type: 'star'})),
        ...floatingParticles.map(p => ({element: p, depth: p.depth, type: 'particle'})),
        ...meteors.map(m => ({element: m, depth: m.depth, type: 'meteor'}))
      ]
      
      // 按深度排序，远处的先绘制
      allElements.sort((a, b) => a.depth - b.depth)
      
      // 分层绘制
      allElements.forEach(({element}) => {
        element.draw()
      })
    }
    
    animationId = requestAnimationFrame(animate)
  }
  
  // 销毁函数
  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
    const existingCanvas = document.getElementById('enhanced-starry-sky')
    if (existingCanvas) {
      existingCanvas.remove()
    }
    window.removeEventListener('resize', resize)
  }
  
  // 事件监听
  window.addEventListener('resize', resize)
  
  // 启动
  init()
  animate()
  
  // 返回销毁函数
  return destroy
}

// 销毁函数
function destroyEnhancedStarrySky() {
  const canvas = document.getElementById('enhanced-starry-sky')
  if (canvas) {
    canvas.style.opacity = '0'
    setTimeout(() => {
      canvas.remove()
    }, 2000)
  }
}

// 导出到全局
window.createEnhancedStarrySky = createEnhancedStarrySky
window.destroyEnhancedStarrySky = destroyEnhancedStarrySky
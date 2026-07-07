import { getDevicePerformance } from '@/components/PerformanceDetector'

const Card = ({ children, headerSlot, className }) => {
  const { isLowEndDevice } = getDevicePerformance()

  // 低端设备用实心卡片（card-base）降级；否则用玻璃拟态（glassmorphism）
  // 两者均走设计系统 intent/elevation 变量，暗色自动自适应
  const surfaceClass = isLowEndDevice ? 'card-base' : 'glassmorphism'

  return (
    <div className={className}>
      <>{headerSlot}</>
      <section
        className={`rounded-xl lg:p-6 p-4 transition-all ease-out author-info-card text-[color:var(--color-text-secondary)] ${surfaceClass}`}>
        {children}
      </section>
    </div>
  )
}
export default Card

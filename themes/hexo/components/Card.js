import { getDevicePerformance } from '@/components/PerformanceDetector'

const Card = ({ children, headerSlot, className }) => {
  const { isLowEndDevice } = getDevicePerformance()
  
  // 动态拼装玻璃态与性能降级类名
  const glassClasses = isLowEndDevice 
    ? 'bg-white dark:bg-[#1e1e1e]' 
    : 'bg-white/70 dark:bg-black/60 backdrop-blur-md'
    
  return <div className={className}>
    <>{headerSlot}</>
    <section className={`dark:text-gray-300 rounded-xl lg:p-6 p-4 lg:duration-100 transition-all ease-out author-info-card shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border dark:border-gray-800 ${glassClasses}`}>
        {children}
    </section>
  </div>
}
export default Card

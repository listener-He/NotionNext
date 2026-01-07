/**
 * 波浪动画组件
 * 放置在Hero底部，用于平滑过渡到内容区
 */
const Wave = () => {
  return (
    <div className="waves-box relative w-full h-[60px] md:h-[100px] overflow-hidden z-10 -mt-1">
      <svg
        className="waves-custom w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        shapeRendering="auto"
      >
        <defs>
          <path
            id="gentle-wave"
            d="M0,60 C150,120 450,0 600,60 C750,120 1050,0 1200,60 V120 H0 Z"
          />
        </defs>
        <g className="parallax">
          {/* Layer 1: 最底层，透明度极低，移动慢 */}
          <g className="wave-layer layer-1">
            <use href="#gentle-wave" x="0" y="0" className="fill-white/10 dark:fill-[#020617]/10" />
            <use href="#gentle-wave" x="-1200" y="0" className="fill-white/10 dark:fill-[#020617]/10" />
            <use href="#gentle-wave" x="1200" y="0" className="fill-white/10 dark:fill-[#020617]/10" />
          </g>
          
          {/* Layer 2 */}
          <g className="wave-layer layer-2">
            <use href="#gentle-wave" x="0" y="3" className="fill-white/20 dark:fill-[#020617]/20" />
            <use href="#gentle-wave" x="-1200" y="3" className="fill-white/20 dark:fill-[#020617]/20" />
            <use href="#gentle-wave" x="1200" y="3" className="fill-white/20 dark:fill-[#020617]/20" />
          </g>

          {/* Layer 3 */}
          <g className="wave-layer layer-3">
            <use href="#gentle-wave" x="0" y="5" className="fill-white/40 dark:fill-[#020617]/40" />
            <use href="#gentle-wave" x="-1200" y="5" className="fill-white/40 dark:fill-[#020617]/40" />
            <use href="#gentle-wave" x="1200" y="5" className="fill-white/40 dark:fill-[#020617]/40" />
          </g>

          {/* Layer 4: 最顶层，不透明，与下方内容背景色一致 */}
          <g className="wave-layer layer-4">
            <use href="#gentle-wave" x="0" y="7" className="fill-white dark:fill-[#020617]" />
            <use href="#gentle-wave" x="-1200" y="7" className="fill-white dark:fill-[#020617]" />
            <use href="#gentle-wave" x="1200" y="7" className="fill-white dark:fill-[#020617]" />
          </g>
        </g>
      </svg>
      <style jsx global>{`
        .waves-box {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
        }
        
        .wave-layer {
           animation: wave-move 25s cubic-bezier(0.55, 0.5, 0.45, 0.5) infinite;
        }
        
        /* Different speeds and delays for parallax effect */
        .layer-1 {
          animation-delay: -2s;
          animation-duration: 7s;
        }
        .layer-2 {
          animation-delay: -3s;
          animation-duration: 10s;
        }
        .layer-3 {
          animation-delay: -4s;
          animation-duration: 13s;
        }
        .layer-4 {
          animation-delay: -5s;
          animation-duration: 20s;
        }

        @keyframes wave-move {
          0% {
            transform: translate3d(-90px, 0, 0);
          }
          100% {
            transform: translate3d(85px, 0, 0);
          }
        }
        
        /* Mobile adjustment */
        @media (max-width: 768px) {
          .waves-box {
            height: 40px; 
            min-height: 40px;
          }
        }
      `}</style>
    </div>
  )
}

export default Wave

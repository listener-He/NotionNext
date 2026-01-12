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
          {/* Day Mode Liquid Gradient - Matches Aurora Palette */}
          <linearGradient id="wave-liquid-day" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#FFD1C1" /> {/* Peach */}
             <stop offset="50%" stopColor="#C7D2FE" /> {/* Periwinkle */}
             <stop offset="100%" stopColor="#FBCFE8" /> {/* Rose */}
          </linearGradient>

           {/* Night Mode Liquid Gradient - Matches Nebula Palette */}
          <linearGradient id="wave-liquid-night" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#312E81" /> {/* Indigo 900 */}
             <stop offset="50%" stopColor="#4C1D95" /> {/* Violet 900 */}
             <stop offset="100%" stopColor="#1E3A8A" /> {/* Blue 900 */}
          </linearGradient>
        </defs>
        <g className="parallax">
          {/* Layer 1: Deep Background Reflection */}
          <g className="wave-layer layer-1">
            <use href="#gentle-wave" x="0" y="0" className="fill-[url(#wave-liquid-day)] dark:fill-[url(#wave-liquid-night)] opacity-30" />
            <use href="#gentle-wave" x="-1200" y="0" className="fill-[url(#wave-liquid-day)] dark:fill-[url(#wave-liquid-night)] opacity-30" />
            <use href="#gentle-wave" x="1200" y="0" className="fill-[url(#wave-liquid-day)] dark:fill-[url(#wave-liquid-night)] opacity-30" />
          </g>
          
          {/* Layer 2: Frosted Glass Effect (Semi-transparent White) */}
          <g className="wave-layer layer-2">
            <use href="#gentle-wave" x="0" y="3" className="fill-white/40 dark:fill-white/10" />
            <use href="#gentle-wave" x="-1200" y="3" className="fill-white/40 dark:fill-white/10" />
            <use href="#gentle-wave" x="1200" y="3" className="fill-white/40 dark:fill-white/10" />
          </g>

          {/* Layer 3: Surface Reflection (Higher Opacity White) */}
          <g className="wave-layer layer-3">
            <use href="#gentle-wave" x="0" y="5" className="fill-white/70 dark:fill-white/20" />
            <use href="#gentle-wave" x="-1200" y="5" className="fill-white/70 dark:fill-white/20" />
            <use href="#gentle-wave" x="1200" y="5" className="fill-white/70 dark:fill-white/20" />
          </g>

          {/* Layer 4: Content Transition (Solid White or Page Background) */}
          <g className="wave-layer layer-4">
             {/* Note: We use the base background color here to blend seamlessy with the content area below */}
            <use href="#gentle-wave" x="0" y="7" className="fill-[#F8FAFC] dark:fill-[#020617]" />
            <use href="#gentle-wave" x="-1200" y="7" className="fill-[#F8FAFC] dark:fill-[#020617]" />
            <use href="#gentle-wave" x="1200" y="7" className="fill-[#F8FAFC] dark:fill-[#020617]" />
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

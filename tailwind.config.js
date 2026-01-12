const BLOG = require('./blog.config')
const { fontFamilies } = require('./lib/font')

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './themes/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}'
  ],
  safelist: [
    'text-blue-700',
    'dark:text-gray-300',
    'border-gray-200',
    'dark:border-gray-600',
    'bg-aurora-gradient',
    'bg-nebula-gradient',
    'tag-badge-day',
    'tag-badge-night'
  ],
  darkMode: BLOG.APPEARANCE === 'class' ? 'media' : 'class', // or 'media' or 'class'
  theme: {
    fontFamily: {
      sans: ['Inter', 'Noto Sans SC', ...fontFamilies.sans],
      serif: ['Playfair Display', 'Noto Serif SC', 'Times New Roman', ...fontFamilies.serif],
      mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      ...fontFamilies
    },
    screens: {
      sm: '540px',
      // => @media (min-width: 576px) { ... }
      md: '720px',
      // => @media (min-width: 768px) { ... }
      lg: '960px',
      // => @media (min-width: 992px) { ... }
      xl: '1140px',
      // => @media (min-width: 1200px) { ... }
      '2xl': '1536px'
    },
    container: {
      center: true,
      padding: '16px'
    },
    extend: {
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px'
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px'
      },
      colors: {
        // Design System: Semantic Colors
        primary: {
          DEFAULT: '#38BDF8', // Sky Blue 400
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          DEFAULT: '#64748B', // Slate 500
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        // Modern Aurora Palette
        aurora: {
          pink: '#FFF1F2', // Rose 50
          peach: '#FFEDD5', // Orange 100
          sky: '#E0F2FE',   // Sky 100
          lavender: '#F3E8FF' // Purple 100
        },
        // Modern Nebula Palette
        nebula: {
          dark: '#0F172A',  // Slate 900
          void: '#020617',  // Slate 950
          purple: '#3B0764', // Purple 950
          indigo: '#1E1B4B'  // Indigo 950
        },
        neutral: {
          DEFAULT: '#64748B',
          light: '#E5E7EB',
          dark: '#1F2937'
        },
        success: '#10B981', // Emerald 500
        warning: '#FBBF24', // Amber 400
        error: '#EF4444', // Red 500
        info: '#3B82F6', // Blue 500

        // Legacy/Theme Support
        day: {
          DEFAULT: '#FFFFFF' // Pure White
        },
        night: {
          DEFAULT: '#020617' // Deep Space
        },
        hexo: {
          'background-gray': '#F9FAFB',
          'black-gray': '#020617',
          'light-gray': '#E5E7EB'
        },
        crystal: {
          clear: '#FFFFFF',
          sky: '#38BDF8',
          glass: 'rgba(255, 255, 255, 0.7)',
          'glass-dark': 'rgba(15, 23, 42, 0.6)'
        },
        dark: {
          DEFAULT: '#0F172A',
          2: '#1E293B',
          3: '#334155',
          4: '#475569',
          5: '#64748B',
          6: '#94A3B8',
          7: '#CBD5E1',
          8: '#E2E8F0'
        },
        // Mappings for compatibility
        'blue-dark': '#0EA5E9',
        'body-color': '#374151',
        'body-secondary': '#6B7280',
        stroke: '#E2E8F0',
        'gray-1': '#F8FAFC',
        'gray-2': '#F1F5F9',
        'gray-7': '#CBD5E1'
      },
      maxWidth: {
        side: '16rem',
        '9/10': '90%',
        'screen-3xl': '1440px',
        'screen-4xl': '1560px'
      },
      boxShadow: {
        'elevation-xs': '0 1px 2px rgba(0,0,0,0.02)',
        'elevation-sm': '0 4px 6px -1px rgba(0,0,0,0.02), 0 2px 4px -1px rgba(0,0,0,0.02)',
        'elevation-md': '0 10px 15px -3px rgba(0,0,0,0.04), 0 4px 6px -2px rgba(0,0,0,0.02)',
        'elevation-lg': '0 20px 25px -5px rgba(0,0,0,0.05), 0 10px 10px -5px rgba(0,0,0,0.02)',
        'elevation-xl': '0 25px 50px -12px rgba(0,0,0,0.08)',
        input: '0px 7px 20px rgba(0, 0, 0, 0.03)',
        form: '0px 1px 55px -11px rgba(0, 0, 0, 0.01)',
        pricing: '0px 0px 40px 0px rgba(0, 0, 0, 0.08)',
        'switch-1': '0px 0px 5px rgba(0, 0, 0, 0.15)',
        testimonial: '0px 10px 20px 0px rgba(92, 115, 160, 0.07)',
        'testimonial-btn': '0px 8px 15px 0px rgba(72, 72, 138, 0.08)',
        1: '0px 1px 3px 0px rgba(166, 175, 195, 0.40)',
        2: '0px 5px 12px 0px rgba(0, 0, 0, 0.10)'
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
        entrance: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
        exit: 'cubic-bezier(0.4, 0.0, 1, 1)'
      },
      keyframes: {
        'bg-pulse': {
          '0%, 100%': { filter: 'saturate(100%)' },
          '50%': { filter: 'saturate(110%)' }
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      },
      animation: {
        'bg-pulse': 'bg-pulse 6s ease-in-out infinite',
        'gradient-slow': 'gradient-shift 15s ease infinite',
      }
    }
  },
  variants: {
    extend: {}
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.tap-target': {
          minWidth: '44px',
          minHeight: '44px'
        },
        '.card-base': {
          borderRadius: theme('borderRadius.xl'),
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)',
          backgroundColor: '#FFFFFF', // Pure White for sharp contrast
          border: '1px solid rgba(0, 0, 0, 0.02)' // Extremely subtle border
        },
        '.ellipsis': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        },
        // Modern Aurora Gradient (Day) - Enhanced for visibility
        '.bg-aurora-gradient': {
          background: 'linear-gradient(-45deg, #FFEFD5, #E0F7FA, #E1F5FE, #F3E5F5)', // Peach -> Cyan -> Sky -> Lavender
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite',
        },
        // Modern Nebula Gradient (Night)
        '.bg-nebula-gradient': {
          background: 'linear-gradient(-45deg, #0f172a, #1e1b4b, #3b0764, #020617)',
          backgroundSize: '400% 400%',
          animation: 'gradient-shift 15s ease infinite',
        },
        '.tag-badge-day': {
          backgroundColor: '#F0F9FF', // Sky tint
          color: '#0369A1',
          borderRadius: theme('borderRadius.sm'),
          border: '1px solid #E0F2FE'
        },
        '.tag-badge-night': {
          backgroundColor: '#0F172A',
          color: '#38BDF8',
          borderRadius: theme('borderRadius.sm'),
          border: '1px solid #1E293B'
        },
        // Glassmorphism 2.0
        '.glass-morphism': {
          background: 'rgba(255, 255, 255, 0.65)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)',
        },
        '.glass-morphism-dark': {
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(16px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
        }
      }
      addUtilities(newUtilities, ['responsive'])
    }
  ]
}

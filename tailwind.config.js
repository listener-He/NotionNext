const BLOG = require('./blog.config')
const { fontFamilies } = require('./lib/font')

module.exports = {
  content: [
    './pages/**/*.js',
    './components/**/*.js',
    './layouts/**/*.js',
    './themes/**/*.js'
  ],
  darkMode: BLOG.APPEARANCE === 'class' ? 'media' : 'class', // or 'media' or 'class'
  theme: {
    fontFamily: fontFamilies,
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
        xl: '24px'
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px'
      },
      colors: {
        day: {
          DEFAULT: BLOG.BACKGROUND_LIGHT || '#ffffff'
        },
        night: {
          DEFAULT: BLOG.BACKGROUND_DARK || '#111827'
        },
        hexo: {
          'background-gray': '#f5f5f5',
          'black-gray': '#101414',
          'light-gray': '#e5e5e5'
        },
        // black: '#212b36',
        'dark-700': '#090e34b3',
        dark: {
          DEFAULT: '#111928',
          2: '#1F2A37',
          3: '#374151',
          4: '#4B5563',
          5: '#6B7280',
          6: '#9CA3AF',
          7: '#D1D5DB',
          8: '#E5E7EB'
        },
        primary: '#1E3A8A',
        'blue-dark': '#1E40AF',
        secondary: '#13C296',
        'body-color': '#637381',
        'body-secondary': '#8899A8',
        warning: '#FBBF24',
        stroke: '#DFE4EA',
        'gray-1': '#F9FAFB',
        'gray-2': '#F3F4F6',
        'gray-7': '#CED4DA'
      },
      maxWidth: {
        side: '14rem',
        '9/10': '90%',
        'screen-3xl': '1440px',
        'screen-4xl': '1560px'
      },
      boxShadow: {
        'elevation-sm': '0 1px 2px rgba(0,0,0,.06)',
        'elevation-md': '0 4px 12px rgba(0,0,0,.08)',
        'elevation-lg': '0 10px 24px rgba(0,0,0,.12)',
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
        standard: 'cubic-bezier(.2,.8,.2,1)'
      },
      keyframes: {
        'bg-pulse': {
          '0%, 100%': { filter: 'saturate(100%)' },
          '50%': { filter: 'saturate(110%)' }
        }
      },
      animation: {
        'bg-pulse': 'bg-pulse 6s ease-in-out infinite'
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
          borderRadius: theme('borderRadius.lg'),
          boxShadow: theme('boxShadow.elevation-md')
        },
        '.ellipsis': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        },
        '.bg-day-gradient': {
          backgroundImage:
            'linear-gradient(135deg, ' +
            '#f0f9ff 0%, ' +
            '#e0f2fe 6.25%, ' +
            '#f0f8ff 12.5%, ' +
            '#e0f7ff 18.75%, ' +
            '#f5f3ff 25%, ' +
            '#faf3ff 31.25%, ' +
            '#fdf4ff 37.5%, ' +
            '#fff3f4 43.75%, ' +
            '#ffe4e6 50%, ' +
            '#fff5f5 56.25%, ' +
            '#fffafa 62.5%, ' +
            '#fffdf5 68.75%, ' +
            '#f0f4ff 75%, ' +
            '#f5f7ff 81.25%, ' +
            '#f8f9ff 87.5%, ' +
            '#fafbff 93.75%, ' +
            '#ffffff 100%)'
        },
        '.bg-night-gradient': {
          backgroundImage:
            'linear-gradient(135deg, #0b1220 0%, #0a1a2b 50%, #111827 100%)'
        },
        '.tag-badge-day': {
          backgroundImage:
            'linear-gradient(135deg, #fff7f9 0%, #eaf6ff 50%, #e7fff2 100%)',
          color: '#111827',
          borderRadius: theme('borderRadius.sm')
        },
        '.tag-badge-night': {
          backgroundImage:
            'linear-gradient(135deg, #1b2230 0%, #132033 50%, #111827 100%)',
          color: '#ffffff',
          borderRadius: theme('borderRadius.sm')
        }
      }
      addUtilities(newUtilities, ['responsive'])
    }
  ]
}

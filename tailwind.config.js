/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#f6f7fa', // pastel off-white
          accent: '#e8eaf6', // subtle accent
        },
        card: {
          DEFAULT: '#fff',
          raised: '#f3f4f9',
        },
        primary: {
          DEFAULT: '#1857ff', // deep blue
          hover: '#1449cc',
        },
        highlight: {
          DEFAULT: '#a48cf0', // soft purple
        },
        text: {
          DEFAULT: '#23253a',
          secondary: '#6b7280',
        },
        error: {
          DEFAULT: '#e53935',
        },
        success: {
          DEFAULT: '#43a047',
        },
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '16px',
        lg: '24px',
        full: '9999px',
      },
      spacing: {
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        card: '0 2px 8px 0 rgba(60, 60, 130, 0.04), 0 1.5px 3px 0 rgba(60,60,130,0.10)',
        raised: '0 4px 16px 0 rgba(60, 60, 130, 0.07), 0 2px 6px 0 rgba(60,60,130,0.13)',
        inner: 'inset 0 1px 3px 0 rgba(60,60,130,0.06)',
        modal: '0 8px 32px 0 rgba(60,60,130,0.13)',
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['0.875rem', '1.5'],
        sm: ['1rem', '1.6'],
        base: ['1.125rem', '1.7'],
        lg: ['1.25rem', '1.8'],
        xl: ['1.5rem', '2'],
        '2xl': ['2rem', '2.2'],
      },
      transitionProperty: {
        'fade-slide': 'opacity, transform',
      },
    },
  },

  plugins: [],
}

import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      'xs': '576px',    // Extra small: mobile phones (larger)
      'sm': '640px',    // Small: tablets (keeping default)
      'md': '768px',    // Medium: tablets
      'lg': '992px',    // Large: small laptops
      'xl': '1200px',   // Extra large: desktops
      '2xl': '1536px',  // 2X large: large desktops (keeping default)
    },
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        // New Professional Color Palette
        'soft-white': '#F9FAFB',
        'vibrant-blue': '#1D6FE1',
        'sky-blue': '#C7E0F4',
        'navy-blue': '#102A43',
        'phthalo-green': '#0A3D2E',
        
        // Updated theme colors using new palette
        background: '#F9FAFB',
        foreground: '#102A43',
        card: {
          DEFAULT: '#F9FAFB',
          foreground: '#102A43',
        },
        popover: {
          DEFAULT: '#F9FAFB',
          foreground: '#102A43',
        },
        primary: {
          DEFAULT: '#1D6FE1',
          foreground: '#F9FAFB',
        },
        secondary: {
          DEFAULT: '#C7E0F4',
          foreground: '#102A43',
        },
        muted: {
          DEFAULT: '#C7E0F4',
          foreground: '#102A43',
        },
        accent: {
          DEFAULT: '#0A3D2E',
          foreground: '#F9FAFB',
        },
        destructive: {
          DEFAULT: '#0A3D2E',
          foreground: '#F9FAFB',
        },
        border: '#C7E0F4',
        input: '#C7E0F4',
        ring: '#1D6FE1',
        chart: {
          '1': '#1D6FE1',
          '2': '#0A3D2E', 
          '3': '#102A43',
          '4': '#C7E0F4',
          '5': '#F9FAFB',
        },
      },
      keyframes: {
        'accordion-down': {
          from: {
            height: '0',
          },
          to: {
            height: 'var(--radix-accordion-content-height)',
          },
        },
        'accordion-up': {
          from: {
            height: 'var(--radix-accordion-content-height)',
          },
          to: {
            height: '0',
          },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;

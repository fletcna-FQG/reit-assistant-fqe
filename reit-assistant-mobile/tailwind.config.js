/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    '../app/**/*.{js,jsx,ts,tsx}',
    '../components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#003366',
          light: '#004080',
          dark: '#002244',
        },
        emerald: {
          DEFAULT: '#28a745',
          light: '#34ce57',
          dark: '#1e7e34',
        },
        'alert-red': '#dc3545',
        'warning-amber': '#ffc107',
        white: '#ffffff',
        'light-gray': '#f5f5f5',
        'medium-gray': '#e0e0e0',
        'dark-gray': '#666666',
        'text-primary': '#2c3e50',
        'text-secondary': '#7f8c8d',
        'success-green': '#28a745',
        dark: {
          canvas: '#16213e',
          surface: '#1a1a2e',
          border: '#0f3460',
          navy: '#4a90e2',
          'text-primary': '#eaeaea',
          'text-secondary': '#a0a0a0',
        },
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
      fontSize: {
        h1: ['24px', { lineHeight: '31.2px', fontWeight: '700' }],
        h3: ['18px', { lineHeight: '25.2px', fontWeight: '700' }],
        h4: ['16px', { lineHeight: '22.4px', fontWeight: '700' }],
        body: ['15px', { lineHeight: '22.5px', fontWeight: '400' }],
        'body-small': ['14px', { lineHeight: '21px', fontWeight: '400' }],
        caption: ['13px', { lineHeight: '18.2px', fontWeight: '600' }],
        micro: ['11px', { lineHeight: '13.2px', fontWeight: '700' }],
      },
    },
  },
  plugins: [],
};

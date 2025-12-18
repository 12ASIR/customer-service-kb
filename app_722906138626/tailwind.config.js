

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#ffffff',
        secondary: 'rgba(55, 67, 106, 0.38)',
        accent: 'rgba(8, 13, 30, 0.9)',
        'text-primary': 'rgba(8, 13, 30, 0.9)',
        'text-secondary': 'rgba(55, 67, 106, 0.7)',
        'bg-gradient-start': '#ffffff',
        'bg-gradient-end': 'rgba(248, 250, 252, 0.8)',
      },
      backgroundImage: {
        'gradient-main': 'linear-gradient(135deg, #ffffff 0%, rgba(248, 250, 252, 0.8) 100%)',
        'gradient-card': 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.7) 100%)',
        'gradient-button': 'linear-gradient(135deg, rgba(55, 67, 106, 0.38) 0%, rgba(8, 13, 30, 0.9) 100%)',
      },
      boxShadow: {
        'card': '0 4px 20px rgba(55, 67, 106, 0.1)',
        'button': '0 2px 10px rgba(55, 67, 106, 0.2)',
      }
    }
  },
  plugins: [],
}


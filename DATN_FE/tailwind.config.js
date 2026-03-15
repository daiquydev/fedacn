/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        Montserrat: 'Monterrat',
        Roboto: 'Roboto',
        Inter: ['Inter', 'sans-serif']
      },
      backgroundImage: {
        chef_bg: 'url(/src/assets/images/chef.png)',
        dark_bg: 'url(/src/assets/images/darkbg.jpg)',
        white_bg: 'url(/src/assets/images/whitebg.jpg)',
        footerdark_bg: 'url(/src/assets/images/footerdarkbg.jpg)',
        start_bg: 'url(/src/assets/images/startbg.png)',
        auth_fitness: 'url(/src/assets/images/auth_fitness.png)'
      },
      screen: {
        xs: '480px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px'
      },
      colors: {
        'color-primary': '#0f172a',
        'color-primary-light': '#f6f2f2',
        'color-primary-dark': '#010410',
        'color-secondary': '#ef571a',
        'color-gray': '#333',
        'color-blob': '#A427DF',
        'brand-green': '#15803D',
        'brand-green-light': '#F0FDF4',
        'brand-amber': '#F59E0B',
        'brand-amber-dark': '#D97706'
      }
    }
  },

  // eslint-disable-next-line no-undef
  plugins: [require('tailwind-scrollbar'), require('daisyui')]
}

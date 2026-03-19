import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        neon: '#00FF9D',
        'neon-dim': '#00C97A',
        'dark-bg': '#080c0a',
        'dark-surface': '#0f1a14',
        'dark-green': '#0a2e1f',
        'dark-border': 'rgba(0,255,157,0.1)',
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-neon': 'pulseNeon 3s ease-in-out infinite',
        'scan': 'scan 3s linear infinite',
        'border-glow': 'borderGlow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        pulseNeon: {
          '0%,100%': { boxShadow: '0 0 20px rgba(0,255,157,0.3), 0 0 40px rgba(0,255,157,0.1)' },
          '50%': { boxShadow: '0 0 40px rgba(0,255,157,0.6), 0 0 80px rgba(0,255,157,0.3)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        borderGlow: {
          from: { borderColor: 'rgba(0,255,157,0.1)' },
          to: { borderColor: 'rgba(0,255,157,0.4)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

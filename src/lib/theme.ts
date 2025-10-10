// src/lib/theme.ts
export const theme = {
  colors: {
    primary: {
      50: '#f5f3ff',
      100: '#ede9fe',
      200: '#ddd6fe',
      300: '#c4b5fd',
      400: '#a78bfa',
      500: '#8b5cf6',
      600: '#7c3aed',
      700: '#6d28d9',
      800: '#5b21b6',
      900: '#4c1d95',
    },
    secondary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    success: {
      50: '#f0fdf4',
      500: '#22c55e',
      700: '#15803d',
    },
    warning: {
      50: '#fffbeb',
      500: '#f59e0b',
      700: '#b45309',
    },
    danger: {
      50: '#fef2f2',
      500: '#ef4444',
      700: '#b91c1c',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
  },
  gradients: {
    primary: 'from-purple-500 to-blue-500',
    success: 'from-green-400 to-emerald-500',
    warning: 'from-yellow-400 to-orange-500',
    danger: 'from-red-400 to-pink-500',
    info: 'from-blue-400 to-indigo-500',
    background: 'from-slate-900 via-purple-900 to-slate-900',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgba(139, 92, 246, 0.3)',
  },
  transitions: {
    fast: 'all 0.15s ease',
    normal: 'all 0.3s ease',
    slow: 'all 0.5s ease',
  },
};

// Reusable component classes
export const components = {
  card: 'bg-white/5 backdrop-blur-lg rounded-xl border border-white/10 hover:bg-white/10 transition-all',
  cardHeader: 'px-6 py-4 border-b border-white/10',
  cardBody: 'p-6',
  cardFooter: 'px-6 py-4 bg-black/20 border-t border-white/10',

  button: {
    base: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
    primary: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20',
    success: 'bg-green-500/20 text-green-400 hover:bg-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 hover:bg-red-500/30',
    ghost: 'text-gray-400 hover:text-white hover:bg-white/5',
  },

  input: 'w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all',

  badge: {
    base: 'px-3 py-1 rounded-full text-xs font-semibold',
    primary: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    success: 'bg-green-500/20 text-green-300 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-300 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  },

  stat: {
    container: 'bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10',
    label: 'text-gray-400 text-sm',
    value: 'text-3xl font-bold text-white mt-1',
  },
};

export const animations = {
  fadeIn: 'animate-fadeIn',
  slideIn: 'animate-slideIn',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
};
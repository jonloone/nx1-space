/**
 * Mundi-Inspired Design System
 * Clean, AI-native GIS professional aesthetic
 *
 * Based on Mundi.ai's design language:
 * - Light backgrounds with generous whitespace
 * - Soft yellow-green accent
 * - Rounded corners (16-24px)
 * - Modern typography
 * - Subtle shadows and borders
 */

export const mundiTheme = {
  // Color Palette
  colors: {
    // Primary - Soft yellow-green accent
    primary: {
      50: '#f9ffe8',
      100: '#f0ffc4',
      200: '#e8ff9f',
      300: '#e0ff82', // Main accent
      400: '#d5f76b',
      500: '#c8ed57',
      600: '#b5db3f',
      700: '#9ebf2c',
      800: '#83a11d',
      900: '#668010'
    },

    // Neutral - Clean backgrounds and text
    neutral: {
      50: '#ffffff',
      100: '#fafafa',
      200: '#f7f8f8', // Light background
      300: '#eeeff0',
      400: '#e1e3e5',
      500: '#c8cacc',
      600: '#9fa2a5',
      700: '#6b6e71', // Muted text
      800: '#424547', // Dark text
      900: '#1a1c1d'
    },

    // Semantic Colors
    success: {
      light: '#d4edda',
      DEFAULT: '#4caf50',
      dark: '#2e7d32'
    },
    warning: {
      light: '#fff3cd',
      DEFAULT: '#ff9800',
      dark: '#e65100'
    },
    error: {
      light: '#f8d7da',
      DEFAULT: '#f44336',
      dark: '#c62828'
    },
    info: {
      light: '#d1ecf1',
      DEFAULT: '#2196f3',
      dark: '#1565c0'
    }
  },

  // Typography
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }]
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },

  // Spacing - Generous whitespace
  spacing: {
    xs: '0.5rem',   // 8px
    sm: '0.75rem',  // 12px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
    '3xl': '4rem'   // 64px
  },

  // Border Radius - Rounded corners
  borderRadius: {
    none: '0',
    sm: '0.5rem',   // 8px
    md: '0.75rem',  // 12px
    lg: '1rem',     // 16px
    xl: '1.5rem',   // 24px
    '2xl': '2rem',  // 32px
    full: '9999px'
  },

  // Shadows - Soft elevation
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)'
  },

  // Component Specific
  components: {
    card: {
      background: '#ffffff',
      border: '#e1e3e5',
      borderRadius: '1rem', // 16px
      padding: '1.5rem', // 24px
      shadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    button: {
      primary: {
        background: '#e0ff82',
        text: '#1a1c1d',
        hover: '#d5f76b',
        borderRadius: '0.75rem' // 12px
      },
      secondary: {
        background: '#f7f8f8',
        text: '#424547',
        hover: '#eeeff0',
        borderRadius: '0.75rem'
      },
      ghost: {
        background: 'transparent',
        text: '#6b6e71',
        hover: '#f7f8f8',
        borderRadius: '0.75rem'
      }
    },
    input: {
      background: '#ffffff',
      border: '#e1e3e5',
      focusBorder: '#e0ff82',
      text: '#424547',
      placeholder: '#9fa2a5',
      borderRadius: '0.75rem',
      padding: '0.75rem'
    },
    panel: {
      background: '#ffffff',
      backgroundAlt: '#fafafa',
      border: '#e1e3e5',
      shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    header: {
      background: '#ffffff',
      border: '#e1e3e5',
      shadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }
  },

  // Animation
  animation: {
    duration: {
      fast: '150ms',
      normal: '250ms',
      slow: '350ms'
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
      inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }
} as const

// Helper functions for theme access
export const getColor = (path: string): string => {
  const keys = path.split('.')
  let value: any = mundiTheme.colors

  for (const key of keys) {
    value = value?.[key]
  }

  return value || '#000000'
}

export const getShadow = (size: keyof typeof mundiTheme.shadows = 'DEFAULT'): string => {
  return mundiTheme.shadows[size]
}

export const getBorderRadius = (size: keyof typeof mundiTheme.borderRadius = 'md'): string => {
  return mundiTheme.borderRadius[size]
}

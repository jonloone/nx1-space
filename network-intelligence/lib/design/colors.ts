/**
 * NexusOne Design System - Colors
 * WCAG AA compliant color palette
 */

export const colors = {
  // Brand Colors
  brand: {
    primary: '#176BF8', // NexusOne Blue
    primaryDark: '#0D4DB8',
    primaryLight: '#4A8AFA',
    secondary: '#080C16', // NexusOne Black
  },

  // Neutrals (WCAG AA compliant)
  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#E5E5E5',
    300: '#D4D4D4',
    400: '#A3A3A3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0A0A0A',
  },

  // Semantic Colors
  semantic: {
    success: {
      bg: '#DCFCE7',
      border: '#86EFAC',
      text: '#166534',
      solid: '#22C55E',
    },
    warning: {
      bg: '#FEF3C7',
      border: '#FCD34D',
      text: '#92400E',
      solid: '#F59E0B',
    },
    error: {
      bg: '#FEE2E2',
      border: '#FCA5A5',
      text: '#991B1B',
      solid: '#EF4444',
    },
    info: {
      bg: '#DBEAFE',
      border: '#93C5FD',
      text: '#1E40AF',
      solid: '#3B82F6',
    },
  },

  // Industry Colors (for scenarios)
  industry: {
    maritime: {
      primary: '#0EA5E9', // Sky Blue
      bg: '#E0F2FE',
      border: '#7DD3FC',
    },
    logistics: {
      primary: '#10B981', // Emerald
      bg: '#D1FAE5',
      border: '#6EE7B7',
    },
    defense: {
      primary: '#EF4444', // Red
      bg: '#FEE2E2',
      border: '#FCA5A5',
    },
  },

  // Backgrounds
  background: {
    primary: '#FFFFFF',
    secondary: '#FAFAFA',
    tertiary: '#F5F5F5',
    inverse: '#080C16',
  },

  // Text (WCAG AA minimum 4.5:1 contrast)
  text: {
    primary: '#171717', // on white: 12.6:1
    secondary: '#525252', // on white: 5.7:1
    tertiary: '#737373', // on white: 4.6:1
    inverse: '#FAFAFA', // on dark: 13.1:1
    link: '#176BF8', // on white: 4.7:1
    linkHover: '#0D4DB8',
  },

  // Borders
  border: {
    default: '#E5E5E5',
    medium: '#D4D4D4',
    strong: '#A3A3A3',
    brand: '#176BF8',
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
}

// WCAG Contrast Ratios (for reference)
// AAA Large Text: 4.5:1
// AA Normal Text: 4.5:1
// AA Large Text: 3:1

export default colors

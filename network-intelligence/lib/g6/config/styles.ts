/**
 * G6 Style Configurations
 *
 * Defines visual styles for nodes, edges, and states across all G6 visualizations
 * in the Citizens 360 platform
 */

import type { NodeConfig, EdgeConfig } from '@antv/g6'

// Citizens 360 Brand Colors
export const CITIZENS360_COLORS = {
  // Risk Levels
  riskHigh: '#dc2626',      // red-600
  riskHighDark: '#b91c1c',  // red-700
  riskMedium: '#f59e0b',    // amber-500
  riskMediumDark: '#d97706', // amber-600
  riskLow: '#10b981',       // emerald-500
  riskLowDark: '#059669',   // emerald-600

  // Node Types
  subject: '#3b82f6',       // blue-500
  subjectDark: '#2563eb',   // blue-600
  associate: '#8b5cf6',     // purple-500
  associateDark: '#7c3aed', // purple-600
  location: '#10b981',      // emerald-500
  locationDark: '#059669',  // emerald-600
  organization: '#6b7280',  // gray-500
  organizationDark: '#4b5563', // gray-600
  alert: '#ef4444',         // red-500
  alertDark: '#dc2626',     // red-600
  evidence: '#f59e0b',      // amber-500
  evidenceDark: '#d97706',  // amber-600

  // Edge Types
  communication: '#3b82f6', // blue-500
  meeting: '#8b5cf6',       // purple-500
  financial: '#10b981',     // emerald-500
  social: '#6b7280',        // gray-500

  // UI
  background: '#ffffff',
  border: '#e5e7eb',        // gray-200
  text: '#111827',          // gray-900
  textLight: '#6b7280'      // gray-500
}

// Node style by type
export const getNodeStyleByType = (type: string): Partial<NodeConfig> => {
  const baseStyle = {
    size: 48,
    labelCfg: {
      position: 'bottom',
      offset: 8,
      style: {
        fontSize: 12,
        fontWeight: 600,
        fill: CITIZENS360_COLORS.text
      }
    }
  }

  switch (type) {
    case 'subject':
      return {
        ...baseStyle,
        style: {
          fill: CITIZENS360_COLORS.subject,
          stroke: CITIZENS360_COLORS.subjectDark,
          lineWidth: 3
        }
      }
    case 'associate':
      return {
        ...baseStyle,
        size: 40,
        style: {
          fill: CITIZENS360_COLORS.associate,
          stroke: CITIZENS360_COLORS.associateDark,
          lineWidth: 2
        }
      }
    case 'location':
      return {
        ...baseStyle,
        size: 36,
        style: {
          fill: CITIZENS360_COLORS.location,
          stroke: CITIZENS360_COLORS.locationDark,
          lineWidth: 2
        }
      }
    case 'organization':
      return {
        ...baseStyle,
        size: 44,
        style: {
          fill: CITIZENS360_COLORS.organization,
          stroke: CITIZENS360_COLORS.organizationDark,
          lineWidth: 2
        }
      }
    default:
      return {
        ...baseStyle,
        style: {
          fill: CITIZENS360_COLORS.subject,
          stroke: CITIZENS360_COLORS.subjectDark,
          lineWidth: 2
        }
      }
  }
}

// Node style by risk level (overrides type style)
export const getNodeStyleByRisk = (riskLevel?: string): Partial<NodeConfig> => {
  if (!riskLevel) return {}

  switch (riskLevel) {
    case 'high':
      return {
        style: {
          fill: CITIZENS360_COLORS.riskHigh,
          stroke: CITIZENS360_COLORS.riskHighDark,
          lineWidth: 4,
          shadowColor: CITIZENS360_COLORS.riskHigh,
          shadowBlur: 10
        }
      }
    case 'medium':
      return {
        style: {
          fill: CITIZENS360_COLORS.riskMedium,
          stroke: CITIZENS360_COLORS.riskMediumDark,
          lineWidth: 3,
          shadowColor: CITIZENS360_COLORS.riskMedium,
          shadowBlur: 8
        }
      }
    case 'low':
      return {
        style: {
          fill: CITIZENS360_COLORS.riskLow,
          stroke: CITIZENS360_COLORS.riskLowDark,
          lineWidth: 2
        }
      }
    default:
      return {}
  }
}

// Edge style by type
export const getEdgeStyleByType = (type: string, frequency?: number): Partial<EdgeConfig> => {
  const baseWidth = 2
  const width = frequency ? Math.min(baseWidth + frequency / 2, 6) : baseWidth

  const baseStyle = {
    labelCfg: {
      autoRotate: true,
      style: {
        fontSize: 10,
        fill: CITIZENS360_COLORS.textLight,
        background: {
          fill: CITIZENS360_COLORS.background,
          padding: [2, 4, 2, 4],
          radius: 4
        }
      }
    }
  }

  switch (type) {
    case 'communication':
      return {
        ...baseStyle,
        style: {
          stroke: CITIZENS360_COLORS.communication,
          lineWidth: width,
          endArrow: {
            path: 'M 0,0 L 8,4 L 8,-4 Z',
            fill: CITIZENS360_COLORS.communication
          }
        }
      }
    case 'meeting':
      return {
        ...baseStyle,
        style: {
          stroke: CITIZENS360_COLORS.meeting,
          lineWidth: width,
          lineDash: [5, 5]
        }
      }
    case 'financial':
      return {
        ...baseStyle,
        style: {
          stroke: CITIZENS360_COLORS.financial,
          lineWidth: width + 1,
          lineDash: [8, 4],
          endArrow: {
            path: 'M 0,0 L 8,4 L 8,-4 Z',
            fill: CITIZENS360_COLORS.financial
          }
        }
      }
    case 'social':
      return {
        ...baseStyle,
        style: {
          stroke: CITIZENS360_COLORS.social,
          lineWidth: width,
          opacity: 0.6
        }
      }
    default:
      return {
        ...baseStyle,
        style: {
          stroke: CITIZENS360_COLORS.border,
          lineWidth: width
        }
      }
  }
}

// Node state styles (hover, selected, active)
export const NODE_STATE_STYLES = {
  hover: {
    lineWidth: 4,
    shadowColor: '#3b82f6',
    shadowBlur: 15,
    cursor: 'pointer'
  },
  selected: {
    lineWidth: 5,
    shadowColor: '#3b82f6',
    shadowBlur: 20,
    stroke: '#3b82f6'
  },
  inactive: {
    opacity: 0.3
  },
  active: {
    opacity: 1
  }
}

// Edge state styles
export const EDGE_STATE_STYLES = {
  hover: {
    lineWidth: 4,
    shadowColor: '#3b82f6',
    shadowBlur: 10
  },
  selected: {
    lineWidth: 5,
    shadowColor: '#3b82f6',
    shadowBlur: 15
  },
  inactive: {
    opacity: 0.2
  },
  active: {
    opacity: 1
  }
}

// Default node configuration
export const DEFAULT_NODE_CONFIG: Partial<NodeConfig> = {
  type: 'circle',
  size: 48,
  style: {
    fill: CITIZENS360_COLORS.subject,
    stroke: CITIZENS360_COLORS.subjectDark,
    lineWidth: 2,
    cursor: 'pointer'
  },
  labelCfg: {
    position: 'bottom',
    offset: 8,
    style: {
      fontSize: 12,
      fontWeight: 600,
      fill: CITIZENS360_COLORS.text
    }
  }
}

// Default edge configuration
export const DEFAULT_EDGE_CONFIG: Partial<EdgeConfig> = {
  type: 'line',
  style: {
    stroke: CITIZENS360_COLORS.border,
    lineWidth: 2,
    opacity: 0.8,
    cursor: 'pointer'
  },
  labelCfg: {
    autoRotate: true,
    style: {
      fontSize: 10,
      fill: CITIZENS360_COLORS.textLight,
      background: {
        fill: CITIZENS360_COLORS.background,
        padding: [2, 4, 2, 4],
        radius: 4
      }
    }
  }
}

// Global theme configuration
export const CITIZENS360_THEME = {
  colors: CITIZENS360_COLORS,
  nodes: {
    default: DEFAULT_NODE_CONFIG,
    state: NODE_STATE_STYLES
  },
  edges: {
    default: DEFAULT_EDGE_CONFIG,
    state: EDGE_STATE_STYLES
  }
}

/**
 * G6 Layout Configurations
 *
 * Defines layout algorithms and their configurations for different graph types
 */

export interface LayoutConfig {
  type: string
  [key: string]: any
}

/**
 * Force-directed layout
 * Best for: Network analysis, showing natural clustering
 */
export const FORCE_LAYOUT: LayoutConfig = {
  type: 'force',
  preventOverlap: true,
  nodeSpacing: 80,
  linkDistance: 150,
  nodeStrength: -300,
  edgeStrength: 0.6,
  collideStrength: 0.8,
  alpha: 0.8,
  alphaDecay: 0.028,
  alphaMin: 0.01,
  forceSimulation: null,
  onTick: () => {},
  onLayoutEnd: () => {}
}

/**
 * Circular layout
 * Best for: Showing all connections equally, highlighting central nodes
 */
export const CIRCULAR_LAYOUT: LayoutConfig = {
  type: 'circular',
  radius: 200,
  startRadius: null,
  endRadius: null,
  clockwise: true,
  divisions: 1,
  ordering: 'degree', // 'topology', 'degree', null
  angleRatio: 1
}

/**
 * Radial layout
 * Best for: Hierarchy with central focus point
 */
export const RADIAL_LAYOUT: LayoutConfig = {
  type: 'radial',
  unitRadius: 100,
  linkDistance: 150,
  preventOverlap: true,
  nodeSpacing: 60,
  strictRadial: true,
  maxIteration: 1000
}

/**
 * Concentric layout
 * Best for: Showing importance/centrality in rings
 */
export const CONCENTRIC_LAYOUT: LayoutConfig = {
  type: 'concentric',
  minNodeSpacing: 60,
  preventOverlap: true,
  nodeSize: 48,
  sweep: undefined,
  equidistant: false,
  startAngle: (3 / 2) * Math.PI,
  clockwise: true,
  maxLevelDiff: undefined,
  sortBy: 'degree' // Sort nodes by degree for concentric rings
}

/**
 * Grid layout
 * Best for: Comparing many nodes systematically
 */
export const GRID_LAYOUT: LayoutConfig = {
  type: 'grid',
  begin: [0, 0],
  preventOverlap: true,
  preventOverlapPadding: 20,
  nodeSize: 48,
  condense: false,
  rows: undefined,
  cols: undefined,
  sortBy: 'degree'
}

/**
 * Dagre layout
 * Best for: Hierarchical/tree structures, timelines, org charts
 */
export const DAGRE_LAYOUT: LayoutConfig = {
  type: 'dagre',
  rankdir: 'TB', // TB (top-bottom), BT (bottom-top), LR (left-right), RL (right-left)
  align: 'UL', // UL, UR, DL, DR
  nodesep: 60,
  ranksep: 80,
  controlPoints: true
}

/**
 * Fruchterman layout
 * Best for: Medium-sized graphs (50-500 nodes), better distribution than force
 */
export const FRUCHTERMAN_LAYOUT: LayoutConfig = {
  type: 'fruchterman',
  gravity: 5,
  speed: 5,
  clustering: true,
  clusterGravity: 10,
  maxIteration: 2000
}

/**
 * Get recommended layout based on graph characteristics
 */
export function getRecommendedLayout(
  nodeCount: number,
  edgeCount: number,
  graphType?: 'network' | 'timeline' | 'hierarchy' | 'flow'
): LayoutConfig {
  // Timeline/flow graphs work best with dagre
  if (graphType === 'timeline' || graphType === 'flow') {
    return DAGRE_LAYOUT
  }

  // Hierarchy graphs use radial or dagre
  if (graphType === 'hierarchy') {
    return RADIAL_LAYOUT
  }

  // For network analysis, choose based on size
  if (nodeCount < 20) {
    return CIRCULAR_LAYOUT // Small networks look good in circles
  } else if (nodeCount < 100) {
    return FORCE_LAYOUT // Medium networks benefit from force-directed
  } else if (nodeCount < 500) {
    return FRUCHTERMAN_LAYOUT // Better performance for larger graphs
  } else {
    return GRID_LAYOUT // Very large graphs need grid for performance
  }
}

/**
 * Layout presets for common use cases
 */
export const LAYOUT_PRESETS = {
  // Network analysis (default)
  network: FORCE_LAYOUT,

  // Timeline analysis
  timeline: {
    ...DAGRE_LAYOUT,
    rankdir: 'TB' // Top to bottom for chronological flow
  },

  // Organization hierarchy
  hierarchy: {
    ...DAGRE_LAYOUT,
    rankdir: 'TB',
    ranksep: 100
  },

  // Location network
  location: {
    ...FORCE_LAYOUT,
    linkDistance: 200, // Larger spacing for geographic feel
    nodeStrength: -500
  },

  // Alert correlation
  alertCorrelation: CONCENTRIC_LAYOUT,

  // Evidence chain
  evidenceChain: {
    ...DAGRE_LAYOUT,
    rankdir: 'LR', // Left to right for evidence flow
    ranksep: 120
  },

  // Financial flow
  financialFlow: {
    ...DAGRE_LAYOUT,
    rankdir: 'LR',
    ranksep: 150
  }
}

/**
 * Get layout by name
 */
export function getLayoutByName(name: string): LayoutConfig {
  const layouts: Record<string, LayoutConfig> = {
    force: FORCE_LAYOUT,
    circular: CIRCULAR_LAYOUT,
    radial: RADIAL_LAYOUT,
    concentric: CONCENTRIC_LAYOUT,
    grid: GRID_LAYOUT,
    dagre: DAGRE_LAYOUT,
    fruchterman: FRUCHTERMAN_LAYOUT
  }

  return layouts[name] || FORCE_LAYOUT
}

/**
 * Available layout options for UI dropdown
 */
export const LAYOUT_OPTIONS = [
  { value: 'force', label: 'Force-Directed', description: 'Natural clustering' },
  { value: 'circular', label: 'Circular', description: 'Equal emphasis' },
  { value: 'radial', label: 'Radial', description: 'Central focus' },
  { value: 'concentric', label: 'Concentric', description: 'Importance rings' },
  { value: 'grid', label: 'Grid', description: 'Systematic comparison' },
  { value: 'dagre', label: 'Hierarchical', description: 'Top-down structure' }
]

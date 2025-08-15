export const colorScales = {
  // Sequential scales (low to high)
  sequential: {
    blue: ['#e3f2fd', '#90caf9', '#42a5f5', '#1e88e5', '#1565c0', '#0d47a1'],
    green: ['#e8f5e9', '#a5d6a7', '#66bb6a', '#43a047', '#2e7d32', '#1b5e20'],
    orange: ['#fff3e0', '#ffcc80', '#ffa726', '#ff9800', '#f57c00', '#e65100'],
    red: ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336'],
    purple: ['#f3e5f5', '#ce93d8', '#ab47bc', '#8e24aa', '#6a1b9a', '#4a148c'],
  },

  // Diverging scales (negative to positive)
  diverging: {
    redGreen: ['#d32f2f', '#f44336', '#ffcdd2', '#ffffff', '#c8e6c9', '#4caf50', '#2e7d32'],
    blueOrange: ['#0d47a1', '#1976d2', '#90caf9', '#ffffff', '#ffcc80', '#ff9800', '#e65100'],
    purpleGreen: ['#4a148c', '#7b1fa2', '#ce93d8', '#ffffff', '#a5d6a7', '#43a047', '#1b5e20'],
  },

  // Categorical scales (distinct colors)
  categorical: {
    default: ['#2196f3', '#4caf50', '#ff9800', '#f44336', '#9c27b0', '#00bcd4', '#ffeb3b', '#795548'],
    pastel: ['#64b5f6', '#81c784', '#ffb74d', '#e57373', '#ba68c8', '#4dd0e1', '#fff176', '#a1887f'],
    vibrant: ['#0066ff', '#00ff00', '#ff8c00', '#ff0000', '#8c00ff', '#00ffff', '#ffff00', '#ff00ff'],
  },

  // Status colors
  status: {
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3',
    neutral: '#9e9e9e',
  },

  // Geospatial specific
  geo: {
    terrain: ['#00441b', '#1b7837', '#5aae61', '#a6dba0', '#d9f0d3', '#f7f7f7'],
    water: ['#08306b', '#08519c', '#2171b5', '#4292c6', '#6baed6', '#9ecae1'],
    heat: ['#0d0887', '#46039f', '#7201a8', '#9c179e', '#bd3786', '#d8576b', '#ed7953', '#fb9f3a', '#fdca26', '#f0f921'],
  },

  // Get color scale function
  getScale: (type: keyof typeof colorScales, name: string) => {
    const scales = colorScales[type as keyof typeof colorScales];
    return (scales as any)[name] || scales[Object.keys(scales)[0]];
  },

  // Get interpolated color
  interpolate: (value: number, scale: string[], min = 0, max = 1) => {
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const index = Math.floor(normalized * (scale.length - 1));
    return scale[Math.min(index, scale.length - 1)];
  },
};
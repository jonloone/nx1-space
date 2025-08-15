// Data transformation utilities for different chart types

export interface LineChartData {
  x: number | Date;
  y: number;
  series?: string;
}

export interface AreaChartData {
  x: number | Date;
  [key: string]: number | Date; // Multiple y values for stacked areas
}

export interface HeatmapData {
  x: string | number;
  y: string | number;
  value: number;
}

export interface NetworkNode {
  id: string;
  group?: string;
  value?: number;
  x?: number;
  y?: number;
}

export interface NetworkLink {
  source: string;
  target: string;
  value?: number;
}

export interface TableColumn {
  id: string;
  header: string;
  accessorKey: string;
  cell?: (value: any) => React.ReactNode;
  enableSorting?: boolean;
  enableFiltering?: boolean;
}

// Transform to line chart data
export const toLineChartData = (
  data: any[],
  xKey: string,
  yKey: string,
  seriesKey?: string
): LineChartData[] => {
  return data.map(d => ({
    x: d[xKey],
    y: d[yKey],
    series: seriesKey ? d[seriesKey] : undefined,
  }));
};

// Transform to multi-series line chart data
export const toMultiLineChartData = (
  data: any[],
  xKey: string,
  yKeys: string[]
): { series: string; data: LineChartData[] }[] => {
  return yKeys.map(yKey => ({
    series: yKey,
    data: data.map(d => ({
      x: d[xKey],
      y: d[yKey],
      series: yKey,
    })),
  }));
};

// Transform to area chart data
export const toAreaChartData = (
  data: any[],
  xKey: string,
  yKeys: string[]
): AreaChartData[] => {
  return data.map(d => {
    const result: AreaChartData = { x: d[xKey] };
    yKeys.forEach(key => {
      result[key] = d[key] || 0;
    });
    return result;
  });
};

// Transform to heatmap data
export const toHeatmapData = (
  data: any[],
  xKey: string,
  yKey: string,
  valueKey: string
): HeatmapData[] => {
  return data.map(d => ({
    x: d[xKey],
    y: d[yKey],
    value: d[valueKey],
  }));
};

// Transform matrix to heatmap data
export const matrixToHeatmapData = (
  matrix: number[][],
  xLabels?: string[],
  yLabels?: string[]
): HeatmapData[] => {
  const result: HeatmapData[] = [];
  matrix.forEach((row, i) => {
    row.forEach((value, j) => {
      result.push({
        x: xLabels ? xLabels[j] : j,
        y: yLabels ? yLabels[i] : i,
        value,
      });
    });
  });
  return result;
};

// Transform to network data
export const toNetworkData = (
  nodes: any[],
  links: any[],
  nodeIdKey = 'id',
  sourceKey = 'source',
  targetKey = 'target'
): { nodes: NetworkNode[]; links: NetworkLink[] } => {
  return {
    nodes: nodes.map(n => ({
      id: n[nodeIdKey],
      group: n.group,
      value: n.value,
      x: n.x,
      y: n.y,
    })),
    links: links.map(l => ({
      source: l[sourceKey],
      target: l[targetKey],
      value: l.value,
    })),
  };
};

// Transform to table data
export const toTableData = (
  data: any[],
  columns?: Partial<TableColumn>[]
): { data: any[]; columns: TableColumn[] } => {
  // Auto-generate columns if not provided
  const tableColumns = columns || (
    data.length > 0
      ? Object.keys(data[0]).map(key => ({
          id: key,
          header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
          accessorKey: key,
          enableSorting: true,
          enableFiltering: true,
        }))
      : []
  );

  return {
    data,
    columns: tableColumns as TableColumn[],
  };
};

// Aggregate data by time periods
export const aggregateByTime = (
  data: any[],
  dateKey: string,
  valueKey: string,
  period: 'hour' | 'day' | 'week' | 'month' = 'day'
): { date: Date; value: number; count: number }[] => {
  const grouped = new Map<string, { sum: number; count: number }>();
  
  data.forEach(d => {
    const date = new Date(d[dateKey]);
    let key: string;
    
    switch (period) {
      case 'hour':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        break;
      case 'day':
        key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        break;
      case 'week':
        const week = Math.floor(date.getDate() / 7);
        key = `${date.getFullYear()}-${date.getMonth()}-${week}`;
        break;
      case 'month':
        key = `${date.getFullYear()}-${date.getMonth()}`;
        break;
    }
    
    const existing = grouped.get(key) || { sum: 0, count: 0 };
    grouped.set(key, {
      sum: existing.sum + (d[valueKey] || 0),
      count: existing.count + 1,
    });
  });
  
  return Array.from(grouped.entries()).map(([key, stats]) => {
    const parts = key.split('-').map(Number);
    const date = new Date(parts[0], parts[1], parts[2] || 1, parts[3] || 0);
    return {
      date,
      value: stats.sum / stats.count, // Average
      count: stats.count,
    };
  }).sort((a, b) => a.date.getTime() - b.date.getTime());
};

// Calculate statistics
export const calculateStats = (data: number[]) => {
  const sorted = [...data].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / sorted.length;
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];
  
  const variance = sorted.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / sorted.length;
  const stdDev = Math.sqrt(variance);
  
  return {
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean,
    median,
    sum,
    stdDev,
    q1: sorted[Math.floor(sorted.length * 0.25)],
    q3: sorted[Math.floor(sorted.length * 0.75)],
  };
};
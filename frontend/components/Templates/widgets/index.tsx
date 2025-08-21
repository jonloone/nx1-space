'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

// Widget Props Interface
export interface BaseWidgetProps {
  id: string;
  title: string;
  data: any;
  config?: Record<string, any>;
  className?: string;
  onInteraction?: (action: string, data: any) => void;
}

// Metric Card Widget
export const MetricWidget: React.FC<BaseWidgetProps> = ({ 
  title, 
  data, 
  config = {},
  className = '' 
}) => {
  const value = data?.value || 0;
  const change = data?.change || 0;
  const unit = config?.unit || '';
  const format = config?.format || 'number';
  
  const formatValue = (val: number) => {
    if (format === 'currency') return `$${val.toLocaleString()}`;
    if (format === 'percentage') return `${val}%`;
    if (format === 'compact') {
      if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
      if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    }
    return val.toLocaleString();
  };
  
  return (
    <div className={`p-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl ${className}`}>
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white/60 text-sm font-medium">{title}</h3>
        {change !== 0 && (
          <div className={`flex items-center gap-1 text-xs ${
            change > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-white">
        {formatValue(value)}
        {unit && <span className="text-xl text-white/60 ml-1">{unit}</span>}
      </div>
      
      {data?.subtitle && (
        <p className="text-white/40 text-sm mt-2">{data.subtitle}</p>
      )}
    </div>
  );
};

// Insight Card Widget
export const InsightWidget: React.FC<BaseWidgetProps> = ({ 
  title, 
  data,
  className = '' 
}) => {
  const type = data?.type || 'info';
  const message = data?.message || '';
  const confidence = data?.confidence || 0;
  
  const getIcon = () => {
    switch (type) {
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error': return <AlertCircle className="w-5 h-5 text-red-400" />;
      default: return <Info className="w-5 h-5 text-blue-400" />;
    }
  };
  
  const getBorderColor = () => {
    switch (type) {
      case 'warning': return 'border-yellow-400/30';
      case 'success': return 'border-green-400/30';
      case 'error': return 'border-red-400/30';
      default: return 'border-blue-400/30';
    }
  };
  
  return (
    <div className={`p-4 bg-black/40 backdrop-blur-md border ${getBorderColor()} rounded-lg ${className}`}>
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1">
          <h4 className="text-white font-medium mb-1">{title}</h4>
          <p className="text-white/60 text-sm">{message}</p>
          {confidence > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <span className="text-white/40 text-xs">Confidence:</span>
              <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                  style={{ width: `${confidence}%` }}
                />
              </div>
              <span className="text-white/40 text-xs">{confidence}%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Data Grid Widget
export const DataGridWidget: React.FC<BaseWidgetProps> = ({ 
  title, 
  data,
  config = {},
  className = '',
  onInteraction 
}) => {
  const columns = config?.columns || [];
  const rows = data?.rows || [];
  const sortable = config?.sortable !== false;
  
  const [sortColumn, setSortColumn] = React.useState<string | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  
  const handleSort = (column: string) => {
    if (!sortable) return;
    
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const sortedRows = React.useMemo(() => {
    if (!sortColumn) return rows;
    
    return [...rows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [rows, sortColumn, sortDirection]);
  
  return (
    <div className={`bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden ${className}`}>
      <div className="p-4 border-b border-white/10">
        <h3 className="text-white font-medium">{title}</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {columns.map((col: any) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`px-4 py-3 text-left text-white/60 text-sm font-medium ${
                    sortable ? 'cursor-pointer hover:text-white' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortable && sortColumn === col.key && (
                      <span className="text-white/40">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedRows.map((row: any, idx: number) => (
              <tr 
                key={idx}
                onClick={() => onInteraction?.('row-click', row)}
                className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
              >
                {columns.map((col: any) => (
                  <td key={col.key} className="px-4 py-3 text-white/80 text-sm">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {rows.length === 0 && (
        <div className="p-8 text-center text-white/40">
          No data available
        </div>
      )}
    </div>
  );
};

// Mini Chart Widget
export const MiniChartWidget: React.FC<BaseWidgetProps> = ({ 
  title, 
  data,
  config = {},
  className = '' 
}) => {
  const points = data?.points || [];
  const color = config?.color || '#3b82f6';
  const height = config?.height || 60;
  
  // Simple sparkline implementation
  const maxValue = Math.max(...points.map((p: any) => p.value || p));
  const minValue = Math.min(...points.map((p: any) => p.value || p));
  const range = maxValue - minValue || 1;
  
  const pathData = points.map((point: any, idx: number) => {
    const value = typeof point === 'number' ? point : point.value;
    const x = (idx / (points.length - 1)) * 100;
    const y = height - ((value - minValue) / range) * height;
    return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  
  return (
    <div className={`p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-white/60 text-sm">{title}</h4>
        <Activity className="w-4 h-4 text-white/40" />
      </div>
      
      <svg 
        viewBox={`0 0 100 ${height}`} 
        className="w-full" 
        style={{ height: `${height}px` }}
      >
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={`${pathData} L 100 ${height} L 0 ${height} Z`}
          fill={`${color}20`}
        />
      </svg>
      
      {data?.currentValue !== undefined && (
        <div className="mt-2 text-2xl font-bold text-white">
          {data.currentValue.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// Status Badge Widget
export const StatusWidget: React.FC<BaseWidgetProps> = ({ 
  data,
  className = '' 
}) => {
  const status = data?.status || 'unknown';
  const label = data?.label || status;
  
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'online':
      case 'success':
        return 'bg-green-400';
      case 'warning':
      case 'degraded':
        return 'bg-yellow-400';
      case 'error':
      case 'offline':
      case 'failed':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 bg-black/60 backdrop-blur-md 
                     border border-white/20 rounded-full ${className}`}>
      <div className={`w-2 h-2 rounded-full ${getStatusColor()}`} />
      <span className="text-white/80 text-sm font-medium">{label}</span>
    </div>
  );
};

// Widget Registry
export const widgetRegistry = {
  metric: MetricWidget,
  insight: InsightWidget,
  grid: DataGridWidget,
  chart: MiniChartWidget,
  status: StatusWidget
};

// Widget Renderer
export const WidgetRenderer: React.FC<{
  type: string;
  props: BaseWidgetProps;
}> = ({ type, props }) => {
  const Widget = widgetRegistry[type as keyof typeof widgetRegistry];
  
  if (!Widget) {
    return (
      <div className="p-4 bg-black/40 border border-red-500/30 rounded-lg">
        <p className="text-red-400">Unknown widget type: {type}</p>
      </div>
    );
  }
  
  return <Widget {...props} />;
};
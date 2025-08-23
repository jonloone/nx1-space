'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Metric {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status?: 'healthy' | 'warning' | 'critical';
  source?: string;
}

interface MetricsCardProps {
  title: string;
  metrics: Metric[];
  icon?: string;
  color?: string;
  className?: string;
}

export function MetricsCard({ 
  title, 
  metrics, 
  icon, 
  color = '#3990cf',
  className 
}: MetricsCardProps) {
  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
      default: return '';
    }
  };

  const getStatusColor = (status?: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'stable', isPositive: boolean = true) => {
    if (!trend) return 'text-gray-500';
    
    switch (trend) {
      case 'up': return isPositive ? 'text-green-500' : 'text-red-500';
      case 'down': return isPositive ? 'text-red-500' : 'text-green-500';
      case 'stable': return 'text-gray-500';
      default: return 'text-gray-500';
    }
  };

  return (
    <div className={cn(
      "bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4",
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {icon && (
          <div 
            className="w-8 h-8 rounded flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <i className={cn(icon, "text-sm")} style={{ color }} />
          </div>
        )}
        <h3 className="font-sans-ui font-medium text-sm text-gray-200">{title}</h3>
      </div>

      {/* Metrics */}
      <div className="space-y-2">
        {metrics.map((metric, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{metric.label}</span>
            <div className="flex items-center gap-2">
              <span className={cn(
                "text-sm font-mono font-medium",
                getStatusColor(metric.status)
              )}>
                {metric.value}
                {metric.unit && <span className="text-xs text-gray-600 ml-1">{metric.unit}</span>}
              </span>
              {metric.trend && (
                <span className={cn(
                  "text-xs",
                  getTrendColor(metric.trend, !metric.label.toLowerCase().includes('error'))
                )}>
                  {getTrendIcon(metric.trend)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Source attribution */}
      {metrics.some(m => m.source) && (
        <div className="mt-3 pt-3 border-t border-gray-800">
          <div className="flex flex-wrap gap-2">
            {Array.from(new Set(metrics.filter(m => m.source).map(m => m.source))).map((source, i) => (
              <span key={i} className="text-xs text-gray-600">
                <i className="fas fa-database mr-1 text-gray-700" />
                {source}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Category-specific metric configurations
export const getCategoryMetrics = (category: string) => {
  switch (category) {
    case 'ingest':
      return [
        {
          title: 'Ingestion Overview',
          icon: 'fas fa-download',
          color: '#06b6d4',
          metrics: [
            { label: 'Ingestion Rate', value: '45,231', unit: 'rec/s', trend: 'up' as const, source: 'DataDog' },
            { label: 'Active Sources', value: 15, status: 'healthy' as const, source: 'DataHub' },
            { label: 'Failed Connections', value: 1, status: 'warning' as const, source: 'DataDog' },
            { label: 'Avg Latency', value: '234', unit: 'ms', trend: 'stable' as const, source: 'CloudWatch' },
          ]
        },
        {
          title: 'Queue Status',
          icon: 'fas fa-stream',
          color: '#06b6d4',
          metrics: [
            { label: 'Kafka Lag', value: '1.2M', unit: 'msgs', trend: 'up' as const, source: 'Kafka' },
            { label: 'SQS Queue', value: '45K', unit: 'msgs', source: 'AWS' },
            { label: 'Consumer Groups', value: 8, status: 'healthy' as const, source: 'Kafka' },
            { label: 'Error Rate', value: '0.02', unit: '%', trend: 'down' as const, source: 'DataDog' },
          ]
        }
      ];
    
    case 'process':
      return [
        {
          title: 'Pipeline Health',
          icon: 'fas fa-code-branch',
          color: '#a855f7',
          metrics: [
            { label: 'Running Pipelines', value: 8, status: 'healthy' as const, source: 'Airflow' },
            { label: 'Success Rate', value: '99.7', unit: '%', trend: 'up' as const, source: 'Airflow' },
            { label: 'Failed Jobs', value: 2, status: 'warning' as const, source: 'Airflow' },
            { label: 'Avg Runtime', value: '12.3', unit: 'min', trend: 'down' as const, source: 'dbt' },
          ]
        },
        {
          title: 'Resource Usage',
          icon: 'fas fa-server',
          color: '#a855f7',
          metrics: [
            { label: 'CPU Usage', value: 67, unit: '%', status: 'warning' as const, source: 'DataDog' },
            { label: 'Memory', value: 82, unit: '%', status: 'warning' as const, source: 'DataDog' },
            { label: 'Spark Executors', value: '48/50', trend: 'stable' as const, source: 'Spark' },
            { label: 'Queue Depth', value: 23, source: 'Airflow' },
          ]
        }
      ];
    
    case 'analyze':
      return [
        {
          title: 'Query Performance',
          icon: 'fas fa-chart-line',
          color: '#10b981',
          metrics: [
            { label: 'Active Queries', value: 34, source: 'Presto' },
            { label: 'Avg Query Time', value: '1.2', unit: 's', trend: 'down' as const, source: 'Databricks' },
            { label: 'Cache Hit Rate', value: 87, unit: '%', trend: 'up' as const, source: 'Presto' },
            { label: 'Slow Queries', value: 3, status: 'warning' as const, source: 'Databricks' },
          ]
        },
        {
          title: 'Data Freshness',
          icon: 'fas fa-clock',
          color: '#10b981',
          metrics: [
            { label: 'Last Update', value: '15', unit: 'min ago', status: 'healthy' as const, source: 'DataHub' },
            { label: 'Tables Updated', value: 127, source: 'DataHub' },
            { label: 'Stale Tables', value: 3, status: 'warning' as const, source: 'DataHub' },
            { label: 'Schema Version', value: 'v2.3.1', source: 'DataHub' },
          ]
        }
      ];
    
    case 'monitor':
      return [
        {
          title: 'Alert Status',
          icon: 'fas fa-bell',
          color: '#f97316',
          metrics: [
            { label: 'Active Alerts', value: 2, status: 'critical' as const, source: 'PagerDuty' },
            { label: 'Acknowledged', value: 5, status: 'warning' as const, source: 'PagerDuty' },
            { label: 'MTTR', value: '12', unit: 'min', trend: 'down' as const, source: 'DataDog' },
            { label: 'On-call', value: 'Team Alpha', source: 'PagerDuty' },
          ]
        },
        {
          title: 'System Health',
          icon: 'fas fa-heartbeat',
          color: '#f97316',
          metrics: [
            { label: 'Uptime', value: '99.94', unit: '%', status: 'healthy' as const, source: 'DataDog' },
            { label: 'Quality Score', value: '94/100', trend: 'up' as const, source: 'DataHub' },
            { label: 'Failed Tests', value: 3, status: 'warning' as const, source: 'dbt' },
            { label: 'Schema Drift', value: 2, source: 'DataHub' },
          ]
        }
      ];
    
    default:
      return [];
  }
};
'use client';

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore, categories, type TaskCategory } from '@/stores/workspaceStore';
import { MetricsCard } from './MetricsCard';

export function HomeDashboard() {
  const { setCurrentCategory, setCurrentTask } = useWorkspaceStore();
  const [systemHealth, setSystemHealth] = useState({
    overall: 94,
    services: { healthy: 42, warning: 5, critical: 2 }
  });
  
  const handleCategoryClick = (categoryId: TaskCategory) => {
    setCurrentCategory(categoryId);
    setCurrentTask('category_landing');
  };

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setSystemHealth(prev => ({
        overall: Math.min(100, Math.max(80, prev.overall + (Math.random() - 0.5) * 2)),
        services: {
          healthy: 40 + Math.floor(Math.random() * 5),
          warning: 3 + Math.floor(Math.random() * 4),
          critical: Math.floor(Math.random() * 3)
        }
      }));
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const criticalMetrics = [
    {
      title: 'System Overview',
      icon: 'fas fa-server',
      color: '#3990cf',
      metrics: [
        { label: 'Health Score', value: systemHealth.overall, unit: '%', status: systemHealth.overall > 90 ? 'healthy' as const : 'warning' as const },
        { label: 'Active Pipelines', value: 156, trend: 'stable' as const },
        { label: 'Data Sources', value: 47, status: 'healthy' as const },
        { label: 'Users Online', value: 89, trend: 'up' as const },
      ]
    },
    {
      title: 'Service Status',
      icon: 'fas fa-heartbeat',
      color: '#10b981',
      metrics: [
        { label: 'Healthy Services', value: systemHealth.services.healthy, status: 'healthy' as const },
        { label: 'Warnings', value: systemHealth.services.warning, status: 'warning' as const },
        { label: 'Critical', value: systemHealth.services.critical, status: systemHealth.services.critical > 0 ? 'critical' as const : 'healthy' as const },
        { label: 'Response Time', value: '124', unit: 'ms', trend: 'down' as const },
      ]
    }
  ];

  const recentActivity = [
    { time: '2 min ago', event: 'Pipeline customer_etl completed successfully', type: 'success' },
    { time: '5 min ago', event: 'New data source connected: sales_db_replica', type: 'info' },
    { time: '12 min ago', event: 'Alert resolved: High memory usage on worker-03', type: 'warning' },
    { time: '15 min ago', event: 'Schema drift detected in orders table', type: 'warning' },
    { time: '23 min ago', event: 'Query optimization saved 2.3TB of scans', type: 'success' },
  ];

  const quickActions = [
    { id: 'query', name: 'Run Query', icon: 'fas fa-search', command: 'query' },
    { id: 'pipeline', name: 'Build Pipeline', icon: 'fas fa-code-branch', command: 'build pipeline' },
    { id: 'connect', name: 'Connect Source', icon: 'fas fa-plug', command: 'connect' },
    { id: 'monitor', name: 'View Alerts', icon: 'fas fa-bell', command: 'view incidents' },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif-display text-gray-100 mb-2">
            Data Engineering Command Center
          </h1>
          <p className="text-gray-500">
            System overview and real-time metrics • {new Date().toLocaleString()}
          </p>
        </div>

        {/* Critical Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {criticalMetrics.map((metric, index) => (
            <MetricsCard
              key={index}
              title={metric.title}
              icon={metric.icon}
              color={metric.color}
              metrics={metric.metrics}
            />
          ))}
        </div>

        {/* Category Status Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-sans-ui font-semibold text-white mb-4">Data Lifecycle Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-all group text-left"
              >
                <div className="flex items-center justify-between mb-3">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${getCategoryColor(category.id)}20` }}
                  >
                    <i className={cn(category.icon, "text-lg")} style={{ color: getCategoryColor(category.id) }} />
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400">
                    View →
                  </span>
                </div>
                <h3 className="font-sans-ui font-medium text-white mb-1">{category.name}</h3>
                <div className="text-xs text-gray-500 space-y-1">
                  {getCategoryQuickStats(category.id).map((stat, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{stat.label}</span>
                      <span className={cn(
                        "font-mono",
                        stat.status === 'good' ? 'text-green-500' : 
                        stat.status === 'warning' ? 'text-yellow-500' : 'text-gray-400'
                      )}>
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-sans-ui font-semibold text-white mb-4">Recent Activity</h2>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 pb-3 border-b border-gray-800 last:border-0 last:pb-0">
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5",
                      activity.type === 'success' ? 'bg-green-500' :
                      activity.type === 'warning' ? 'bg-yellow-500' :
                      activity.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300">{activity.event}</p>
                      <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-sans-ui font-semibold text-white mb-4">Quick Actions</h2>
            <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-4">
                Use the AI Console (Ctrl+`) to execute these commands:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <div
                    key={action.id}
                    className="bg-gray-800/50 rounded-lg p-3 border border-gray-700"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <i className={cn(action.icon, "text-blue-400")} />
                      <span className="text-sm font-medium text-gray-200">{action.name}</span>
                    </div>
                    <code className="text-xs text-gray-500 font-mono">{action.command}</code>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <i className="fas fa-lightbulb mr-2" />
            Pro tip: The AI Console adapts to your current context. Type 'help' to see available commands for your selected category.
          </p>
        </div>
      </div>
    </div>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case 'ingest': return '#06b6d4';
    case 'process': return '#a855f7';
    case 'analyze': return '#10b981';
    case 'monitor': return '#f97316';
    default: return '#3990cf';
  }
}

function getCategoryQuickStats(category: TaskCategory) {
  switch (category) {
    case 'ingest':
      return [
        { label: 'Active', value: '15/17', status: 'good' },
        { label: 'Rate', value: '45K/s', status: 'good' },
        { label: 'Errors', value: '1', status: 'warning' },
      ];
    case 'process':
      return [
        { label: 'Running', value: '8', status: 'good' },
        { label: 'Success', value: '99.7%', status: 'good' },
        { label: 'Queue', value: '23', status: 'warning' },
      ];
    case 'analyze':
      return [
        { label: 'Queries', value: '34', status: 'good' },
        { label: 'Cache', value: '87%', status: 'good' },
        { label: 'Slow', value: '3', status: 'warning' },
      ];
    case 'monitor':
      return [
        { label: 'Alerts', value: '2', status: 'warning' },
        { label: 'SLA', value: '99.94%', status: 'good' },
        { label: 'Tests', value: '3 fail', status: 'warning' },
      ];
    default:
      return [];
  }
}
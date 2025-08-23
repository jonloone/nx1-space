'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  useWorkspaceStore,
  categories,
  getTasksByCategory,
  type TaskCategory,
  type TaskType
} from '@/stores/workspaceStore';
import { MetricsCard, getCategoryMetrics } from './MetricsCard';

interface CategoryLandingProps {
  categoryId: TaskCategory;
}

export function CategoryLanding({ categoryId }: CategoryLandingProps) {
  const { setCurrentTask } = useWorkspaceStore();
  
  const category = categories.find(c => c.id === categoryId);
  const tasks = getTasksByCategory(categoryId);

  if (!category) return null;

  const handleTaskClick = (taskId: TaskType) => {
    setCurrentTask(taskId);
  };

  const getCategoryContent = (categoryId: TaskCategory) => {
    switch (categoryId) {
      case 'ingest':
        return {
          title: 'Ingest - Connect and Import Your Data',
          description: 'Establish connections to data sources and import data into your ecosystem.',
          suggestions: [
            'Connect to a PostgreSQL database',
            'Set up real-time streaming from Kafka',
            'Import CSV files from S3 bucket'
          ],
          quickStart: [
            { id: 'database_connection', name: 'Database Connection', icon: 'fas fa-database' },
            { id: 'api_integration', name: 'API Integration', icon: 'fas fa-plug' },
            { id: 'file_upload', name: 'File Upload', icon: 'fas fa-upload' }
          ]
        };
      case 'process':
        return {
          title: 'Process - Transform and Optimize Your Data',
          description: 'Build pipelines, transform data, and optimize performance.',
          suggestions: [
            'Help me build a pipeline for customer data',
            'Optimize a slow-running ETL job',
            'Set up data validation rules'
          ],
          quickStart: [
            { id: 'pipeline_builder', name: 'Pipeline Builder', icon: 'fas fa-code-branch' },
            { id: 'performance_optimizer', name: 'Performance Optimizer', icon: 'fas fa-tachometer-alt' },
            { id: 'data_validator', name: 'Data Validator', icon: 'fas fa-check-circle' }
          ]
        };
      case 'analyze':
        return {
          title: 'Analyze - Explore and Discover Insights',
          description: 'Query data, build visualizations, and uncover patterns.',
          suggestions: [
            'Show me sales trends over the last quarter',
            'Find anomalies in user behavior data',
            'Create a dashboard for KPI monitoring'
          ],
          quickStart: [
            { id: 'query_builder', name: 'Query Builder', icon: 'fas fa-search' },
            { id: 'visualization_studio', name: 'Visualization Studio', icon: 'fas fa-chart-bar' },
            { id: 'anomaly_detector', name: 'Anomaly Detector', icon: 'fas fa-exclamation-triangle' }
          ]
        };
      case 'monitor':
        return {
          title: 'Monitor - Track Health and Performance',
          description: 'Set up alerts, monitor data quality, and track system health.',
          suggestions: [
            'Set up alerts for data pipeline failures',
            'Monitor data quality metrics',
            'Create health dashboards'
          ],
          quickStart: [
            { id: 'alert_manager', name: 'Alert Manager', icon: 'fas fa-bell' },
            { id: 'quality_monitor', name: 'Quality Monitor', icon: 'fas fa-shield-alt' },
            { id: 'health_dashboard', name: 'Health Dashboard', icon: 'fas fa-heartbeat' }
          ]
        };
      default:
        return {
          title: 'Data Engineering',
          description: 'Manage your data lifecycle',
          suggestions: [],
          quickStart: []
        };
    }
  };

  const content = getCategoryContent(categoryId);

  return (
    <div className="h-full flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-800 border-b border-gray-800">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-16 h-16 rounded-xl flex items-center justify-center",
              "bg-gray-800/50 backdrop-blur-sm"
            )}>
              <i className={cn(category.icon, category.color, "text-2xl")} />
            </div>
            <div>
              <h1 className="text-2xl font-serif-header text-white mb-2">
                {content.title}
              </h1>
              <p className="text-gray-400 text-lg">
                {content.description}
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-8">
        {/* Real-time Metrics Section */}
        <div className="mb-8">
          <h2 className="text-xl font-sans-ui font-semibold text-white mb-4">Live Metrics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {getCategoryMetrics(categoryId).map((metricGroup, index) => (
              <MetricsCard
                key={index}
                title={metricGroup.title}
                icon={metricGroup.icon}
                color={metricGroup.color}
                metrics={metricGroup.metrics}
              />
            ))}
          </div>
        </div>

        {/* Quick Start Section */}
        <div className="mb-8">
          <h2 className="text-xl font-sans-ui font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.quickStart.map((item) => (
              <button
                key={item.id}
                onClick={() => handleTaskClick(item.id as TaskType)}
                className="p-6 bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700 hover:border-gray-600 transition-all group text-left"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <i className={cn(item.icon, "text-blue-400")} />
                  </div>
                  <h3 className="font-sans-ui font-medium text-white group-hover:text-blue-400 transition-colors">
                    {item.name}
                  </h3>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* All Tasks Section */}
        <div className="mb-8">
          <h2 className="text-xl font-sans-ui font-semibold text-white mb-4">All {category.name} Tasks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {tasks.map((task) => (
              <button
                key={task.id}
                onClick={() => handleTaskClick(task.id)}
                className="p-4 bg-gray-800/20 backdrop-blur-sm rounded-lg border border-gray-800 hover:border-gray-700 transition-all group text-left flex items-center gap-3"
              >
                <i className={cn(task.icon, "text-gray-400 group-hover:text-blue-400 transition-colors")} />
                <div className="min-w-0 flex-1">
                  <div className="font-sans-ui font-medium text-white group-hover:text-blue-400 transition-colors">
                    {task.name}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {task.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
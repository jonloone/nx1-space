'use client';

import React from 'react';
import { useWorkspaceStore, getTaskById } from '@/stores/workspaceStore';
import { CategoryLanding } from '@/components/workspace/CategoryLanding';
import { QueryToProductWizard } from '@/components/workstation/QueryToProductWizard';
import { DataQualityAssessment } from '@/components/workstation/DataQualityAssessment';
import { PipelineBuilder } from '@/components/workstation/tasks/PipelineBuilder';
import { QueryOptimizer } from '@/components/workstation/tasks/QueryOptimizer';
import { ConnectionWizard } from '@/components/workstation/tasks/ConnectionWizard';
import { TaskPlaceholder } from '@/components/workstation/TaskPlaceholder';

export function TaskContent() {
  const { currentTask, currentCategory } = useWorkspaceStore();
  
  // Handle category landing pages
  if (currentTask === 'category_landing' && currentCategory) {
    return <CategoryLanding categoryId={currentCategory} />;
  }
  
  const task = currentTask ? getTaskById(currentTask) : null;

  if (!currentTask || !task) {
    return <EmptyState />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Task Header */}
      <div className="px-8 py-6 border-b border-gray-800/50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                <i className={task.icon + " text-blue-400 text-lg"} />
              </div>
              <div>
                <h1 className="text-2xl font-serif-display text-gray-100">{task.name}</h1>
                <p className="text-sm text-gray-500 mt-1">{task.description}</p>
              </div>
            </div>
            
            {/* Task Actions */}
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm text-gray-400 hover:text-gray-200 transition-colors">
                <i className="fas fa-bookmark mr-2" />
                Save
              </button>
              <button className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors">
                <i className="fas fa-play mr-2" />
                Run
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Task Interface */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="max-w-6xl mx-auto">
            <TaskInterface taskId={currentTask} />
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { taskHistory } = useWorkspaceStore();
  
  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center">
          <i className="fas fa-layer-group text-3xl text-blue-400" />
        </div>
        
        <h2 className="text-3xl font-serif-display text-gray-100 mb-4">
          Welcome to Your Data Engineering Workspace
        </h2>
        <p className="text-gray-500 mb-8">
          Select a task from the navigation menu to get started, or continue where you left off.
        </p>
        
        {taskHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-sans-ui font-medium text-gray-400 mb-3">Recent Tasks</h3>
            <div className="flex flex-wrap gap-2 justify-center">
              {taskHistory.slice(0, 3).map((item) => {
                const task = getTaskById(item.taskId);
                if (!task) return null;
                
                return (
                  <button
                    key={item.taskId}
                    onClick={() => useWorkspaceStore.getState().setCurrentTask(item.taskId)}
                    className="px-4 py-2 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <i className={task.icon + " text-xs text-gray-500"} />
                    <span className="text-sm text-gray-300">{task.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-sm text-blue-400">
            <i className="fas fa-lightbulb mr-2" />
            Tip: Use <kbd className="px-2 py-0.5 bg-gray-800 rounded text-xs">Cmd/Ctrl + /</kbd> to open the AI assistant for help
          </p>
        </div>
      </div>
    </div>
  );
}

function TaskInterface({ taskId }: { taskId: string }) {
  const task = getTaskById(taskId as any);
  
  // Map task IDs to their respective components
  switch (taskId) {
    // Ingest tasks
    case 'connect_data':
      return <ConnectionWizard role="data_engineer" />;
    
    case 'stream_processing':
      return (
        <TaskPlaceholder 
          taskName="Stream Processing"
          taskDescription="Set up real-time data streaming pipelines with Kafka, Kinesis, or other streaming platforms"
          icon="fas fa-stream"
          category="ingest"
        />
      );
    
    case 'migrate_data':
      return (
        <TaskPlaceholder 
          taskName="Data Migration"
          taskDescription="Migrate data between systems, databases, or cloud platforms with validation and rollback capabilities"
          icon="fas fa-exchange-alt"
          category="ingest"
        />
      );
    
    // Process tasks
    case 'build_pipeline':
      return <PipelineBuilder role="data_engineer" />;
    
    case 'optimize_query':
      return <QueryOptimizer role="data_engineer" />;
    
    case 'catalog_data':
      return (
        <TaskPlaceholder 
          taskName="Data Catalog"
          taskDescription="Catalog and document your data assets with metadata, tags, and business context"
          icon="fas fa-book"
          category="process"
        />
      );
    
    case 'query_to_product':
      return <QueryToProductWizard />;
    
    // Analyze tasks
    case 'trace_lineage':
      return (
        <TaskPlaceholder 
          taskName="Lineage Tracing"
          taskDescription="Trace data lineage from source to destination, understanding transformations and dependencies"
          icon="fas fa-project-diagram"
          category="analyze"
        />
      );
    
    case 'profile_data':
      return (
        <TaskPlaceholder 
          taskName="Data Profiling"
          taskDescription="Profile your data to understand distributions, patterns, and quality characteristics"
          icon="fas fa-microscope"
          category="analyze"
        />
      );
    
    case 'create_metrics':
      return (
        <TaskPlaceholder 
          taskName="Metrics Builder"
          taskDescription="Define and create business metrics with calculations, aggregations, and KPIs"
          icon="fas fa-chart-line"
          category="analyze"
        />
      );
    
    case 'explore_insights':
      return (
        <TaskPlaceholder 
          taskName="Insight Explorer"
          taskDescription="Explore data using AI-powered insights, anomaly detection, and pattern recognition"
          icon="fas fa-lightbulb"
          category="analyze"
        />
      );
    
    // Monitor tasks
    case 'test_quality':
      return <DataQualityAssessment tableName="customers" />;
    
    case 'monitor_health':
      return (
        <TaskPlaceholder 
          taskName="Health Monitoring"
          taskDescription="Monitor system health, performance metrics, and service availability in real-time"
          icon="fas fa-heartbeat"
          category="monitor"
        />
      );
    
    case 'create_dashboard':
      return (
        <TaskPlaceholder 
          taskName="Dashboard Builder"
          taskDescription="Create interactive dashboards with real-time metrics, alerts, and visualizations"
          icon="fas fa-tachometer-alt"
          category="monitor"
        />
      );
    
    default:
      return (
        <TaskPlaceholder 
          taskName={task?.name || 'Unknown Task'}
          taskDescription={task?.description || 'This task is being developed'}
          icon={task?.icon || 'fas fa-hammer'}
          category={task?.category}
        />
      );
  }
}
import { type TaskType } from '@/stores/workspaceStore';

export interface PaneTemplate {
  taskId: TaskType;
  panes: PaneConfig[];
}

export interface PaneConfig {
  id: string;
  component: string;
  title: string;
  position: 'right' | 'bottom' | 'left';
  size: number; // Percentage of available space
  closeable: boolean;
  autoOpen: boolean;
  params?: Record<string, any>;
}

// Define pane templates for each task type
export const paneTemplates: Record<TaskType, PaneConfig[]> = {
  // Special views
  category_landing: [],
  idle: [],
  
  // Ingest tasks
  connect_data: [
    {
      id: 'connection-status',
      component: 'status',
      title: 'Connection Status',
      position: 'right',
      size: 30,
      closeable: true,
      autoOpen: true,
      params: { type: 'connection' }
    },
    {
      id: 'schema-preview',
      component: 'schema',
      title: 'Schema Preview',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: { readonly: true }
    }
  ],
  
  stream_processing: [
    {
      id: 'stream-metrics',
      component: 'metrics',
      title: 'Stream Metrics',
      position: 'right',
      size: 35,
      closeable: true,
      autoOpen: true,
      params: { type: 'streaming' }
    },
    {
      id: 'logs',
      component: 'logs',
      title: 'Processing Logs',
      position: 'bottom',
      size: 20,
      closeable: true,
      autoOpen: true,
      params: { filter: 'stream' }
    }
  ],
  
  migrate_data: [
    {
      id: 'migration-progress',
      component: 'progress',
      title: 'Migration Progress',
      position: 'right',
      size: 30,
      closeable: true,
      autoOpen: true,
      params: { type: 'migration' }
    },
    {
      id: 'validation',
      component: 'validation',
      title: 'Data Validation',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: {}
    }
  ],
  
  // Process tasks
  build_pipeline: [
    {
      id: 'pipeline-status',
      component: 'status',
      title: 'Pipeline Status',
      position: 'right',
      size: 30,
      closeable: true,
      autoOpen: true,
      params: { type: 'pipeline' }
    },
    {
      id: 'step-requirements',
      component: 'requirements',
      title: 'Step Requirements',
      position: 'bottom',
      size: 20,
      closeable: true,
      autoOpen: false,
      params: {}
    },
    {
      id: 'build-output',
      component: 'output',
      title: 'Build Output',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: { type: 'build' }
    }
  ],
  
  optimize_query: [
    {
      id: 'query-metrics',
      component: 'metrics',
      title: 'Query Metrics',
      position: 'right',
      size: 40,
      closeable: true,
      autoOpen: true,
      params: { type: 'query' }
    },
    {
      id: 'execution-plan',
      component: 'plan',
      title: 'Execution Plan',
      position: 'bottom',
      size: 30,
      closeable: true,
      autoOpen: true,
      params: {}
    }
  ],
  
  catalog_data: [
    {
      id: 'metadata',
      component: 'metadata',
      title: 'Metadata',
      position: 'right',
      size: 35,
      closeable: true,
      autoOpen: true,
      params: {}
    },
    {
      id: 'lineage',
      component: 'lineage',
      title: 'Data Lineage',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: {}
    }
  ],
  
  query_to_product: [
    {
      id: 'wizard-config',
      component: 'config',
      title: 'Configuration',
      position: 'right',
      size: 35,
      closeable: true,
      autoOpen: true,
      params: { type: 'wizard' }
    },
    {
      id: 'preview',
      component: 'preview',
      title: 'Data Preview',
      position: 'bottom',
      size: 30,
      closeable: true,
      autoOpen: false,
      params: {}
    }
  ],
  
  // Analyze tasks
  trace_lineage: [
    {
      id: 'lineage-graph',
      component: 'graph',
      title: 'Lineage Graph',
      position: 'right',
      size: 50,
      closeable: true,
      autoOpen: true,
      params: { type: 'lineage' }
    },
    {
      id: 'impact-analysis',
      component: 'impact',
      title: 'Impact Analysis',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: {}
    }
  ],
  
  profile_data: [
    {
      id: 'profile-stats',
      component: 'statistics',
      title: 'Profile Statistics',
      position: 'right',
      size: 40,
      closeable: true,
      autoOpen: true,
      params: {}
    },
    {
      id: 'quality-issues',
      component: 'issues',
      title: 'Quality Issues',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: true,
      params: { type: 'quality' }
    }
  ],
  
  create_metrics: [
    {
      id: 'metric-builder',
      component: 'builder',
      title: 'Metric Builder',
      position: 'right',
      size: 35,
      closeable: true,
      autoOpen: true,
      params: { type: 'metric' }
    },
    {
      id: 'metric-preview',
      component: 'preview',
      title: 'Metric Preview',
      position: 'bottom',
      size: 30,
      closeable: true,
      autoOpen: false,
      params: { realtime: true }
    }
  ],
  
  explore_insights: [
    {
      id: 'insight-panel',
      component: 'insights',
      title: 'AI Insights',
      position: 'right',
      size: 35,
      closeable: true,
      autoOpen: true,
      params: { ai: true }
    },
    {
      id: 'visualization',
      component: 'viz',
      title: 'Visualizations',
      position: 'bottom',
      size: 35,
      closeable: true,
      autoOpen: true,
      params: {}
    }
  ],
  
  // Monitor tasks
  test_quality: [
    {
      id: 'test-config',
      component: 'config',
      title: 'Test Configuration',
      position: 'right',
      size: 30,
      closeable: true,
      autoOpen: true,
      params: { type: 'quality' }
    },
    {
      id: 'test-results',
      component: 'results',
      title: 'Test Results',
      position: 'bottom',
      size: 30,
      closeable: true,
      autoOpen: false,
      params: {}
    },
    {
      id: 'quality-metrics',
      component: 'metrics',
      title: 'Quality Metrics',
      position: 'right',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: { type: 'quality' }
    }
  ],
  
  monitor_health: [
    {
      id: 'health-dashboard',
      component: 'dashboard',
      title: 'Health Dashboard',
      position: 'right',
      size: 50,
      closeable: true,
      autoOpen: true,
      params: { type: 'health' }
    },
    {
      id: 'alerts',
      component: 'alerts',
      title: 'Active Alerts',
      position: 'bottom',
      size: 25,
      closeable: true,
      autoOpen: true,
      params: {}
    }
  ],
  
  create_dashboard: [
    {
      id: 'widget-library',
      component: 'library',
      title: 'Widget Library',
      position: 'right',
      size: 25,
      closeable: true,
      autoOpen: true,
      params: { type: 'widgets' }
    },
    {
      id: 'dashboard-config',
      component: 'config',
      title: 'Dashboard Config',
      position: 'right',
      size: 25,
      closeable: true,
      autoOpen: false,
      params: { type: 'dashboard' }
    },
    {
      id: 'data-sources',
      component: 'sources',
      title: 'Data Sources',
      position: 'bottom',
      size: 20,
      closeable: true,
      autoOpen: false,
      params: {}
    }
  ]
};

// Get pane template for a specific task
export function getPaneTemplate(taskId: TaskType): PaneConfig[] {
  return paneTemplates[taskId] || [];
}

// Check if a task has auto-opening panes
export function hasAutoOpenPanes(taskId: TaskType): boolean {
  const template = getPaneTemplate(taskId);
  return template.some(pane => pane.autoOpen);
}

// Get only auto-opening panes for a task
export function getAutoOpenPanes(taskId: TaskType): PaneConfig[] {
  const template = getPaneTemplate(taskId);
  return template.filter(pane => pane.autoOpen);
}

// Update pane state based on task progression
export function updatePaneForStep(taskId: TaskType, step: number): PaneConfig | null {
  // Special handling for build_pipeline task
  if (taskId === 'build_pipeline') {
    switch (step) {
      case 1:
        return {
          id: 'step-requirements',
          component: 'requirements',
          title: 'Requirements',
          position: 'right',
          size: 30,
          closeable: true,
          autoOpen: true,
          params: { step: 1 }
        };
      case 2:
        return {
          id: 'validation-results',
          component: 'validation',
          title: 'Validation Results',
          position: 'right',
          size: 35,
          closeable: true,
          autoOpen: true,
          params: { step: 2 }
        };
      case 3:
        return {
          id: 'build-progress',
          component: 'progress',
          title: 'Build Progress',
          position: 'bottom',
          size: 25,
          closeable: true,
          autoOpen: true,
          params: { step: 3 }
        };
      default:
        return null;
    }
  }
  
  // Add similar logic for other tasks as needed
  return null;
}
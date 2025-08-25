import { type TaskType } from '@/stores/workspaceStore';

export interface SmartPaneConfig {
  id: string;
  component: string;
  title: string;
  position: 'right' | 'left' | 'bottom' | 'top';
  size: number; // percentage
  closeable: boolean;
  autoOpen: boolean;
  updateOn?: string[]; // Events that trigger updates
  initialData?: any;
}

export interface TaskPaneLayout {
  main: {
    component: string;
    title: string;
    size?: number;
  };
  auxiliary: SmartPaneConfig[];
  aiContext: {
    mode: string;
    tools: string[];
    initialPrompt?: string;
  };
}

// Smart pane configurations for each task type
export const smartTaskConfigs: Partial<Record<string, TaskPaneLayout>> = {
  'build_pipeline': {
    main: {
      component: 'pipeline-builder',
      title: 'Pipeline Builder',
      size: 65
    },
    auxiliary: [
      {
        id: 'pipeline-status',
        component: 'status',
        title: 'Pipeline Status',
        position: 'right',
        size: 35,
        closeable: true,
        autoOpen: true,
        updateOn: ['step-change', 'validation', 'error']
      },
      {
        id: 'pipeline-requirements',
        component: 'requirements',
        title: 'Requirements',
        position: 'bottom',
        size: 20,
        closeable: true,
        autoOpen: false,
        updateOn: ['requirements-check']
      }
    ],
    aiContext: {
      mode: 'pipeline-assistant',
      tools: ['validator', 'optimizer', 'debugger'],
      initialPrompt: 'I\'m ready to help you build your pipeline. What data sources will you be working with?'
    }
  },

  'data_quality_assessment': {
    main: {
      component: 'quality-dashboard',
      title: 'Data Quality Assessment',
      size: 55
    },
    auxiliary: [
      {
        id: 'quality-metrics',
        component: 'metrics',
        title: 'Quality Metrics',
        position: 'right',
        size: 45,
        closeable: false,
        autoOpen: true,
        updateOn: ['data-change', 'rule-execution']
      },
      {
        id: 'sample-issues',
        component: 'validation',
        title: 'Sample Issues',
        position: 'bottom',
        size: 25,
        closeable: true,
        autoOpen: true,
        updateOn: ['issue-found']
      }
    ],
    aiContext: {
      mode: 'quality-analyst',
      tools: ['anomaly-detector', 'rule-suggester', 'pattern-finder'],
      initialPrompt: 'I\'ve loaded the quality assessment tools. Which dataset would you like to analyze?'
    }
  },

  'real_time_monitoring': {
    main: {
      component: 'monitor-dashboard',
      title: 'Real-time Monitor',
      size: 70
    },
    auxiliary: [
      {
        id: 'live-metrics',
        component: 'metrics',
        title: 'Live Metrics',
        position: 'right',
        size: 30,
        closeable: false,
        autoOpen: true,
        updateOn: ['metric-update']
      },
      {
        id: 'alert-panel',
        component: 'logs',
        title: 'Alerts',
        position: 'bottom',
        size: 20,
        closeable: true,
        autoOpen: false,
        updateOn: ['alert-triggered']
      }
    ],
    aiContext: {
      mode: 'monitor-assistant',
      tools: ['alert-analyzer', 'trend-detector', 'threshold-optimizer'],
      initialPrompt: 'Monitoring systems active. I\'ll alert you to any anomalies or issues.'
    }
  },

  'performance_tuning': {
    main: {
      component: 'performance-analyzer',
      title: 'Performance Tuning',
      size: 60
    },
    auxiliary: [
      {
        id: 'performance-metrics',
        component: 'metrics',
        title: 'Performance Metrics',
        position: 'right',
        size: 40,
        closeable: false,
        autoOpen: true,
        updateOn: ['performance-data']
      },
      {
        id: 'optimization-suggestions',
        component: 'progress',
        title: 'Optimizations',
        position: 'bottom',
        size: 30,
        closeable: true,
        autoOpen: true,
        updateOn: ['optimization-found']
      }
    ],
    aiContext: {
      mode: 'performance-optimizer',
      tools: ['bottleneck-finder', 'query-optimizer', 'resource-analyzer'],
      initialPrompt: 'Let\'s optimize your system performance. What specific areas are you concerned about?'
    }
  },

  'exploratory_analysis': {
    main: {
      component: 'analysis-workspace',
      title: 'Exploratory Analysis',
      size: 75
    },
    auxiliary: [
      {
        id: 'data-preview',
        component: 'preview',
        title: 'Data Preview',
        position: 'right',
        size: 25,
        closeable: true,
        autoOpen: true,
        updateOn: ['data-selected']
      }
    ],
    aiContext: {
      mode: 'data-scientist',
      tools: ['pattern-finder', 'correlation-analyzer', 'insight-generator'],
      initialPrompt: 'Ready to explore your data. What patterns or insights are you looking for?'
    }
  },

  // Task launched from AI suggestion - pipeline failure
  'pipeline-debug': {
    main: {
      component: 'pipeline-debugger',
      title: 'Pipeline Debugger',
      size: 50
    },
    auxiliary: [
      {
        id: 'error-logs',
        component: 'logs',
        title: 'Error Logs',
        position: 'bottom',
        size: 30,
        closeable: false,
        autoOpen: true,
        updateOn: ['log-update'],
        initialData: { filter: 'error' }
      },
      {
        id: 'pipeline-trace',
        component: 'status',
        title: 'Execution Trace',
        position: 'right',
        size: 50,
        closeable: false,
        autoOpen: true,
        updateOn: ['trace-update']
      }
    ],
    aiContext: {
      mode: 'debug-assistant',
      tools: ['error-analyzer', 'root-cause-finder', 'fix-suggester'],
      initialPrompt: 'I see the pipeline failures. Let me analyze the error patterns and suggest fixes.'
    }
  },

  // Task launched from AI suggestion - optimization
  'performance-optimize': {
    main: {
      component: 'optimization-wizard',
      title: 'Optimization Wizard',
      size: 60
    },
    auxiliary: [
      {
        id: 'before-after',
        component: 'metrics',
        title: 'Before/After Metrics',
        position: 'right',
        size: 40,
        closeable: false,
        autoOpen: true,
        updateOn: ['optimization-applied']
      },
      {
        id: 'optimization-progress',
        component: 'progress',
        title: 'Optimization Progress',
        position: 'bottom',
        size: 20,
        closeable: true,
        autoOpen: true,
        updateOn: ['step-complete']
      }
    ],
    aiContext: {
      mode: 'optimization-guide',
      tools: ['optimizer', 'impact-analyzer', 'rollback-manager'],
      initialPrompt: 'I\'ve identified optimization opportunities. Let\'s apply them safely with rollback capability.'
    }
  }
};

// Function to get optimal pane configuration based on context
export function getOptimalPaneConfig(
  taskType: string,
  context?: {
    dataSize?: number;
    hasErrors?: boolean;
    priority?: 'high' | 'medium' | 'low';
    source?: 'ai-suggestion' | 'user' | 'system';
  }
): TaskPaneLayout | undefined {
  const baseConfig = smartTaskConfigs[taskType];
  
  if (!baseConfig) {
    // Return a default configuration for unknown tasks
    return {
      main: {
        component: 'task',
        title: taskType,
        size: 70
      },
      auxiliary: [],
      aiContext: {
        mode: 'general-assistant',
        tools: ['helper'],
        initialPrompt: 'How can I help you with this task?'
      }
    };
  }

  // Clone the base config to avoid mutations
  const config = JSON.parse(JSON.stringify(baseConfig)) as TaskPaneLayout;

  // Adjust configuration based on context
  if (context) {
    // Add performance monitoring for large datasets
    if (context.dataSize && context.dataSize > 1000000) {
      config.auxiliary.push({
        id: 'performance-monitor',
        component: 'metrics',
        title: 'Performance',
        position: 'bottom',
        size: 15,
        closeable: true,
        autoOpen: true,
        updateOn: ['performance-update']
      });
    }

    // Add error inspector for tasks with errors
    if (context.hasErrors) {
      config.auxiliary.push({
        id: 'error-inspector',
        component: 'logs',
        title: 'Errors',
        position: 'bottom',
        size: 25,
        closeable: false,
        autoOpen: true,
        updateOn: ['error'],
        initialData: { severity: 'error' }
      });
    }

    // Adjust AI context based on priority
    if (context.priority === 'high') {
      config.aiContext.initialPrompt = '⚠️ High priority task. ' + config.aiContext.initialPrompt;
    }

    // If launched from AI suggestion, add more context
    if (context.source === 'ai-suggestion') {
      config.aiContext.initialPrompt = 'I suggested this task based on system analysis. ' + config.aiContext.initialPrompt;
    }
  }

  return config;
}

// Helper to determine if panes should be reconfigured or kept
export function shouldReconfigurePanes(
  currentTask: string,
  newTask: string,
  keepLayout: boolean = false
): boolean {
  if (keepLayout) return false;
  
  // Define task relationships
  const relatedTasks: Record<string, string[]> = {
    'build_pipeline': ['pipeline-debug', 'performance-optimize'],
    'data_quality_assessment': ['exploratory_analysis'],
    'real_time_monitoring': ['pipeline-debug', 'performance_tuning']
  };

  // Check if tasks are related
  const currentRelated = relatedTasks[currentTask] || [];
  const newRelated = relatedTasks[newTask] || [];
  
  return !(currentRelated.includes(newTask) || newRelated.includes(currentTask));
}
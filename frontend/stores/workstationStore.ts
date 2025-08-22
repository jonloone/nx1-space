import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

export type TaskType = 
  | 'idle'
  | 'build_pipeline'
  | 'optimize_query'
  | 'explore_lineage'
  | 'test_data'
  | 'add_connection'
  | 'create_dashboard'
  | 'stream_processing'
  | 'catalog_data'
  | 'monitor_quality'
  | 'profile_data'
  | 'migrate_data'
  | 'create_metrics'
  | 'explore_insights'
  | 'query_to_product';

export type UserRole = 
  | 'data_engineer'
  | 'analytics_engineer'
  | 'data_analyst'
  | 'domain_expert'
  | 'executive';

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  currentAction?: string;
  progress?: number;
}

export interface TaskContext {
  request?: string;
  analysis?: any;
  configuration?: any;
  validation?: any;
  deployment?: any;
}

interface WorkstationState {
  // Current state
  currentTask: TaskType;
  userRole: UserRole;
  taskContext: TaskContext;
  activeAgents: Agent[];
  agentLogs: Array<{
    timestamp: Date;
    agent: string;
    message: string;
    level: 'info' | 'warning' | 'error';
  }>;
  
  // UI state
  testMode: boolean;
  showAgentDetails: boolean;
  
  // Metrics
  metrics: {
    taskStartTime?: Date;
    clickCount: number;
    errorCount: number;
    helpCount: number;
  };
  
  // Actions
  setCurrentTask: (task: TaskType) => void;
  setUserRole: (role: UserRole) => void;
  updateTaskContext: (updates: Partial<TaskContext>) => void;
  
  // Agent actions
  addAgent: (agent: Agent) => void;
  updateAgent: (agentId: string, updates: Partial<Agent>) => void;
  removeAgent: (agentId: string) => void;
  addAgentLog: (log: Omit<WorkstationState['agentLogs'][0], 'timestamp'>) => void;
  
  // UI actions
  setTestMode: (enabled: boolean) => void;
  setShowAgentDetails: (show: boolean) => void;
  
  // Metrics actions
  incrementClickCount: () => void;
  incrementErrorCount: () => void;
  incrementHelpCount: () => void;
  startTaskTimer: () => void;
  getTaskDuration: () => number;
}

export const useWorkstationStore = create<WorkstationState>()(
  immer((set, get) => ({
    // Initial state
    currentTask: 'idle',
    userRole: 'data_engineer',
    taskContext: {},
    activeAgents: [],
    agentLogs: [],
    testMode: process.env.NODE_ENV === 'development',
    showAgentDetails: true,
    metrics: {
      clickCount: 0,
      errorCount: 0,
      helpCount: 0
    },
    
    // Actions
    setCurrentTask: (task) =>
      set((state) => {
        state.currentTask = task;
        state.taskContext = {};
        if (task !== 'idle') {
          state.metrics.taskStartTime = new Date();
        }
      }),
    
    setUserRole: (role) =>
      set((state) => {
        state.userRole = role;
        // Adjust UI complexity based on role
        state.showAgentDetails = role === 'data_engineer' || role === 'analytics_engineer';
      }),
    
    updateTaskContext: (updates) =>
      set((state) => {
        Object.assign(state.taskContext, updates);
      }),
    
    // Agent actions
    addAgent: (agent) =>
      set((state) => {
        state.activeAgents.push(agent);
        state.addAgentLog({
          agent: agent.name,
          message: `${agent.name} started`,
          level: 'info'
        });
      }),
    
    updateAgent: (agentId, updates) =>
      set((state) => {
        const agent = state.activeAgents.find(a => a.id === agentId);
        if (agent) {
          Object.assign(agent, updates);
          if (updates.currentAction) {
            state.addAgentLog({
              agent: agent.name,
              message: updates.currentAction,
              level: 'info'
            });
          }
        }
      }),
    
    removeAgent: (agentId) =>
      set((state) => {
        const index = state.activeAgents.findIndex(a => a.id === agentId);
        if (index !== -1) {
          const agent = state.activeAgents[index];
          state.activeAgents.splice(index, 1);
          state.addAgentLog({
            agent: agent.name,
            message: `${agent.name} completed`,
            level: 'info'
          });
        }
      }),
    
    addAgentLog: (log) =>
      set((state) => {
        state.agentLogs.unshift({
          ...log,
          timestamp: new Date()
        });
        // Keep only last 50 logs
        if (state.agentLogs.length > 50) {
          state.agentLogs = state.agentLogs.slice(0, 50);
        }
      }),
    
    // UI actions
    setTestMode: (enabled) =>
      set((state) => {
        state.testMode = enabled;
      }),
    
    setShowAgentDetails: (show) =>
      set((state) => {
        state.showAgentDetails = show;
      }),
    
    // Metrics actions
    incrementClickCount: () =>
      set((state) => {
        state.metrics.clickCount++;
      }),
    
    incrementErrorCount: () =>
      set((state) => {
        state.metrics.errorCount++;
      }),
    
    incrementHelpCount: () =>
      set((state) => {
        state.metrics.helpCount++;
      }),
    
    startTaskTimer: () =>
      set((state) => {
        state.metrics.taskStartTime = new Date();
      }),
    
    getTaskDuration: () => {
      const { taskStartTime } = get().metrics;
      if (!taskStartTime) return 0;
      return Date.now() - taskStartTime.getTime();
    }
  }))
);

// Data lifecycle stages
export type DataLifecycleStage = 'ingest' | 'process' | 'analyze' | 'monitor';

export interface TaskDefinition {
  id: string;
  name: string;
  icon: string;
  description: string;
  roles: UserRole[];
  lifecycle: DataLifecycleStage;
  color: string;
}

// Helper functions
export function getTasksForRole(role: UserRole) {
  const allTasks: TaskDefinition[] = [
    // Ingest Stage
    { 
      id: 'add_connection', 
      name: 'Connect Data Source', 
      icon: 'fas fa-database',
      description: 'Connect databases, APIs, or files',
      roles: ['data_engineer', 'analytics_engineer'],
      lifecycle: 'ingest',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'stream_processing', 
      name: 'Stream Processing', 
      icon: 'fas fa-water',
      description: 'Set up real-time data flows',
      roles: ['data_engineer'],
      lifecycle: 'ingest',
      color: 'from-blue-500 to-cyan-500'
    },
    { 
      id: 'migrate_data', 
      name: 'Migrate Data', 
      icon: 'fas fa-truck-moving',
      description: 'Move data between systems',
      roles: ['data_engineer'],
      lifecycle: 'ingest',
      color: 'from-blue-500 to-cyan-500'
    },
    
    // Process Stage
    { 
      id: 'build_pipeline', 
      name: 'Build Pipeline', 
      icon: 'fas fa-code-branch',
      description: 'Create transformation workflows',
      roles: ['data_engineer', 'analytics_engineer'],
      lifecycle: 'process',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'optimize_query', 
      name: 'Optimize Performance', 
      icon: 'fas fa-tachometer-alt',
      description: 'Speed up slow queries',
      roles: ['data_engineer', 'analytics_engineer', 'data_analyst'],
      lifecycle: 'process',
      color: 'from-purple-500 to-pink-500'
    },
    { 
      id: 'catalog_data', 
      name: 'Catalog Data', 
      icon: 'fas fa-book',
      description: 'Document data assets',
      roles: ['data_engineer', 'analytics_engineer'],
      lifecycle: 'process',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'query_to_product',
      name: 'Query to Product',
      icon: 'fas fa-magic',
      description: 'Transform SQL into data product',
      roles: ['data_engineer', 'analytics_engineer', 'data_analyst'],
      lifecycle: 'process',
      color: 'from-purple-500 to-pink-500'
    },
    
    // Analyze Stage
    { 
      id: 'explore_lineage', 
      name: 'Trace Lineage', 
      icon: 'fas fa-sitemap',
      description: 'Map data dependencies',
      roles: ['data_engineer', 'analytics_engineer', 'data_analyst'],
      lifecycle: 'analyze',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'profile_data', 
      name: 'Profile Data', 
      icon: 'fas fa-microscope',
      description: 'Analyze data characteristics',
      roles: ['data_engineer', 'analytics_engineer', 'data_analyst'],
      lifecycle: 'analyze',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'create_metrics', 
      name: 'Define Metrics', 
      icon: 'fas fa-chart-line',
      description: 'Build business KPIs',
      roles: ['analytics_engineer', 'data_analyst'],
      lifecycle: 'analyze',
      color: 'from-green-500 to-emerald-500'
    },
    { 
      id: 'explore_insights', 
      name: 'Explore Insights', 
      icon: 'fas fa-lightbulb',
      description: 'Discover patterns',
      roles: ['data_analyst', 'domain_expert'],
      lifecycle: 'analyze',
      color: 'from-green-500 to-emerald-500'
    },
    
    // Monitor Stage
    { 
      id: 'test_data', 
      name: 'Test Quality', 
      icon: 'fas fa-shield-alt',
      description: 'Validate data integrity',
      roles: ['data_engineer', 'analytics_engineer', 'data_analyst'],
      lifecycle: 'monitor',
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 'monitor_quality', 
      name: 'Monitor Health', 
      icon: 'fas fa-heartbeat',
      description: 'Track data quality metrics',
      roles: ['data_engineer', 'analytics_engineer'],
      lifecycle: 'monitor',
      color: 'from-orange-500 to-red-500'
    },
    { 
      id: 'create_dashboard', 
      name: 'Build Dashboard', 
      icon: 'fas fa-chart-pie',
      description: 'Create visualizations',
      roles: ['data_analyst', 'domain_expert', 'executive'],
      lifecycle: 'monitor',
      color: 'from-orange-500 to-red-500'
    }
  ];
  
  return allTasks.filter(task => task.roles.includes(role));
}

export function getTasksByLifecycle(tasks: TaskDefinition[]) {
  const stages: Record<DataLifecycleStage, TaskDefinition[]> = {
    ingest: [],
    process: [],
    analyze: [],
    monitor: []
  };
  
  tasks.forEach(task => {
    stages[task.lifecycle].push(task);
  });
  
  return stages;
}

export function getLifecycleStageInfo(stage: DataLifecycleStage) {
  const info = {
    ingest: {
      name: 'Ingest',
      icon: 'fas fa-download',
      description: 'Connect and collect data',
      color: 'text-cyan-400',
      bgColor: 'bg-gradient-to-r from-blue-500/10 to-cyan-500/10'
    },
    process: {
      name: 'Process',
      icon: 'fas fa-cogs',
      description: 'Transform and optimize',
      color: 'text-purple-400',
      bgColor: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10'
    },
    analyze: {
      name: 'Analyze',
      icon: 'fas fa-chart-bar',
      description: 'Explore and understand',
      color: 'text-emerald-400',
      bgColor: 'bg-gradient-to-r from-green-500/10 to-emerald-500/10'
    },
    monitor: {
      name: 'Monitor',
      icon: 'fas fa-shield-alt',
      description: 'Track and visualize',
      color: 'text-orange-400',
      bgColor: 'bg-gradient-to-r from-orange-500/10 to-red-500/10'
    }
  };
  
  return info[stage];
}

export function getInterfaceComplexity(userRole: UserRole) {
  const complexity = {
    data_engineer: {
      showTechnicalDetails: true,
      showCode: true,
      allowManualConfig: true,
      defaultView: 'technical',
      agentTransparency: 'full' as const
    },
    analytics_engineer: {
      showTechnicalDetails: true,
      showCode: 'optional' as const,
      allowManualConfig: true,
      defaultView: 'visual',
      agentTransparency: 'medium' as const
    },
    data_analyst: {
      showTechnicalDetails: false,
      showCode: false,
      allowManualConfig: false,
      defaultView: 'guided',
      agentTransparency: 'minimal' as const
    },
    domain_expert: {
      showTechnicalDetails: false,
      showCode: false,
      allowManualConfig: false,
      defaultView: 'natural_language',
      agentTransparency: 'hidden' as const
    },
    executive: {
      showTechnicalDetails: false,
      showCode: false,
      allowManualConfig: false,
      defaultView: 'summary',
      agentTransparency: 'hidden' as const
    }
  };
  
  return complexity[userRole];
}
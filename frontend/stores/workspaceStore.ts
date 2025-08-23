import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

export type TaskCategory = 'ingest' | 'process' | 'analyze' | 'monitor';

export type TaskType = 
  // Special views
  | 'category_landing'
  | 'idle'
  // Ingest tasks
  | 'connect_data'
  | 'stream_processing'
  | 'migrate_data'
  // Process tasks
  | 'build_pipeline'
  | 'optimize_query'
  | 'catalog_data'
  | 'query_to_product'
  // Analyze tasks
  | 'trace_lineage'
  | 'profile_data'
  | 'create_metrics'
  | 'explore_insights'
  // Monitor tasks
  | 'test_quality'
  | 'monitor_health'
  | 'create_dashboard';

export interface Task {
  id: TaskType;
  name: string;
  description: string;
  category: TaskCategory;
  icon: string;
  status?: 'healthy' | 'warning' | 'error';
  badge?: number;
}

export interface TaskHistory {
  taskId: TaskType;
  timestamp: Date;
  state?: any;
}

interface WorkspaceState {
  // Navigation
  currentCategory: TaskCategory | null;
  currentTask: TaskType | null;
  expandedCategories: TaskCategory[];
  
  // Task management
  taskHistory: TaskHistory[];
  taskStates: Record<TaskType, any>;
  bookmarkedTasks: TaskType[];
  
  // Chat context
  chatContext: {
    task: TaskType | null;
    messages: Array<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }>;
  };
  
  // Actions
  setCurrentTask: (task: TaskType | null) => void;
  setCurrentCategory: (category: TaskCategory | null) => void;
  toggleCategory: (category: TaskCategory) => void;
  saveTaskState: (task: TaskType, state: any) => void;
  addToHistory: (task: TaskType) => void;
  toggleBookmark: (task: TaskType) => void;
  addChatMessage: (message: { role: 'user' | 'assistant'; content: string }) => void;
  clearChatContext: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    immer((set, get) => ({
      // Initial state
      currentCategory: null,
      currentTask: null,
      expandedCategories: ['ingest'],
      taskHistory: [],
      taskStates: {},
      bookmarkedTasks: [],
      chatContext: {
        task: null,
        messages: []
      },
      
      // Actions
      setCurrentTask: (task) =>
        set((state) => {
          state.currentTask = task;
          if (task) {
            // Update chat context
            state.chatContext.task = task;
            // Add to history
            const historyEntry: TaskHistory = {
              taskId: task,
              timestamp: new Date(),
              state: state.taskStates[task]
            };
            state.taskHistory = [
              historyEntry,
              ...state.taskHistory.filter(h => h.taskId !== task).slice(0, 9)
            ];
            // Auto-expand category
            const taskDef = getTaskById(task);
            if (taskDef && !state.expandedCategories.includes(taskDef.category)) {
              state.expandedCategories.push(taskDef.category);
            }
          }
        }),
      
      setCurrentCategory: (category) =>
        set((state) => {
          state.currentCategory = category;
        }),
      
      toggleCategory: (category) =>
        set((state) => {
          const index = state.expandedCategories.indexOf(category);
          if (index > -1) {
            state.expandedCategories.splice(index, 1);
          } else {
            state.expandedCategories.push(category);
          }
        }),
      
      saveTaskState: (task, taskState) =>
        set((state) => {
          state.taskStates[task] = taskState;
        }),
      
      addToHistory: (task) =>
        set((state) => {
          const entry: TaskHistory = {
            taskId: task,
            timestamp: new Date(),
            state: state.taskStates[task]
          };
          state.taskHistory = [
            entry,
            ...state.taskHistory.filter(h => h.taskId !== task).slice(0, 9)
          ];
        }),
      
      toggleBookmark: (task) =>
        set((state) => {
          const index = state.bookmarkedTasks.indexOf(task);
          if (index > -1) {
            state.bookmarkedTasks.splice(index, 1);
          } else {
            state.bookmarkedTasks.push(task);
          }
        }),
      
      addChatMessage: (message) =>
        set((state) => {
          state.chatContext.messages.push({
            ...message,
            timestamp: new Date()
          });
          // Keep only last 100 messages
          if (state.chatContext.messages.length > 100) {
            state.chatContext.messages = state.chatContext.messages.slice(-100);
          }
        }),
      
      clearChatContext: () =>
        set((state) => {
          state.chatContext.messages = [];
        })
    })),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        expandedCategories: state.expandedCategories,
        bookmarkedTasks: state.bookmarkedTasks,
        taskHistory: state.taskHistory.slice(0, 5)
      })
    }
  )
);

// Task definitions
export const tasks: Task[] = [
  // Ingest
  { id: 'connect_data', name: 'Connect Data Source', description: 'Connect databases, APIs, or files', category: 'ingest', icon: 'fas fa-database' },
  { id: 'stream_processing', name: 'Stream Processing', description: 'Set up real-time data flows', category: 'ingest', icon: 'fas fa-water' },
  { id: 'migrate_data', name: 'Migrate Data', description: 'Move data between systems', category: 'ingest', icon: 'fas fa-truck-moving' },
  
  // Process
  { id: 'build_pipeline', name: 'Build Pipeline', description: 'Create transformation workflows', category: 'process', icon: 'fas fa-code-branch' },
  { id: 'optimize_query', name: 'Optimize Performance', description: 'Speed up slow queries', category: 'process', icon: 'fas fa-tachometer-alt' },
  { id: 'catalog_data', name: 'Catalog Data', description: 'Document data assets', category: 'process', icon: 'fas fa-book' },
  { id: 'query_to_product', name: 'Query to Product', description: 'Transform SQL into data product', category: 'process', icon: 'fas fa-magic' },
  
  // Analyze
  { id: 'trace_lineage', name: 'Trace Lineage', description: 'Map data dependencies', category: 'analyze', icon: 'fas fa-sitemap' },
  { id: 'profile_data', name: 'Profile Data', description: 'Analyze data characteristics', category: 'analyze', icon: 'fas fa-microscope' },
  { id: 'create_metrics', name: 'Define Metrics', description: 'Build business KPIs', category: 'analyze', icon: 'fas fa-chart-line' },
  { id: 'explore_insights', name: 'Explore Insights', description: 'Discover patterns', category: 'analyze', icon: 'fas fa-lightbulb' },
  
  // Monitor
  { id: 'test_quality', name: 'Test Quality', description: 'Validate data integrity', category: 'monitor', icon: 'fas fa-shield-alt' },
  { id: 'monitor_health', name: 'Monitor Health', description: 'Track system performance', category: 'monitor', icon: 'fas fa-heartbeat' },
  { id: 'create_dashboard', name: 'Build Dashboard', description: 'Create visualizations', category: 'monitor', icon: 'fas fa-chart-pie' }
];

export const categories = [
  { id: 'ingest' as TaskCategory, name: 'Ingest', description: 'Connect and collect data', icon: 'fas fa-download', color: 'text-cyan-400' },
  { id: 'process' as TaskCategory, name: 'Process', description: 'Transform and optimize', icon: 'fas fa-cogs', color: 'text-purple-400' },
  { id: 'analyze' as TaskCategory, name: 'Analyze', description: 'Explore and understand', icon: 'fas fa-chart-bar', color: 'text-emerald-400' },
  { id: 'monitor' as TaskCategory, name: 'Monitor', description: 'Track and observe', icon: 'fas fa-shield-alt', color: 'text-orange-400' }
];

// Helper functions
export function getTaskById(id: TaskType): Task | undefined {
  return tasks.find(t => t.id === id);
}

export function getTasksByCategory(category: TaskCategory): Task[] {
  return tasks.filter(t => t.category === category);
}

export function getCategoryById(id: TaskCategory) {
  return categories.find(c => c.id === id);
}
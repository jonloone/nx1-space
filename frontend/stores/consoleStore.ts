import { create } from 'zustand';
import { DockviewApi } from 'dockview';

export interface ConsoleMessage {
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    command: string;
  }>;
}

export interface ActiveAgent {
  id: string;
  name: string;
  status: 'running' | 'error' | 'completed';
  currentAction: string;
  progress?: number;
  duration?: string;
  logs?: string[];
}

export interface ConsoleResult {
  id: string;
  title: string;
  timestamp: Date;
  type: 'table' | 'json' | 'chart' | 'text';
  data?: any;
  columns?: string[];
  rows?: any[][];
  content?: string;
  actions?: Array<{
    label: string;
    variant?: 'primary' | 'secondary';
    handler: () => void;
  }>;
}

interface ConsoleStore {
  // Console API
  consoleApi: DockviewApi | null;
  setConsoleApi: (api: DockviewApi) => void;

  // Messages
  messages: ConsoleMessage[];
  addMessage: (message: ConsoleMessage) => void;
  clearMessages: () => void;

  // Active Agents
  activeAgents: ActiveAgent[];
  addAgent: (agent: ActiveAgent) => void;
  updateAgent: (id: string, updates: Partial<ActiveAgent>) => void;
  removeAgent: (id: string) => void;

  // Results
  results: ConsoleResult[];
  addResult: (result: ConsoleResult) => void;
  clearResults: () => void;

  // Panel Management
  showActivityPanel: () => void;
  showResultsPanel: () => void;
  focusConsole: () => void;

  // Metric Interactions
  onMetricClick: (metric: any) => void;
  onErrorClick: (error: any) => void;
  onSelectionChange: (selection: any[]) => void;
}

export const useConsoleStore = create<ConsoleStore>((set, get) => ({
  // Console API
  consoleApi: null,
  setConsoleApi: (api) => set({ consoleApi: api }),

  // Messages
  messages: [],
  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),
  clearMessages: () => set({ messages: [] }),

  // Active Agents
  activeAgents: [],
  addAgent: (agent) =>
    set((state) => ({
      activeAgents: [...state.activeAgents, agent],
    })),
  updateAgent: (id, updates) =>
    set((state) => ({
      activeAgents: state.activeAgents.map((agent) =>
        agent.id === id ? { ...agent, ...updates } : agent
      ),
    })),
  removeAgent: (id) =>
    set((state) => ({
      activeAgents: state.activeAgents.filter((agent) => agent.id !== id),
    })),

  // Results
  results: [],
  addResult: (result) =>
    set((state) => ({
      results: [...state.results, result],
    })),
  clearResults: () => set({ results: [] }),

  // Panel Management
  showActivityPanel: () => {
    const api = get().consoleApi;
    if (api) {
      const existingPanel = api.getPanel('activity');
      if (existingPanel) {
        existingPanel.api.setActive();
      } else {
        api.addPanel({
          id: 'activity',
          component: 'activity',
          title: 'Activity',
        });
      }
    }
  },

  showResultsPanel: () => {
    const api = get().consoleApi;
    if (api) {
      const existingPanel = api.getPanel('results');
      if (existingPanel) {
        existingPanel.api.setActive();
      } else {
        api.addPanel({
          id: 'results',
          component: 'results',
          title: 'Results',
        });
      }
    }
  },

  focusConsole: () => {
    const api = get().consoleApi;
    if (api) {
      const panel = api.getPanel('main-console');
      if (panel) {
        panel.api.setActive();
      }
    }
  },

  // Metric Interactions
  onMetricClick: (metric) => {
    const { addMessage, focusConsole } = get();
    
    // Add a pre-filled command based on the metric
    addMessage({
      type: 'system',
      content: `Metric selected: ${metric.name} (${metric.value})`,
      timestamp: new Date(),
      actions: [
        { label: 'Analyze', command: `@analyze metric ${metric.id}` },
        { label: 'Set Alert', command: `@monitor set-alert ${metric.id}` },
        { label: 'View History', command: `@monitor metrics ${metric.id} --history` },
      ],
    });
    
    focusConsole();
  },

  onErrorClick: (error) => {
    const { addMessage, focusConsole } = get();
    
    addMessage({
      type: 'system',
      content: `Error detected in ${error.pipeline}: ${error.message}`,
      timestamp: new Date(),
      actions: [
        { label: 'Debug', command: `@process debug ${error.pipeline}` },
        { label: 'View Logs', command: `@monitor logs ${error.pipeline} --errors` },
        { label: 'Auto-fix', command: `@process fix ${error.pipeline} --auto` },
      ],
    });
    
    focusConsole();
  },

  onSelectionChange: (selection) => {
    const { addMessage } = get();
    
    if (selection.length > 1) {
      addMessage({
        type: 'system',
        content: `${selection.length} items selected`,
        timestamp: new Date(),
        actions: [
          { label: 'Compare', command: `@analyze compare ${selection.map(s => s.id).join(' ')}` },
          { label: 'Batch Process', command: `@process batch ${selection.map(s => s.id).join(' ')}` },
        ],
      });
    }
  },
}));
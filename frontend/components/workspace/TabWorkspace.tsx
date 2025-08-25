'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  DockviewApi,
  IDockviewPanelProps,
  DockviewPanelApi,
} from 'dockview';
import { SimpleHomePanel } from './panels/SimpleHomePanel';
import { TaskContent } from './TaskContent';
import { AIConsolePanel } from './panels/AIConsolePanel';
import { useWorkspaceStore, type TaskType, type TaskCategory } from '@/stores/workspaceStore';
import { useConsoleStore } from '@/stores/consoleStore';
import { cn } from '@/lib/utils/cn';
import { getPaneTemplate, getAutoOpenPanes, updatePaneForStep, type PaneConfig } from '@/lib/workspace/paneTemplates';
import { getOptimalPaneConfig, type SmartPaneConfig } from '@/lib/workspace/smartPaneConfigs';
import 'dockview/dist/styles/dockview.css';

const STORAGE_KEY = 'nexusone-tab-workspace-v1';
const TAB_HEIGHT = 36;
const CONSOLE_MIN_HEIGHT = 48;
const CONSOLE_DEFAULT_HEIGHT = 300;

interface TabInfo {
  id: string;
  type: 'home' | 'task' | 'custom';
  taskId?: TaskType;
  title: string;
  icon?: string;
  closeable: boolean;
}

export function TabWorkspace() {
  const [api, setApi] = useState<DockviewApi>();
  const [consoleMinimized, setConsoleMinimized] = useState(true);
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const tabCounter = useRef(0);
  const { currentTask, setCurrentTask, addToHistory } = useWorkspaceStore();
  const { setConsoleApi } = useConsoleStore();

  // Initialize Dockview
  const onReady = useCallback((event: DockviewReadyEvent) => {
    const api = event.api;
    setApi(api);
    setConsoleApi(api);
    
    // Store API globally for keyboard shortcuts
    (window as any).dockviewApi = api;

    // Try to restore saved layout or create default
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const { layout, tabs: savedTabs } = JSON.parse(saved);
        api.fromJSON(layout);
        setTabs(savedTabs || []);
        
        // ALWAYS ensure home tab exists
        const homePanel = api.getPanel('home');
        if (!homePanel) {
          api.addPanel({
            id: 'home',
            component: 'home',
            title: 'Home',
            params: { closeable: false },
          });
          
          setTabs(prev => {
            if (!prev.find(t => t.id === 'home')) {
              return [{
                id: 'home',
                type: 'home',
                title: 'Home',
                icon: 'fas fa-home',
                closeable: false,
              }, ...prev];
            }
            return prev;
          });
        }
        
        // AI console is now global, managed outside Dockview
      } catch (e) {
        console.error('Failed to restore layout:', e);
        createDefaultLayout(api);
      }
    } else {
      createDefaultLayout(api);
    }

    // Auto-save layout changes
    api.onDidLayoutChange(() => {
      saveLayout(api);
    });

    // Handle panel activation (tab switching)
    api.onDidActivePanelChange((panel) => {
      if (panel?.id) {
        const tab = tabs.find(t => t.id === panel.id);
        if (tab?.taskId) {
          setCurrentTask(tab.taskId);
        }
      }
    });

    // Handle panel removal (tab closing)
    api.onDidRemovePanel((event) => {
      // NEVER allow home tab or console to be closed
      if (event.id === 'home' || event.id === 'ai-console') {
        // Immediately recreate home tab if somehow closed
        setTimeout(() => {
          const homeExists = api.getPanel('home');
          if (!homeExists) {
            api.addPanel({
              id: 'home',
              component: 'home',
              title: 'Home',
              params: { closeable: false },
            });
            setTabs(prev => {
              if (!prev.find(t => t.id === 'home')) {
                return [{
                  id: 'home',
                  type: 'home',
                  title: 'Home',
                  icon: 'fas fa-home',
                  closeable: false,
                }, ...prev];
              }
              return prev;
            });
          }
        }, 0);
        return;
      }
      
      setTabs(prev => prev.filter(t => t.id !== event.id));
      
      // If closing the active task tab, reset current task
      const tab = tabs.find(t => t.id === event.id);
      if (tab?.taskId === currentTask) {
        setCurrentTask(null);
      }
    });
  }, [tabs, currentTask, setCurrentTask, setConsoleApi]);

  // Create default layout with home tab
  const createDefaultLayout = (api: DockviewApi) => {
    const homeTab: TabInfo = {
      id: 'home',
      type: 'home',
      title: 'Home',
      icon: 'fas fa-home',
      closeable: false,
    };

    const homePanel = api.addPanel({
      id: homeTab.id,
      component: 'home',
      title: homeTab.title,
      params: { closeable: false },
    });
    
    // Extra protection: disable close functionality
    if (homePanel) {
      homePanel.api.closeable = false;
    }

    setTabs([homeTab]);
    
    // AI console is now global, no need to create it here
  };

  // Save layout to localStorage
  const saveLayout = (api: DockviewApi) => {
    try {
      const layout = api.toJSON();
      const state = {
        layout,
        tabs,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  };

  // Open a new task tab with auto-opening context panes
  const openTaskTab = useCallback((taskId: TaskType | string, taskName: string, taskIcon?: string, context?: any) => {
    if (!api) return;

    // Check if task tab already exists
    const existingTab = tabs.find(t => t.taskId === taskId);
    if (existingTab) {
      // Activate existing tab
      const panel = api.getPanel(existingTab.id);
      if (panel) {
        panel.api.setActive();
      }
      return;
    }

    // Get smart pane configuration for this task
    const smartConfig = getOptimalPaneConfig(taskId, context);
    
    // Create new tab
    const tabId = `task-${taskId}-${++tabCounter.current}`;
    const newTab: TabInfo = {
      id: tabId,
      type: 'task',
      taskId: taskId as TaskType,
      title: taskName,
      icon: taskIcon,
      closeable: true,
    };

    // Find reference panel (prefer active panel, fallback to home)
    const activePanel = api.activePanel || api.getPanel('home');
    
    const taskPanel = api.addPanel({
      id: tabId,
      component: 'task',
      title: taskName,
      params: { 
        taskId,
        closeable: true,
        smartConfig, // Pass smart config to the panel
      },
      position: activePanel ? {
        referencePanel: activePanel,
        direction: 'right',
      } : undefined,
    });

    setTabs(prev => [...prev, newTab]);
    if (taskId in ['build_pipeline', 'data_quality_assessment', 'real_time_monitoring', 'performance_tuning', 'exploratory_analysis']) {
      addToHistory(taskId as TaskType);
    }

    // Auto-open smart context panes for this task
    if (taskPanel && smartConfig) {
      setTimeout(() => {
        openSmartPanes(taskPanel, smartConfig.auxiliary);
        
        // Update AI console context
        if ((window as any).updateAIContext) {
          (window as any).updateAIContext({
            task: taskId,
            mode: smartConfig.aiContext.mode,
            tools: smartConfig.aiContext.tools,
            prompt: smartConfig.aiContext.initialPrompt
          });
        }
      }, 100);
    } else if (taskPanel) {
      // Fallback to old pane system if no smart config
      setTimeout(() => {
        openContextPanes(taskId as TaskType, taskPanel);
      }, 100);
    }
  }, [api, tabs, addToHistory]);

  // Open smart panes with optimal configuration
  const openSmartPanes = useCallback((taskPanel: any, panes: SmartPaneConfig[]) => {
    if (!api) return;

    panes.forEach((paneConfig, index) => {
      if (!paneConfig.autoOpen) return;
      
      setTimeout(() => {
        const paneId = `${taskPanel.id}-${paneConfig.id}`;
        
        // Check if pane already exists
        if (!api.getPanel(paneId)) {
          const newPane = api.addPanel({
            id: paneId,
            component: paneConfig.component,
            title: paneConfig.title,
            params: {
              ...paneConfig.initialData,
              closeable: paneConfig.closeable,
              updateOn: paneConfig.updateOn,
            },
            position: {
              referencePanel: taskPanel,
              direction: paneConfig.position,
            },
          });

          // Set pane size
          if (newPane) {
            setTimeout(() => {
              const sizeKey = paneConfig.position === 'bottom' || paneConfig.position === 'top' ? 'height' : 'width';
              const baseSize = paneConfig.position === 'bottom' || paneConfig.position === 'top' 
                ? window.innerHeight 
                : window.innerWidth;
              newPane.api.setSize({ [sizeKey]: baseSize * (paneConfig.size / 100) });
            }, 50);
          }
        }
      }, index * 100); // Stagger pane creation for smooth animation
    });
  }, [api]);

  // Open context panes based on task template
  const openContextPanes = useCallback((taskId: TaskType, taskPanel: any) => {
    if (!api) return;

    const autoPanes = getAutoOpenPanes(taskId);
    
    autoPanes.forEach((paneConfig: PaneConfig, index: number) => {
      setTimeout(() => {
        const paneId = `${taskPanel.id}-${paneConfig.id}`;
        
        // Check if pane already exists
        if (!api.getPanel(paneId)) {
          api.addPanel({
            id: paneId,
            component: paneConfig.component,
            title: paneConfig.title,
            params: {
              ...paneConfig.params,
              taskId,
              closeable: paneConfig.closeable,
            },
            position: {
              referencePanel: taskPanel,
              direction: paneConfig.position,
            },
          });

          // Set pane size
          setTimeout(() => {
            const pane = api.getPanel(paneId);
            if (pane) {
              const sizeKey = paneConfig.position === 'bottom' ? 'height' : 'width';
              const baseSize = paneConfig.position === 'bottom' ? window.innerHeight : window.innerWidth;
              pane.api.setSize({ [sizeKey]: baseSize * (paneConfig.size / 100) });
            }
          }, 50);
        }
      }, index * 50); // Stagger pane creation for smooth animation
    });
  }, [api]);

  // Update panes based on task progression
  const updateTaskPanes = useCallback((taskId: TaskType, step: number) => {
    if (!api) return;

    const stepPane = updatePaneForStep(taskId, step);
    if (stepPane) {
      const taskTab = tabs.find(t => t.taskId === taskId);
      if (taskTab) {
        const taskPanel = api.getPanel(taskTab.id);
        if (taskPanel) {
          const paneId = `${taskTab.id}-${stepPane.id}`;
          
          // Close existing step panes
          api.panels.forEach(panel => {
            if (panel.id.startsWith(`${taskTab.id}-step-`) && panel.id !== paneId) {
              panel.api.close();
            }
          });

          // Open new step pane
          if (!api.getPanel(paneId)) {
            api.addPanel({
              id: paneId,
              component: stepPane.component,
              title: stepPane.title,
              params: {
                ...stepPane.params,
                taskId,
                closeable: stepPane.closeable,
              },
              position: {
                referencePanel: taskPanel,
                direction: stepPane.position,
              },
            });

            // Set pane size
            setTimeout(() => {
              const pane = api.getPanel(paneId);
              if (pane) {
                const sizeKey = stepPane.position === 'bottom' ? 'height' : 'width';
                const baseSize = stepPane.position === 'bottom' ? window.innerHeight : window.innerWidth;
                pane.api.setSize({ [sizeKey]: baseSize * (stepPane.size / 100) });
              }
            }, 50);
          }
        }
      }
    }
  }, [api, tabs]);

  // AI console is now managed globally, no toggle needed here

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!api) return;

      const key = e.key.toLowerCase();
      const alt = e.altKey;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Alt+K is now handled by GlobalAIConsole

      // Alt+H: Restore Home tab if missing
      if (alt && key === 'h') {
        e.preventDefault();
        const homePanel = api.getPanel('home');
        if (!homePanel) {
          api.addPanel({
            id: 'home',
            component: 'home',
            title: 'Home',
            params: { closeable: false },
          });
          setTabs(prev => {
            if (!prev.find(t => t.id === 'home')) {
              return [{
                id: 'home',
                type: 'home',
                title: 'Home',
                icon: 'fas fa-home',
                closeable: false,
              }, ...prev];
            }
            return prev;
          });
        } else {
          // If home exists, switch to it
          homePanel.api.setActive();
        }
      }

      // Alt+T: New tab (opens task selector)
      if (alt && key === 't') {
        e.preventDefault();
        // TODO: Open task selector modal
        console.log('Task selector not yet implemented');
      }

      // Alt+W: Close current tab (but NEVER the home tab)
      if (alt && key === 'w') {
        e.preventDefault();
        const activePanel = api.activePanel;
        // NEVER close home tab or console
        if (activePanel && activePanel.id !== 'home' && activePanel.id !== 'ai-console') {
          activePanel.api.close();
        }
      }

      // Alt+1-9: Quick tab switching
      if (alt && key >= '1' && key <= '9') {
        e.preventDefault();
        const index = parseInt(key) - 1;
        const panels = api.panels.filter(p => p.id !== 'ai-console');
        if (panels[index]) {
          panels[index].api.setActive();
        }
      }

      // Alt+Q/A: Previous/Next tab
      if (alt && (key === 'q' || key === 'a')) {
        e.preventDefault();
        const panels = api.panels.filter(p => p.id !== 'ai-console');
        const currentIndex = panels.findIndex(p => p.api.isActive);
        
        if (key === 'q' && currentIndex > 0) {
          panels[currentIndex - 1].api.setActive();
        } else if (key === 'a' && currentIndex < panels.length - 1) {
          panels[currentIndex + 1].api.setActive();
        }
      }

      // Escape: Collapse console when focused
      if (key === 'escape' && !consoleMinimized) {
        const activeElement = document.activeElement;
        if (activeElement?.closest('.ai-console-panel')) {
          e.preventDefault();
          toggleConsole();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api]);

  // Component registry with context pane components
  const components: Record<string, React.ComponentType<IDockviewPanelProps>> = {
    home: SimpleHomePanel,
    console: AIConsolePanel,
    task: (props: IDockviewPanelProps) => {
      const taskId = props.params?.taskId;
      
      // Use specific task components based on taskId
      if (taskId === 'data-quality' || taskId === 'data_quality_assessment') {
        const DataQualityTask = require('@/components/tasks/DataQualityTask').DataQualityTask;
        return (
          <div className="h-full overflow-auto bg-gray-950">
            <DataQualityTask />
          </div>
        );
      }
      
      // For pipeline debug task from AI suggestion
      if (taskId === 'pipeline-debug') {
        return (
          <div className="h-full overflow-auto bg-gray-950 p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Pipeline Debugger</h1>
            <p className="text-gray-400 mb-6">Analyzing Customer ETL pipeline failures...</p>
            <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-400 font-semibold mb-2">Last 3 runs failed with timeout errors</h3>
              <pre className="text-sm text-gray-300">
                Error: Timeout after 300s at step 'transform_customer_data'{'\n'}
                Cause: Large volume of duplicate records causing processing bottleneck{'\n'}
                Recommendation: Add deduplication step before transformation
              </pre>
            </div>
          </div>
        );
      }
      
      // For optimization task from AI suggestion
      if (taskId === 'performance-optimize') {
        return (
          <div className="h-full overflow-auto bg-gray-950 p-6">
            <h1 className="text-2xl font-bold text-white mb-4">Performance Optimizer</h1>
            <p className="text-gray-400 mb-6">Optimizing Product Dimension processing...</p>
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-semibold mb-2">Optimization Opportunity Found</h3>
              <p className="text-gray-300">Product dimension can be 40% faster by:</p>
              <ul className="list-disc list-inside text-sm text-gray-400 mt-2">
                <li>Adding composite index on (product_id, effective_date)</li>
                <li>Partitioning by product_category</li>
                <li>Caching frequently accessed dimensions</li>
              </ul>
            </div>
          </div>
        );
      }
      
      // For all other tasks, ensure proper task is set and use TaskContent
      React.useEffect(() => {
        if (taskId) {
          useWorkspaceStore.getState().setCurrentTask(taskId as TaskType);
        }
      }, [taskId]);
      
      return (
        <div className="h-full overflow-auto bg-gray-950">
          <TaskContent />
        </div>
      );
    },
    // Context pane components
    status: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Type:</span>
            <span>{props.params?.type || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Task:</span>
            <span>{props.params?.taskId || 'None'}</span>
          </div>
        </div>
      </div>
    ),
    metrics: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Metrics</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-500">Processing</div>
            <div className="text-xl font-bold">2.3M/s</div>
          </div>
          <div className="bg-gray-800/50 p-3 rounded">
            <div className="text-xs text-gray-500">Latency</div>
            <div className="text-xl font-bold">12ms</div>
          </div>
        </div>
      </div>
    ),
    logs: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300 font-mono text-xs">
        <h3 className="text-lg font-semibold mb-3 font-sans">Logs</h3>
        <div className="space-y-1 text-gray-400">
          <div>[INFO] Task started...</div>
          <div>[INFO] Processing data...</div>
          <div>[SUCCESS] Operation completed</div>
        </div>
      </div>
    ),
    schema: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Schema Preview</h3>
        <div className="space-y-2 text-sm font-mono">
          <div className="text-gray-500">// Schema will be displayed here</div>
        </div>
      </div>
    ),
    requirements: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Requirements</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <i className="fas fa-check-circle text-green-400 mt-0.5" />
            <span>Database connection configured</span>
          </li>
          <li className="flex items-start gap-2">
            <i className="fas fa-times-circle text-red-400 mt-0.5" />
            <span>API credentials missing</span>
          </li>
        </ul>
      </div>
    ),
    progress: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Progress</h3>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-full h-2 overflow-hidden">
            <div className="bg-blue-500 h-full w-3/4 transition-all" />
          </div>
          <div className="text-sm text-gray-400">75% Complete</div>
        </div>
      </div>
    ),
    validation: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Validation</h3>
        <div className="space-y-2 text-sm">
          <div className="text-green-400">✓ Data format valid</div>
          <div className="text-yellow-400">⚠ Missing optional fields</div>
        </div>
      </div>
    ),
    preview: (props: IDockviewPanelProps) => (
      <div className="h-full p-4 bg-gray-900/50 text-gray-300">
        <h3 className="text-lg font-semibold mb-3">Data Preview</h3>
        <div className="bg-gray-800/50 p-3 rounded font-mono text-xs">
          <div className="text-gray-500">// Sample data will appear here</div>
        </div>
      </div>
    ),
  };

  // Custom tab components for better styling
  const tabComponents = {
    home: (props: any) => (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
        <i className="fas fa-home text-gray-400" />
        <span className="text-gray-300">Home</span>
        {/* No close button - home tab is permanent */}
      </div>
    ),
    task: (props: any) => {
      const tab = tabs.find(t => t.id === props.api.id);
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs group">
          {tab?.icon && <i className={cn(tab.icon, "text-gray-400")} />}
          <span className="text-gray-300">{props.api.title}</span>
          <button
            className="ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              props.api.close();
            }}
            title="Close tab (Alt+W)"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      );
    },
    console: (props: any) => {
      const isMinimized = props.params?.minimized;
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
          <i className="fas fa-terminal text-gray-400" />
          <span className="text-gray-300">AI Console</span>
          <span className="text-gray-500 text-xs ml-auto">Alt+K</span>
        </div>
      );
    },
  };

  // Expose functions to window for external access
  useEffect(() => {
    (window as any).openTaskTab = openTaskTab;
    (window as any).updateTaskPanes = updateTaskPanes;
  }, [openTaskTab, updateTaskPanes]);

  // Show loading state until dockview is ready
  if (typeof window === 'undefined') {
    return (
      <div className="h-full w-full bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading workspace...</div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-950 relative">
      <DockviewReact
        className="dockview-theme-dark h-full w-full"
        onReady={onReady}
        components={components}
        tabComponents={tabComponents}
        watermarkComponent={() => null}
        proportionalLayout={true}
        disableAutoResizing={false}
        disableFloatingGroups={false}
        disableDnd={false}
        showDndOverlay={true}
        orientation="horizontal"
      />
      
      <style jsx global>{`
        /* Tab styling */
        .dockview-tab-container {
          background: rgba(17, 24, 39, 0.5);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(75, 85, 99, 0.3);
          height: ${TAB_HEIGHT}px;
        }
        
        .dockview-tab {
          background: transparent;
          border: none;
          border-right: 1px solid rgba(75, 85, 99, 0.2);
          transition: all 0.2s;
        }
        
        .dockview-tab:hover {
          background: rgba(31, 41, 55, 0.5);
        }
        
        .dockview-tab.dockview-active {
          background: rgba(31, 41, 55, 0.8);
          border-bottom: 2px solid rgb(99, 102, 241);
        }
        
        /* Home tab cannot be closed */
        .dockview-tab[data-panel-id="home"] .dockview-tab-action,
        .dockview-tab[data-panel-id="home"] button {
          display: none !important;
        }
        
        /* Ensure home tab looks non-closeable */
        .dockview-tab[data-panel-id="home"]:hover .dockview-tab-action {
          display: none !important;
        }
        
        /* Console panel styling */
        .dockview-panel[data-panel-id="ai-console"] {
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(75, 85, 99, 0.3);
        }
        
        .dockview-panel[data-panel-id="ai-console"][data-minimized="true"] {
          min-height: ${CONSOLE_MIN_HEIGHT}px !important;
          max-height: ${CONSOLE_MIN_HEIGHT}px !important;
        }
        
        /* Hide console tab */
        .dockview-tab[data-panel-id="ai-console"] {
          display: none !important;
        }
        
        /* Console panel styling */
        .dockview-panel[data-panel-id="ai-console"] {
          background: rgba(17, 24, 39, 0.95);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(75, 85, 99, 0.3);
        }
        
        /* Hide console tab */
        .dockview-tab[data-panel-id="ai-console"] {
          display: none !important;
        }
        
        /* Console panel cannot be closed */
        .dockview-panel[data-panel-id="ai-console"] .dockview-tab-action {
          display: none !important;
        }
        
        /* Panel content area */
        .dockview-panel-content {
          background: rgb(3, 7, 18);
        }
        
        /* Splitter styling */
        .dockview-sash {
          background: rgba(75, 85, 99, 0.3);
          transition: background 0.2s;
        }
        
        .dockview-sash:hover {
          background: rgba(99, 102, 241, 0.5);
        }
      `}</style>
    </div>
  );
}
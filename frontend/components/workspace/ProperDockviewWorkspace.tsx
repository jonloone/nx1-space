'use client';

import React, { useState, useEffect } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  DockviewApi,
  IDockviewPanelProps,
  SerializedDockview,
} from 'dockview';
import { MainContentPanel } from './panels/MainContentPanel';
import { AIConsolePanel } from './panels/AIConsolePanel';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useConsoleStore } from '@/stores/consoleStore';
import 'dockview/dist/styles/dockview.css';

const STORAGE_KEY = 'nexusone-workspace-layout-v7';

export function ProperDockviewWorkspace() {
  const [api, setApi] = useState<DockviewApi>();
  const { currentCategory, currentTask } = useWorkspaceStore();
  const { setConsoleApi } = useConsoleStore();
  const [aiMinimized, setAiMinimized] = useState(true);

  const getCurrentTitle = () => {
    const titles: Record<string, string> = {
      ingest: 'Ingest - Connect and Import',
      process: 'Process - Transform and Optimize',
      analyze: 'Analyze - Discover and Understand',
      monitor: 'Monitor - Track and Alert',
    };
    return titles[currentCategory] || 'Workspace';
  };

  // Initialize Dockview with proper configuration
  const onReady = (event: DockviewReadyEvent) => {
    const api = event.api;
    setApi(api);
    setConsoleApi(api);
    
    // Store API globally for keyboard shortcuts
    (window as any).dockviewApi = api;

    // Try to restore saved layout or create default
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const layout = JSON.parse(saved);
        api.fromJSON(layout);
        
        // Ensure AI panel params are set
        const aiPanel = api.getPanel('ai-assistant');
        if (aiPanel) {
          aiPanel.api.updateParameters({ minimized: aiMinimized });
        }
      } catch (e) {
        console.error('Failed to restore layout:', e);
        createDefaultLayout(api);
      }
    } else {
      createDefaultLayout(api);
    }

    // Auto-save layout changes
    api.onDidLayoutChange(() => {
      try {
        const layout = api.toJSON();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      } catch (e) {
        console.error('Failed to save layout:', e);
      }
    });

    // Handle panel removal
    api.onDidRemovePanel((event) => {
      console.log('Panel removed:', event.id);
      
      // Recreate main workspace if accidentally closed
      if (event.id === 'workspace-main') {
        setTimeout(() => {
          if (!api.getPanel('workspace-main')) {
            api.addPanel({
              id: 'workspace-main',
              component: 'workspace',
              title: getCurrentTitle(),
            });
          }
        }, 0);
      }
    });
  };

  const createDefaultLayout = (api: DockviewApi) => {
    // Create main workspace panel (not closeable)
    const mainPanel = api.addPanel({
      id: 'workspace-main',
      component: 'workspace',
      title: getCurrentTitle(),
      params: {
        section: currentCategory,
        task: currentTask,
        closeable: false, // Main workspace cannot be closed
      },
    });

    // Create AI Assistant panel on the RIGHT (closeable/minimizable)
    if (mainPanel) {
      api.addPanel({
        id: 'ai-assistant',
        component: 'assistant',
        title: 'AI Assistant',
        params: {
          context: currentCategory,
          task: currentTask,
          minimized: true,
          closeable: true, // AI Assistant CAN be closed
        },
        position: {
          referencePanel: mainPanel,
          direction: 'right', // FORCE RIGHT POSITION
        },
      });

      // Set initial sizes
      setTimeout(() => {
        const aiPanel = api.getPanel('ai-assistant');
        if (aiPanel) {
          if (aiMinimized) {
            aiPanel.api.setSize({ width: 48 });
          } else {
            aiPanel.api.setSize({ width: window.innerWidth * 0.3 });
          }
        }
      }, 100);
    }
  };

  // Helper function to open AI Assistant on right
  const openAIAssistant = () => {
    if (!api) return;
    
    const existingPanel = api.getPanel('ai-assistant');
    
    if (existingPanel) {
      // Toggle minimize/expand
      const isMinimized = existingPanel.api.width <= 50;
      
      if (isMinimized) {
        // Expand
        existingPanel.api.setSize({ width: window.innerWidth * 0.3 });
        existingPanel.api.updateParameters({ minimized: false });
        existingPanel.api.setActive();
        setAiMinimized(false);
        
        // Focus input
        setTimeout(() => {
          const input = document.querySelector('.ai-console-input') as HTMLInputElement;
          input?.focus();
        }, 200);
      } else {
        // Minimize
        existingPanel.api.setSize({ width: 48 });
        existingPanel.api.updateParameters({ minimized: true });
        setAiMinimized(true);
      }
    } else {
      // Create new panel on the RIGHT
      const mainPanel = api.getPanel('workspace-main');
      if (mainPanel) {
        api.addPanel({
          id: 'ai-assistant',
          component: 'assistant',
          title: 'AI Assistant',
          params: {
            context: currentCategory,
            minimized: false,
            closeable: true,
          },
          position: {
            referencePanel: mainPanel,
            direction: 'right', // ALWAYS RIGHT
          },
        });
        setAiMinimized(false);
      }
    }
  };

  // Helper to add custom panels
  const addCustomPanel = (type: string) => {
    if (!api) return;
    
    const mainPanel = api.getPanel('workspace-main');
    if (!mainPanel) return;
    
    api.addPanel({
      id: `${type}-${Date.now()}`,
      component: type,
      title: getCustomPanelTitle(type),
      params: { closeable: true },
      position: {
        referencePanel: mainPanel,
        direction: 'below',
      },
    });
  };

  const getCustomPanelTitle = (type: string): string => {
    const titles: Record<string, string> = {
      properties: 'Properties',
      metrics: 'Metrics',
      logs: 'Logs',
      documentation: 'Documentation',
    };
    return titles[type] || 'Panel';
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!api) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl + K or J: Toggle AI Assistant (on right)
      if (ctrl && (key === 'k' || key === 'j')) {
        e.preventDefault();
        openAIAssistant();
      }

      // Cmd/Ctrl + P: Add properties panel
      if (ctrl && key === 'p' && !e.shiftKey) {
        e.preventDefault();
        addCustomPanel('properties');
      }

      // Cmd/Ctrl + L: Add logs panel
      if (ctrl && key === 'l' && !e.shiftKey) {
        e.preventDefault();
        addCustomPanel('logs');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api, currentCategory]);

  // Update panel titles when navigation changes
  useEffect(() => {
    if (api) {
      const mainPanel = api.getPanel('workspace-main');
      if (mainPanel) {
        mainPanel.api.setTitle(getCurrentTitle());
        mainPanel.api.updateParameters({
          section: currentCategory,
          task: currentTask,
        });
      }

      const aiPanel = api.getPanel('ai-assistant');
      if (aiPanel) {
        aiPanel.api.updateParameters({
          context: currentCategory,
          task: currentTask,
        });
      }
    }
  }, [api, currentCategory, currentTask]);

  // Component registry with proper configurations
  const components = {
    workspace: (props: IDockviewPanelProps) => {
      // Main workspace component (not closeable)
      return <MainContentPanel {...props} />;
    },
    assistant: (props: IDockviewPanelProps) => {
      // AI Assistant component (closeable/minimizable)
      return <AIConsolePanel {...props} />;
    },
    properties: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Properties</h3>
        <p className="text-sm text-gray-400">Properties panel content</p>
      </div>
    ),
    logs: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300 font-mono text-xs">
        <h3 className="text-lg font-semibold mb-2 font-sans">Logs</h3>
        <pre className="text-gray-400">System logs...</pre>
      </div>
    ),
    metrics: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Metrics</h3>
        <p className="text-sm text-gray-400">Performance metrics</p>
      </div>
    ),
    documentation: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Documentation</h3>
        <p className="text-sm text-gray-400">Documentation content</p>
      </div>
    ),
  };

  // Custom tab renderer for better control
  const tabComponents = {
    workspace: (props: any) => (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
        <i className="fas fa-layer-group text-gray-400" />
        <span className="text-gray-300">{props.api.title}</span>
        {/* No close button for workspace */}
      </div>
    ),
    assistant: (props: any) => {
      const isMinimized = props.params?.minimized;
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 text-xs group">
          <i className="fas fa-robot text-gray-400" />
          <span className="text-gray-300">{props.api.title}</span>
          {/* Close/minimize button for AI Assistant */}
          <button
            className="ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              if (isMinimized) {
                openAIAssistant(); // Expand
              } else {
                // Minimize instead of close
                const panel = api?.getPanel('ai-assistant');
                if (panel) {
                  panel.api.setSize({ width: 48 });
                  panel.api.updateParameters({ minimized: true });
                  setAiMinimized(true);
                }
              }
            }}
            title={isMinimized ? "Expand (Cmd+K)" : "Minimize (Cmd+K)"}
          >
            <i className={`fas ${isMinimized ? 'fa-expand-alt' : 'fa-compress-alt'} text-xs`} />
          </button>
        </div>
      );
    },
    default: (props: any) => (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs group">
        <i className="fas fa-window-maximize text-gray-400" />
        <span className="text-gray-300">{props.api.title}</span>
        {/* Standard close button for other panels */}
        <button
          className="ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            props.api.close();
          }}
          title="Close panel"
        >
          <i className="fas fa-times text-xs" />
        </button>
      </div>
    ),
  };

  return (
    <div className="h-full w-full bg-gray-950 relative">
      {/* Controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">
        <button
          className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 hover:bg-gray-700"
          onClick={() => openAIAssistant()}
          title="Toggle AI Assistant (Cmd+K)"
        >
          <i className="fas fa-robot mr-1" />
          AI Assistant
        </button>
        
        <button
          className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 hover:bg-gray-700"
          onClick={() => addCustomPanel('properties')}
          title="Add Properties Panel"
        >
          <i className="fas fa-plus mr-1" />
          Add Panel
        </button>
      </div>

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
        /* Hide close button for main workspace */
        .dockview-tab[data-panel-id="workspace-main"] .dockview-tab-action {
          display: none !important;
        }
        
        /* Style close buttons */
        .dockview-tab-action {
          opacity: 0;
          transition: opacity 0.2s;
          padding: 2px 4px;
          border-radius: 2px;
        }
        
        .dockview-tab:hover .dockview-tab-action {
          opacity: 0.5;
        }
        
        .dockview-tab-action:hover {
          opacity: 1;
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* AI panel in minimized state */
        .dockview-panel[data-panel-id="ai-assistant"][data-minimized="true"] {
          min-width: 48px !important;
          max-width: 48px !important;
        }
      `}</style>
    </div>
  );
}
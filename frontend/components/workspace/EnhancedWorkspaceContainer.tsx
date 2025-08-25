'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  DockviewReact,
  DockviewReadyEvent,
  DockviewApi,
  IDockviewPanelProps,
  SerializedDockview,
  IDockviewPanel,
} from 'dockview';
import { MainContentPanel } from './panels/MainContentPanel';
import { AIConsolePanel } from './panels/AIConsolePanel';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useConsoleStore } from '@/stores/consoleStore';
import {
  DOCKVIEW_CONFIG,
  PANEL_DEFINITIONS,
  LAYOUT_PRESETS,
  PanelStateManager,
  KEYBOARD_SHORTCUTS,
} from '@/lib/dockview/config';
import 'dockview/dist/styles/dockview.css';

const STORAGE_KEY = 'nexusone-workspace-layout-v5';

export function EnhancedWorkspaceContainer() {
  const [api, setApi] = useState<DockviewApi>();
  const [panelManager, setPanelManager] = useState<PanelStateManager>();
  const { currentCategory, currentTask } = useWorkspaceStore();
  const { setConsoleApi } = useConsoleStore();
  const [recentlyClosed, setRecentlyClosed] = useState<any[]>([]);
  const [currentPreset, setCurrentPreset] = useState<string>('default');

  // Load saved layout
  const getSavedLayout = (): SerializedDockview | undefined => {
    if (typeof window === 'undefined') return undefined;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved layout:', e);
      }
    }
    return undefined;
  };

  // Save layout with debouncing
  const saveLayout = useCallback((api: DockviewApi) => {
    if (typeof window === 'undefined') return;
    try {
      const layout = api.toJSON();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
      localStorage.setItem(`${STORAGE_KEY}-preset`, currentPreset);
    } catch (e) {
      console.error('Failed to save layout:', e);
    }
  }, [currentPreset]);

  // Initialize Dockview
  const onReady = (event: DockviewReadyEvent) => {
    const api = event.api;
    setApi(api);
    setConsoleApi(api);

    // Initialize panel manager
    const manager = new PanelStateManager(api);
    setPanelManager(manager);

    // Try to restore saved layout or create default
    const savedLayout = getSavedLayout();
    const savedPreset = localStorage.getItem(`${STORAGE_KEY}-preset`) || 'default';
    setCurrentPreset(savedPreset);
    
    if (savedLayout && savedLayout.panels) {
      try {
        api.fromJSON(savedLayout);
      } catch (e) {
        console.error('Failed to restore layout, creating default:', e);
        createDefaultLayout(api);
      }
    } else {
      createDefaultLayout(api);
    }

    // Setup auto-save with debouncing
    let saveTimeout: NodeJS.Timeout;
    api.onDidLayoutChange(() => {
      clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => saveLayout(api), 1000);
    });

    // Handle panel removal
    api.onDidRemovePanel((event) => {
      const panelDef = PANEL_DEFINITIONS[event.id];
      
      // Prevent main content from being closed
      if (event.id === 'main-content') {
        setTimeout(() => {
          if (!api.getPanel('main-content')) {
            api.addPanel({
              id: 'main-content',
              component: 'mainContent',
              title: getCurrentTitle(),
              params: {
                section: currentCategory,
                task: currentTask,
              },
            });
          }
        }, 0);
      } else if (panelDef?.closeable) {
        // Update recently closed list
        setRecentlyClosed(prev => [
          { id: event.id, title: panelDef.title, timestamp: Date.now() },
          ...prev.slice(0, 9), // Keep last 10
        ]);
      }
    });

    // Setup panel action handlers - simplified
    api.onDidAddPanel((event) => {
      // Basic setup without complex actions for now
      if (event?.panel?.id) {
        console.log('Panel added:', event.panel.id);
      }
    });
  };

  const createDefaultLayout = (api: DockviewApi) => {
    // Create main content panel as the primary panel
    const mainPanel = api.addPanel({
      id: 'main-content',
      component: 'mainContent',
      title: getCurrentTitle(),
      params: {
        section: currentCategory,
        task: currentTask,
      },
    });

    // Create console panel on the right side - minimized by default
    const consolePanel = api.addPanel({
      id: 'ai-console',
      component: 'aiConsole',
      title: 'AI Assistant',
      params: {
        context: currentCategory,
        task: currentTask,
        minimized: true,
      },
      position: mainPanel ? {
        referencePanel: mainPanel,
        direction: 'right',
      } : undefined,
    });

    // Set initial sizes - main takes most space, console minimized to right
    if (consolePanel && mainPanel) {
      const totalWidth = window.innerWidth;
      mainPanel.api.setSize({ width: totalWidth * 0.95 });
      consolePanel.api.setSize({ width: 48 }); // Minimized width - just enough for expand button
    }
  };

  // Setup actions for each panel
  const setupPanelActions = (panel: IDockviewPanel) => {
    if (!panel?.id) return;
    
    const panelDef = PANEL_DEFINITIONS[panel.id];
    if (!panelDef?.actions) return;

    panelDef.actions.forEach(action => {
      if (action.id === 'maximize') {
        // Maximize panel logic
        panel.api.onDidFocusChange(() => {
          if (panel.api.isFocused) {
            // Store original size for restore
            panel.params = {
              ...panel.params,
              originalSize: panel.api.width,
            };
          }
        });
      } else if (action.id === 'float') {
        // Float panel logic
        panel.api.onDidActiveChange(() => {
          if (panel.api.isActive && panel.params?.floatRequested) {
            panelManager?.createFloatingPanel(panel.id, panel.params);
            panel.params.floatRequested = false;
          }
        });
      }
    });
  };

  const getCurrentTitle = () => {
    const titles: Record<string, string> = {
      ingest: 'Ingest - Connect and Import',
      process: 'Process - Transform and Optimize',
      analyze: 'Analyze - Discover and Understand',
      monitor: 'Monitor - Track and Alert',
    };
    return titles[currentCategory] || 'Workspace';
  };

  // Update panels when navigation changes
  useEffect(() => {
    if (api) {
      const mainPanel = api.getPanel('main-content');
      if (mainPanel) {
        mainPanel.api.setTitle(getCurrentTitle());
        mainPanel.api.updateParameters({
          section: currentCategory,
          task: currentTask,
        });
      }

      const consolePanel = api.getPanel('ai-console');
      if (consolePanel) {
        consolePanel.api.updateParameters({
          context: currentCategory,
          task: currentTask,
        });
      }
    }
  }, [api, currentCategory, currentTask]);

  // Enhanced keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!api || !panelManager) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Cmd/Ctrl + K: Toggle AI Console between minimized and expanded
      if (ctrl && key === 'k') {
        e.preventDefault();
        const consolePanel = api.getPanel('ai-console');
        if (consolePanel) {
          const isMinimized = consolePanel.api.width <= 50;
          
          if (isMinimized) {
            // Expand console
            const totalWidth = window.innerWidth;
            consolePanel.api.setSize({ width: totalWidth * 0.3 });
            consolePanel.api.setActive();
            consolePanel.api.updateParameters({ 
              ...consolePanel.params, 
              minimized: false 
            });
            
            // Focus input after expansion
            setTimeout(() => {
              const input = document.querySelector('.ai-console-input') as HTMLInputElement;
              input?.focus();
            }, 200);
          } else {
            // Minimize console (don't close, just shrink)
            consolePanel.api.setSize({ width: 48 });
            consolePanel.api.updateParameters({ 
              ...consolePanel.params, 
              minimized: true 
            });
          }
        } else {
          // Create console if it doesn't exist
          const mainPanel = api.getPanel('main-content');
          api.addPanel({
            id: 'ai-console',
            component: 'aiConsole',
            title: 'AI Assistant',
            params: {
              context: currentCategory,
              task: currentTask,
              minimized: false,
            },
            position: mainPanel ? {
              referencePanel: mainPanel,
              direction: 'right',
            } : undefined,
          });
        }
      }

      // Cmd/Ctrl + J: Alternative shortcut for AI Console
      if (ctrl && key === 'j') {
        e.preventDefault();
        // Trigger same logic as Cmd+K
        const consolePanel = api.getPanel('ai-console');
        if (consolePanel) {
          const isMinimized = consolePanel.api.width <= 50;
          
          if (isMinimized) {
            // Expand console
            const totalWidth = window.innerWidth;
            consolePanel.api.setSize({ width: totalWidth * 0.3 });
            consolePanel.api.setActive();
            consolePanel.api.updateParameters({ 
              ...consolePanel.params, 
              minimized: false 
            });
            
            // Focus input after expansion
            setTimeout(() => {
              const input = document.querySelector('.ai-console-input') as HTMLInputElement;
              input?.focus();
            }, 200);
          } else {
            // Minimize console
            consolePanel.api.setSize({ width: 48 });
            consolePanel.api.updateParameters({ 
              ...consolePanel.params, 
              minimized: true 
            });
          }
        }
      }

      // Cmd/Ctrl + P: Toggle Properties Panel
      if (ctrl && key === 'p' && !shift) {
        e.preventDefault();
        const panel = api.getPanel('properties');
        if (panel) {
          panel.api.setVisible(!panel.api.isVisible);
        }
        // Skip restore for now to avoid errors
      }

      // Cmd/Ctrl + Shift + T: Reopen recently closed tab
      if (ctrl && shift && key === 't') {
        e.preventDefault();
        const recent = recentlyClosed[0];
        if (recent && api) {
          // Simple restore
          api.addPanel({
            id: recent.id,
            component: recent.id === 'ai-console' ? 'aiConsole' : 'mainContent',
            title: recent.title,
            position: {
              referencePanel: api.getPanel('main-content'),
              direction: 'right',
            },
          });
          setRecentlyClosed(prev => prev.slice(1));
        }
      }

      // Cmd/Ctrl + W: Close current tab (if closeable)
      if (ctrl && key === 'w' && !shift) {
        const activePanel = api.activePanel;
        if (activePanel) {
          const panelDef = PANEL_DEFINITIONS[activePanel.id];
          if (panelDef?.closeable) {
            e.preventDefault();
            activePanel.api.close();
          }
        }
      }

      // Escape: Close floating panels
      if (key === 'escape') {
        const floatingPanels = api.panels.filter(p => p.id.includes('-floating'));
        floatingPanels.forEach(p => p.api.close());
      }

      // Cmd/Ctrl + M: Maximize current panel
      if (ctrl && key === 'm') {
        e.preventDefault();
        const activePanel = api.activePanel;
        if (activePanel) {
          const isMaximized = activePanel.params?.maximized;
          if (isMaximized) {
            // Restore original size
            const originalSize = activePanel.params?.originalSize || window.innerWidth * 0.5;
            activePanel.api.setSize({ width: originalSize });
            activePanel.params = { ...activePanel.params, maximized: false };
          } else {
            // Maximize
            activePanel.params = {
              ...activePanel.params,
              originalSize: activePanel.api.width,
              maximized: true,
            };
            activePanel.api.setSize({ width: window.innerWidth * 0.9 });
          }
        }
      }

      // Cmd/Ctrl + Shift + L: Reset layout
      if (ctrl && shift && key === 'l') {
        e.preventDefault();
        api.clear();
        createDefaultLayout(api);
      }

      // Cmd/Ctrl + D: Toggle Documentation
      if (ctrl && key === 'd' && !shift) {
        e.preventDefault();
        const panel = api.getPanel('documentation');
        if (panel) {
          panel.api.setVisible(!panel.api.isVisible);
        }
        // Skip restore for now
      }

      // Cmd/Ctrl + 1: Reset to default layout
      if (ctrl && !shift && key === '1') {
        e.preventDefault();
        api.clear();
        createDefaultLayout(api);
        setCurrentPreset('default');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api, panelManager, recentlyClosed, currentPreset, currentCategory, currentTask]);

  // Panel components registry
  const components = {
    mainContent: (props: IDockviewPanelProps) => <MainContentPanel {...props} />,
    aiConsole: (props: IDockviewPanelProps) => <AIConsolePanel {...props} />,
    properties: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Properties</h3>
        <p className="text-sm text-gray-400">Properties panel content</p>
      </div>
    ),
    results: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Results</h3>
        <p className="text-sm text-gray-400">Results will appear here</p>
      </div>
    ),
    documentation: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Documentation</h3>
        <p className="text-sm text-gray-400">Documentation content</p>
      </div>
    ),
    metrics: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300">
        <h3 className="text-lg font-semibold mb-2">Metrics</h3>
        <p className="text-sm text-gray-400">Performance metrics</p>
      </div>
    ),
    logs: (props: IDockviewPanelProps) => (
      <div className="p-4 text-gray-300 font-mono text-xs">
        <h3 className="text-lg font-semibold mb-2 font-sans">Logs</h3>
        <pre className="text-gray-400">System logs...</pre>
      </div>
    ),
  };

  // Custom tab component - properly integrated with Dockview's tab system
  const TabComponent = (props: any) => {
    const panelId = props.api.id;
    const isAIConsole = panelId === 'ai-console';
    const isMainContent = panelId === 'main-content';
    
    // Main content cannot be closed, everything else can
    const isCloseable = !isMainContent;

    const getIcon = () => {
      if (props.api.title.includes('Process')) return 'fa-cogs';
      if (props.api.title.includes('Analyze')) return 'fa-chart-line';
      if (props.api.title.includes('Monitor')) return 'fa-heartbeat';
      if (props.api.title.includes('Ingest')) return 'fa-database';
      if (props.api.title === 'AI Assistant') return 'fa-robot';
      if (props.api.title === 'Properties') return 'fa-sliders-h';
      if (props.api.title === 'Documentation') return 'fa-book';
      if (props.api.title === 'Results') return 'fa-list';
      if (props.api.title === 'Metrics') return 'fa-chart-bar';
      if (props.api.title === 'Logs') return 'fa-terminal';
      return 'fa-layer-group';
    };

    const handleCloseClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      
      if (isAIConsole && api) {
        // For AI Console, minimize instead of close
        const consolePanel = api.getPanel('ai-console');
        if (consolePanel) {
          consolePanel.api.setSize({ width: 48 });
          consolePanel.api.updateParameters({ 
            ...consolePanel.params, 
            minimized: true 
          });
        }
      } else {
        // For other panels, use Dockview's close method
        props.api.close();
      }
    };

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs group h-full">
        <i className={`fas ${getIcon()} text-gray-400`} />
        <span className="text-gray-300 flex-1">{props.api.title}</span>
        {isCloseable && (
          <button
            className="ml-auto opacity-0 group-hover:opacity-50 hover:opacity-100 transition-opacity p-1 hover:bg-gray-800 rounded"
            onClick={handleCloseClick}
            onMouseDown={(e) => e.preventDefault()} // Prevent tab selection on close
            title={isAIConsole ? "Minimize (Cmd+K)" : "Close tab"}
          >
            <i className={`fas ${isAIConsole ? 'fa-compress-alt' : 'fa-times'} text-xs`} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="h-full w-full bg-gray-950 relative">
      {/* Simple controls */}
      <div className="absolute top-2 right-2 z-10 flex gap-2">        
        {recentlyClosed.length > 0 && (
          <button
            className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded border border-gray-700 hover:bg-gray-700"
            onClick={() => {
              const recent = recentlyClosed[0];
              if (recent && api) {
                // Simple restore without complex manager
                api.addPanel({
                  id: recent.id,
                  component: recent.id === 'ai-console' ? 'aiConsole' : 'mainContent',
                  title: recent.title,
                  position: {
                    referencePanel: api.getPanel('main-content'),
                    direction: 'right',
                  },
                });
                setRecentlyClosed(prev => prev.slice(1));
              }
            }}
            title={`Reopen ${recentlyClosed[0]?.title}`}
          >
            <i className="fas fa-undo mr-1" />
            Reopen
          </button>
        )}
      </div>

      <DockviewReact
        className="dockview-theme-dark h-full w-full nexusone-dockview"
        onReady={onReady}
        components={components}
        watermarkComponent={() => null}
        disableFloatingGroups={!DOCKVIEW_CONFIG.floatingGroups}
        showDndOverlay={true}
        proportionalLayout={DOCKVIEW_CONFIG.proportionalLayout}
        defaultTabComponent={TabComponent}
      />

      {/* Keyboard shortcuts help */}
      <div className="absolute bottom-2 left-2 z-10">
        <button
          className="text-gray-500 hover:text-gray-300 text-xs"
          onClick={() => {
            const shortcuts = Object.entries(KEYBOARD_SHORTCUTS)
              .map(([key, desc]) => `${key}: ${desc}`)
              .join('\n');
            alert(`Keyboard Shortcuts:\n\n${shortcuts}`);
          }}
          title="Keyboard shortcuts"
        >
          <i className="fas fa-keyboard" />
        </button>
      </div>
    </div>
  );
}
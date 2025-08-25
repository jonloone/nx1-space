'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

const STORAGE_KEY = 'nexusone-workspace-layout-v6';

export function SimpleWorkspaceContainer() {
  const [api, setApi] = useState<DockviewApi>();
  const { currentCategory, currentTask } = useWorkspaceStore();
  const { setConsoleApi } = useConsoleStore();

  const getCurrentTitle = () => {
    const titles: Record<string, string> = {
      ingest: 'Ingest - Connect and Import',
      process: 'Process - Transform and Optimize',
      analyze: 'Analyze - Discover and Understand',
      monitor: 'Monitor - Track and Alert',
    };
    return titles[currentCategory] || 'Workspace';
  };

  // Initialize Dockview
  const onReady = (event: DockviewReadyEvent) => {
    const api = event.api;
    setApi(api);
    setConsoleApi(api);

    // Try to restore saved layout or create default
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        api.fromJSON(JSON.parse(saved));
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
        localStorage.setItem(STORAGE_KEY, JSON.stringify(api.toJSON()));
      } catch (e) {
        console.error('Failed to save layout:', e);
      }
    });

    // Prevent main content from being removed
    api.onDidRemovePanel((event) => {
      if (event.id === 'main-content') {
        setTimeout(() => {
          if (!api.getPanel('main-content')) {
            api.addPanel({
              id: 'main-content',
              component: 'mainContent',
              title: getCurrentTitle(),
            });
          }
        }, 0);
      }
    });
  };

  const createDefaultLayout = (api: DockviewApi) => {
    // Create main content panel
    const mainPanel = api.addPanel({
      id: 'main-content',
      component: 'mainContent',
      title: getCurrentTitle(),
    });

    // Create AI console panel on the right (minimized)
    const consolePanel = api.addPanel({
      id: 'ai-console',
      component: 'aiConsole',
      title: 'AI Assistant',
      params: { minimized: true },
      position: mainPanel ? {
        referencePanel: mainPanel,
        direction: 'right',
      } : undefined,
    });

    // Set sizes
    if (consolePanel && mainPanel) {
      mainPanel.api.setSize({ width: window.innerWidth * 0.95 });
      consolePanel.api.setSize({ width: 48 });
    }
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!api) return;

      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;

      // Cmd/Ctrl + K or J: Toggle AI Console
      if (ctrl && (key === 'k' || key === 'j')) {
        e.preventDefault();
        const consolePanel = api.getPanel('ai-console');
        
        if (consolePanel) {
          const isMinimized = consolePanel.api.width <= 50;
          
          if (isMinimized) {
            // Expand
            consolePanel.api.setSize({ width: window.innerWidth * 0.3 });
            consolePanel.api.updateParameters({ minimized: false });
            consolePanel.api.setActive();
            
            // Focus input
            setTimeout(() => {
              const input = document.querySelector('.ai-console-input') as HTMLInputElement;
              input?.focus();
            }, 200);
          } else {
            // Minimize
            consolePanel.api.setSize({ width: 48 });
            consolePanel.api.updateParameters({ minimized: true });
          }
        } else {
          // Recreate if closed
          const mainPanel = api.getPanel('main-content');
          api.addPanel({
            id: 'ai-console',
            component: 'aiConsole',
            title: 'AI Assistant',
            params: { minimized: false },
            position: mainPanel ? {
              referencePanel: mainPanel,
              direction: 'right',
            } : undefined,
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [api]);

  // Update panels when navigation changes
  useEffect(() => {
    if (api) {
      const mainPanel = api.getPanel('main-content');
      if (mainPanel) {
        mainPanel.api.setTitle(getCurrentTitle());
      }
    }
  }, [api, currentCategory, currentTask]);

  // Panel components
  const components = {
    mainContent: (props: IDockviewPanelProps) => <MainContentPanel {...props} />,
    aiConsole: (props: IDockviewPanelProps) => <AIConsolePanel {...props} />,
  };

  return (
    <div className="h-full w-full bg-gray-950">
      <DockviewReact
        className="dockview-theme-dark h-full w-full"
        onReady={onReady}
        components={components}
        watermarkComponent={() => null}
        proportionalLayout={true}
        disableAutoResizing={false}
        showDndOverlay={true}
        // Let Dockview handle tabs with built-in close functionality
        tabComponents={{
          'ai-console': (props) => (
            <div className="flex items-center gap-2 px-3 py-1 text-xs">
              <i className="fas fa-robot text-gray-400" />
              <span>{props.api.title}</span>
            </div>
          ),
          'main-content': (props) => (
            <div className="flex items-center gap-2 px-3 py-1 text-xs">
              <i className="fas fa-layer-group text-gray-400" />
              <span>{props.api.title}</span>
            </div>
          ),
        }}
      />
      
      <style jsx global>{`
        /* Customize Dockview close buttons */
        .dockview-tab[data-panel-id="main-content"] .dockview-tab-action-close {
          display: none !important;
        }
        
        .dockview-tab[data-panel-id="ai-console"] .dockview-tab-action-close::before {
          content: "\\f066"; /* Font Awesome compress icon */
          font-family: "Font Awesome 5 Free";
          font-weight: 900;
        }
        
        .dockview-tab-action-close {
          opacity: 0;
          transition: opacity 0.2s;
        }
        
        .dockview-tab:hover .dockview-tab-action-close {
          opacity: 0.5;
        }
        
        .dockview-tab-action-close:hover {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}
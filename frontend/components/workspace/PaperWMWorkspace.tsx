'use client';

/**
 * PaperWMWorkspace - Direct React adaptation of PaperWM's workspace management
 * Replaces dockview with PaperWM's proven scrolling column paradigm
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ColumnManager, Column } from '@/lib/paperwm/ColumnManager';
import { ScrollController } from '@/lib/paperwm/ScrollController';
import { KeybindManager } from '@/lib/paperwm/KeybindManager';
import { AnimationEngine } from '@/lib/paperwm/AnimationEngine';
import { PAPERWM_CONSTANTS } from '@/lib/paperwm/PaperWMConfig';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils/cn';
import { useSmartPanels } from '@/hooks/useSmartPanels';
import { HomeDashboard } from '@/components/workspace/HomeDashboard';
import { ProgressivePaperManager } from '@/lib/services/ProgressivePaperManager';
import { AITerminalPanel } from '@/components/workspace/AITerminalPanel';
import { ContextNavigator } from '@/components/navigation/ContextNavigator';
import { useContextualNavigation, NavigationContext } from '@/hooks/useContextualNavigation';
import { useProgressiveRevelation } from '@/hooks/useProgressiveRevelation';
import { useWorkspaceState } from '@/hooks/useWorkspaceState';
import { WorkspaceManager } from './WorkspaceManager';

// Import column components
import { DataProductBuilder } from '@/components/columns/DataProductBuilder';
import { PipelineOperations } from '@/components/columns/PipelineOperations';
import { QualityMonitor } from '@/components/columns/QualityMonitor';
import { PerformanceOptimizer } from '@/components/columns/PerformanceOptimizer';
import { DataQualityTask } from '@/components/tasks/DataQualityTask';

interface PaperWMWorkspaceProps {
  className?: string;
}

export function PaperWMWorkspace({ className }: PaperWMWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // PaperWM core instances
  const [columnManager, setColumnManager] = useState<ColumnManager | null>(null);
  const [scrollController, setScrollController] = useState<ScrollController | null>(null);
  const [keybindManager, setKeybindManager] = useState<KeybindManager | null>(null);
  const [animationEngine] = useState(() => new AnimationEngine());
  
  // State
  const [scrollPosition, setScrollPosition] = useState(0);
  const [columns, setColumns] = useState<Column[]>([]);
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);
  const [progressiveMode, setProgressiveMode] = useState(true); // Start in progressive mode
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string | null>(null);
  const [navigationContext, setNavigationContext] = useState<NavigationContext | null>(null);
  const [showPipelineMap, setShowPipelineMap] = useState(false);
  const [aiConsoleExpanded, setAiConsoleExpanded] = useState(false);
  
  // Contextual navigation
  const { initializeControllers: initContextualNavigation } = useContextualNavigation();
  
  // Progressive revelation
  const { initialize: initProgressiveRevelation, registerTaskRevelations } = useProgressiveRevelation();
  
  // Workspace state management
  const { initialize: initWorkspaceState, quickSave } = useWorkspaceState();
  const [showWorkspaceManager, setShowWorkspaceManager] = useState(false);
  
  const { currentTask } = useWorkspaceStore();
  const progressivePaperManager = useRef(ProgressivePaperManager.getInstance());
  
  // Smart panels integration
  const { 
    loadTaskLayout, 
    setPaperWMControllers,
    markColumnCompleted,
    currentTaskType 
  } = useSmartPanels();

  /**
   * Helper function to add a new column dynamically
   */
  const handleAddColumn = useCallback((col: Partial<Column>) => {
    if (!columnManager) return;
    
    // Import detail columns dynamically
    const { PipelineInvestigation } = require('@/components/columns/PipelineInvestigation');
    const { DataProductBuilder } = require('@/components/columns/DataProductBuilder');
    const { PerformanceOptimizer } = require('@/components/columns/PerformanceOptimizer');
    const { QualityMonitor } = require('@/components/columns/QualityMonitor');
    const { TechnicalDetails } = require('@/components/columns/TechnicalDetails');
    const { TestingValidation } = require('@/components/columns/TestingValidation');
    
    const componentMap: Record<string, any> = {
      'PipelineInvestigation': PipelineInvestigation,
      'DataProductBuilder': DataProductBuilder,
      'PerformanceOptimizer': PerformanceOptimizer,
      'QualityMonitor': QualityMonitor,
      'TechnicalDetails': TechnicalDetails,
      'TestingValidation': TestingValidation
    };
    
    const ComponentToRender = componentMap[col.component || 'PipelineInvestigation'] || 
      (() => <div className="p-6 text-white">Component {col.component} not found</div>);
    
    const newColumn: Column = {
      id: col.id || `column-${Date.now()}`,
      component: ComponentToRender,
      width: col.width || 800,
      x: 0,
      y: 0,
      height: containerRef.current ? containerRef.current.offsetHeight - 2 * PAPERWM_CONSTANTS.VERTICAL_MARGIN : 600,
      focused: false,
      title: col.title || 'Details',
      type: col.type || 'detail',
      props: {
        ...col.props,
        onAddColumn: handleAddColumn,
        onFocusColumn: handleFocusColumn
      }
    };
    
    columnManager.insertColumn(newColumn);
    columnManager.layout({ animate: true });
    setColumns([...columnManager.getColumns()]);
    
    // Focus the new column
    setTimeout(() => {
      const newIndex = columnManager.getColumns().findIndex(c => c.id === newColumn.id);
      if (newIndex !== -1 && scrollController) {
        scrollController.scrollToColumn(newIndex, { preferLeft: false });
        columnManager.focusColumn(newIndex);
        setActiveColumnIndex(newIndex);
      }
    }, 100);
  }, [columnManager, scrollController]);
  
  /**
   * Helper function to focus a specific column
   */
  const handleFocusColumn = useCallback((columnId: string) => {
    if (!columnManager || !scrollController) return;
    
    const index = columnManager.getColumns().findIndex(c => c.id === columnId);
    if (index !== -1) {
      scrollController.scrollToColumn(index, { preferLeft: false });
      columnManager.focusColumn(index);
      setActiveColumnIndex(index);
    }
  }, [columnManager, scrollController]);

  /**
   * Initialize PaperWM system
   */
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized) return;
    
    // Wait a bit for refs to be ready
    const timer = setTimeout(() => {
      if (!containerRef.current || !viewportRef.current) {
        console.error('PaperWM: Container refs still not ready after delay');
        return;
      }

    const container = containerRef.current;
    const viewport = viewportRef.current;
    const containerWidth = container.offsetWidth;
    const containerHeight = container.offsetHeight;

    // Initialize column manager
    const cm = new ColumnManager(containerWidth, containerHeight);
    
    // Initialize scroll controller
    const sc = new ScrollController(cm, containerWidth);
    sc.onScroll((position) => {
      setScrollPosition(position);
      if (viewportRef.current) {
        viewportRef.current.style.transform = `translateX(-${position}px)`;
      }
    });

    // Initialize keybind manager
    const kb = new KeybindManager(cm, sc);
    kb.onAction((action) => {
      // Update UI state when actions occur
      setColumns([...cm.getColumns()]);
      setActiveColumnIndex(cm.getActiveColumnIndex());
    });

    // Import priority hub columns
    const { AttentionColumn } = require('@/components/columns/AttentionColumn');
    const { BuildColumn } = require('@/components/columns/BuildColumn');
    const { MonitorColumn } = require('@/components/columns/MonitorColumn');
    
    // Store references for callbacks
    (window as any).__paperWMCallbacks = {
      addColumn: (col: Partial<Column>) => {
        // Will be updated when columnManager is available
      },
      focusColumn: (id: string) => {
        // Will be updated when scrollController is available
      }
    };
    
    // Add priority hub columns
    const attentionColumn: Column = {
      id: 'hub-attention',
      component: AttentionColumn,
      width: Math.min(1200, containerWidth * 0.8), // 80% of viewport
      x: 0,
      y: 0,
      height: containerHeight - 2 * PAPERWM_CONSTANTS.VERTICAL_MARGIN,
      focused: true,
      title: 'What Needs Attention',
      type: 'priority-hub',
      props: {}
    };
    
    const buildColumn: Column = {
      id: 'hub-build',
      component: BuildColumn,
      width: Math.min(1200, containerWidth * 0.8),
      x: 0,
      y: 0,
      height: containerHeight - 2 * PAPERWM_CONSTANTS.VERTICAL_MARGIN,
      focused: false,
      title: 'What to Build',
      type: 'priority-hub',
      props: {
        onShowPipeline: () => setShowPipelineMap(true)
      }
    };
    
    const monitorColumn: Column = {
      id: 'hub-monitor',
      component: MonitorColumn,
      width: Math.min(1200, containerWidth * 0.8),
      x: 0,
      y: 0,
      height: containerHeight - 2 * PAPERWM_CONSTANTS.VERTICAL_MARGIN,
      focused: false,
      title: 'What to Monitor',
      type: 'priority-hub',
      props: {}
    };
    
    // Start with the three priority hubs
    cm.insertColumn(attentionColumn);
    cm.insertColumn(buildColumn);
    cm.insertColumn(monitorColumn);
    cm.layout({ animate: false });
    
    setColumnManager(cm);
    setScrollController(sc);
    setKeybindManager(kb);
    setColumns(cm.getColumns());
    setIsInitialized(true);
    
    // Update global callbacks now that controllers are available
    (window as any).__paperWMCallbacks = {
      addColumn: (col: Partial<Column>) => {
        // Use the handleAddColumn from outer scope once state is set
        setTimeout(() => {
          const currentCM = cm;
          const currentSC = sc;
          if (currentCM && currentSC) {
            // Re-use the logic from handleAddColumn but with local refs
            const { PipelineInvestigation } = require('@/components/columns/PipelineInvestigation');
            const { DataProductBuilder } = require('@/components/columns/DataProductBuilder');
            const { PerformanceOptimizer } = require('@/components/columns/PerformanceOptimizer');
            const { QualityMonitor } = require('@/components/columns/QualityMonitor');
            const { TechnicalDetails } = require('@/components/columns/TechnicalDetails');
            const { TestingValidation } = require('@/components/columns/TestingValidation');
            
            const componentMap: Record<string, any> = {
              'PipelineInvestigation': PipelineInvestigation,
              'DataProductBuilder': DataProductBuilder,
              'PerformanceOptimizer': PerformanceOptimizer,
              'QualityMonitor': QualityMonitor,
              'TechnicalDetails': TechnicalDetails,
              'TestingValidation': TestingValidation
            };
            
            const ComponentToRender = componentMap[col.component || 'PipelineInvestigation'] || 
              (() => <div className="p-6 text-white">Component {col.component} not found</div>);
            
            const newColumn: Column = {
              id: col.id || `column-${Date.now()}`,
              component: ComponentToRender,
              width: col.width || 800,
              x: 0,
              y: 0,
              height: containerHeight - 2 * PAPERWM_CONSTANTS.VERTICAL_MARGIN,
              focused: false,
              title: col.title || 'Details',
              type: col.type || 'detail',
              props: {
                ...col.props,
                onAddColumn: (window as any).__paperWMCallbacks.addColumn,
                onFocusColumn: (window as any).__paperWMCallbacks.focusColumn
              }
            };
            
            currentCM.insertColumn(newColumn);
            currentCM.layout({ animate: true });
            setColumns([...currentCM.getColumns()]);
            
            // Focus the new column
            setTimeout(() => {
              const newIndex = currentCM.getColumns().findIndex(c => c.id === newColumn.id);
              if (newIndex !== -1) {
                currentSC.scrollToColumn(newIndex, { preferLeft: false });
                currentCM.focusColumn(newIndex);
                setActiveColumnIndex(newIndex);
              }
            }, 100);
          }
        }, 0);
      },
      focusColumn: (id: string) => {
        setTimeout(() => {
          const currentCM = cm;
          const currentSC = sc;
          if (currentCM && currentSC) {
            const index = currentCM.getColumns().findIndex(c => c.id === id);
            if (index !== -1) {
              currentSC.scrollToColumn(index, { preferLeft: false });
              currentCM.focusColumn(index);
              setActiveColumnIndex(index);
            }
          }
        }, 0);
      }
    };
    
    // Connect smart panels to PaperWM controllers
    setPaperWMControllers(cm, sc);
    
    // Connect contextual navigation
    initContextualNavigation(cm, sc);
    
    // Connect progressive revelation
    initProgressiveRevelation(cm, sc);
    
    // Connect workspace state management
    initWorkspaceState(cm, sc);

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.offsetWidth;
      const newHeight = container.offsetHeight;
      cm.updateContainerDimensions(newWidth, newHeight);
      sc.updateContainerWidth(newWidth);
      setColumns([...cm.getColumns()]);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      sc.destroy();
    };
    }, 50); // Small delay to ensure refs are ready
    
    return () => clearTimeout(timer);
  }, []); // Run once on mount

  /**
   * Handle keyboard events
   */
  useEffect(() => {
    if (!keybindManager || !columnManager || !scrollController) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt+Arrow keys for column navigation
      if (event.altKey) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          const currentIndex = columnManager.getActiveColumnIndex();
          if (currentIndex > 0) {
            const newIndex = currentIndex - 1;
            if (scrollController.focusColumnOptimal) {
              scrollController.focusColumnOptimal(newIndex);
            } else {
              columnManager.focusColumn(newIndex);
              scrollController.scrollToColumn(newIndex, { preferLeft: true });
            }
            setActiveColumnIndex(newIndex);
          }
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          const currentIndex = columnManager.getActiveColumnIndex();
          const totalColumns = columnManager.getColumns().length;
          if (currentIndex < totalColumns - 1) {
            const newIndex = currentIndex + 1;
            if (scrollController.focusColumnOptimal) {
              scrollController.focusColumnOptimal(newIndex);
            } else {
              columnManager.focusColumn(newIndex);
              scrollController.scrollToColumn(newIndex, { preferLeft: true });
            }
            setActiveColumnIndex(newIndex);
          }
        }
      } else {
        // Pass other key events to PaperWM keybind manager
        keybindManager.handleKeyDown(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [keybindManager, columnManager, scrollController]);

  /**
   * Handle mouse wheel scrolling
   * Shift+Scroll: Switch between columns (horizontal movement)
   * Horizontal scroll (trackpad): Switch between columns
   * Normal Scroll: Allow vertical scrolling within columns
   */
  const handleWheel = useCallback((event: React.WheelEvent) => {
    if (!scrollController) return;
    
    // Detect horizontal scroll (trackpad two-finger swipe or horizontal mouse wheel)
    const isHorizontalScroll = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    
    // Shift+Scroll OR horizontal scroll for switching between columns
    if (event.shiftKey || isHorizontalScroll) {
      // Use the appropriate delta based on scroll type
      const deltaX = isHorizontalScroll ? event.deltaX : event.deltaY;
      scrollController.handleScrollDelta(deltaX, 0, false);
      event.preventDefault();
    }
    // Normal vertical scroll - let it bubble for vertical scrolling within columns
    // Don't prevent default to allow natural vertical scrolling
  }, [scrollController]);

  /**
   * Handle touch events for mobile/tablet
   */
  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (!scrollController) return;
    scrollController.handleTouchStart(Array.from(event.touches));
  }, [scrollController]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!scrollController || event.touches.length !== PAPERWM_CONSTANTS.GESTURE_HORIZONTAL_FINGERS) return;
    
    // Calculate delta from previous position
    // This is simplified - would need to track previous position properly
    const touch = event.touches[0];
    scrollController.handleTouchMove(Array.from(event.touches), touch.clientX, 0);
  }, [scrollController]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (!scrollController) return;
    scrollController.handleTouchEnd(Array.from(event.touches));
  }, [scrollController]);

  /**
   * Open a new column based on task type
   */
  const openTaskColumn = useCallback((taskType: string, title: string, context?: any) => {
    // Check if this is a smart panel task
    if (taskType && loadTaskLayout) {
      // Try to load the smart panel layout for this task
      loadTaskLayout(taskType).then(() => {
        console.log(`Loaded smart panel layout for ${taskType}`);
      }).catch(() => {
        // Fall back to individual column if no smart panel rule
        if (!columnManager || !scrollController) return;

        let component: React.ComponentType<any>;
        let width = PAPERWM_CONSTANTS.DEFAULT_COLUMN_WIDTH;

        // Map task types to components
        switch (taskType) {
          case 'data-quality':
          case 'data_quality_assessment':
            component = DataQualityTask;
            width = 600;
            break;
          default:
            // Default to a placeholder component
            component = () => <div className="p-6">Task: {title}</div>;
        }

        const newColumn: Column = {
          id: `task-${Date.now()}`,
          component,
          width,
          x: 0,
          y: 0,
          height: 0,
          focused: false,
        };

        columnManager.insertColumn(newColumn);
        setColumns([...columnManager.getColumns()]);
        
        // Animate to new column with optimal positioning
        const newIndex = columnManager.getColumns().length - 1;
        if (scrollController.focusColumnOptimal) {
          scrollController.focusColumnOptimal(newIndex);
        } else {
          columnManager.focusColumn(newIndex);
          scrollController.scrollToColumn(newIndex, { preferLeft: true });
        }
        
        setActiveColumnIndex(newIndex);
      });
    }
  }, [columnManager, scrollController, loadTaskLayout]);

  /**
   * Handle task selection from the landing page
   */
  const handleTaskSelection = useCallback(async (taskId: string, taskType: string) => {
    if (!columnManager || !scrollController) return;

    try {
      // Register progressive revelation targets for this task
      registerTaskRevelations(taskType);
      
      // Start the appropriate workflow
      const papers = await progressivePaperManager.current.startWorkflow(
        taskType, 
        columnManager, 
        scrollController
      );
      
      setCurrentWorkflowId(taskType);
      setColumns([...columnManager.getColumns()]);
      
      console.log(`Started workflow for task: ${taskId}, type: ${taskType}`);
      
    } catch (error) {
      console.error('Failed to start workflow:', error);
    }
  }, [columnManager, scrollController, registerTaskRevelations]);
  
  /**
   * Handle context changes from navigation
   */
  const handleContextChange = useCallback((context: NavigationContext) => {
    setNavigationContext(context);
    if (context.workflowId) {
      setCurrentWorkflowId(context.workflowId);
    } else if (context.taskId) {
      setCurrentWorkflowId(context.taskId);
    }
  }, []);

  // Expose openTaskColumn globally for AI command center
  useEffect(() => {
    (window as any).openTaskColumn = openTaskColumn;
  }, [openTaskColumn]);

  /**
   * Render a column
   * Each column is exactly viewport height with internal scrolling for content
   */
  const renderColumn = (column: Column, index: number) => {
    const Component = column.component;
    const isActive = index === activeColumnIndex;
    const columnTitle = (column as any).title || `Column ${index + 1}`;
    const columnType = (column as any).type;
    const taskId = (column as any).taskId;

    return (
      <div
        key={column.id}
        className={cn(
          'absolute flex flex-col bg-gray-950 rounded-lg overflow-hidden transition-opacity',
          isActive ? 'ring-2 ring-[#1d48e5]/50' : 'ring-1 ring-gray-800',
          column.focused ? 'opacity-100' : 'opacity-90'
        )}
        style={{
          transform: `translateX(${column.x}px)`,
          width: `${column.width}px`,
          height: `calc(100vh - ${2 * PAPERWM_CONSTANTS.VERTICAL_MARGIN}px - ${navigationContext ? '96px' : '0px'})`,
          top: `${PAPERWM_CONSTANTS.VERTICAL_MARGIN}px`,
          transition: `transform ${PAPERWM_CONSTANTS.ANIMATION_TIME}ms ease-out, width ${PAPERWM_CONSTANTS.ANIMATION_TIME}ms ease-out`,
        }}
      >
        {/* Column header - fixed at top */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-200 font-medium">{columnTitle}</span>
            {currentTaskType && taskId && (
              <span className="text-xs text-[#1d48e5] bg-[#1d48e5]/10 px-2 py-0.5 rounded">
                {currentTaskType.replace(/_/g, ' ')}
              </span>
            )}
          </div>
          {/* Only allow closing non-essential columns (not task selection) */}
          {column.id !== 'task-selection' && (
            <button
              onClick={() => {
                if (columnManager && scrollController) {
                  columnManager.removeColumn(index);
                  setColumns([...columnManager.getColumns()]);
                  setActiveColumnIndex(columnManager.getActiveColumnIndex());
                }
              }}
              className="text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Close column"
            >
              ×
            </button>
          )}
        </div>

        {/* Column content - scrollable internally if needed */}
        <div className="flex-1 overflow-auto min-h-0">
          <Component 
            onComplete={taskId ? () => {
              markColumnCompleted(taskId);
              // Handle progressive workflow completion
              if (currentWorkflowId) {
                progressivePaperManager.current.onPaperComplete(
                  taskId, 
                  currentWorkflowId, 
                  columnManager, 
                  scrollController
                );
              }
            } : undefined}
            columnId={column.id}
            taskId={taskId}
            onTaskSelect={column.id === 'task-selection' ? (taskId: string) => handleTaskSelection(taskId, taskId) : undefined}
            userRole={column.id === 'task-selection' ? 'analyst' : undefined}
            onAddColumn={(window as any).__paperWMCallbacks ? (window as any).__paperWMCallbacks.addColumn : handleAddColumn}
            onFocusColumn={(window as any).__paperWMCallbacks ? (window as any).__paperWMCallbacks.focusColumn : handleFocusColumn}
            {...((column as any).props || {})}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed inset-0 overflow-hidden bg-gray-950',
        className
      )}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Context Navigator - Fixed at top */}
      <ContextNavigator 
        columnManager={columnManager}
        scrollController={scrollController}
        onContextChange={handleContextChange}
        className="fixed top-0 left-0 right-0 z-40"
      />
      
      {/* Viewport container - this moves horizontally */}
      <div
        ref={viewportRef}
        className={cn(
          "absolute inset-0",
          navigationContext && "top-24" // Add top margin when context navigator is visible
        )}
        style={{
          willChange: 'transform',
        }}
      >
        {/* Render all columns */}
        {isInitialized && columns.map((column, index) => renderColumn(column, index))}
      </div>

      {/* Scroll indicators */}
      {scrollPosition > 0 && (
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 p-2">
          <div className="w-8 h-8 bg-[#1d48e5]/20 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-left text-[#1d48e5]" />
          </div>
        </div>
      )}
      
      {columnManager && scrollPosition < columnManager.getTotalWidth() - (containerRef.current?.offsetWidth || 0) && (
        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 p-2">
          <div className="w-8 h-8 bg-[#1d48e5]/20 rounded-full flex items-center justify-center">
            <i className="fas fa-chevron-right text-[#1d48e5]" />
          </div>
        </div>
      )}


      {/* Column Position Indicator */}
      <div className="absolute bottom-4 right-4 bg-gray-900/95 px-3 py-2 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {columns.map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-2 h-2 rounded-full transition-all',
                  index === activeColumnIndex 
                    ? 'bg-[#1d48e5] w-6' 
                    : 'bg-gray-600 hover:bg-gray-500'
                )}
                onClick={() => {
                  if (columnManager && scrollController) {
                    if (scrollController.focusColumnOptimal) {
                      scrollController.focusColumnOptimal(index);
                    } else {
                      columnManager.focusColumn(index);
                      scrollController.scrollToColumn(index, { preferLeft: true });
                    }
                    setActiveColumnIndex(index);
                  }
                }}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">
            {activeColumnIndex + 1} / {columns.length}
          </span>
        </div>
      </div>

      {/* Workspace Manager Modal */}
      {showWorkspaceManager && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <WorkspaceManager
            currentContext={navigationContext}
            onClose={() => setShowWorkspaceManager(false)}
          />
        </div>
      )}

      {/* AI Terminal Panel - Fixed overlay that doesn't interfere with columns */}
      <AITerminalPanel 
        columnManager={columnManager}
        scrollController={scrollController}
        currentWorkflowId={currentWorkflowId}
      />
      
      {/* Floating Pipeline Map - Shows when in data product context */}
      {showPipelineMap && (() => {
        const { FloatingPipelineMap } = require('@/components/workspace/overlays/FloatingPipelineMap');
        return (
          <FloatingPipelineMap
            visible={showPipelineMap}
            onClose={() => setShowPipelineMap(false)}
          />
        );
      })()}
      
      {/* Floating AI Console - Always available */}
      {(() => {
        const { FloatingAIConsole } = require('@/components/workspace/overlays/FloatingAIConsole');
        return (
          <FloatingAIConsole
            expanded={aiConsoleExpanded}
            onToggle={() => setAiConsoleExpanded(!aiConsoleExpanded)}
          />
        );
      })()}
    </div>
  );
}
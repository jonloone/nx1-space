/**
 * Dockview Advanced Configuration for NexusOne
 * Handles auto-sizing, closeable tabs, and panel management
 */

import { DockviewApi, IDockviewPanelProps } from 'dockview';

export interface PanelDefinition {
  id: string;
  title: string;
  component: string;
  closeable: boolean;
  minimumSize?: { width?: number; height?: number };
  defaultSize?: { width?: number; height?: number };
  position?: 'left' | 'right' | 'top' | 'bottom' | 'center';
  actions?: Array<{
    id: string;
    icon: string;
    tooltip?: string;
  }>;
}

export interface LayoutPreset {
  name: string;
  description: string;
  panels: string[];
  sizes: Record<string, { width?: number; height?: number }>;
}

export interface DockviewConfig {
  // Core configuration
  proportionalLayout: boolean;
  disableAutoResizing: boolean;
  floatingGroups: boolean;
  tabHeight: number;
  showTabCloseButton: boolean;
  enableAutoResize: boolean;
  hideBorders: boolean;
  className: string;
  
  // Panel definitions
  panels: Record<string, PanelDefinition>;
  
  // Layout presets
  presets: Record<string, LayoutPreset>;
  
  // Sizing rules
  sizingRules: Record<string, Record<string, string>>;
}

// Panel definitions with closeable configuration
export const PANEL_DEFINITIONS: Record<string, PanelDefinition> = {
  'main-content': {
    id: 'main-content',
    title: 'Workspace',
    component: 'mainContent',
    closeable: false, // Main workspace cannot be closed
    minimumSize: { width: 400, height: 300 },
    position: 'center',
  },
  
  'ai-console': {
    id: 'ai-console',
    title: 'AI Assistant',
    component: 'aiConsole',
    closeable: true, // Can be closed with X button
    defaultSize: { width: 300 },
    minimumSize: { width: 250, height: 200 },
    position: 'right',
    actions: [
      { id: 'maximize', icon: 'maximize', tooltip: 'Maximize Panel' },
      { id: 'float', icon: 'popout', tooltip: 'Float Panel' },
    ],
  },
  
  'properties': {
    id: 'properties',
    title: 'Properties',
    component: 'properties',
    closeable: true,
    defaultSize: { width: 280 },
    minimumSize: { width: 200, height: 150 },
    position: 'right',
  },
  
  'results': {
    id: 'results',
    title: 'Results',
    component: 'results',
    closeable: true,
    defaultSize: { height: 250 },
    minimumSize: { height: 100 },
    position: 'bottom',
  },
  
  'documentation': {
    id: 'documentation',
    title: 'Documentation',
    component: 'documentation',
    closeable: true,
    defaultSize: { width: 350 },
    minimumSize: { width: 250, height: 200 },
    position: 'right',
  },
  
  'metrics': {
    id: 'metrics',
    title: 'Metrics',
    component: 'metrics',
    closeable: true,
    defaultSize: { height: 200 },
    minimumSize: { height: 150 },
    position: 'bottom',
  },
  
  'logs': {
    id: 'logs',
    title: 'Logs',
    component: 'logs',
    closeable: true,
    defaultSize: { height: 200 },
    minimumSize: { height: 100 },
    position: 'bottom',
  },
};

// Layout presets for different workflows
export const LAYOUT_PRESETS: Record<string, LayoutPreset> = {
  default: {
    name: 'Default',
    description: 'Standard workspace with AI Assistant',
    panels: ['main-content', 'ai-console'],
    sizes: {
      'main-content': { width: 70 },
      'ai-console': { width: 30 },
    },
  },
  
  analysis: {
    name: 'Analysis Mode',
    description: 'Full analysis workspace with properties and results',
    panels: ['main-content', 'properties', 'ai-console', 'results'],
    sizes: {
      'main-content': { width: 50 },
      'properties': { width: 20 },
      'ai-console': { width: 30 },
      'results': { height: 25 },
    },
  },
  
  focus: {
    name: 'Focus Mode',
    description: 'Distraction-free workspace',
    panels: ['main-content'],
    sizes: {
      'main-content': { width: 100 },
    },
  },
  
  debug: {
    name: 'Debug Mode',
    description: 'Development and debugging workspace',
    panels: ['main-content', 'logs', 'metrics', 'ai-console'],
    sizes: {
      'main-content': { width: 60 },
      'ai-console': { width: 40 },
      'logs': { height: 30 },
      'metrics': { height: 20 },
    },
  },
  
  documentation: {
    name: 'Documentation Mode',
    description: 'Workspace with documentation panel',
    panels: ['main-content', 'documentation', 'ai-console'],
    sizes: {
      'main-content': { width: 50 },
      'documentation': { width: 25 },
      'ai-console': { width: 25 },
    },
  },
};

// Smart sizing rules based on open panels
export const SIZING_RULES = {
  // When only main workspace is open
  workspaceOnly: {
    'main-content': '100%',
  },
  
  // When AI Assistant is added
  withAIAssistant: {
    'main-content': '70%',
    'ai-console': '30%',
  },
  
  // When properties panel is added
  withProperties: {
    'main-content': '55%',
    'ai-console': '25%',
    'properties': '20%',
  },
  
  // Full analysis mode
  fullAnalysis: {
    'main-content': '45%',
    'ai-console': '25%',
    'properties': '15%',
    'results': '15%',
  },
};

// Main configuration
export const DOCKVIEW_CONFIG: DockviewConfig = {
  // Enable proportional layout for auto-sizing
  proportionalLayout: true,
  
  // Allow panels to auto-resize
  disableAutoResizing: false,
  
  // Enable floating groups for popups
  floatingGroups: true,
  
  // Tab configuration
  tabHeight: 35,
  showTabCloseButton: true,
  
  // Enable automatic layout reflow
  enableAutoResize: true,
  
  // Show borders for visual separation
  hideBorders: false,
  
  // Custom class for styling
  className: 'nexusone-dockview',
  
  // Panel definitions
  panels: PANEL_DEFINITIONS,
  
  // Layout presets
  presets: LAYOUT_PRESETS,
  
  // Sizing rules
  sizingRules: SIZING_RULES,
};

// Panel state management
export class PanelStateManager {
  private closedPanels: Map<string, any> = new Map();
  private api: DockviewApi | null = null;
  
  constructor(api?: DockviewApi) {
    if (api) {
      this.api = api;
      this.setupEventHandlers();
    }
  }
  
  setApi(api: DockviewApi) {
    this.api = api;
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    if (!this.api) return;
    
    // Track closed panels
    this.api.onDidRemovePanel((event) => {
      const panelDef = PANEL_DEFINITIONS[event.id];
      if (panelDef?.closeable) {
        this.closedPanels.set(event.id, {
          ...panelDef,
          timestamp: Date.now(),
          params: event.params,
        });
        
        // Auto-resize remaining panels
        this.autoResizePanels();
      }
    });
    
    // Handle panel additions
    this.api.onDidAddPanel(() => {
      this.autoResizePanels();
    });
  }
  
  // Auto-resize panels based on what's open
  private autoResizePanels() {
    if (!this.api) return;
    
    const openPanels = this.api.panels.map(p => p.id);
    const totalPanels = openPanels.length;
    
    if (totalPanels === 0) return;
    
    // Determine sizing rule to apply
    let sizingRule: Record<string, string> = {};
    
    if (totalPanels === 1 && openPanels.includes('main-content')) {
      sizingRule = SIZING_RULES.workspaceOnly;
    } else if (openPanels.includes('main-content') && openPanels.includes('ai-console')) {
      if (openPanels.includes('properties')) {
        sizingRule = SIZING_RULES.withProperties;
      } else {
        sizingRule = SIZING_RULES.withAIAssistant;
      }
    }
    
    // Apply proportional sizing
    if (Object.keys(sizingRule).length > 0) {
      Object.entries(sizingRule).forEach(([panelId, size]) => {
        const panel = this.api?.getPanel(panelId);
        if (panel) {
          const numericSize = parseInt(size.replace('%', ''));
          panel.api.setSize({ width: (window.innerWidth * numericSize) / 100 });
        }
      });
    } else {
      // Equal distribution if no rule matches
      const equalSize = 100 / totalPanels;
      openPanels.forEach(panelId => {
        const panel = this.api?.getPanel(panelId);
        if (panel) {
          panel.api.setSize({ width: (window.innerWidth * equalSize) / 100 });
        }
      });
    }
  }
  
  // Restore a closed panel
  restorePanel(panelId: string) {
    if (!this.api) return;
    
    const closedPanel = this.closedPanels.get(panelId);
    if (!closedPanel) return;
    
    const mainPanel = this.api.getPanel('main-content');
    const position = closedPanel.position || 'right';
    
    try {
      this.api.addPanel({
        id: closedPanel.id,
        component: closedPanel.component,
        title: closedPanel.title,
        params: closedPanel.params,
        position: mainPanel ? {
          referencePanel: mainPanel,
          direction: position,
        } : undefined,
      });
      
      this.closedPanels.delete(panelId);
    } catch (error) {
      console.error('Failed to restore panel:', error);
    }
  }
  
  // Get recently closed panels
  getRecentlyClosedPanels(): Array<{ id: string; title: string; timestamp: number }> {
    return Array.from(this.closedPanels.entries())
      .map(([id, panel]) => ({
        id,
        title: panel.title,
        timestamp: panel.timestamp,
      }))
      .sort((a, b) => b.timestamp - a.timestamp);
  }
  
  // Apply a layout preset
  applyPreset(presetName: string) {
    if (!this.api) return;
    
    const preset = LAYOUT_PRESETS[presetName];
    if (!preset) return;
    
    try {
      // Clear current layout
      this.api.clear();
      
      // Add panels from preset
      preset.panels.forEach((panelId, index) => {
        const panelDef = PANEL_DEFINITIONS[panelId];
        if (!panelDef) return;
        
        const isFirst = index === 0;
        const previousPanel = index > 0 ? this.api?.getPanel(preset.panels[index - 1]) : null;
        
        try {
          this.api?.addPanel({
            id: panelDef.id,
            component: panelDef.component,
            title: panelDef.title,
            position: !isFirst && previousPanel ? {
              referencePanel: previousPanel,
              direction: panelDef.position || 'right',
            } : undefined,
          });
        } catch (error) {
          console.error(`Failed to add panel ${panelId}:`, error);
        }
      });
      
      // Apply sizes after a short delay to ensure panels are ready
      setTimeout(() => {
        Object.entries(preset.sizes).forEach(([panelId, size]) => {
          const panel = this.api?.getPanel(panelId);
          if (panel) {
            try {
              if (size.width) {
                panel.api.setSize({ width: (window.innerWidth * size.width) / 100 });
              }
              if (size.height) {
                panel.api.setSize({ height: (window.innerHeight * size.height) / 100 });
              }
            } catch (error) {
              console.error(`Failed to resize panel ${panelId}:`, error);
            }
          }
        });
      }, 100);
    } catch (error) {
      console.error('Failed to apply preset:', error);
    }
  }
  
  // Create floating panel
  createFloatingPanel(panelId: string, content?: any) {
    if (!this.api) return;
    
    const panelDef = PANEL_DEFINITIONS[panelId];
    if (!panelDef) return;
    
    // Create floating group
    const floatingGroup = this.api.addFloatingGroup({
      x: window.innerWidth / 2 - 300,
      y: window.innerHeight / 2 - 200,
      width: 600,
      height: 400,
    });
    
    // Add panel to floating group
    this.api.addPanel({
      id: `${panelId}-floating`,
      component: panelDef.component,
      title: panelDef.title,
      params: content,
      floating: {
        group: floatingGroup,
      },
    } as any);
  }
}

// Keyboard shortcuts configuration
export const KEYBOARD_SHORTCUTS = {
  'Cmd+K': 'Toggle AI Assistant',
  'Cmd+P': 'Toggle Properties Panel',
  'Cmd+Shift+T': 'Reopen Closed Tab',
  'Cmd+W': 'Close Current Tab (if closeable)',
  'Escape': 'Close Floating Panel',
  'Cmd+M': 'Maximize Current Panel',
  'Cmd+Shift+L': 'Reset Layout',
  'Cmd+D': 'Toggle Documentation',
  'Cmd+Shift+D': 'Duplicate Panel',
  'Cmd+1': 'Apply Default Layout',
  'Cmd+2': 'Apply Analysis Layout',
  'Cmd+3': 'Apply Focus Layout',
  'Cmd+4': 'Apply Debug Layout',
};
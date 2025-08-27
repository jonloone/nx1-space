'use client';

import { NavigationContext } from '@/hooks/useContextualNavigation';
import { Column } from '@/lib/paperwm/ColumnManager';

export interface WorkspaceSnapshot {
  id: string;
  name: string;
  description?: string;
  timestamp: Date;
  context: NavigationContext;
  columns: {
    id: string;
    type: string;
    width: number;
    position: number;
    focused: boolean;
    props: any;
  }[];
  viewport: {
    scrollPosition: number;
    activeColumnIndex: number;
    zoomLevel: number;
  };
  metadata: {
    userRole: string;
    workflowId?: string;
    tags: string[];
    version: string;
  };
}

export interface SharedWorkspace {
  id: string;
  snapshotId: string;
  shareToken: string;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    expiresAt?: Date;
  };
  sharedBy: {
    name: string;
    role: string;
  };
  createdAt: Date;
}

export class WorkspaceStateManager {
  private static instance: WorkspaceStateManager;
  private snapshots: Map<string, WorkspaceSnapshot> = new Map();
  private sharedWorkspaces: Map<string, SharedWorkspace> = new Map();
  private autoSaveInterval: NodeJS.Timeout | null = null;
  private currentSnapshot: WorkspaceSnapshot | null = null;
  
  private constructor() {
    this.loadFromStorage();
    this.setupAutoSave();
  }
  
  static getInstance(): WorkspaceStateManager {
    if (!WorkspaceStateManager.instance) {
      WorkspaceStateManager.instance = new WorkspaceStateManager();
    }
    return WorkspaceStateManager.instance;
  }

  /**
   * Create a snapshot of current workspace state
   */
  async createSnapshot(
    name: string,
    context: NavigationContext,
    columns: Column[],
    viewport: { scrollPosition: number; activeColumnIndex: number },
    options: {
      description?: string;
      tags?: string[];
      autoSave?: boolean;
    } = {}
  ): Promise<WorkspaceSnapshot> {
    const snapshot: WorkspaceSnapshot = {
      id: `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description: options.description,
      timestamp: new Date(),
      context,
      columns: columns.map((col, index) => ({
        id: col.id,
        type: col.type || 'unknown',
        width: col.width,
        position: index,
        focused: col.focused,
        props: (col as any).props || {}
      })),
      viewport: {
        ...viewport,
        zoomLevel: 1.0 // Default zoom level
      },
      metadata: {
        userRole: context.metadata.userRole,
        workflowId: context.workflowId || context.taskId,
        tags: options.tags || [],
        version: '1.0.0'
      }
    };

    this.snapshots.set(snapshot.id, snapshot);
    
    if (!options.autoSave) {
      // Only persist user-created snapshots immediately
      this.saveToStorage();
    }
    
    this.currentSnapshot = snapshot;
    
    console.log(`Created workspace snapshot: ${name} (${snapshot.id})`);
    return snapshot;
  }

  /**
   * Restore workspace from snapshot
   */
  async restoreSnapshot(
    snapshotId: string,
    columnManager: any,
    scrollController: any
  ): Promise<boolean> {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) {
      console.error(`Snapshot not found: ${snapshotId}`);
      return false;
    }

    try {
      // Clear existing columns (except home)
      const currentColumns = columnManager.getColumns();
      for (let i = currentColumns.length - 1; i > 0; i--) {
        columnManager.removeColumn(i);
      }

      // Restore columns in order
      const sortedColumns = snapshot.columns.sort((a, b) => a.position - b.position);
      
      for (const columnData of sortedColumns) {
        // Skip home column as it should already exist
        if (columnData.id === 'task-selection') continue;
        
        const component = await this.loadComponent(columnData.type);
        if (component) {
          const column: Column = {
            id: columnData.id,
            component,
            width: columnData.width,
            x: 0,
            y: 0,
            height: 0,
            focused: columnData.focused,
            title: this.getTitleForType(columnData.type),
            type: columnData.type,
            props: columnData.props
          };

          columnManager.insertColumn(column);
        }
      }

      // Layout and restore viewport
      columnManager.layout({ animate: true });
      
      setTimeout(() => {
        // Restore scroll position and focus
        scrollController.setScrollPosition(snapshot.viewport.scrollPosition);
        columnManager.focusColumn(snapshot.viewport.activeColumnIndex);
      }, 300);

      this.currentSnapshot = snapshot;
      console.log(`Restored workspace snapshot: ${snapshot.name}`);
      return true;
      
    } catch (error) {
      console.error('Failed to restore snapshot:', error);
      return false;
    }
  }

  /**
   * Get all saved snapshots
   */
  getSnapshots(): WorkspaceSnapshot[] {
    return Array.from(this.snapshots.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Delete a snapshot
   */
  deleteSnapshot(snapshotId: string): boolean {
    const deleted = this.snapshots.delete(snapshotId);
    if (deleted) {
      this.saveToStorage();
      console.log(`Deleted snapshot: ${snapshotId}`);
    }
    return deleted;
  }

  /**
   * Share a workspace snapshot
   */
  shareSnapshot(
    snapshotId: string,
    permissions: { canEdit: boolean; canComment: boolean; expiresAt?: Date },
    sharedBy: { name: string; role: string }
  ): SharedWorkspace | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return null;

    const shareToken = this.generateShareToken();
    const sharedWorkspace: SharedWorkspace = {
      id: `shared_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      snapshotId,
      shareToken,
      permissions,
      sharedBy,
      createdAt: new Date()
    };

    this.sharedWorkspaces.set(sharedWorkspace.id, sharedWorkspace);
    this.saveToStorage();

    console.log(`Shared workspace: ${snapshot.name} (${shareToken})`);
    return sharedWorkspace;
  }

  /**
   * Access shared workspace by token
   */
  getSharedWorkspace(shareToken: string): { workspace: SharedWorkspace; snapshot: WorkspaceSnapshot } | null {
    const shared = Array.from(this.sharedWorkspaces.values())
      .find(sw => sw.shareToken === shareToken);
    
    if (!shared) return null;

    // Check if expired
    if (shared.permissions.expiresAt && shared.permissions.expiresAt < new Date()) {
      console.warn(`Shared workspace expired: ${shareToken}`);
      return null;
    }

    const snapshot = this.snapshots.get(shared.snapshotId);
    if (!snapshot) return null;

    return { workspace: shared, snapshot };
  }

  /**
   * Export workspace as JSON
   */
  exportWorkspace(snapshotId: string): string | null {
    const snapshot = this.snapshots.get(snapshotId);
    if (!snapshot) return null;

    return JSON.stringify(snapshot, null, 2);
  }

  /**
   * Import workspace from JSON
   */
  async importWorkspace(jsonData: string): Promise<WorkspaceSnapshot | null> {
    try {
      const snapshot = JSON.parse(jsonData) as WorkspaceSnapshot;
      
      // Validate snapshot structure
      if (!snapshot.id || !snapshot.name || !snapshot.context || !Array.isArray(snapshot.columns)) {
        throw new Error('Invalid workspace format');
      }

      // Generate new ID to avoid conflicts
      snapshot.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      snapshot.timestamp = new Date();
      
      this.snapshots.set(snapshot.id, snapshot);
      this.saveToStorage();
      
      console.log(`Imported workspace: ${snapshot.name}`);
      return snapshot;
      
    } catch (error) {
      console.error('Failed to import workspace:', error);
      return null;
    }
  }

  /**
   * Get current workspace state for auto-save
   */
  getCurrentSnapshot(): WorkspaceSnapshot | null {
    return this.currentSnapshot;
  }

  /**
   * Setup automatic workspace saving
   */
  private setupAutoSave(): void {
    // Auto-save every 30 seconds if there are changes
    this.autoSaveInterval = setInterval(() => {
      if (this.currentSnapshot) {
        // Create auto-save snapshot (limit to 5 most recent)
        const autoSaves = Array.from(this.snapshots.values())
          .filter(s => s.name.startsWith('Auto-save'))
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        // Remove old auto-saves (keep only 5)
        autoSaves.slice(5).forEach(snapshot => {
          this.snapshots.delete(snapshot.id);
        });
      }
    }, 30000);
  }

  /**
   * Save state to localStorage
   */
  private saveToStorage(): void {
    try {
      const data = {
        snapshots: Array.from(this.snapshots.entries()),
        sharedWorkspaces: Array.from(this.sharedWorkspaces.entries()),
        lastSaved: new Date().toISOString()
      };
      
      // Check if we're in the browser
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('workspace-state-manager', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  /**
   * Load state from localStorage
   */
  private loadFromStorage(): void {
    try {
      // Check if we're in the browser
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return;
      }
      
      const data = localStorage.getItem('workspace-state-manager');
      if (!data) return;

      const parsed = JSON.parse(data);
      
      if (parsed.snapshots) {
        this.snapshots = new Map(parsed.snapshots.map(([id, snapshot]: [string, any]) => [
          id,
          {
            ...snapshot,
            timestamp: new Date(snapshot.timestamp)
          }
        ]));
      }
      
      if (parsed.sharedWorkspaces) {
        this.sharedWorkspaces = new Map(parsed.sharedWorkspaces.map(([id, workspace]: [string, any]) => [
          id,
          {
            ...workspace,
            createdAt: new Date(workspace.createdAt),
            permissions: {
              ...workspace.permissions,
              expiresAt: workspace.permissions.expiresAt ? new Date(workspace.permissions.expiresAt) : undefined
            }
          }
        ]));
      }
      
      console.log(`Loaded ${this.snapshots.size} snapshots and ${this.sharedWorkspaces.size} shared workspaces from storage`);
      
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  /**
   * Generate share token
   */
  private generateShareToken(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 12)}`;
  }

  /**
   * Load component dynamically (placeholder implementation)
   */
  private async loadComponent(componentType: string): Promise<React.ComponentType<any> | null> {
    const React = await import('react');
    
    // This would normally load the actual components
    const PlaceholderComponent = () => 
      React.createElement('div', { className: 'h-full p-6 bg-gray-950 text-gray-200' },
        React.createElement('h2', { className: 'text-xl font-bold mb-4' }, componentType),
        React.createElement('p', { className: 'text-gray-400' }, 'Restored from workspace snapshot')
      );
    
    return PlaceholderComponent;
  }

  /**
   * Get title for component type
   */
  private getTitleForType(type: string): string {
    const titles: Record<string, string> = {
      'PipelineOperations': 'Pipeline Operations',
      'QualityMonitor': 'Quality Monitor',
      'DataPreview': 'Data Preview',
      'ErrorAnalysis': 'Error Analysis',
      'PerformanceOptimizer': 'Performance Optimizer'
    };
    
    return titles[type] || type;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }
}
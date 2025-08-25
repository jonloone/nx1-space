'use client';

import React, { useState } from 'react';
import { SimplifiedNavigation } from '@/components/workspace/SimplifiedNavigation';
import { EnhancedWorkspaceContainer } from '@/components/workspace/EnhancedWorkspaceContainer';
import { cn } from '@/lib/utils/cn';

export function AppLayout() {
  const [sideNavCollapsed, setSideNavCollapsed] = useState(true);

  return (
    <div className="flex h-screen w-screen workspace-background">
      {/* Navigation Sidebar - Outside Dockview */}
      <aside className={cn(
        "flex-shrink-0 transition-all duration-300 border-r border-gray-800 bg-gray-950/50 backdrop-blur-sm",
        sideNavCollapsed ? "w-16" : "w-64"
      )}>
        <SimplifiedNavigation 
          collapsed={sideNavCollapsed}
          onToggleCollapse={() => setSideNavCollapsed(!sideNavCollapsed)}
        />
      </aside>
      
      {/* Workspace Container - Managed by Dockview */}
      <main className="flex-1 relative overflow-hidden">
        <EnhancedWorkspaceContainer />
      </main>
    </div>
  );
}
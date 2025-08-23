'use client';

import '@/styles/workspace.css';
import '@/styles/typography.css';

import React, { useState } from 'react';
import { SimplifiedNavigation } from '@/components/workspace/SimplifiedNavigation';
import { TaskContent } from '@/components/workspace/TaskContent';
import AIConsole from '@/components/workspace/AIConsole';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils';

export default function DataEngineeringWorkspace() {
  const [sideNavCollapsed, setSideNavCollapsed] = useState(false);
  const { currentTask, currentCategory } = useWorkspaceStore();

  return (
    <div className="flex h-screen workspace-background">
      {/* Side Navigation */}
      <aside className={cn(
        "transition-all duration-300 border-r border-gray-800",
        sideNavCollapsed ? "w-16" : "w-64"
      )}>
        <SimplifiedNavigation 
          collapsed={sideNavCollapsed}
          onToggleCollapse={() => setSideNavCollapsed(!sideNavCollapsed)}
        />
      </aside>
      
      {/* Main Content Area with Console */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-auto">
          <TaskContent />
        </div>
        {/* AI Console - Full width of main content */}
        <AIConsole />
      </main>
    </div>
  );
}
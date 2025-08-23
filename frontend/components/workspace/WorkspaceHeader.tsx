'use client';

import React from 'react';
import { NexusOneLogo } from '@/components/workstation/NexusOneLogo';
import { useWorkspaceStore, getTaskById } from '@/stores/workspaceStore';

export function WorkspaceHeader() {
  const { currentTask } = useWorkspaceStore();
  const task = currentTask ? getTaskById(currentTask) : null;

  return (
    <header className="h-14 border-b border-gray-800 bg-gray-950/50 backdrop-blur-sm flex items-center justify-between px-6">
      <div className="flex items-center gap-6">
        <NexusOneLogo width={160} />
        
        {/* Breadcrumb */}
        {task && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Workspace</span>
            <i className="fas fa-chevron-right text-xs" />
            <span className="capitalize">{task.category}</span>
            <i className="fas fa-chevron-right text-xs" />
            <span className="text-gray-300">{task.name}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Quick Actions */}
        <button className="text-gray-500 hover:text-gray-300 transition-colors" title="Keyboard Shortcuts">
          <i className="fas fa-keyboard" />
        </button>
        <button className="text-gray-500 hover:text-gray-300 transition-colors" title="Settings">
          <i className="fas fa-cog" />
        </button>
        <button className="text-gray-500 hover:text-gray-300 transition-colors" title="Help">
          <i className="fas fa-question-circle" />
        </button>
        
        {/* User Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <span className="text-xs font-bold text-white">DE</span>
        </div>
      </div>
    </header>
  );
}
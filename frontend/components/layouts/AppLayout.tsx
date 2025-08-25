'use client';

import React from 'react';
import { TabWorkspace } from '@/components/workspace/TabWorkspace';
import { GlobalAIConsole } from '@/components/ai/GlobalAIConsole';

export function AppLayout() {
  return (
    <div className="h-screen w-screen workspace-background relative">
      {/* Main Tab Workspace */}
      <div className="h-full w-full">
        <TabWorkspace />
      </div>
      
      {/* Global AI Console - Outside of Dockview */}
      <GlobalAIConsole />
    </div>
  );
}
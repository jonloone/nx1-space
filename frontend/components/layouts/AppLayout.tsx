'use client';

import React from 'react';
import { SimplePaperWM } from '@/components/workspace/SimplePaperWM';

export function AppLayout() {
  return (
    <div className="h-screen w-screen workspace-background relative">
      {/* PaperWM Scrolling Workspace - now includes AI Terminal Panel */}
      <div className="h-full w-full">
        <SimplePaperWM />
      </div>
    </div>
  );
}
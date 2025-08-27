'use client';

import React from 'react';
import { AttentionColumn } from '@/components/columns/AttentionColumn';
import { BuildColumn } from '@/components/columns/BuildColumn';
import { MonitorColumn } from '@/components/columns/MonitorColumn';

export function SimplePaperWM() {
  return (
    <div className="fixed inset-0 bg-gray-950 overflow-x-auto overflow-y-hidden">
      <div className="flex h-full gap-4 p-4">
        {/* Attention Column */}
        <div className="flex-shrink-0 w-[80vw] max-w-[1200px] h-full overflow-y-auto bg-gray-900 rounded-lg">
          <AttentionColumn />
        </div>
        
        {/* Build Column */}
        <div className="flex-shrink-0 w-[80vw] max-w-[1200px] h-full overflow-y-auto bg-gray-900 rounded-lg">
          <BuildColumn />
        </div>
        
        {/* Monitor Column */}
        <div className="flex-shrink-0 w-[80vw] max-w-[1200px] h-full overflow-y-auto bg-gray-900 rounded-lg">
          <MonitorColumn />
        </div>
      </div>
    </div>
  );
}
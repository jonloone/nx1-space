import React from 'react';
import { IDockviewPanelProps } from 'dockview';
import { HomeDashboard } from '../HomeDashboard';

export function SimpleHomePanel(props: IDockviewPanelProps) {
  return (
    <div className="h-full w-full overflow-auto bg-gray-950">
      <HomeDashboard />
    </div>
  );
}
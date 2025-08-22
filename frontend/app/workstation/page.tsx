'use client';
import '@/styles/workstation.css';
import '@/styles/typography.css';

import React from 'react';
import { TaskSelector } from '@/components/workstation/TaskSelector';
import { TaskWorkspace } from '@/components/workstation/TaskWorkspace';
import { RoleSelector } from '@/components/workstation/RoleSelector';
import { AgentStatusBar } from '@/components/workstation/AgentStatusBar';
import { ValidationChecklist } from '@/components/testing/ValidationChecklist';
import { MetricsDashboard } from '@/components/testing/MetricsDashboard';
import { useWorkstationStore } from '@/stores/workstationStore';
import { usePerformanceMetrics } from '@/hooks/usePerformanceMetrics';
import { NexusOneLogo } from '@/components/workstation/NexusOneLogo';

export type TaskType = 
  | 'idle'
  | 'build_pipeline'
  | 'optimize_query'
  | 'explore_lineage'
  | 'test_data'
  | 'add_connection'
  | 'create_dashboard'
  | 'query_to_product';

export type UserRole = 
  | 'data_engineer'
  | 'analytics_engineer'
  | 'data_analyst'
  | 'domain_expert'
  | 'executive';

export default function DataEngineeringWorkstation() {
  const { currentTask, setCurrentTask, userRole, setUserRole, testMode } = useWorkstationStore();
  
  // Track performance metrics
  usePerformanceMetrics();
  
  return (
    <div className="flex flex-col h-screen workstation-background">
      {/* Minimal Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-800 glass-panel-dark">
        <div className="flex items-center gap-4">
          <NexusOneLogo width={200} />
          {currentTask !== 'idle' && (
            <button
              onClick={() => setCurrentTask('idle')}
              className="px-3 py-1 text-sm bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-2 font-sans-ui"
            >
              <i className="fas fa-arrow-left text-xs" />
              Back to Tasks
            </button>
          )}
        </div>
        <RoleSelector value={userRole} onChange={setUserRole} />
      </header>
      
      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        {currentTask === 'idle' ? (
          <TaskSelector onSelectTask={setCurrentTask} role={userRole} />
        ) : (
          <TaskWorkspace task={currentTask} role={userRole} />
        )}
      </main>
      
      {/* Agent Status Bar */}
      <AgentStatusBar userRole={userRole} />
      
      {/* Testing Tools (only in test mode) */}
      {/* {testMode && (
        <>
          <ValidationChecklist />
          <MetricsDashboard />
        </>
      )} */}
    </div>
  );
}
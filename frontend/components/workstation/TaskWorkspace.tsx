'use client';

import React, { useState } from 'react';
import { PipelineBuilder } from './tasks/PipelineBuilder';
import { QueryOptimizer } from './tasks/QueryOptimizer';
import { ConnectionWizard } from './tasks/ConnectionWizard';
import { DataQualityTester } from './tasks/DataQualityTester';
import { QueryToProductWizard } from './QueryToProductWizard';
import { DataQualityAssessment } from './DataQualityAssessment';
import type { TaskType, UserRole } from '@/app/workstation/page';

interface Props {
  task: TaskType;
  role: UserRole;
}

export function TaskWorkspace({ task, role }: Props) {
  const [showWizard, setShowWizard] = useState(true);
  
  // Render appropriate task component based on selected task
  switch (task) {
    case 'build_pipeline':
      return <PipelineBuilder role={role} />;
    
    case 'optimize_query':
      return <QueryOptimizer role={role} />;
    
    case 'add_connection':
      return <ConnectionWizard role={role} />;
    
    case 'test_data':
      return <DataQualityTester role={role} />;
    
    case 'query_to_product':
      return <QueryToProductWizard />;
    
    case 'explore_lineage':
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <i className="fas fa-project-diagram text-4xl text-gray-700 mb-4" />
            <h2 className="text-xl font-medium text-gray-300">Data Lineage Explorer</h2>
            <p className="text-gray-500 mt-2">Coming soon...</p>
          </div>
        </div>
      );
    
    case 'create_dashboard':
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <i className="fas fa-chart-bar text-4xl text-gray-700 mb-4" />
            <h2 className="text-xl font-medium text-gray-300">Dashboard Builder</h2>
            <p className="text-gray-500 mt-2">Coming soon...</p>
          </div>
        </div>
      );
    
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-gray-700 mb-4" />
            <h2 className="text-xl font-medium text-gray-300">Unknown Task</h2>
            <p className="text-gray-500 mt-2">Task type not recognized</p>
          </div>
        </div>
      );
  }
}
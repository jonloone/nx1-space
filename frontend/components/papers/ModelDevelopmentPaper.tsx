'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mockDataStore } from '@/lib/services/mock/MockDataStore';

interface ModelDevelopmentPaperProps {
  paperId: string;
  state: any;
  workflowState: any;
  adjacentPapers: any;
  onSpawnPaper: (config: any) => void;
  onUpdateState: (updates: any) => void;
  onUpdateWorkflowState?: (state: any) => void;
  onNavigate: (paperId: string) => void;
}

export function ModelDevelopmentPaper({ 
  state, 
  workflowState,
  onSpawnPaper, 
  onUpdateState,
  onUpdateWorkflowState 
}: ModelDevelopmentPaperProps) {
  const [activeTab, setActiveTab] = useState<'definition' | 'preview' | 'lineage'>('definition');
  const [sqlModel, setSqlModel] = useState('');
  const [testResults, setTestResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  
  // Get the pipeline model from mock store
  const pipeline = mockDataStore.getPipeline('customer_etl_pipeline_v3');
  const model = pipeline?.model;
  
  useEffect(() => {
    if (model) {
      setSqlModel(model.sql);
    }
  }, [model]);
  
  // Simulate SQLMesh validation
  const validateModel = async () => {
    setIsValidating(true);
    
    setTimeout(() => {
      setTestResults({
        status: 'success',
        tests: [
          { name: 'Column count validation', status: 'passed', duration: 234 },
          { name: 'Data type consistency', status: 'passed', duration: 156 },
          { name: 'Null check validation', status: 'passed', duration: 89 },
          { name: 'Referential integrity', status: 'passed', duration: 445 },
          { name: 'Business rule validation', status: 'warning', duration: 678, 
            message: 'Email field length increased from 50 to 100' }
        ],
        preview: {
          rowCount: 1000,
          columns: model?.columns || [],
          sampleRows: [
            { customer_id: 'CUST-001', customer_email: 'john.doe@example.com', first_name: 'John', last_name: 'Doe' },
            { customer_id: 'CUST-002', customer_email: 'jane.smith@example.com', first_name: 'Jane', last_name: 'Smith' },
            { customer_id: 'CUST-003', customer_email: 'robert.johnson@example.com', first_name: 'Robert', last_name: 'Johnson' }
          ]
        },
        metrics: {
          estimatedCost: '$2.34',
          estimatedRuntime: '3m 24s',
          affectedRows: 45000,
          incrementalWindow: '6 hours'
        }
      });
      
      setIsValidating(false);
      
      if (onUpdateWorkflowState) {
        onUpdateWorkflowState({
          ...workflowState,
          modelValidated: true,
          modelDefinition: sqlModel
        });
      }
    }, 2000);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header with Model Info */}
      <div className="px-6 py-4 bg-gray-900/50 border-b border-gray-800">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium text-white mb-1">
              SQLMesh Model Development
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>Model: {model?.name || 'customer_master'}</span>
              <span className="text-blue-400">Type: {model?.kind || 'INCREMENTAL'}</span>
              <span>Schedule: {model?.schedule || '0 */6 * * *'}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={validateModel}
              disabled={isValidating}
              className={cn(
                "px-3 py-1 rounded text-sm font-medium transition-colors",
                "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400",
                isValidating && "opacity-50 cursor-not-allowed"
              )}
            >
              {isValidating ? 'Validating...' : 'Validate Model'}
            </button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex gap-4 mt-4">
          {['definition', 'preview', 'lineage'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={cn(
                "px-3 py-1 text-sm font-medium capitalize transition-colors",
                activeTab === tab 
                  ? "text-white border-b-2 border-blue-500" 
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'definition' && (
          <div className="h-full flex">
            {/* SQL Editor */}
            <div className="flex-1 p-6">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-medium text-white">Model Definition</h2>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>Partition: {model?.partitionBy || 'DATE(updated_at)'}</span>
                    <span>•</span>
                    <span>Cluster: {model?.clusterBy?.join(', ') || 'state, city'}</span>
                  </div>
                </div>
                <div className="flex-1 bg-gray-950 rounded-lg p-4 font-mono text-sm">
                  <textarea
                    value={sqlModel}
                    onChange={(e) => setSqlModel(e.target.value)}
                    className="w-full h-full bg-transparent text-gray-300 resize-none focus:outline-none"
                    spellCheck={false}
                    placeholder="Enter SQLMesh model definition..."
                  />
                </div>
                
                {/* Quick Actions */}
                <div className="mt-4 flex gap-3">
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
                    Add Transformation
                  </button>
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
                    Add Join
                  </button>
                  <button className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm">
                    Add Filter
                  </button>
                </div>
              </div>
            </div>
            
            {/* Schema Panel */}
            <div className="w-80 bg-gray-900/50 border-l border-gray-800 p-6">
              <h2 className="text-sm font-medium text-white mb-4">Output Schema</h2>
              <div className="space-y-2">
                {model?.columns.map((col, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-gray-900 rounded">
                    <div>
                      <div className="text-sm text-white">{col.name}</div>
                      <div className="text-xs text-gray-500">{col.type}</div>
                    </div>
                    <div className="text-xs text-gray-400">
                      {col.nullable ? 'NULL' : 'NOT NULL'}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Dependencies */}
              <h2 className="text-sm font-medium text-white mt-6 mb-3">Dependencies</h2>
              <div className="space-y-1">
                {model?.dependencies.map((dep, index) => (
                  <div key={index} className="text-sm text-gray-400 hover:text-gray-300 cursor-pointer">
                    • {dep}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'preview' && (
          <div className="p-6">
            {testResults?.preview ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-white">Data Preview</h2>
                  <div className="text-sm text-gray-400">
                    Showing {testResults.preview.sampleRows.length} of {testResults.preview.rowCount.toLocaleString()} rows
                  </div>
                </div>
                
                {/* Preview Table */}
                <div className="bg-gray-900 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800">
                      <tr>
                        {testResults.preview.columns.slice(0, 4).map((col: any) => (
                          <th key={col.name} className="px-4 py-2 text-left text-gray-300">
                            {col.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {testResults.preview.sampleRows.map((row: any, i: number) => (
                        <tr key={i} className="border-t border-gray-800">
                          <td className="px-4 py-2 text-gray-400">{row.customer_id}</td>
                          <td className="px-4 py-2 text-gray-400">{row.customer_email}</td>
                          <td className="px-4 py-2 text-gray-400">{row.first_name}</td>
                          <td className="px-4 py-2 text-gray-400">{row.last_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Metrics */}
                <div className="mt-6 grid grid-cols-4 gap-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Estimated Cost</div>
                    <div className="text-lg font-medium text-white">{testResults.metrics.estimatedCost}</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Runtime</div>
                    <div className="text-lg font-medium text-white">{testResults.metrics.estimatedRuntime}</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Affected Rows</div>
                    <div className="text-lg font-medium text-white">{testResults.metrics.affectedRows.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4">
                    <div className="text-xs text-gray-500 mb-1">Incremental Window</div>
                    <div className="text-lg font-medium text-white">{testResults.metrics.incrementalWindow}</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-gray-500 mb-2">No preview available</div>
                  <button
                    onClick={validateModel}
                    className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded text-sm"
                  >
                    Validate Model to Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'lineage' && (
          <div className="p-6">
            <div className="text-center text-gray-500">
              Lineage visualization coming soon...
            </div>
          </div>
        )}
      </div>
      
      {/* Validation Results Footer */}
      {testResults && (
        <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-white">Validation Results:</span>
              {testResults.tests.map((test: any, index: number) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    test.status === 'passed' ? 'bg-green-500' : 
                    test.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                  )} />
                  <span className="text-xs text-gray-400">{test.name}</span>
                </div>
              ))}
            </div>
            
            <div className="flex gap-3">
              <motion.button
                onClick={() => {
                  onSpawnPaper({
                    type: 'deployment',
                    title: 'Deploy to Production',
                    componentKey: 'deployment-pipeline',
                    parentId: state.paperId,
                    initialState: { 
                      model: sqlModel,
                      validation: testResults 
                    },
                    workflowId: workflowState?.workflowId
                  });
                }}
                className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Deploy Model
              </motion.button>
              
              <motion.button
                onClick={() => {
                  onSpawnPaper({
                    type: 'investigation',
                    title: 'Quality Setup',
                    componentKey: 'quality-setup',
                    parentId: state.paperId,
                    initialState: { model: sqlModel },
                    workflowId: workflowState?.workflowId
                  });
                }}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Add Quality Checks
              </motion.button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
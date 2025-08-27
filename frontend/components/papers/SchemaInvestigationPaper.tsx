'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mockDataHubService } from '@/lib/services/mock/MockDataHubService';
import { mockRangerService } from '@/lib/services/mock/MockRangerService';

interface SchemaInvestigationPaperProps {
  paperId: string;
  state: any;
  workflowState: any;
  adjacentPapers: any;
  onSpawnPaper: (config: any) => void;
  onUpdateState: (updates: any) => void;
  onUpdateWorkflowState?: (state: any) => void;
  onNavigate: (paperId: string) => void;
}

export function SchemaInvestigationPaper({ 
  state, 
  workflowState,
  onSpawnPaper, 
  onUpdateState,
  onUpdateWorkflowState 
}: SchemaInvestigationPaperProps) {
  const [activeView, setActiveView] = useState<'changes' | 'lineage' | 'permissions'>('changes');
  const [schemaChanges, setSchemaChanges] = useState<any[]>([]);
  const [lineageData, setLineageData] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [impactAnalysis, setImpactAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Load data from mock services
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Get schema changes from DataHub
        const changes = await mockDataHubService.getSchemaChanges(
          'urn:li:dataset:(urn:li:dataPlatform:custom,customer.master_table,PROD)',
          30
        );
        setSchemaChanges(changes);
        
        // Get lineage information
        const lineage = await mockDataHubService.getLineage(
          'urn:li:dataset:(urn:li:dataPlatform:custom,customer.master_table,PROD)',
          2
        );
        setLineageData(lineage);
        
        // Get permissions from Ranger
        const policies = await mockRangerService.getPolicies({
          resource: 'customer.master_table'
        });
        setPermissions(policies);
        
        // Get impact analysis
        if (changes.length > 0) {
          const impact = await mockDataHubService.getImpactAnalysis(
            'urn:li:dataset:(urn:li:dataPlatform:custom,customer.master_table,PROD)',
            changes[0]
          );
          setImpactAnalysis(impact);
        }
        
      } catch (error) {
        console.error('Error loading investigation data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Auto-fix schema function
  const autoFixSchema = async () => {
    // Simulate fixing the schema
    const fixedSchema = {
      customer_email: 'VARCHAR(100)', // Updated from 50 to 100
      updatedAt: new Date().toISOString(),
      approvedBy: 'data-engineer'
    };
    
    if (onUpdateWorkflowState) {
      onUpdateWorkflowState({
        ...workflowState,
        schemaFixed: true,
        fixApplied: fixedSchema
      });
    }
    
    // Spawn model development paper
    onSpawnPaper({
      type: 'development',
      title: 'Update SQLMesh Model',
      componentKey: 'model-development',
      parentId: state.paperId,
      initialState: { 
        schemaFix: fixedSchema,
        errorType: state.errorType 
      },
      workflowId: workflowState?.workflowId
    });
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 bg-orange-500/5 border-b border-orange-500/20">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-lg font-medium text-white mb-1">
              Schema Investigation & Impact Analysis
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span className="text-orange-400">Breaking Change Detected</span>
              <span>Field: customer_email</span>
              <span>VARCHAR(50) → VARCHAR(100)</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded text-sm">
              DataHub Connected
            </div>
            <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded text-sm">
              Ranger Active
            </div>
          </div>
        </div>
        
        {/* View Tabs */}
        <div className="flex gap-4 mt-4">
          {['changes', 'lineage', 'permissions'].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view as any)}
              className={cn(
                "px-3 py-1 text-sm font-medium capitalize transition-colors",
                activeView === view 
                  ? "text-white border-b-2 border-orange-500" 
                  : "text-gray-400 hover:text-gray-300"
              )}
            >
              {view === 'permissions' ? 'Access Control' : view}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="space-y-3 text-center">
              <div className="w-12 h-12 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm text-gray-400">Investigating schema changes...</div>
            </div>
          </div>
        ) : (
          <>
            {activeView === 'changes' && (
              <div className="p-6 space-y-6">
                {/* Schema Changes Timeline */}
                <div>
                  <h2 className="text-sm font-medium text-white mb-4">Recent Schema Changes</h2>
                  <div className="space-y-3">
                    {schemaChanges.map((change, index) => (
                      <div key={index} className={cn(
                        "flex items-start gap-4 p-4 rounded-lg",
                        change.breakingChange ? "bg-red-500/5 border border-red-500/20" : "bg-gray-900"
                      )}>
                        <div className={cn(
                          "w-2 h-2 rounded-full mt-1.5",
                          change.breakingChange ? "bg-red-500" : "bg-yellow-500"
                        )} />
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white">{change.field}</span>
                            <span className="text-xs text-gray-500">
                              {change.changeType === 'modified' && `${change.oldType} → ${change.newType}`}
                              {change.changeType === 'added' && `Added: ${change.newType}`}
                              {change.changeType === 'removed' && 'Removed'}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            {new Date(change.timestamp).toLocaleString()}
                          </div>
                          {change.breakingChange && (
                            <div className="mt-2 text-xs text-red-400">
                              ⚠️ Breaking change - requires downstream updates
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Impact Analysis */}
                {impactAnalysis && (
                  <div>
                    <h2 className="text-sm font-medium text-white mb-4">Impact Analysis</h2>
                    <div className="bg-gray-900 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Affected Assets</div>
                          <div className="text-lg font-medium text-white">
                            {impactAnalysis.affectedAssets.length}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Estimated Downtime</div>
                          <div className="text-lg font-medium text-yellow-400">
                            {impactAnalysis.estimatedDowntime} min
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-gray-500">Recommendations:</div>
                        {impactAnalysis.recommendations.map((rec: string, i: number) => (
                          <div key={i} className="text-sm text-gray-300 pl-3">
                            • {rec}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {activeView === 'lineage' && lineageData && (
              <div className="p-6">
                <h2 className="text-sm font-medium text-white mb-4">Data Lineage Graph</h2>
                
                {/* Simplified lineage visualization */}
                <div className="bg-gray-900 rounded-lg p-6">
                  <div className="flex items-center justify-center gap-8">
                    {/* Upstream */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 text-center">Upstream</div>
                      {lineageData.nodes.filter((n: any) => n.level < 0).map((node: any) => (
                        <div key={node.id} className="px-3 py-2 bg-gray-800 rounded text-sm text-gray-300">
                          {node.label}
                        </div>
                      ))}
                    </div>
                    
                    {/* Current */}
                    <div className="px-4 py-3 bg-orange-500/10 border border-orange-500/30 rounded">
                      <div className="text-sm font-medium text-orange-400">
                        customer.master_table
                      </div>
                    </div>
                    
                    {/* Downstream */}
                    <div className="space-y-2">
                      <div className="text-xs text-gray-500 text-center">Downstream</div>
                      {lineageData.nodes.filter((n: any) => n.level > 0).map((node: any) => (
                        <div key={node.id} className="px-3 py-2 bg-gray-800 rounded text-sm text-gray-300">
                          {node.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Note: {lineageData.nodes.length} nodes in lineage graph with depth {lineageData.depth}
                </div>
              </div>
            )}
            
            {activeView === 'permissions' && (
              <div className="p-6">
                <h2 className="text-sm font-medium text-white mb-4">Access Control Policies</h2>
                
                <div className="space-y-3">
                  {permissions.map((policy: any) => (
                    <div key={policy.id} className="bg-gray-900 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-white">{policy.name}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            Service: {policy.service} | Created: {new Date(policy.createdTime).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={cn(
                          "px-2 py-1 rounded text-xs",
                          policy.isEnabled ? "bg-green-500/10 text-green-400" : "bg-gray-700 text-gray-400"
                        )}>
                          {policy.isEnabled ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                      
                      <div className="mt-3 space-y-2">
                        {policy.policyItems.slice(0, 2).map((item: any, i: number) => (
                          <div key={i} className="text-xs text-gray-400">
                            <span className="text-gray-300">
                              {item.users.join(', ') || item.groups.join(', ')}
                            </span>
                            {' → '}
                            <span className="text-blue-400">
                              {item.accesses.map((a: any) => a.type).join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-lg">
                  <div className="text-xs text-yellow-400">
                    ⚠️ Schema changes may require policy updates for new fields
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Action Footer */}
      <div className="px-6 py-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">Next Steps:</span>
            <span className="text-white">
              {impactAnalysis?.breakingChanges 
                ? 'Breaking changes require immediate attention'
                : 'Review and approve schema updates'}
            </span>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              onClick={autoFixSchema}
              className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Auto-Fix Schema
            </motion.button>
            
            <motion.button
              onClick={() => {
                onSpawnPaper({
                  type: 'development',
                  title: 'Manual Schema Update',
                  componentKey: 'fix-planning',
                  parentId: state.paperId,
                  initialState: { 
                    changes: schemaChanges,
                    impact: impactAnalysis 
                  },
                  workflowId: workflowState?.workflowId
                });
              }}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded text-sm font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Manual Investigation
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
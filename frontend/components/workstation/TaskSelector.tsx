'use client';

import React, { useState } from 'react';
import { TaskCard } from './TaskCard';
import { RecentWorkSection } from './RecentWorkSection';
import { processNaturalLanguage } from '@/lib/mock/agentResponses';
import { 
  getTasksForRole, 
  getTasksByLifecycle, 
  getLifecycleStageInfo,
  type DataLifecycleStage 
} from '@/stores/workstationStore';
import type { TaskType, UserRole } from '@/app/workstation/page';
import { cn } from '@/lib/utils';

interface Props {
  onSelectTask: (task: TaskType) => void;
  role: UserRole;
}

export function TaskSelector({ onSelectTask, role }: Props) {
  const [naturalInput, setNaturalInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [suggestion, setSuggestion] = useState<any>(null);
  
  const tasks = getTasksForRole(role);
  const tasksByLifecycle = getTasksByLifecycle(tasks);
  
  const handleNaturalLanguageRequest = async (input: string) => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    try {
      const result = await processNaturalLanguage(input, role);
      setSuggestion(result);
      
      if (result.confidence > 0.7 && result.suggestedTask) {
        // Auto-select task if high confidence
        setTimeout(() => {
          onSelectTask(result.suggestedTask as TaskType);
        }, 1000);
      }
    } catch (error) {
      console.error('Error processing request:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const exampleQueries = {
    data_engineer: [
      "Merge customer data from Salesforce and warehouse",
      "My query is running slow and needs optimization",
      "Set up real-time streaming from Kafka"
    ],
    analytics_engineer: [
      "Create a new dbt model for revenue",
      "Test data quality for customer table",
      "Build incremental pipeline for events"
    ],
    data_analyst: [
      "Create dashboard for monthly sales",
      "Explore customer journey data",
      "Find data quality issues in orders"
    ],
    domain_expert: [
      "I need all customer information",
      "Show me sales performance metrics",
      "Help me understand our data"
    ],
    executive: [
      "Create KPI dashboard",
      "Show business metrics overview",
      "Revenue performance analysis"
    ]
  };
  
  const lifecycleStages: DataLifecycleStage[] = ['ingest', 'process', 'analyze', 'monitor'];
  
  return (
    <div className="flex flex-col h-full">
      {/* Main Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-8 pb-4">
          <div className="max-w-7xl mx-auto">
            {/* Natural Language Input */}
            <div className="mb-8">
              <div className="relative">
                <input
                  type="text"
                  value={naturalInput}
                  onChange={(e) => setNaturalInput(e.target.value)}
                  placeholder="What would you like to do today?"
                  className="w-full px-6 py-5 text-xl glass-panel border border-gray-800 rounded-xl focus:border-accent-blue-50 focus:outline-none transition-colors pr-24 font-serif italic natural-language-input placeholder:text-gray-600"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleNaturalLanguageRequest(naturalInput);
                    }
                  }}
                  disabled={isProcessing}
                />
                <button
                  onClick={() => handleNaturalLanguageRequest(naturalInput)}
                  disabled={isProcessing || !naturalInput.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-5 py-2.5 glass-button disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin" />
                      <span className="font-sans-ui font-medium">Processing</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic" />
                      <span className="font-sans-ui font-medium">Ask AI</span>
                    </>
                  )}
                </button>
              </div>
              
              {/* Example Queries */}
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500 font-sans-ui">Try:</span>
                {exampleQueries[role]?.slice(0, 2).map((example, idx) => (
                  <button
                    key={idx}
                    onClick={() => setNaturalInput(example)}
                    className="text-xs accent-blue hover:opacity-80 transition-opacity font-sans-ui"
                  >
                    "{example}"
                  </button>
                ))}
              </div>
              
              {/* Suggestion Display */}
              {suggestion && suggestion.confidence > 0.3 && (
                <div className="mt-4 p-4 glass-panel rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400 font-sans-ui">Understanding your request...</span>
                    <span className="text-xs text-gray-500 font-sans-ui">
                      Confidence: {Math.round(suggestion.confidence * 100)}%
                    </span>
                  </div>
                  {suggestion.suggestedTask && (
                    <div className="text-sm accent-blue font-sans-ui">
                      Suggested task: {suggestion.suggestedTask.replace('_', ' ')}
                    </div>
                  )}
                  {Object.keys(suggestion.entities).length > 0 && (
                    <div className="mt-2 text-xs text-gray-500 font-sans-ui">
                      Detected: {Object.entries(suggestion.entities).map(([k, v]) => `${k}: ${v}`).join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Tasks Organized by Lifecycle */}
            <div className="space-y-8">
              {lifecycleStages.map(stage => {
                const stageTasks = tasksByLifecycle[stage];
                if (stageTasks.length === 0) return null;
                
                const stageInfo = getLifecycleStageInfo(stage);
                
                return (
                  <div key={stage} className="space-y-4">
                    {/* Stage Header */}
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center",
                        stageInfo.bgColor
                      )}>
                        <i className={cn(stageInfo.icon, stageInfo.color, "text-lg")} />
                      </div>
                      <div className="flex-1">
                        <h2 className={cn(
                          "text-2xl font-serif-display",
                          stageInfo.color
                        )}>
                          {stageInfo.name}
                        </h2>
                        <p className="text-sm text-gray-500 font-sans-ui mt-0.5">
                          {stageInfo.description}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stage Tasks Box */}
                    <div className={cn(
                      "p-6 rounded-2xl border transition-all",
                      "bg-gradient-to-br from-gray-900/30 to-gray-900/10",
                      "border-gray-800/50 hover:border-gray-700/50"
                    )}>
                      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {stageTasks.map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => onSelectTask(task.id as TaskType)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Recent Work - Now at the bottom */}
            <div className="mt-12 pt-8 border-t border-gray-800">
              <RecentWorkSection onSelectTask={onSelectTask} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
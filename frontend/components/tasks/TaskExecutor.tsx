'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore, TASKS } from '@/stores/taskStore';
import { cn } from '@/lib/utils';

export function TaskExecutor() {
  const { activeTask, updateTaskContext, completeTask, cancelTask, addToHistory } = useTaskStore();
  const [contextInputs, setContextInputs] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  
  const task = TASKS.find(t => t.id === activeTask?.taskId);
  
  useEffect(() => {
    if (activeTask?.currentStep === 'gathering-context') {
      // Initialize context inputs
      const inputs: Record<string, any> = {};
      task?.requiredContext?.forEach(ctx => {
        inputs[ctx] = '';
      });
      setContextInputs(inputs);
    }
  }, [activeTask, task]);
  
  const handleContextSubmit = () => {
    if (!activeTask) return;
    
    updateTaskContext({
      context: contextInputs,
      currentStep: 'executing'
    });
    
    addToHistory({
      action: 'context-gathered',
      details: `Context provided for ${task?.title}`
    });
    
    executeTask();
  };
  
  const executeTask = async () => {
    setIsExecuting(true);
    setExecutionLog(['Starting task execution...']);
    
    // Simulate task execution steps
    const steps = [
      'Validating inputs...',
      'Connecting to data sources...',
      'Processing request...',
      'Generating results...',
      'Finalizing output...'
    ];
    
    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExecutionLog(prev => [...prev, step]);
    }
    
    setIsExecuting(false);
    updateTaskContext({
      currentStep: 'review',
      results: {
        success: true,
        message: 'Task completed successfully',
        data: contextInputs
      }
    });
    
    addToHistory({
      action: 'task-executed',
      details: task?.title,
      result: 'success'
    });
  };
  
  const handleComplete = () => {
    completeTask(activeTask?.results);
  };
  
  const handleCancel = () => {
    cancelTask();
  };
  
  if (!activeTask || !task) return null;
  
  return (
    <div className="h-full bg-[#0A0A0A] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[#222222]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <i className={task.icon} />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[#FAFAFA]">{task.title}</h1>
              <p className="text-xs text-[#71717A]">{activeTask.intent}</p>
            </div>
          </div>
          
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-[#111111] rounded-lg transition-colors"
          >
            <i className="fas fa-times text-[#71717A]" />
          </button>
        </div>
        
        {/* Progress Steps */}
        <div className="mt-4 flex items-center gap-2">
          {['gathering-context', 'executing', 'review'].map((step, idx) => {
            const isActive = activeTask.currentStep === step;
            const isPast = ['gathering-context', 'executing', 'review'].indexOf(activeTask.currentStep!) > idx;
            
            return (
              <React.Fragment key={step}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                    isActive && "bg-purple-500 text-white",
                    isPast && "bg-green-500 text-white",
                    !isActive && !isPast && "bg-[#222222] text-[#71717A]"
                  )}>
                    {isPast ? <i className="fas fa-check text-xs" /> : idx + 1}
                  </div>
                  <span className={cn(
                    "text-xs capitalize",
                    isActive && "text-[#FAFAFA]",
                    !isActive && "text-[#71717A]"
                  )}>
                    {step.replace('-', ' ')}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={cn(
                    "flex-1 h-0.5",
                    isPast ? "bg-green-500" : "bg-[#222222]"
                  )} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Gathering Context */}
        {activeTask.currentStep === 'gathering-context' && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Provide Required Information</h2>
            <div className="space-y-4">
              {task.requiredContext?.map(ctx => (
                <div key={ctx}>
                  <label className="block text-xs text-[#71717A] mb-2 capitalize">
                    {ctx.replace(/[-_]/g, ' ')}
                  </label>
                  <input
                    type="text"
                    value={contextInputs[ctx] || ''}
                    onChange={(e) => setContextInputs({
                      ...contextInputs,
                      [ctx]: e.target.value
                    })}
                    placeholder={`Enter ${ctx.replace(/[-_]/g, ' ')}...`}
                    className="w-full px-4 py-2 bg-[#111111] border border-[#222222] rounded-lg text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              ))}
              
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleContextSubmit}
                  disabled={Object.values(contextInputs).some(v => !v)}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  Continue
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-[#111111] border border-[#222222] text-[#FAFAFA] rounded-lg hover:bg-[#1A1A1A] transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Executing */}
        {activeTask.currentStep === 'executing' && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Executing Task</h2>
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4">
              <div className="space-y-2">
                {executionLog.map((log, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <i className={cn(
                      "fas text-xs",
                      idx === executionLog.length - 1 && isExecuting
                        ? "fa-spinner fa-spin text-purple-400"
                        : "fa-check-circle text-green-400"
                    )} />
                    <span className="text-sm text-[#FAFAFA]">{log}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {!isExecuting && (
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-400" />
                  <span className="text-sm text-green-400">Task executed successfully!</span>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Review */}
        {activeTask.currentStep === 'review' && (
          <div className="max-w-2xl">
            <h2 className="text-sm font-medium text-[#FAFAFA] mb-4">Review Results</h2>
            
            {/* Results Summary */}
            <div className="bg-[#111111] border border-[#222222] rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <i className="fas fa-check-circle text-green-400" />
                <span className="text-sm font-medium text-[#FAFAFA]">Task Completed Successfully</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#71717A]">Task:</span>
                  <span className="text-xs text-[#FAFAFA]">{task.title}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#71717A]">Intent:</span>
                  <span className="text-xs text-[#FAFAFA]">{activeTask.intent}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs text-[#71717A]">Context:</span>
                  <div className="text-xs text-[#FAFAFA]">
                    {Object.entries(activeTask.context).map(([key, value]) => (
                      <div key={key} className="ml-2">
                        {key}: {value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="space-y-3">
              <h3 className="text-xs text-[#71717A] uppercase tracking-wider">Next Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {task.actions.map((action, idx) => (
                  <button
                    key={idx}
                    className="px-4 py-3 bg-[#111111] border border-[#222222] rounded-lg hover:bg-[#1A1A1A] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {action.type === 'ai-assist' && <i className="fas fa-robot text-purple-400 text-sm" />}
                      {action.type === 'navigate' && <i className="fas fa-arrow-right text-blue-400 text-sm" />}
                      {action.type === 'wizard' && <i className="fas fa-magic text-green-400 text-sm" />}
                      {action.type === 'execute' && <i className="fas fa-play text-orange-400 text-sm" />}
                      <span className="text-sm text-[#FAFAFA]">{action.label}</span>
                    </div>
                    <span className="text-xs text-[#71717A]">
                      {action.type === 'ai-assist' && 'Get AI assistance'}
                      {action.type === 'navigate' && 'Navigate to view'}
                      {action.type === 'wizard' && 'Launch wizard'}
                      {action.type === 'execute' && 'Execute action'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
              >
                Complete Task
              </button>
              <button
                onClick={() => executeTask()}
                className="px-4 py-2 bg-[#111111] border border-[#222222] text-[#FAFAFA] rounded-lg hover:bg-[#1A1A1A] transition-colors text-sm"
              >
                Run Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
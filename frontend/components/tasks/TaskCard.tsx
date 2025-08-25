'use client';

import React from 'react';
import { useTaskStore, getCategoryInfo, type Task } from '@/stores/taskStore';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { startTask } = useTaskStore();
  const categoryInfo = getCategoryInfo(task.category);
  
  const handleTaskStart = () => {
    startTask(task);
  };
  
  const handleAction = (action: any, e: React.MouseEvent) => {
    e.stopPropagation();
    // Handle quick actions
    if (action.type === 'ai-assist') {
      startTask(task, `AI assist for ${task.title}`);
    } else if (action.type === 'navigate') {
      // Navigate to target
      console.log('Navigate to:', action.target);
    } else if (action.type === 'wizard') {
      startTask(task, `Launch ${action.target}`);
    } else if (action.type === 'execute') {
      startTask(task, `Execute ${action.target}`);
    }
  };
  
  return (
    <div
      onClick={handleTaskStart}
      className="group bg-[#111111] border border-[#222222] rounded-lg p-4 hover:bg-[#1A1A1A] hover:border-[#333333] transition-all cursor-pointer"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center",
          categoryInfo.color === 'blue' && "bg-blue-500/10 text-blue-400",
          categoryInfo.color === 'green' && "bg-green-500/10 text-green-400",
          categoryInfo.color === 'orange' && "bg-orange-500/10 text-orange-400",
          categoryInfo.color === 'purple' && "bg-purple-500/10 text-purple-400",
          categoryInfo.color === 'cyan' && "bg-cyan-500/10 text-cyan-400",
          categoryInfo.color === 'pink' && "bg-pink-500/10 text-pink-400"
        )}>
          <i className={task.icon} />
        </div>
        
        {/* Category Badge */}
        <span className={cn(
          "px-2 py-0.5 rounded-full text-xs capitalize",
          "bg-[#0A0A0A] border border-[#222222]",
          "text-[#71717A]"
        )}>
          {task.category}
        </span>
      </div>
      
      {/* Content */}
      <h3 className="text-sm font-medium text-[#FAFAFA] mb-1 group-hover:text-purple-400 transition-colors">
        {task.title}
      </h3>
      <p className="text-xs text-[#71717A] mb-3 line-clamp-2">
        {task.description}
      </p>
      
      {/* Metadata */}
      <div className="flex items-center gap-3 mb-3">
        {task.estimatedTime && (
          <div className="flex items-center gap-1">
            <i className="fas fa-clock text-xs text-[#71717A]" />
            <span className="text-xs text-[#71717A]">{task.estimatedTime}</span>
          </div>
        )}
        {task.requiredContext && (
          <div className="flex items-center gap-1">
            <i className="fas fa-info-circle text-xs text-[#71717A]" />
            <span className="text-xs text-[#71717A]">{task.requiredContext.length} inputs</span>
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-1">
        {task.actions.slice(0, 2).map((action, idx) => (
          <button
            key={idx}
            onClick={(e) => handleAction(action, e)}
            className={cn(
              "px-2 py-1 rounded text-xs transition-all",
              "bg-[#0A0A0A] border border-[#222222]",
              "text-[#71717A] hover:text-[#FAFAFA]",
              "hover:bg-purple-500/20 hover:border-purple-500/30",
              "flex items-center gap-1"
            )}
          >
            {action.type === 'ai-assist' && <i className="fas fa-robot text-xs" />}
            {action.type === 'navigate' && <i className="fas fa-arrow-right text-xs" />}
            {action.type === 'wizard' && <i className="fas fa-magic text-xs" />}
            {action.type === 'execute' && <i className="fas fa-play text-xs" />}
            <span>{action.label}</span>
          </button>
        ))}
        {task.actions.length > 2 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleTaskStart();
            }}
            className="px-2 py-1 bg-[#0A0A0A] border border-[#222222] rounded text-xs text-[#71717A] hover:text-[#FAFAFA] hover:bg-[#1A1A1A]"
          >
            +{task.actions.length - 2} more
          </button>
        )}
      </div>
    </div>
  );
}
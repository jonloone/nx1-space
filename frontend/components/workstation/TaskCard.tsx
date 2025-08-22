'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { TaskDefinition } from '@/stores/workstationStore';

interface TaskCardProps {
  task: TaskDefinition;
  onClick: () => void;
  compact?: boolean;
}

export function TaskCard({ task, onClick, compact = false }: TaskCardProps) {
  
  return (
    <button
      onClick={onClick}
      className="group relative p-6 glass-panel hover:border-accent-blue-30 rounded-xl transition-all text-left overflow-hidden h-full"
    >
      {/* Gradient background on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
        task.color
      )} />
      
      <div className="relative flex flex-col gap-4 h-full">
        {/* Icon */}
        <div className={cn(
          "w-16 h-16 rounded-xl flex items-center justify-center transition-all",
          "bg-gradient-to-br opacity-20 group-hover:opacity-30",
          task.color
        )}>
          <i className={cn(task.icon, "text-white text-2xl")} />
        </div>
        
        {/* Title and Description */}
        <div className="flex-1 flex flex-col gap-2">
          <h3 className="font-serif-display text-3xl text-gray-100 group-hover:text-white transition-colors leading-tight">
            {task.name}
          </h3>
          <p className="text-sm text-gray-400 font-sans-ui leading-relaxed">
            {task.description}
          </p>
        </div>
        
        {/* Arrow */}
        <div className="flex justify-end">
          <i className="fas fa-arrow-right text-gray-600 group-hover:text-[#3990cf] transition-all group-hover:translate-x-1" />
        </div>
      </div>
    </button>
  );
}
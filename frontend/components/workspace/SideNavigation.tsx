'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  useWorkspaceStore, 
  categories, 
  getTasksByCategory,
  type TaskCategory,
  type TaskType 
} from '@/stores/workspaceStore';

interface SideNavigationProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SideNavigation({ collapsed, onToggleCollapse }: SideNavigationProps) {
  const { 
    currentTask, 
    expandedCategories, 
    toggleCategory, 
    setCurrentTask
  } = useWorkspaceStore();

  return (
    <div className="h-full flex flex-col bg-gray-950/50 backdrop-blur-sm">
      {/* Toggle Button */}
      <div className="p-4 border-b border-gray-800">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-between text-gray-400 hover:text-gray-200 transition-colors"
        >
          {!collapsed && <span className="text-sm font-sans-ui">Navigation</span>}
          <i className={cn(
            "fas transition-transform",
            collapsed ? "fa-chevron-right" : "fa-chevron-left"
          )} />
        </button>
      </div>

      {/* Search (expanded only) */}
      {!collapsed && (
        <div className="p-4 border-b border-gray-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full px-3 py-2 pl-9 text-sm bg-gray-900/50 border border-gray-800 rounded-lg focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-xs" />
          </div>
        </div>
      )}

      {/* Task Categories */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4 space-y-2">
          {categories.map((category) => (
            <CategorySection
              key={category.id}
              category={category}
              collapsed={collapsed}
              isExpanded={expandedCategories.includes(category.id)}
              onToggle={() => toggleCategory(category.id)}
              currentTask={currentTask}
              onSelectTask={setCurrentTask}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface CategorySectionProps {
  category: any;
  collapsed: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  currentTask: TaskType | null;
  onSelectTask: (task: TaskType) => void;
}

function CategorySection({ 
  category, 
  collapsed, 
  isExpanded, 
  onToggle, 
  currentTask,
  onSelectTask 
}: CategorySectionProps) {
  const tasks = getTasksByCategory(category.id);
  const hasActiveTask = tasks.some(t => t.id === currentTask);

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={onToggle}
          className={cn(
            "w-full p-3 rounded-lg transition-all flex items-center justify-center",
            hasActiveTask 
              ? "bg-blue-500/20 text-blue-400" 
              : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          )}
          title={category.name}
        >
          <i className={cn(category.icon, category.color)} />
        </button>
        {hasActiveTask && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-blue-400 rounded-l" />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Category Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full px-3 py-2 rounded-lg transition-all flex items-center justify-between",
          hasActiveTask 
            ? "bg-gray-800/50 text-gray-200" 
            : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
        )}
      >
        <div className="flex items-center gap-3">
          <i className={cn(
            "fas transition-transform",
            isExpanded ? "fa-chevron-down" : "fa-chevron-right",
            "text-xs"
          )} />
          <i className={cn(category.icon, category.color, "text-sm")} />
          <span className="text-sm font-sans-ui font-medium">{category.name}</span>
        </div>
        {tasks.length > 0 && (
          <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
            {tasks.length}
          </span>
        )}
      </button>

      {/* Tasks */}
      {isExpanded && (
        <div className="ml-6 space-y-0.5">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isActive={currentTask === task.id}
              onClick={() => onSelectTask(task.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TaskItemProps {
  task: any;
  isActive: boolean;
  onClick: () => void;
}

function TaskItem({ task, isActive, onClick }: TaskItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left px-3 py-2 rounded-lg text-sm transition-all group flex items-center justify-between",
        isActive 
          ? "bg-blue-500/20 text-blue-400" 
          : "text-gray-500 hover:bg-gray-800/50 hover:text-gray-300"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <i className={cn(task.icon, "text-xs opacity-60")} />
        <span className="truncate">{task.name}</span>
      </div>
      
      {/* Status Indicators */}
      <div className="flex items-center gap-1">
        {task.status === 'error' && (
          <div className="w-2 h-2 bg-red-400 rounded-full" title="Error" />
        )}
        {task.status === 'warning' && (
          <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Warning" />
        )}
        {task.badge && (
          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            {task.badge}
          </span>
        )}
      </div>
    </button>
  );
}
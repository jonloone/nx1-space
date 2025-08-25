'use client';

import React, { useState } from 'react';
import { useWorkspaceStore, categories, getTasksByCategory, type TaskCategory, type TaskType } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils/cn';
import { NexusOneLogo } from '@/components/workstation/NexusOneLogo';

interface CategoryCard {
  id: TaskCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: string;
  tasks: number;
}

export function EnhancedHomeDashboard() {
  const { taskHistory, setCurrentTask, bookmarkedTasks, toggleBookmark } = useWorkspaceStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState<TaskCategory | null>(null);

  // Enhanced category data with gradients
  const categoryCards: CategoryCard[] = categories.map(cat => ({
    ...cat,
    tasks: getTasksByCategory(cat.id).length,
    gradient: {
      ingest: 'from-blue-500/20 to-blue-600/10',
      process: 'from-green-500/20 to-green-600/10',
      analyze: 'from-purple-500/20 to-purple-600/10',
      monitor: 'from-orange-500/20 to-orange-600/10',
    }[cat.id] || 'from-gray-500/20 to-gray-600/10',
  }));

  // Get recent tasks with details
  const recentTasks = taskHistory.slice(0, 6).map(entry => {
    const tasks = [...getTasksByCategory('ingest'), ...getTasksByCategory('process'), 
                   ...getTasksByCategory('analyze'), ...getTasksByCategory('monitor')];
    return tasks.find(t => t.id === entry.taskId);
  }).filter(Boolean);

  // Open task in new tab
  const openTask = (taskId: TaskType, taskName: string, taskIcon?: string) => {
    // Use the global function exposed by TabWorkspace
    if ((window as any).openTaskTab) {
      (window as any).openTaskTab(taskId, taskName, taskIcon);
    }
    setCurrentTask(taskId);
  };

  // Handle category click
  const handleCategoryClick = (category: TaskCategory) => {
    // Open category landing page in new tab
    openTask('category_landing' as TaskType, category.charAt(0).toUpperCase() + category.slice(1), 
             categoryCards.find(c => c.id === category)?.icon);
  };

  // System status mock data
  const systemStatus = {
    pipelines: { active: 12, total: 45, health: 'healthy' as const },
    dataQuality: { score: 94, trend: 'up' as const },
    alerts: { critical: 0, warning: 3, info: 8 },
    throughput: { value: '2.3M', unit: 'records/hr', trend: 'stable' as const },
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <NexusOneLogo />
        </div>

        {/* AI Command Bar */}
        <div className="relative">
          <div className="relative group">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ask AI or search for tasks... (Alt+K for console)"
              className="w-full px-6 py-4 pl-14 text-lg bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl focus:outline-none focus:border-blue-500/50 transition-all group-hover:bg-gray-900/70"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery) {
                  // Trigger AI console with query
                  const event = new KeyboardEvent('keydown', { key: 'k', altKey: true });
                  window.dispatchEvent(event);
                  setTimeout(() => {
                    const input = document.querySelector('.ai-console-input') as HTMLInputElement;
                    if (input) {
                      input.value = searchQuery;
                      input.dispatchEvent(new Event('input', { bubbles: true }));
                    }
                  }, 300);
                }
              }}
            />
            <i className="fas fa-magic absolute left-5 top-1/2 -translate-y-1/2 text-blue-400 text-xl" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <span className="text-xs text-gray-600 bg-gray-800 px-2 py-1 rounded">Enter</span>
            </div>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categoryCards.map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
              className={cn(
                "relative p-6 rounded-xl border transition-all duration-300",
                "bg-gradient-to-br backdrop-blur",
                "hover:scale-105 hover:shadow-xl hover:shadow-black/20",
                "group cursor-pointer",
                category.gradient,
                hoveredCategory === category.id ? "border-gray-600" : "border-gray-800"
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <i className={cn(category.icon, category.color, "text-3xl transition-transform group-hover:scale-110")} />
                  <span className="text-xs text-gray-500 bg-gray-900/50 px-2 py-1 rounded-full">
                    {category.tasks} tasks
                  </span>
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-white mb-1">{category.name}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{category.description}</p>
                </div>
              </div>
              
              {/* Hover effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
        </div>

        {/* Recent Tasks and System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Tasks */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <i className="fas fa-history text-gray-400" />
                Recent Tasks
              </h2>
              <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                View all →
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recentTasks.length > 0 ? (
                recentTasks.map((task) => task && (
                  <button
                    key={task.id}
                    onClick={() => openTask(task.id, task.name, task.icon)}
                    className="p-4 bg-gray-900/30 backdrop-blur border border-gray-800 rounded-lg hover:bg-gray-900/50 hover:border-gray-700 transition-all group text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <i className={cn(task.icon, "text-gray-400 group-hover:text-gray-300")} />
                        <div className="min-w-0">
                          <div className="font-medium text-gray-200 truncate">{task.name}</div>
                          <div className="text-xs text-gray-500 truncate">{task.description}</div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(task.id);
                        }}
                        className="ml-2 flex-shrink-0"
                      >
                        <i className={cn(
                          "fas fa-star text-sm transition-colors",
                          bookmarkedTasks.includes(task.id) ? "text-yellow-400" : "text-gray-700 hover:text-gray-500"
                        )} />
                      </button>
                    </div>
                  </button>
                ))
              ) : (
                <div className="col-span-2 p-8 text-center text-gray-600">
                  <i className="fas fa-inbox text-4xl mb-3 opacity-50" />
                  <p>No recent tasks</p>
                  <p className="text-sm mt-1">Start by selecting a category above</p>
                </div>
              )}
            </div>
          </div>

          {/* System Status Mini Dashboard */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <i className="fas fa-heartbeat text-gray-400" />
              System Status
            </h2>
            
            <div className="space-y-3">
              {/* Active Pipelines */}
              <div className="p-4 bg-gray-900/30 backdrop-blur border border-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Active Pipelines</span>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    systemStatus.pipelines.health === 'healthy' ? "bg-green-400" : "bg-yellow-400"
                  )} />
                </div>
                <div className="text-2xl font-bold text-white">
                  {systemStatus.pipelines.active}/{systemStatus.pipelines.total}
                </div>
              </div>

              {/* Data Quality */}
              <div className="p-4 bg-gray-900/30 backdrop-blur border border-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Data Quality</span>
                  <i className={cn(
                    "fas text-xs",
                    systemStatus.dataQuality.trend === 'up' ? "fa-arrow-up text-green-400" : "fa-arrow-down text-red-400"
                  )} />
                </div>
                <div className="text-2xl font-bold text-white">{systemStatus.dataQuality.score}%</div>
              </div>

              {/* Alerts */}
              <div className="p-4 bg-gray-900/30 backdrop-blur border border-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Active Alerts</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    <span className="text-white font-semibold">{systemStatus.alerts.critical}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                    <span className="text-white font-semibold">{systemStatus.alerts.warning}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-white font-semibold">{systemStatus.alerts.info}</span>
                  </div>
                </div>
              </div>

              {/* Throughput */}
              <div className="p-4 bg-gray-900/30 backdrop-blur border border-gray-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Throughput</span>
                  <i className="fas fa-wave-square text-xs text-gray-600" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {systemStatus.throughput.value}
                  <span className="text-sm text-gray-400 ml-1">{systemStatus.throughput.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center gap-2">
                <i className="fas fa-plus" />
                New Pipeline
              </button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                <i className="fas fa-book" />
                Documentation
              </button>
              <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
                <i className="fas fa-cog" />
                Settings
              </button>
            </div>
            
            <div className="text-xs text-gray-600">
              Press <span className="bg-gray-800 px-1.5 py-0.5 rounded">Alt+K</span> for AI assistance
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { useTaskStore, getPersonaInfo, getCategoryInfo, type Task } from '@/stores/taskStore';
import { TaskCard } from './TaskCard';
import { TaskExecutor } from './TaskExecutor';
import { NaturalLanguageInput } from './NaturalLanguageInput';
import { cn } from '@/lib/utils';

export function TaskWorkspace() {
  const {
    selectedPersona,
    activeTask,
    suggestedTasks,
    setPersona,
    getTasksForPersona,
    getRecentTasks
  } = useTaskStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAllTasks, setShowAllTasks] = useState(false);
  
  const personaInfo = getPersonaInfo(selectedPersona);
  const allTasks = getTasksForPersona(selectedPersona);
  const recentTasks = getRecentTasks();
  
  // Filter tasks based on search and category
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || task.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const displayTasks = showAllTasks ? filteredTasks : suggestedTasks;
  
  // Get unique categories for current persona
  const categories = [...new Set(allTasks.map(t => t.category))];
  
  return (
    <div className="h-full bg-[#0A0A0A] overflow-hidden">
      {activeTask ? (
        <TaskExecutor />
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-[#222222]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  "bg-gradient-to-br",
                  personaInfo.color === 'blue' && "from-blue-500/20 to-blue-600/20 text-blue-400",
                  personaInfo.color === 'green' && "from-green-500/20 to-green-600/20 text-green-400",
                  personaInfo.color === 'purple' && "from-purple-500/20 to-purple-600/20 text-purple-400",
                  personaInfo.color === 'orange' && "from-orange-500/20 to-orange-600/20 text-orange-400",
                  personaInfo.color === 'pink' && "from-pink-500/20 to-pink-600/20 text-pink-400",
                  personaInfo.color === 'red' && "from-red-500/20 to-red-600/20 text-red-400"
                )}>
                  <i className={personaInfo.icon} />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-[#FAFAFA]">{personaInfo.title} Workspace</h1>
                  <p className="text-xs text-[#71717A]">{personaInfo.description}</p>
                </div>
              </div>
              
              {/* Persona Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#71717A]">Switch to:</span>
                <div className="flex gap-1">
                  {(['data-engineer', 'analytics-engineer', 'data-analyst', 'domain-expert', 'data-scientist', 'executive'] as const).map(persona => {
                    const info = getPersonaInfo(persona);
                    return (
                      <button
                        key={persona}
                        onClick={() => setPersona(persona)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          selectedPersona === persona
                            ? "bg-[#1A1A1A] border border-[#333333]"
                            : "hover:bg-[#111111]"
                        )}
                        title={info.title}
                      >
                        <i className={cn(info.icon, "text-sm", 
                          selectedPersona === persona ? "text-[#FAFAFA]" : "text-[#71717A]"
                        )} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            
            {/* Natural Language Input */}
            <NaturalLanguageInput />
          </div>
          
          {/* Task Filters */}
          <div className="px-6 py-3 border-b border-[#222222] flex items-center gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A] text-sm" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tasks..."
                className="w-full pl-10 pr-4 py-2 bg-[#111111] border border-[#222222] rounded-lg text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-[#333333]"
              />
            </div>
            
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#71717A]">Filter:</span>
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs transition-colors",
                  !selectedCategory
                    ? "bg-purple-500/20 text-purple-400"
                    : "text-[#71717A] hover:bg-[#111111]"
                )}
              >
                All
              </button>
              {categories.map(category => {
                const categoryInfo = getCategoryInfo(category as any);
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center gap-1",
                      selectedCategory === category
                        ? "bg-purple-500/20 text-purple-400"
                        : "text-[#71717A] hover:bg-[#111111]"
                    )}
                  >
                    <i className={cn(categoryInfo.icon, "text-xs")} />
                    <span className="capitalize">{category}</span>
                  </button>
                );
              })}
            </div>
            
            {/* View Toggle */}
            <button
              onClick={() => setShowAllTasks(!showAllTasks)}
              className="px-3 py-1.5 bg-[#111111] border border-[#222222] rounded-lg text-xs text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors"
            >
              {showAllTasks ? 'Show Suggested' : 'Show All Tasks'}
            </button>
          </div>
          
          {/* Main Content */}
          <div className="flex-1 overflow-auto p-6">
            {/* Recent Activity */}
            {recentTasks.length > 0 && (
              <div className="mb-6">
                <h2 className="text-sm font-medium text-[#FAFAFA] mb-3">Recent Activity</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {recentTasks.slice(0, 5).map((item, idx) => (
                    <div
                      key={idx}
                      className="flex-shrink-0 px-3 py-2 bg-[#111111] border border-[#222222] rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <i className={cn(
                          "text-xs",
                          item.result === 'success' && "fas fa-check-circle text-green-400",
                          item.result === 'error' && "fas fa-times-circle text-red-400",
                          item.result === 'warning' && "fas fa-exclamation-circle text-yellow-400",
                          !item.result && "fas fa-clock text-[#71717A]"
                        )} />
                        <span className="text-xs text-[#FAFAFA]">{item.details}</span>
                        <span className="text-xs text-[#71717A]">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Task Grid */}
            <div>
              <h2 className="text-sm font-medium text-[#FAFAFA] mb-3">
                {showAllTasks ? `All Tasks (${displayTasks.length})` : 'Suggested Tasks'}
              </h2>
              
              {displayTasks.length === 0 ? (
                <div className="text-center py-12">
                  <i className="fas fa-inbox text-4xl text-[#333333] mb-3" />
                  <p className="text-sm text-[#71717A]">No tasks found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-8 p-4 bg-[#111111] border border-[#222222] rounded-lg">
              <h3 className="text-sm font-medium text-[#FAFAFA] mb-3">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <button className="px-3 py-1.5 bg-[#0A0A0A] border border-[#222222] rounded-lg text-xs text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1">
                  <i className="fas fa-history text-xs" />
                  View History
                </button>
                <button className="px-3 py-1.5 bg-[#0A0A0A] border border-[#222222] rounded-lg text-xs text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1">
                  <i className="fas fa-book text-xs" />
                  Documentation
                </button>
                <button className="px-3 py-1.5 bg-[#0A0A0A] border border-[#222222] rounded-lg text-xs text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1">
                  <i className="fas fa-cog text-xs" />
                  Settings
                </button>
                <button className="px-3 py-1.5 bg-[#0A0A0A] border border-[#222222] rounded-lg text-xs text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors flex items-center gap-1">
                  <i className="fas fa-question-circle text-xs" />
                  Help
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
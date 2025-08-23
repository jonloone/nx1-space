'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  useWorkspaceStore, 
  categories, 
  type TaskCategory 
} from '@/stores/workspaceStore';
import { NexusOneLogo } from '@/components/workstation/NexusOneLogo';

interface SimplifiedNavigationProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function SimplifiedNavigation({ collapsed, onToggleCollapse }: SimplifiedNavigationProps) {
  const { 
    currentCategory, 
    setCurrentCategory,
    setCurrentTask
  } = useWorkspaceStore();

  const handleCategoryClick = (categoryId: TaskCategory) => {
    setCurrentCategory(categoryId);
    setCurrentTask('category_landing'); // Special task type for category landing pages
  };

  return (
    <div className={cn(
      "h-full flex flex-col bg-gray-950/50 backdrop-blur-sm transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Header */}
      <div className="p-4 border-b border-gray-800">
        {collapsed ? (
          <div className="w-full flex justify-center">
            <svg width="28" height="28" viewBox="0 0 57 57" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28.2845 0L56.5688 28.2842L28.2845 56.5685L15.714 43.998L31.4278 28.2842L15.714 12.5704L28.2845 0ZM40.8564 28.2842L25.1426 43.998L28.2845 47.1399L47.1402 28.2842L28.2845 9.42846L25.1426 12.5704L40.8564 28.2842Z" fill="#3990cf"/>
              <path d="M25.4559 28.2843L12.728 41.0122L8.48518 36.7694L16.9703 28.2843L8.48518 19.7992L12.728 15.5564L25.4559 28.2843Z" fill="#3990cf"/>
              <path d="M5.6571 22.6273L11.314 28.2842L5.6571 33.941L2.82867 31.1126L5.6571 28.2842L2.82867 25.4558L5.6571 22.6273Z" fill="#3990cf"/>
            </svg>
          </div>
        ) : (
          <NexusOneLogo width={180} className="mx-auto" />
        )}
      </div>

      {/* Main Categories */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-2">
          {categories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              collapsed={collapsed}
              isActive={currentCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
            />
          ))}
        </div>
      </div>

      {/* Bottom Section - Settings & Actions */}
      <div className="border-t border-gray-800">
        {/* Quick Stats (expanded only) */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-800">
            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex justify-between">
                <span>Active Tasks</span>
                <span className="text-blue-400">3</span>
              </div>
              <div className="flex justify-between">
                <span>Health Score</span>
                <span className="text-green-400">94%</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Settings Icons */}
        <div className="p-3">
          <div className={cn(
            "flex gap-2",
            collapsed ? "flex-col items-center" : "flex-row justify-between"
          )}>
            <button 
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="Profile"
            >
              <i className="fas fa-user text-sm" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="Notifications"
            >
              <i className="fas fa-bell text-sm" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="Help"
            >
              <i className="fas fa-question-circle text-sm" />
            </button>
            <button 
              className="p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors"
              title="Settings"
            >
              <i className="fas fa-cog text-sm" />
            </button>
          </div>
        </div>
        
        {/* Collapse Toggle */}
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={onToggleCollapse}
            className="w-full p-2 text-gray-500 hover:text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-center"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <i className={cn(
              "fas transition-transform",
              collapsed ? "fa-chevron-right" : "fa-chevron-left"
            )} />
          </button>
        </div>
      </div>
    </div>
  );
}

interface CategoryButtonProps {
  category: any;
  collapsed: boolean;
  isActive: boolean;
  onClick: () => void;
}

function CategoryButton({ category, collapsed, isActive, onClick }: CategoryButtonProps) {
  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className={cn(
            "w-full p-4 rounded-lg transition-all flex items-center justify-center",
            isActive 
              ? "bg-blue-500/20 text-blue-400" 
              : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
          )}
          title={category.name}
        >
          <i className={cn(category.icon, category.color, "text-lg")} />
        </button>
        {isActive && (
          <div className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-400 rounded-l" />
        )}
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full px-4 py-3 rounded-lg transition-all flex items-center gap-3 text-left",
        isActive 
          ? "bg-blue-500/20 text-blue-400" 
          : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
      )}
    >
      <i className={cn(category.icon, category.color, "text-lg")} />
      <div className="min-w-0">
        <div className="font-sans-ui font-medium text-sm">{category.name}</div>
        <div className="text-xs text-gray-500 truncate">{category.description}</div>
      </div>
    </button>
  );
}
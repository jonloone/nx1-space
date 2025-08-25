'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface FloatingAIConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

type DockPosition = 'floating' | 'right' | 'bottom';
type ConsoleMode = 'overlay' | 'docked' | 'minimized';

export function FloatingAIConsole({ isOpen, onClose }: FloatingAIConsoleProps) {
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [dockPosition, setDockPosition] = useState<DockPosition>('floating');
  const [mode, setMode] = useState<ConsoleMode>('overlay');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [input, setInput] = useState('');
  
  const consoleRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const dragStartOffset = useRef({ x: 0, y: 0 });
  
  const { currentTask } = useWorkspaceStore();

  // Set initial position after mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPosition({ x: window.innerWidth - 420, y: 100 });
    }
  }, []);

  // Get context-aware agent message
  const getContextMessage = () => {
    const taskMessages: Record<string, string> = {
      'build_pipeline': "I see you're building a pipeline. I can help with schema validation, source connections, or transformation logic.",
      'data_quality': "Working on data quality? I can analyze your quality scores, suggest remediation, or set up monitoring rules.",
      'optimize_query': "Optimizing performance? I can help identify bottlenecks, suggest indexes, or rewrite queries.",
      'connect_data': "Connecting data sources? I can help with connection strings, authentication, or schema mapping.",
      'default': "I'm your AI assistant. How can I help you today?",
    };
    
    return taskMessages[currentTask || 'default'] || taskMessages.default;
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (dockPosition !== 'floating') return;
    
    setIsDragging(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartOffset.current = { x: position.x, y: position.y };
  };

  // Handle drag
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - size.width, dragStartOffset.current.x + deltaX)),
        y: Math.max(0, Math.min(window.innerHeight - size.height, dragStartOffset.current.y + deltaY)),
      });
      
      // Check for edge snapping
      const snapThreshold = 50;
      if (e.clientX < snapThreshold) {
        // Snap to left - not implemented for now
      } else if (e.clientX > window.innerWidth - snapThreshold) {
        setDockPosition('right');
        setMode('docked');
      } else if (e.clientY > window.innerHeight - snapThreshold) {
        setDockPosition('bottom');
        setMode('docked');
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, size.width, size.height]);

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragStartOffset.current = { x: size.width, y: size.height };
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartPos.current.x;
      const deltaY = e.clientY - dragStartPos.current.y;
      
      setSize({
        width: Math.max(300, Math.min(800, dragStartOffset.current.x + deltaX)),
        height: Math.max(200, Math.min(800, dragStartOffset.current.y + deltaY)),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Handle mode changes
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
    if (!isMinimized) {
      setMode('minimized');
    } else {
      setMode(dockPosition === 'floating' ? 'overlay' : 'docked');
    }
  };

  const undock = () => {
    setDockPosition('floating');
    setMode('overlay');
    if (typeof window !== 'undefined') {
      setPosition({
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 250,
      });
    }
  };

  // Handle input submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `Processing your request about "${input}". ${getContextMessage()}`
      }]);
    }, 500);
    
    setInput('');
  };

  if (!isOpen) return null;

  // Console styles based on mode and dock position
  const getConsoleStyles = (): React.CSSProperties => {
    if (mode === 'minimized') {
      return {
        bottom: 20,
        right: 20,
        width: 300,
        height: 48,
      };
    }

    if (dockPosition === 'right') {
      return {
        top: 36, // Below tab bar
        right: 0,
        width: size.width,
        height: 'calc(100vh - 36px)',
      };
    }

    if (dockPosition === 'bottom') {
      return {
        bottom: 0,
        left: 0,
        right: 0,
        height: size.height,
      };
    }

    // Floating
    return {
      left: position.x,
      top: position.y,
      width: size.width,
      height: size.height,
    };
  };

  return (
    <div
      ref={consoleRef}
      className={cn(
        "fixed z-50 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg shadow-2xl flex flex-col transition-all",
        dockPosition !== 'floating' && "rounded-none",
        isDragging && "cursor-move",
        mode === 'minimized' && "rounded-full"
      )}
      style={getConsoleStyles()}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-2 border-b border-gray-700 cursor-move select-none",
          mode === 'minimized' && "border-0 py-3"
        )}
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <i className="fas fa-robot text-blue-400" />
          <span className="text-sm font-medium text-gray-200">
            {mode === 'minimized' ? 'AI Assistant' : `AI Assistant - ${currentTask || 'General'}`}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Dock controls */}
          {dockPosition === 'floating' && mode !== 'minimized' && (
            <>
              <button
                onClick={() => { setDockPosition('right'); setMode('docked'); }}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                title="Dock to right"
              >
                <i className="fas fa-window-maximize text-xs" />
              </button>
              <button
                onClick={() => { setDockPosition('bottom'); setMode('docked'); }}
                className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
                title="Dock to bottom"
              >
                <i className="fas fa-window-maximize text-xs rotate-90" />
              </button>
            </>
          )}
          
          {dockPosition !== 'floating' && (
            <button
              onClick={undock}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              title="Undock"
            >
              <i className="fas fa-external-link-alt text-xs" />
            </button>
          )}
          
          <button
            onClick={toggleMinimize}
            className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
            title={isMinimized ? "Expand" : "Minimize"}
          >
            <i className={cn("fas text-xs", isMinimized ? "fa-expand" : "fa-minus")} />
          </button>
          
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            title="Close (Alt+K)"
          >
            <i className="fas fa-times text-xs" />
          </button>
        </div>
      </div>

      {/* Content */}
      {mode !== 'minimized' && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <i className="fas fa-comments text-4xl mb-3 opacity-50" />
                <p className="text-sm">{getContextMessage()}</p>
                <p className="text-xs mt-2 opacity-75">Type a message or use Alt+K to toggle</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "p-3 rounded-lg",
                    msg.role === 'user' 
                      ? "bg-blue-500/20 text-blue-100 ml-8" 
                      : "bg-gray-800 text-gray-200 mr-8"
                  )}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {msg.role === 'user' ? 'You' : 'AI Assistant'}
                  </div>
                  <div className="text-sm">{msg.content}</div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="border-t border-gray-700 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 ai-console-input"
                autoFocus
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
              >
                Send
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Press Alt+K to toggle • Drag header to move • Drag corners to resize
            </div>
          </form>

          {/* Resize handle */}
          {dockPosition === 'floating' && (
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-b border-r border-gray-600" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
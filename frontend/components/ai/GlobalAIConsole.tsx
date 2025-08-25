'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function GlobalAIConsole() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [height, setHeight] = useState(300);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: string; content: string; timestamp: Date }>>([]);
  const [isResizing, setIsResizing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const { currentCategory } = useWorkspaceStore();

  // Keyboard shortcut (Alt+K)
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsExpanded(prev => !prev);
        if (!isExpanded) {
          setTimeout(() => inputRef.current?.focus(), 200);
        }
      }
    };
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [isExpanded]);

  // Handle resize
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startY = e.clientY;
    const startHeight = height;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = startY - e.clientY;
      const newHeight = Math.min(600, Math.max(200, startHeight + deltaY));
      setHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Process command
    const response = await processCommand(input, currentCategory || 'general');
    
    // Add AI response
    const aiMessage = {
      type: 'ai',
      content: response,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);

    // Clear input
    setInput('');

    // Scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const processCommand = async (cmd: string, context: string): Promise<string> => {
    // Mock AI processing
    const lowerCmd = cmd.toLowerCase();
    
    if (lowerCmd.includes('help')) {
      return `Available commands for ${context}:
• status - Check current status
• optimize - Optimize performance
• debug - Debug issues
• clear - Clear console

I can also answer questions about your data and help with tasks.`;
    }

    if (lowerCmd.includes('clear')) {
      setMessages([]);
      return 'Console cleared.';
    }
    
    return `Processing "${cmd}" in ${context} context...
I understand you need help with this. Let me analyze your request and provide guidance.`;
  };

  return (
    <>
      {/* AI Console Container */}
      <motion.div
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800",
          "shadow-2xl shadow-black/50 z-[999]", // Below modal (z-1000) but above workspace
          isResizing && "select-none"
        )}
        initial={{ height: 48 }}
        animate={{ 
          height: isExpanded ? height : 48,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Resize Handle (only when expanded) */}
        {isExpanded && (
          <div
            className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-500/20 transition-colors"
            onMouseDown={handleMouseDown}
          />
        )}

        {/* Console Header Bar */}
        <div className="h-12 px-4 flex items-center justify-between border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3">
            <i className="fas fa-robot text-blue-400" />
            <span className="text-sm font-medium text-gray-200">AI Assistant</span>
            {!isExpanded && (
              <span className="text-xs text-gray-500">Alt+K to expand</span>
            )}
            {currentCategory && (
              <span className="text-xs text-gray-500">
                Context: <span className="text-blue-400">{currentCategory}</span>
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isExpanded && (
              <>
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
                >
                  Clear
                </button>
                <div className="w-px h-4 bg-gray-700" />
              </>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-200 transition-colors"
              title={isExpanded ? "Collapse (Alt+K)" : "Expand (Alt+K)"}
            >
              <i className={cn("fas", isExpanded ? "fa-chevron-down" : "fa-chevron-up")} />
            </button>
          </div>
        </div>

        {/* Console Content (only when expanded) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              className="flex flex-col h-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ height: height - 48 }}
            >
              {/* Messages Area */}
              <div
                ref={outputRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2"
              >
                {messages.length === 0 ? (
                  <div className="text-gray-500 text-xs">
                    Welcome to the AI Assistant. Type a command or ask a question.
                    Try "help" to see available commands.
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={index} className={cn(
                      "flex gap-2",
                      msg.type === 'user' ? 'text-green-400' : 'text-gray-300'
                    )}>
                      <span className="text-gray-500 select-none">
                        {msg.type === 'user' ? '>' : '◆'}
                      </span>
                      <div className="flex-1 whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSubmit} className="border-t border-gray-800 p-2">
                <div className="flex items-center gap-2">
                  <span className="text-green-400 font-mono select-none">{'>'}</span>
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a command or ask a question..."
                    className="flex-1 bg-transparent outline-none font-mono text-sm text-gray-300 placeholder-gray-600"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Spacer to prevent content from going under console */}
      <div style={{ height: isExpanded ? height : 48 }} />
    </>
  );
}
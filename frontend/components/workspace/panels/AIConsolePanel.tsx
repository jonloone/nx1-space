'use client';

import React, { useState, useRef, useEffect } from 'react';
import { IDockviewPanelProps } from 'dockview';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils/cn';

interface AIConsolePanelProps extends IDockviewPanelProps<{ 
  context?: string; 
  task?: string;
  minimized?: boolean;
}> {}

export function AIConsolePanel({ params }: AIConsolePanelProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ type: string; content: string; timestamp: Date }>>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const { currentCategory } = useWorkspaceStore();

  // Context-aware command prefixes
  const contextPrefixes: Record<string, string> = {
    ingest: '@ingest',
    process: '@process',
    analyze: '@analyze',
    monitor: '@monitor',
    default: '@global',
  };

  const getCurrentPrefix = () => {
    return contextPrefixes[currentCategory] || contextPrefixes.default;
  };

  // Auto-suggest commands based on input
  useEffect(() => {
    if (input.startsWith('@')) {
      const prefix = input.split(' ')[0];
      const availableCommands = getCommandsForContext(prefix);
      setSuggestions(availableCommands);
      setShowSuggestions(availableCommands.length > 0);
    } else if (input.length > 2) {
      const nlSuggestions = getNaturalLanguageSuggestions(input, currentCategory);
      setSuggestions(nlSuggestions);
      setShowSuggestions(nlSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [input, currentCategory]);

  const getCommandsForContext = (prefix: string): string[] => {
    const commands: Record<string, string[]> = {
      '@ingest': [
        '@ingest status',
        '@ingest start [pipeline]',
        '@ingest validate [source]',
        '@ingest schedule [pipeline] [cron]',
      ],
      '@process': [
        '@process optimize [pipeline]',
        '@process status',
        '@process debug [pipeline]',
        '@process scale [pipeline] [workers]',
      ],
      '@analyze': [
        '@analyze metrics',
        '@analyze anomalies',
        '@analyze quality [dataset]',
        '@analyze compare [metric1] [metric2]',
      ],
      '@monitor': [
        '@monitor alerts',
        '@monitor health',
        '@monitor logs [service]',
        '@monitor set-alert [metric] [threshold]',
      ],
      '@global': [
        '@global help',
        '@global clear',
        '@global save [name]',
        '@global export [format]',
      ],
    };
    
    return commands[prefix] || [];
  };

  const getNaturalLanguageSuggestions = (input: string, context: string): string[] => {
    const suggestions: string[] = [];
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('optimize')) {
      suggestions.push('@process optimize');
    }
    if (lowerInput.includes('status') || lowerInput.includes('check')) {
      suggestions.push(`@${context} status`);
    }
    if (lowerInput.includes('error') || lowerInput.includes('debug')) {
      suggestions.push('@process debug');
      suggestions.push('@monitor logs --errors');
    }
    if (lowerInput.includes('performance')) {
      suggestions.push('@analyze performance');
      suggestions.push('@process optimize');
    }

    return suggestions.slice(0, 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add to history
    setHistory([...history, input]);
    setHistoryIndex(-1);

    // Add user message
    const userMessage = {
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Process command
    const response = await processCommand(input, currentCategory);
    
    // Add AI response
    const aiMessage = {
      type: 'ai',
      content: response,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMessage]);

    // Clear input
    setInput('');
    setShowSuggestions(false);

    // Scroll to bottom
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  };

  const processCommand = async (cmd: string, context: string): Promise<string> => {
    const lowerCmd = cmd.toLowerCase();
    
    if (lowerCmd.includes('optimize')) {
      return `Optimizing ${context} pipeline...
✓ Identified inefficient operations
✓ Applied optimizations
Expected improvement: 35%`;
    }
    
    if (lowerCmd.includes('status')) {
      return `${context} Status:
• Active pipelines: 8
• Success rate: 94%
• Avg processing time: 2.3s
• Last run: 2 minutes ago`;
    }
    
    if (lowerCmd.includes('help')) {
      return `Available commands for ${context}:
• @${context} status - Check current status
• @${context} optimize - Optimize performance
• @${context} debug - Debug issues
• @${context} metrics - View metrics

Type any natural language question or use commands.`;
    }

    if (lowerCmd.includes('clear')) {
      setMessages([]);
      return 'Console cleared.';
    }
    
    return `Processing "${cmd}" in ${context} context...
Analysis complete. Found 3 optimization opportunities.`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault();
      setInput(suggestions[0]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const isMinimized = params?.minimized === true;

  if (isMinimized) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-950 border-l border-gray-800">
        <div className="flex flex-col items-center gap-2 text-gray-400 cursor-pointer hover:text-gray-300 transition-colors"
             title="Click to expand AI Console (Cmd+K)">
          <i className="fas fa-robot text-lg" />
          <span className="text-xs font-mono transform -rotate-90 whitespace-nowrap">AI</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-950 text-gray-300 relative">
      {/* Console Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800 bg-gray-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Context:</span>
          <span className="text-xs font-mono text-blue-400">{getCurrentPrefix()}</span>
          <span className="text-xs text-gray-500 ml-2">
            {currentCategory ? `(${currentCategory})` : ''}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMessages([])}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            Clear
          </button>
          <button
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
            title="Minimize (Cmd+K)"
          >
            <i className="fas fa-compress-alt" />
          </button>
        </div>
      </div>

      {/* Console Output */}
      <div
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-sm space-y-2"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-xs">
            Welcome to the AI Console. Type a command or ask a question.
            Try "help" to see available commands.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div key={index} className={cn(
              "flex gap-2",
              msg.type === 'user' ? 'text-green-400' : 'text-gray-300'
            )}>
              <span className="text-gray-500">
                {msg.type === 'user' ? '>' : '◆'}
              </span>
              <div className="flex-1 whitespace-pre-wrap">{msg.content}</div>
            </div>
          ))
        )}
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="absolute bottom-12 left-4 right-4 bg-gray-900 border border-gray-800 rounded-lg shadow-xl max-h-40 overflow-y-auto z-50">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 transition-colors font-mono"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Console Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800 p-2">
        <div className="flex items-center gap-2">
          <span className="text-green-400 font-mono">{'>'}</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Type a command or ask a question... (${getCurrentPrefix()} for context commands)`}
            className="flex-1 bg-transparent outline-none font-mono text-sm text-gray-300 placeholder-gray-600 ai-console-input"
            autoFocus
          />
        </div>
      </form>
    </div>
  );
}
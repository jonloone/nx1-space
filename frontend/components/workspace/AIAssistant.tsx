'use client';

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore, getTaskById } from '@/stores/workspaceStore';

interface AIAssistantProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AIAssistant({ collapsed, onToggleCollapse }: AIAssistantProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentTask, chatContext, addChatMessage } = useWorkspaceStore();
  const task = currentTask ? getTaskById(currentTask) : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatContext.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    addChatMessage({ role: 'user', content: input });
    setInput('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const response = generateContextualResponse(input, task);
      addChatMessage({ role: 'assistant', content: response });
      setIsTyping(false);
    }, 1500);
  };

  const quickActions = task ? getQuickActionsForTask(task) : getGeneralQuickActions();

  if (collapsed) {
    return (
      <div className="h-12 border-t border-gray-800 bg-gray-950/80 backdrop-blur-sm flex items-center px-6">
        <button
          onClick={onToggleCollapse}
          className="flex-1 flex items-center gap-3 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <i className="fas fa-robot text-blue-400" />
          <span className="text-sm">Ask AI for help...</span>
          <kbd className="ml-auto px-2 py-0.5 bg-gray-800 rounded text-xs">Cmd /</kbd>
        </button>
      </div>
    );
  }

  return (
    <div className="h-96 border-t border-gray-800 bg-gray-950/80 backdrop-blur-sm flex flex-col">
      {/* Header */}
      <div className="px-6 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="fas fa-robot text-blue-400" />
          <h3 className="text-sm font-sans-ui font-medium text-gray-300">
            AI Assistant
            {task && (
              <span className="ml-2 text-gray-500">
                • {task.name}
              </span>
            )}
          </h3>
        </div>
        <button
          onClick={onToggleCollapse}
          className="text-gray-500 hover:text-gray-300 transition-colors"
        >
          <i className="fas fa-chevron-down" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {chatContext.messages.length === 0 && (
          <div className="text-center text-gray-500">
            <p className="mb-4">
              {task 
                ? `I can help you with ${task.name}. What would you like to know?`
                : 'Select a task to get contextual assistance, or ask me anything about data engineering.'}
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 justify-center">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(action.prompt);
                    if (action.autoSend) {
                      handleSubmit(new Event('submit') as any);
                    }
                  }}
                  className="px-3 py-1.5 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg text-xs text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <i className={cn(action.icon, "mr-2")} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatContext.messages.map((message, idx) => (
          <ChatMessage key={idx} message={message} />
        ))}

        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <i className="fas fa-robot text-white text-xs" />
            </div>
            <div className="flex-1 p-3 bg-gray-800/50 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="px-6 py-4 border-t border-gray-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={task ? `Ask about ${task.name}...` : 'Ask a question...'}
            className="flex-1 px-4 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i className="fas fa-paper-plane" />
          </button>
        </div>
      </form>
    </div>
  );
}

function ChatMessage({ message }: { message: any }) {
  const isUser = message.role === 'user';

  return (
    <div className={cn("flex items-start gap-3", isUser && "flex-row-reverse")}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        isUser 
          ? "bg-gradient-to-br from-purple-500 to-pink-500"
          : "bg-gradient-to-br from-blue-500 to-cyan-500"
      )}>
        <i className={cn(
          "fas text-white text-xs",
          isUser ? "fa-user" : "fa-robot"
        )} />
      </div>
      
      <div className={cn(
        "flex-1 p-3 rounded-lg",
        isUser 
          ? "bg-purple-500/10 text-gray-300"
          : "bg-gray-800/50 text-gray-300"
      )}>
        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
        {!isUser && message.content.includes('```') && (
          <button className="mt-2 text-xs text-blue-400 hover:text-blue-300">
            <i className="fas fa-copy mr-1" />
            Copy code
          </button>
        )}
      </div>
    </div>
  );
}

function generateContextualResponse(input: string, task: any): string {
  const lowerInput = input.toLowerCase();

  if (!task) {
    return "I can provide better assistance once you select a task. In the meantime, feel free to ask about any data engineering concepts or challenges you're facing.";
  }

  // Task-specific responses
  if (task.id === 'query_to_product') {
    if (lowerInput.includes('odps') || lowerInput.includes('specification')) {
      return `ODPS (Open Data Product Specification) v3.1 is the standard we use for creating data products. 

Key components include:
• **Metadata**: Product name, domain, owner, and tags
• **Data Access**: API endpoints, SQL views, and streaming interfaces
• **Quality SLAs**: Availability, response time, and update frequency
• **Data Contract**: Schema versioning and governance rules

Would you like me to help you configure any of these sections?`;
    }
    
    if (lowerInput.includes('optimize') || lowerInput.includes('slow')) {
      return `To optimize your query:

1. **Check indexes**: Missing indexes are the most common cause
2. **Review joins**: Ensure join conditions are efficient
3. **Consider materialization**: For frequently-run complex queries
4. **Partition strategy**: Time-based partitioning can help

Run the Query Optimizer task to get specific recommendations for your query.`;
    }
  }

  if (task.id === 'test_quality') {
    if (lowerInput.includes('dbt') || lowerInput.includes('test')) {
      return `Your dbt tests are configured in \`models/schema.yml\`. 

Common test types:
• **unique**: Ensures column values are unique
• **not_null**: Checks for null values
• **relationships**: Validates foreign keys
• **accepted_values**: Limits to specific values

Run \`dbt test --select <model>\` to execute tests for a specific model.`;
    }
  }

  // Generic helpful response
  return `I understand you're working on ${task.name}. ${task.description}

Common tasks include:
• Setting up the initial configuration
• Troubleshooting errors
• Optimizing performance
• Following best practices

What specific aspect would you like help with?`;
}

function getQuickActionsForTask(task: any) {
  const actions: any[] = [
    { icon: 'fas fa-question', label: 'How to start', prompt: `How do I get started with ${task.name}?` },
    { icon: 'fas fa-list', label: 'Best practices', prompt: `What are the best practices for ${task.name}?` },
    { icon: 'fas fa-bug', label: 'Common errors', prompt: `What are common errors when ${task.description.toLowerCase()}?` }
  ];

  // Add task-specific actions
  if (task.id === 'query_to_product') {
    actions.push({ icon: 'fas fa-file-alt', label: 'ODPS help', prompt: 'Explain ODPS v3.1 specification' });
  }
  
  if (task.id === 'test_quality') {
    actions.push({ icon: 'fas fa-vial', label: 'dbt tests', prompt: 'How do I write custom dbt tests?' });
  }

  return actions;
}

function getGeneralQuickActions() {
  return [
    { icon: 'fas fa-rocket', label: 'Getting started', prompt: 'How do I get started with data engineering?' },
    { icon: 'fas fa-book', label: 'Documentation', prompt: 'Where can I find documentation?' },
    { icon: 'fas fa-keyboard', label: 'Shortcuts', prompt: 'What keyboard shortcuts are available?' }
  ];
}
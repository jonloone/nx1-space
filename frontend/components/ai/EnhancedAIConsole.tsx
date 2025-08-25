/**
 * Enhanced AI Console Component
 * Terminal-style interface with agent-based AI assistance
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AgentOrchestrator } from '@/lib/ai/AgentOrchestrator';
import { ExecutionMode, AgentResponse } from '@/lib/ai/agents/types';
import { Terminal, Cpu, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'system' | 'agent' | 'error';
  content: string;
  timestamp: Date;
  agent?: string;
  confidence?: number;
}

interface EnhancedAIConsoleProps {
  isOpen?: boolean;
  onClose?: () => void;
  context?: any;
}

export const EnhancedAIConsole: React.FC<EnhancedAIConsoleProps> = ({
  isOpen = true,
  onClose,
  context
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'system',
      content: 'NexusOne AI Console initialized. Type "help" for available commands.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('supervised');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const orchestratorRef = useRef<AgentOrchestrator | null>(null);

  // Initialize orchestrator
  useEffect(() => {
    const initOrchestrator = async () => {
      if (!orchestratorRef.current) {
        orchestratorRef.current = new AgentOrchestrator();
        await orchestratorRef.current.initialize();
        
        // Subscribe to events
        orchestratorRef.current.on('agent:log', (data) => {
          addMessage({
            type: 'system',
            content: `[${data.agent}] ${data.message}`,
            agent: data.agent
          });
        });
        
        orchestratorRef.current.on('agent:task:complete', (data) => {
          addMessage({
            type: 'agent',
            content: `Task completed: ${data.response.message}`,
            agent: data.agent,
            confidence: data.response.confidence
          });
        });
      }
    };
    
    initOrchestrator();
    
    return () => {
      if (orchestratorRef.current) {
        orchestratorRef.current.terminate();
      }
    };
  }, []);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages(prev => [...prev, {
      ...message,
      id: `msg_${Date.now()}`,
      timestamp: new Date()
    }]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const userInput = input.trim();
    setInput('');
    setCommandHistory(prev => [...prev, userInput]);
    setHistoryIndex(-1);
    
    // Add user message
    addMessage({
      type: 'user',
      content: userInput
    });
    
    // Handle special commands
    if (userInput.toLowerCase() === 'help') {
      showHelp();
      return;
    }
    
    if (userInput.toLowerCase() === 'clear') {
      setMessages([]);
      return;
    }
    
    if (userInput.toLowerCase().startsWith('mode ')) {
      const mode = userInput.substring(5).toLowerCase() as ExecutionMode;
      if (['supervised', 'collaborative', 'autonomous'].includes(mode)) {
        setExecutionMode(mode);
        addMessage({
          type: 'system',
          content: `Execution mode changed to: ${mode}`
        });
      }
      return;
    }
    
    // Process through orchestrator
    setIsProcessing(true);
    try {
      if (orchestratorRef.current) {
        const response = await orchestratorRef.current.processUserInput(
          userInput,
          context,
          executionMode
        );
        
        displayResponse(response);
      }
    } catch (error) {
      addMessage({
        type: 'error',
        content: `Error: ${error}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const displayResponse = (response: AgentResponse) => {
    // Display main response
    addMessage({
      type: 'agent',
      content: response.message,
      confidence: response.confidence
    });
    
    // Display suggestions if any
    if (response.suggestions && response.suggestions.length > 0) {
      addMessage({
        type: 'system',
        content: 'Suggestions:\n' + response.suggestions.map((s, i) => `  ${i + 1}. ${s}`).join('\n')
      });
    }
    
    // Display result details if any
    if (response.result) {
      addMessage({
        type: 'system',
        content: `Result: ${JSON.stringify(response.result, null, 2)}`
      });
    }
  };

  const showHelp = () => {
    const helpText = `
Available Commands:
  help                - Show this help message
  clear              - Clear console output
  mode <mode>        - Change execution mode (supervised/collaborative/autonomous)
  
Agent Commands:
  @engineer <task>   - Direct task to Data Engineer
  @monitor <task>    - Direct task to Monitor agent
  @analyst <task>    - Direct task to Analyst agent
  @fix <issue>       - Direct task to Remediation agent
  
Example Queries:
  "Build a pipeline for customer data"
  "Monitor system health"
  "Analyze data quality"
  "Fix connection timeout errors"
  "Optimize pipeline performance"
    `;
    
    addMessage({
      type: 'system',
      content: helpText
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="h-full flex flex-col bg-gray-950 text-green-400 font-mono text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" />
          <span className="text-blue-400">NexusOne AI Console</span>
          <span className="text-gray-500">|</span>
          <span className="text-yellow-400">{executionMode}</span>
        </div>
        <div className="flex items-center gap-2">
          {isProcessing && <Activity className="w-4 h-4 animate-spin" />}
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
      </div>
      
      {/* Output */}
      <div 
        ref={outputRef}
        className="flex-1 overflow-y-auto p-4 space-y-2"
      >
        {messages.map((msg) => (
          <div key={msg.id} className="flex gap-2">
            <span className={`
              ${msg.type === 'user' ? 'text-green-400' : ''}
              ${msg.type === 'system' ? 'text-gray-400' : ''}
              ${msg.type === 'agent' ? 'text-blue-400' : ''}
              ${msg.type === 'error' ? 'text-red-400' : ''}
            `}>
              {msg.type === 'user' ? '>' : ''}
              {msg.type === 'system' ? '◆' : ''}
              {msg.type === 'agent' ? '◈' : ''}
              {msg.type === 'error' ? '✗' : ''}
            </span>
            <div className="flex-1">
              <pre className="whitespace-pre-wrap break-words">
                {msg.content}
                {msg.confidence && (
                  <span className="text-gray-500 ml-2">
                    ({Math.round(msg.confidence * 100)}% confident)
                  </span>
                )}
              </pre>
            </div>
          </div>
        ))}
        
        {isProcessing && (
          <div className="flex gap-2 text-yellow-400">
            <Activity className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
      </div>
      
      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-800">
        <div className="flex items-center px-4 py-2">
          <span className="text-green-400 mr-2">$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="flex-1 bg-transparent outline-none text-white placeholder-gray-600"
            placeholder="Enter command or query..."
            autoComplete="off"
            spellCheck="false"
          />
        </div>
      </form>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1 border-t border-gray-800 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span>Mode: {executionMode}</span>
          <span>History: {commandHistory.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="w-3 h-3 text-green-400" />
          <span>Connected</span>
        </div>
      </div>
    </div>
  );
};
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Sparkles, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SimpleAssistantProvider, useAssistantContext } from './SimpleAssistantProvider';
import { SuggestedPrompts } from './SuggestedPrompts';
import './assistant-overrides.css';

interface SimpleEmbeddedAssistantProps {
  context: {
    type: 'station' | 'opportunity' | 'maritime';
    station?: any;
    hexagon?: any;
    vessel?: any;
    metrics?: any;
  };
  maxHeight?: number;
  defaultOpen?: boolean;
  className?: string;
}

const AssistantContent: React.FC<{ maxHeight: number }> = ({ maxHeight }) => {
  const { context, runtime } = useAssistantContext();
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [runtime.messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || runtime.isLoading) return;

    runtime.append({ role: 'user', content: input.trim() });
    setInput('');
    setShowSuggestions(false);
  };

  const handleSuggestionSelect = (prompt: string) => {
    runtime.append({ role: 'user', content: prompt });
    setShowSuggestions(false);
  };

  return (
    <div className="embedded-assistant-content">
      {showSuggestions && runtime.messages.filter(m => m.role !== 'system').length === 0 && (
        <div className="suggested-prompts">
          <div className="prompts-header">
            <span className="text-xs text-gray-500">Suggested questions</span>
          </div>
          <div className="prompts-list">
            {getSuggestedPrompts(context).map((prompt, index) => (
              <button
                key={index}
                className="prompt-chip"
                onClick={() => handleSuggestionSelect(prompt.prompt)}
              >
                {prompt.icon}
                <span>{prompt.text}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div 
        className="assistant-messages"
        style={{ maxHeight: `${maxHeight - 60}px`, overflowY: 'auto' }}
      >
        {runtime.messages
          .filter(m => m.role !== 'system')
          .map((message) => (
            <div
              key={message.id}
              className={`compact-message ${message.role}`}
            >
              <div className="message-content">
                {message.content || (runtime.isLoading && message.role === 'assistant' ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span className="text-xs opacity-50">Thinking...</span>
                  </div>
                ) : null)}
              </div>
            </div>
          ))}
        <div ref={messagesEndRef} />
      </div>

      {runtime.error && (
        <div className="assistant-error">
          Error: {runtime.error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="assistant-input-form">
        <div className="relative flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this data..."
            className="compact-composer"
            disabled={runtime.isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || runtime.isLoading}
            className="assistant-send-button"
          >
            {runtime.isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export const SimpleEmbeddedAssistant: React.FC<SimpleEmbeddedAssistantProps> = ({
  context,
  maxHeight = 400,
  defaultOpen = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const threadId = `${context.type}-${context.station?.id || context.hexagon?.id || context.vessel?.id || 'default'}`;

  return (
    <div className={`embedded-assistant ${className}`}>
      <button
        className="assistant-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      >
        <MessageSquare className="w-4 h-4" />
        <span>AI Assistant</span>
        <Sparkles className="w-3 h-3 ml-1 opacity-50" />
        {isOpen ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="assistant-container"
          >
            <SimpleAssistantProvider context={context} threadId={threadId}>
              <AssistantContent maxHeight={maxHeight} />
            </SimpleAssistantProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper function to get suggested prompts
function getSuggestedPrompts(context: any) {
  if (context.type === 'station' && context.station) {
    const station = context.station;
    const prompts = [];

    if (station.utilization < 0.5) {
      prompts.push({
        icon: <span>🔍</span>,
        text: "Why is utilization low?",
        prompt: `Why is the utilization for ${station.name} only ${(station.utilization * 100).toFixed(1)}%?`
      });
    }

    if (station.score < 0.7) {
      prompts.push({
        icon: <span>📈</span>,
        text: "How to improve score?",
        prompt: `What are the top 3 actions to improve ${station.name}'s health score?`
      });
    }

    prompts.push({
      icon: <span>🔄</span>,
      text: "Compare to nearby",
      prompt: `Compare ${station.name} to other nearby ground stations`
    });

    return prompts.slice(0, 3);
  }

  return [
    {
      icon: <span>📊</span>,
      text: "Overview",
      prompt: "Give me an overview of what I'm looking at"
    },
    {
      icon: <span>💡</span>,
      text: "Key insights",
      prompt: "What are the key insights from this data?"
    }
  ];
}
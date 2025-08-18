'use client';

import React, { useState } from 'react';
import { Thread, Composer } from '@assistant-ui/react';
import { ChevronDown, ChevronUp, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AssistantProvider, useAssistantContext } from './AssistantProvider';
import { SuggestedPrompts } from './SuggestedPrompts';
import './assistant-overrides.css';

interface EmbeddedAssistantProps {
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
  const { context } = useAssistantContext();
  const [showSuggestions, setShowSuggestions] = useState(true);

  return (
    <div className="embedded-assistant-content">
      {showSuggestions && (
        <SuggestedPrompts 
          context={context}
          onSelect={() => setShowSuggestions(false)}
        />
      )}
      
      <Thread 
        className="compact-thread"
        style={{ maxHeight: `${maxHeight}px` }}
        components={{
          Composer: CompactComposer,
          Message: CompactMessage
        }}
      />
    </div>
  );
};

export const EmbeddedAssistant: React.FC<EmbeddedAssistantProps> = ({
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
            <AssistantProvider context={context} threadId={threadId}>
              <AssistantContent maxHeight={maxHeight} />
            </AssistantProvider>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact Message Component
const CompactMessage: React.FC<any> = ({ message, ...props }) => {
  const isUser = message.role === 'user';
  
  return (
    <div className={`compact-message ${isUser ? 'user' : 'assistant'}`} {...props}>
      <div className="message-content">
        {message.content}
      </div>
      {message.status === 'streaming' && (
        <span className="streaming-indicator">●</span>
      )}
    </div>
  );
};

// Compact Composer Component
const CompactComposer: React.FC<any> = (props) => {
  return (
    <Composer
      {...props}
      className="compact-composer"
      placeholder="Ask about this data..."
      autoFocus
    />
  );
};
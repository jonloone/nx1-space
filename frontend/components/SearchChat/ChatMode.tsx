'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Loader2, AlertCircle } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';
import type { ChatMessage } from './SearchChatBar';

interface ChatModeProps {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

// Extend ChatMessage type to include error flag
declare module './SearchChatBar' {
  interface ChatMessage {
    error?: boolean;
  }
}

export const ChatMode: React.FC<ChatModeProps> = ({
  messages,
  onMessagesChange,
  isLoading,
  onLoadingChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { domain, dataCache, selectedFeatures, viewState } = useMapStore();
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Process new user messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user' && !isLoading) {
      processUserMessage(lastMessage);
    }
  }, [messages, isLoading]);

  const processUserMessage = async (userMessage: ChatMessage) => {
    onLoadingChange(true);
    
    try {
      // Build context for LLM
      const context = {
        domain,
        viewState,
        selectedFeatures: selectedFeatures.slice(0, 5), // Limit to 5 features
        previousMessages: messages.slice(-10).map(m => ({ // Last 10 messages for context
          role: m.role as 'user' | 'assistant',
          content: m.content
        }))
      };

      // Check if streaming is supported
      const useStreaming = true; // Enable streaming by default

      if (useStreaming) {
        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();
        
        // Create placeholder message for streaming
        const aiMessageId = Date.now().toString();
        setStreamingMessageId(aiMessageId);
        setStreamingContent('');
        
        const placeholderMessage: ChatMessage = {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
        };
        onMessagesChange([...messages, placeholderMessage]);

        // Start streaming
        const response = await fetch('/api/llm/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userMessage.content,
            context,
            options: { stream: true }
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let accumulatedContent = '';

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  // Streaming complete
                  setStreamingMessageId(null);
                  setStreamingContent('');
                } else {
                  try {
                    const parsed = JSON.parse(data);
                    if (parsed.chunk) {
                      accumulatedContent += parsed.chunk;
                      setStreamingContent(accumulatedContent);
                    } else if (parsed.error) {
                      throw new Error(parsed.error);
                    }
                  } catch (e) {
                    console.error('Failed to parse stream chunk:', e);
                  }
                }
              }
            }
          }
        }

        // Update final message
        onMessagesChange(messages.map(m => 
          m.id === aiMessageId ? { ...m, content: accumulatedContent } : m
        ));
      } else {
        // Non-streaming fallback
        const response = await fetch('/api/llm/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: userMessage.content,
            context,
            options: { stream: false }
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `API error: ${response.status}`);
        }

        const data = await response.json();
        
        const aiMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response.content,
          timestamp: new Date(),
        };
        
        onMessagesChange([...messages, aiMessage]);
      }

    } catch (error: any) {
      console.error('Chat processing error:', error);
      
      // Clean up streaming state
      if (streamingMessageId) {
        setStreamingMessageId(null);
        setStreamingContent('');
      }
      
      let errorContent = 'Sorry, I encountered an error processing your request.';
      
      // Provide more specific error messages
      if (error.name === 'AbortError') {
        errorContent = 'Request was cancelled.';
      } else if (error.message.includes('API error: 401')) {
        errorContent = 'Authentication failed. Please check the API configuration.';
      } else if (error.message.includes('API error: 429')) {
        errorContent = 'Rate limit exceeded. Please wait a moment before trying again.';
      } else if (error.message.includes('API error: 500')) {
        errorContent = 'The AI service is temporarily unavailable. Please try again later.';
      }
      
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorContent,
        timestamp: new Date(),
        error: true,
      };
      onMessagesChange([...messages, errorMessage]);
    } finally {
      onLoadingChange(false);
      abortControllerRef.current = null;
    }
  };

  // Cancel ongoing request if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatMessage = (content: string) => {
    // Simple markdown parsing for bold text
    return content.split('\n').map((line, idx) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <div key={idx} className="chat-message-line">
          {parts.map((part, partIdx) => 
            partIdx % 2 === 0 ? part : <strong key={partIdx}>{part}</strong>
          )}
        </div>
      );
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: index * 0.05 }}
              className={`chat-message ${message.role}`}
            >
              <div className="chat-message-avatar">
                {message.role === 'user' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <Bot className="w-4 h-4" />
                )}
              </div>
              <div className="chat-message-content">
                {message.id === streamingMessageId && streamingContent
                  ? formatMessage(streamingContent)
                  : formatMessage(message.content)
                }
                {message.error && (
                  <div className="chat-error-indicator">
                    <AlertCircle className="w-3 h-3" />
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="chat-message assistant"
            >
              <div className="chat-message-avatar">
                <Bot className="w-4 h-4" />
              </div>
              <div className="chat-message-content">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      {messages.length === 0 && (
        <div className="chat-empty">
          <Bot className="w-8 h-8 mb-2 opacity-50" />
          <p>Ask me about ground stations, coverage, or network performance</p>
        </div>
      )}
    </div>
  );
};
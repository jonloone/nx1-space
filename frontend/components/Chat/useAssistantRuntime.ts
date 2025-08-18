'use client';

import { useEffect, useRef, useState } from 'react';
import { ASSISTANT_CONFIG } from '@/lib/services/llm/synthetic-adapter';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: Date;
}

interface Runtime {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  append: (message: { role: 'user' | 'assistant'; content: string }) => void;
  setMessages: (messages: Message[]) => void;
  setSystemMessage: (content: string) => void;
}

export function useAssistantRuntime(config: {
  api: string;
  context?: any;
  threadId?: string;
}): Runtime {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const append = async (message: { role: 'user' | 'assistant'; content: string }) => {
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: message.role,
      content: message.content,
      createdAt: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    if (message.role === 'user') {
      // Send to API for assistant response
      setIsLoading(true);
      setError(null);
      
      try {
        abortControllerRef.current = new AbortController();
        
        const response = await fetch(config.api, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content
            })),
            context: config.context,
            threadId: config.threadId
          }),
          signal: abortControllerRef.current.signal
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '',
          createdAt: new Date()
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        if (reader) {
          let accumulatedContent = '';
          
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;
                
                try {
                  const parsed = JSON.parse(data);
                  if (parsed.choices?.[0]?.delta?.content) {
                    accumulatedContent += parsed.choices[0].delta.content;
                    // Update the assistant message
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessage.id 
                        ? { ...m, content: accumulatedContent }
                        : m
                    ));
                  }
                } catch (e) {
                  // Ignore parse errors
                }
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('[Assistant Runtime] Error:', err);
          setError(err.message);
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const setSystemMessage = (content: string) => {
    // Add or update system message at the beginning
    setMessages(prev => {
      const filtered = prev.filter(m => m.role !== 'system');
      return [{
        id: 'system',
        role: 'system',
        content,
        createdAt: new Date()
      }, ...filtered];
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    append,
    setMessages,
    setSystemMessage
  };
}
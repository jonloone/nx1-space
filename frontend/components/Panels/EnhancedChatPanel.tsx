'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, MessageSquare, Bot, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMapStore } from '@/lib/store/mapStore';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  agent?: string;
}

interface EnhancedChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedChatPanel({ isOpen, onClose }: EnhancedChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI assistant for geospatial intelligence. I can help you analyze ground stations, optimize networks, assess business opportunities, and ensure regulatory compliance. What would you like to explore?',
      sender: 'assistant',
      timestamp: new Date(),
      agent: 'system'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { selectedFeatures, viewState, flyTo, selectFeature, domain } = useMapStore();
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Process actions from AI response
  const processActions = (actions: any[]) => {
    if (!actions || actions.length === 0) return;
    
    actions.forEach(action => {
      switch (action.type) {
        case 'flyTo':
          if (action.coordinates && action.coordinates.length === 2) {
            const [lng, lat] = action.coordinates;
            const zoom = action.zoom || 12;
            // Handle both stationName (ground stations) and locationName (GERS)
            const locationName = action.stationName || action.locationName || 'location';
            console.log(`Flying to ${locationName}: [${lng}, ${lat}] zoom ${zoom}`);
            flyTo(lng, lat, zoom);
            
            // Add a small delay to ensure the map has time to process the command
            setTimeout(() => {
              console.log(`Map should now be centered at ${locationName}`);
            }, 500);
          } else {
            console.error('Invalid flyTo action - missing coordinates:', action);
          }
          break;
          
        case 'selectFeature':
          if (action.feature) {
            console.log(`Selecting feature: ${action.feature.name}`);
            selectFeature(action.feature);
          }
          break;
          
        default:
          console.log('Unknown action type:', action.type);
      }
    });
  };
  
  // Send message to CrewAI API with retry logic
  const sendMessage = async (messageText: string, retryCount = 0) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      const response = await fetch('/api/crew/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageText,
          context: {
            selectedFeatures,
            viewState,
            domain
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.details || `API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle API errors in response
      if (data.error) {
        throw new Error(data.details || data.error);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        sender: 'assistant',
        timestamp: new Date(),
        agent: data.agent_used
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // Process any actions from the response
      if (data.actions && data.actions.length > 0) {
        // Small delay to let the message appear first
        setTimeout(() => {
          processActions(data.actions);
        }, 100);
      }
    } catch (error) {
      console.error(`Chat error (attempt ${retryCount + 1}):`, error);
      
      // Retry logic for network errors
      if (retryCount < maxRetries && (
        error.message.includes('NetworkError') || 
        error.message.includes('fetch') ||
        error.message.includes('Failed to fetch')
      )) {
        setTimeout(() => {
          sendMessage(messageText, retryCount + 1);
        }, retryDelay * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      let errorText = 'Sorry, I encountered an error connecting to the AI service.';
      
      if (error.message.includes('NetworkError')) {
        errorText += ' Please check your internet connection and try again.';
      } else if (error.message.includes('500')) {
        errorText += ' The AI service is temporarily unavailable. Please try again in a moment.';
      } else if (retryCount >= maxRetries) {
        errorText += ` Failed after ${maxRetries + 1} attempts. Please try again later.`;
      } else {
        errorText += ` Error: ${error.message}`;
      }
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorText,
        sender: 'assistant',
        timestamp: new Date(),
        agent: 'error'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };
  
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: 400, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 h-[400px] bg-black/95 backdrop-blur-xl border-t border-white/10 z-[1050]"
        >
          {/* Header */}
          <div className="p-3 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-blue-500/20 to-[#1d48e5]/20 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Assistant</h2>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="flex flex-col" style={{ height: 'calc(100% - 60px)' }}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex items-start gap-3 animate-in slide-in-from-bottom-2",
                    message.sender === 'user' ? 'flex-row-reverse' : ''
                  )}
                >
                  <div className={cn(
                    "p-2 rounded-lg shrink-0",
                    message.sender === 'user' 
                      ? 'bg-blue-500/20' 
                      : 'bg-gray-700/50'
                  )}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Bot className="w-4 h-4 text-green-400" />
                    )}
                  </div>
                  
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-lg",
                    message.sender === 'user'
                      ? 'bg-blue-500/20 text-white ml-auto'
                      : 'bg-gray-800/50 text-white/90'
                  )}>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap">
                      {message.text}
                    </div>
                    {message.agent && message.agent !== 'system' && (
                      <div className="text-xs text-white/50 mt-2">
                        Agent: {message.agent}
                      </div>
                    )}
                    <div className="text-xs text-white/40 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-700/50">
                    <Bot className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-100" />
                      <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-3 border-t border-white/10">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about stations, coverage, performance..."
                  className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-white/50 focus:outline-none focus:border-blue-400/50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-blue-500/20 hover:bg-blue-500/30 disabled:bg-gray-700/50 disabled:cursor-not-allowed rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4 text-blue-400" />
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
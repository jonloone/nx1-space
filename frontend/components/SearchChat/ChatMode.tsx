'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, User, Loader2 } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';
import type { ChatMessage } from './SearchChatBar';

interface ChatModeProps {
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
  isLoading: boolean;
  onLoadingChange: (loading: boolean) => void;
}

export const ChatMode: React.FC<ChatModeProps> = ({
  messages,
  onMessagesChange,
  isLoading,
  onLoadingChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { domain, dataCache, selectedFeatures } = useMapStore();

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
      // Simulate AI response based on the query
      let response = '';
      const query = userMessage.content.toLowerCase();

      if (query.includes('ground station') || query.includes('station')) {
        const stations = dataCache.get('ground-stations')?.stations || [];
        if (stations.length > 0) {
          response = `I found ${stations.length} ground stations in the current view:\n\n`;
          stations.slice(0, 5).forEach((station: any, idx: number) => {
            response += `${idx + 1}. **${station.name}**\n`;
            response += `   - Score: ${(station.score * 100).toFixed(1)}%\n`;
            response += `   - Utilization: ${(station.utilization * 100).toFixed(1)}%\n`;
            response += `   - Status: ${station.status}\n\n`;
          });
          if (stations.length > 5) {
            response += `...and ${stations.length - 5} more stations.`;
          }
        } else {
          response = 'No ground stations are currently loaded. Try zooming in or selecting the ground stations layer.';
        }
      } else if (query.includes('coverage') || query.includes('performance')) {
        response = `Based on the current data:\n\n`;
        response += `**Coverage Analysis:**\n`;
        response += `- Continental coverage: 87.3%\n`;
        response += `- Ocean coverage: 62.1%\n`;
        response += `- Average signal strength: -82.4 dBm\n\n`;
        response += `**Performance Metrics:**\n`;
        response += `- Network utilization: 73.2%\n`;
        response += `- Average latency: 142ms\n`;
        response += `- Packet loss rate: 0.03%\n\n`;
        response += `The network is performing within normal parameters with good continental coverage.`;
      } else if (query.includes('help') || query.includes('what can')) {
        response = `I can help you analyze and understand the NexusOne network data. Here are some things you can ask me:\n\n`;
        response += `**Data Analysis:**\n`;
        response += `- "Show me ground station performance"\n`;
        response += `- "What's the network coverage in this area?"\n`;
        response += `- "Analyze signal strength patterns"\n\n`;
        response += `**Navigation:**\n`;
        response += `- "Find stations near Los Angeles"\n`;
        response += `- "Show me maritime traffic"\n`;
        response += `- "Focus on high-utilization areas"\n\n`;
        response += `**Insights:**\n`;
        response += `- "What are the network bottlenecks?"\n`;
        response += `- "Compare coverage between regions"\n`;
        response += `- "Predict future capacity needs"`;
      } else if (selectedFeatures.length > 0) {
        const feature = selectedFeatures[0];
        response = `Looking at the selected ${feature.type || 'feature'}:\n\n`;
        response += `**${feature.name || 'Unknown'}**\n`;
        if (feature.score) response += `- Score: ${(feature.score * 100).toFixed(1)}%\n`;
        if (feature.utilization) response += `- Utilization: ${(feature.utilization * 100).toFixed(1)}%\n`;
        if (feature.coordinates) response += `- Location: [${feature.coordinates[0].toFixed(4)}, ${feature.coordinates[1].toFixed(4)}]\n`;
        response += `\nWould you like me to analyze this feature in more detail?`;
      } else {
        response = `I can help you analyze the ${domain} data. Try asking about:\n`;
        response += `- Network performance and coverage\n`;
        response += `- Ground station utilization\n`;
        response += `- Signal strength patterns\n`;
        response += `- Geographic distribution\n\n`;
        response += `You can also select features on the map for detailed analysis.`;
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      
      onMessagesChange([...messages, aiMessage]);
    } catch (error) {
      console.error('Chat processing error:', error);
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      onMessagesChange([...messages, errorMessage]);
    } finally {
      onLoadingChange(false);
    }
  };

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
                {formatMessage(message.content)}
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
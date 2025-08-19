'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, X, ArrowRight, Send } from 'lucide-react';
import { SearchMode } from './SearchMode';
import { ChatMode } from './ChatMode';
import { ModeToggle } from './components/ModeToggle';
import { cn } from '@/lib/utils';
import './SearchChatBar.css';

type Mode = 'search' | 'chat';

export interface SearchResult {
  id: string;
  name: string;
  type: 'location' | 'station' | 'feature';
  gersId?: string;
  coordinates?: [number, number];
  description?: string;
  metadata?: any;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: any;
}

export const SearchChatBar: React.FC = () => {
  const [mode, setMode] = useState<Mode>('search');
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
      // / to focus search
      else if (e.key === '/' && !isOpen) {
        e.preventDefault();
        setIsOpen(true);
        setMode('search');
      }
      // Escape to close
      else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (mode === 'search') {
      // Handle search
      setIsLoading(true);
      // SearchMode component will handle the actual search
    } else {
      // Handle chat
      const newMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: query,
        timestamp: new Date(),
      };
      setChatMessages([...chatMessages, newMessage]);
      setQuery('');
      setIsLoading(true);
      // ChatMode component will handle the response
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchResults([]);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <>
      {/* Main Search/Chat Bar */}
      <div className="search-chat-container">
        <AnimatePresence>
          {(query.trim() || searchResults.length > 0 || chatMessages.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="search-chat-results"
            >
              {mode === 'search' ? (
                <SearchMode
                  query={query}
                  results={searchResults}
                  onResultsChange={setSearchResults}
                  isLoading={isLoading}
                  onLoadingChange={setIsLoading}
                />
              ) : (
                <ChatMode
                  messages={chatMessages}
                  onMessagesChange={setChatMessages}
                  isLoading={isLoading}
                  onLoadingChange={setIsLoading}
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn("search-chat-bar", isOpen && "expanded")}
        >
          <form onSubmit={handleSubmit} className="search-chat-form">
            <div className="search-chat-input-group">
              <ModeToggle mode={mode} onModeChange={setMode} />
              
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={
                  mode === 'search' 
                    ? "Search locations, stations, or features..." 
                    : "Ask about ground stations, coverage, performance..."
                }
                className="search-chat-input"
                onFocus={() => setIsOpen(true)}
              />

              {query && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="search-chat-clear"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              <button
                type="submit"
                className="search-chat-submit"
                disabled={!query.trim() || isLoading}
              >
                {mode === 'search' ? (
                  <ArrowRight className="w-4 h-4" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

        </motion.div>
      </div>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="search-chat-backdrop"
            onClick={() => {
              setIsOpen(false);
              setQuery('');
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
};
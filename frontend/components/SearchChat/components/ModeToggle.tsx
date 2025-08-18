'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Search, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModeToggleProps {
  mode: 'search' | 'chat';
  onModeChange: (mode: 'search' | 'chat') => void;
}

export const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  // Handle Tab key for mode switching
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
        // Only prevent default if we're focused within the search/chat component
        const activeElement = document.activeElement;
        if (activeElement?.closest('.search-chat-container')) {
          e.preventDefault();
          onModeChange(mode === 'search' ? 'chat' : 'search');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, onModeChange]);

  return (
    <div className="mode-toggle-container">
      <button
        type="button"
        onClick={() => onModeChange('search')}
        className={cn(
          "mode-toggle-button",
          mode === 'search' && "active"
        )}
        aria-label="Search mode"
      >
        <Search className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => onModeChange('chat')}
        className={cn(
          "mode-toggle-button",
          mode === 'chat' && "active"
        )}
        aria-label="Chat mode"
      >
        <MessageSquare className="w-4 h-4" />
      </button>
      
      {/* Sliding indicator */}
      <motion.div
        className="mode-toggle-indicator"
        layoutId="mode-indicator"
        initial={false}
        animate={{
          x: mode === 'search' ? 0 : 40
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30
        }}
      />
    </div>
  );
};
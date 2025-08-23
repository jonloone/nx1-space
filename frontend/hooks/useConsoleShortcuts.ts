'use client';

import { useEffect, useState } from 'react';

interface UseConsoleShortcutsReturn {
  isConsoleOpen: boolean;
  toggleConsole: () => void;
}

export function useConsoleShortcuts(): UseConsoleShortcutsReturn {
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + ` to toggle console
      if ((event.ctrlKey || event.metaKey) && event.key === '`') {
        event.preventDefault();
        setIsConsoleOpen(prev => !prev);
      }
      
      // Ctrl/Cmd + K to focus console input
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        setIsConsoleOpen(true);
        // Focus will be handled by the AIConsole component
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleConsole = () => {
    setIsConsoleOpen(prev => !prev);
  };

  return {
    isConsoleOpen,
    toggleConsole
  };
}
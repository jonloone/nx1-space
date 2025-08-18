'use client';

import { useEffect, useState } from 'react';

export const ConsoleCapture: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    // Capture console logs
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const addLog = (type: string, args: any[]) => {
      const message = `[${type}] ${args.map(arg => {
        try {
          if (typeof arg === 'object' && arg !== null) {
            // Handle cyclic objects and errors
            const seen = new WeakSet();
            return JSON.stringify(arg, (key, value) => {
              if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                  return '[Circular]';
                }
                seen.add(value);
              }
              // Handle Error objects
              if (value instanceof Error) {
                return {
                  name: value.name,
                  message: value.message,
                  stack: value.stack
                };
              }
              return value;
            }, 2);
          }
          return String(arg);
        } catch (e) {
          return '[Object with cyclic reference]';
        }
      }).join(' ')}`;
      setLogs(prev => [...prev.slice(-20), message]); // Keep last 20 logs
    };
    
    console.log = (...args) => {
      originalLog(...args);
      addLog('LOG', args);
    };
    
    console.error = (...args) => {
      originalError(...args);
      addLog('ERROR', args);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      addLog('WARN', args);
    };
    
    // Initial log
    console.log('Console capture initialized');
    console.log('Window available:', typeof window !== 'undefined');
    console.log('Document available:', typeof document !== 'undefined');
    
    // Cleanup
    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      maxHeight: '300px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid #333',
      borderRadius: '4px',
      padding: '10px',
      overflow: 'auto',
      fontSize: '12px',
      fontFamily: 'monospace',
      color: '#fff',
      zIndex: 9999
    }}>
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Console Output:</div>
      {logs.map((log, i) => (
        <div 
          key={i} 
          style={{ 
            marginBottom: '4px',
            color: log.includes('[ERROR]') ? '#ff6b6b' : 
                   log.includes('[WARN]') ? '#ffd93d' : '#6bcf7f',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all'
          }}
        >
          {log}
        </div>
      ))}
      {logs.length === 0 && (
        <div style={{ color: '#666' }}>No console output yet...</div>
      )}
    </div>
  );
};
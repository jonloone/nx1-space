'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useConsoleShortcuts } from '@/hooks/useConsoleShortcuts';

interface CommandHistory {
  id: string;
  command: string;
  response: string;
  timestamp: Date;
  status: 'success' | 'error' | 'warning' | 'info';
  executionTime?: number;
}

interface CommandSuggestion {
  command: string;
  description: string;
  category: string;
}

// Category-specific command suggestions
const getCategorySuggestions = (category: string | null): CommandSuggestion[] => {
  const baseCommands = [
    { command: 'help', description: 'Show available commands', category: 'system' },
    { command: 'clear', description: 'Clear console output', category: 'system' },
    { command: 'history', description: 'Show command history', category: 'system' },
    { command: 'metrics', description: 'Show current metrics', category: 'system' },
  ];

  switch (category) {
    case 'ingest':
      return [
        ...baseCommands,
        { command: 'connect postgres', description: 'Connect to PostgreSQL database', category: 'ingest' },
        { command: 'import csv', description: 'Import CSV file', category: 'ingest' },
        { command: 'stream kafka', description: 'Set up Kafka streaming', category: 'ingest' },
        { command: 'list sources', description: 'Show available data sources', category: 'ingest' },
        { command: 'test connection', description: 'Test data source connection', category: 'ingest' },
        { command: 'show ingestion-rate', description: 'Display current ingestion metrics', category: 'ingest' },
      ];
    case 'process':
      return [
        ...baseCommands,
        { command: 'build pipeline', description: 'Create data pipeline', category: 'process' },
        { command: 'optimize query', description: 'Optimize slow queries', category: 'process' },
        { command: 'validate data', description: 'Run data validation', category: 'process' },
        { command: 'transform table', description: 'Apply transformations', category: 'process' },
        { command: 'schedule job', description: 'Schedule processing job', category: 'process' },
        { command: 'show pipeline-status', description: 'Display pipeline metrics', category: 'process' },
      ];
    case 'analyze':
      return [
        ...baseCommands,
        { command: 'query', description: 'Execute SQL query', category: 'analyze' },
        { command: 'profile', description: 'Profile dataset statistics', category: 'analyze' },
        { command: 'find anomalies', description: 'Detect data anomalies', category: 'analyze' },
        { command: 'create dashboard', description: 'Build visualization dashboard', category: 'analyze' },
        { command: 'explore', description: 'Interactive data exploration', category: 'analyze' },
        { command: 'show query-performance', description: 'Display query metrics', category: 'analyze' },
      ];
    case 'monitor':
      return [
        ...baseCommands,
        { command: 'set alert', description: 'Configure alert rules', category: 'monitor' },
        { command: 'check health', description: 'System health check', category: 'monitor' },
        { command: 'monitor quality', description: 'Data quality monitoring', category: 'monitor' },
        { command: 'view incidents', description: 'Show active incidents', category: 'monitor' },
        { command: 'test pipeline', description: 'Test pipeline health', category: 'monitor' },
        { command: 'show sla-status', description: 'Display SLA metrics', category: 'monitor' },
      ];
    default:
      return [
        ...baseCommands,
        { command: 'analyze', description: 'Analyze data quality and patterns', category: 'general' },
        { command: 'query', description: 'Execute SQL query', category: 'general' },
        { command: 'profile', description: 'Profile dataset statistics', category: 'general' },
        { command: 'export', description: 'Export results to various formats', category: 'general' },
      ];
  }
};

const getCategoryColor = (category: string | null) => {
  switch (category) {
    case 'ingest': return '#06b6d4'; // cyan
    case 'process': return '#a855f7'; // purple
    case 'analyze': return '#10b981'; // emerald
    case 'monitor': return '#f97316'; // orange
    default: return '#3990cf'; // blue
  }
};

const getCategoryPrompt = (category: string | null) => {
  const user = 'user';
  const host = 'nx1';
  switch (category) {
    case 'ingest': return `${user}@${host}:ingest`;
    case 'process': return `${user}@${host}:process`;
    case 'analyze': return `${user}@${host}:analyze`;
    case 'monitor': return `${user}@${host}:monitor`;
    default: return `${user}@${host}`;
  }
};

export default function AIConsole() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(0);
  const [hasShownWelcome, setHasShownWelcome] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const { currentTask, currentCategory } = useWorkspaceStore();
  const { isConsoleOpen, toggleConsole } = useConsoleShortcuts();

  // Get category-specific suggestions
  const commandSuggestions = getCategorySuggestions(currentCategory);

  // Auto-scroll to bottom when new output is added
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [history]);

  // Show welcome message when category changes
  useEffect(() => {
    if (currentCategory && !hasShownWelcome) {
      const welcomeMessage = getWelcomeMessage(currentCategory);
      if (welcomeMessage) {
        setHistory(prev => [...prev, {
          id: Date.now().toString(),
          command: '',
          response: welcomeMessage,
          timestamp: new Date(),
          status: 'info',
        }]);
        setHasShownWelcome(true);
      }
    }
  }, [currentCategory, hasShownWelcome]);

  // Reset welcome flag when category changes
  useEffect(() => {
    setHasShownWelcome(false);
  }, [currentCategory]);

  // Focus input when console opens
  useEffect(() => {
    if (isConsoleOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isConsoleOpen]);

  // Listen for Ctrl+K to focus input
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = commandSuggestions.filter(s =>
    s.command.toLowerCase().startsWith(input.toLowerCase()) ||
    s.description.toLowerCase().includes(input.toLowerCase())
  );

  const getWelcomeMessage = (category: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
    switch (category) {
      case 'ingest':
        return `[${timestamp}] Ingest agent activated. Ready for data source connections.\n[${timestamp}] Type 'help' for available commands or 'metrics' for current stats.`;
      case 'process':
        return `[${timestamp}] Process agent activated. Pipeline orchestration ready.\n[${timestamp}] Type 'help' for available commands or 'metrics' for current stats.`;
      case 'analyze':
        return `[${timestamp}] Analyze agent activated. Query engine initialized.\n[${timestamp}] Type 'help' for available commands or 'metrics' for current stats.`;
      case 'monitor':
        return `[${timestamp}] Monitor agent activated. Health checks enabled.\n[${timestamp}] Type 'help' for available commands or 'metrics' for current stats.`;
      default:
        return null;
    }
  };

  const formatTimestamp = () => {
    return new Date().toLocaleTimeString('en-US', { hour12: false });
  };

  const getMetrics = (category: string | null) => {
    const timestamp = formatTimestamp();
    switch (category) {
      case 'ingest':
        return `[${timestamp}] === Ingestion Metrics (DataDog/Kafka) ===
[${timestamp}] Ingestion Rate: 45,231 records/sec ↑12%
[${timestamp}] Active Sources: 15 (12 healthy, 2 warning, 1 error)
[${timestamp}] Kafka Lag: 1.2M messages (consumer group: main)
[${timestamp}] SQS Queue: 45K messages pending
[${timestamp}] Last Sync: 2 minutes ago (SUCCESS)
[${timestamp}] Error Rate: 0.02% (last hour)`;
      
      case 'process':
        return `[${timestamp}] === Pipeline Metrics (Airflow/dbt) ===
[${timestamp}] Pipeline Status: 8 running, 145 success, 2 failed (24h)
[${timestamp}] Processing Time: P50=234ms, P95=890ms, P99=2.1s
[${timestamp}] Resource Usage: CPU 67%, Memory 82%
[${timestamp}] Job Queue: 23 pending, 8 running
[${timestamp}] Transform Success: 99.7% (1.2M records/hour)
[${timestamp}] Spark Executors: 48/50 active`;
      
      case 'analyze':
        return `[${timestamp}] === Query Metrics (Databricks/Presto) ===
[${timestamp}] Active Queries: 34 concurrent users
[${timestamp}] Query Performance: Avg 1.2s, P95 4.5s
[${timestamp}] Cache Hit Rate: 87% (saved 2.3TB scans)
[${timestamp}] Resource Pools: 2 queued, 12ms avg wait
[${timestamp}] Data Freshness: Updated 15 min ago
[${timestamp}] Slow Queries: 3 queries >10s (last hour)`;
      
      case 'monitor':
        return `[${timestamp}] === Monitoring Metrics (DataDog/PagerDuty) ===
[${timestamp}] Alert Status: 2 active, 5 acknowledged, 28 resolved
[${timestamp}] SLA Compliance: 99.94% uptime (30 days)
[${timestamp}] Data Quality: Score 94/100, 3 failed tests
[${timestamp}] Schema Drift: 2 changes detected (non-breaking)
[${timestamp}] Incident MTTR: 12 minutes (30 day avg)
[${timestamp}] On-call: Team Alpha (rotation in 4 hours)`;
      
      default:
        return `[${timestamp}] No category selected. Use navigation to select a data lifecycle stage.`;
    }
  };

  const executeCommand = useCallback(async (command: string) => {
    if (!command.trim()) return;

    setIsProcessing(true);
    const startTime = Date.now();
    const timestamp = formatTimestamp();

    // Parse command
    const [cmd, ...args] = command.trim().split(' ');
    
    let response = '';
    let status: CommandHistory['status'] = 'success';

    // Handle built-in commands
    switch (cmd.toLowerCase()) {
      case 'clear':
        setHistory([]);
        setIsProcessing(false);
        return;
        
      case 'help':
        const categoryName = currentCategory ? currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1) : 'General';
        response = `[${timestamp}] Available ${categoryName} Commands:\n` +
          commandSuggestions
            .map(s => `[${timestamp}]   ${s.command.padEnd(20)} - ${s.description}`)
            .join('\n');
        break;
        
      case 'history':
        response = history
          .slice(-10)
          .map((h, i) => `[${timestamp}] ${(i + 1).toString().padStart(2)} | ${h.command}`)
          .join('\n');
        break;
        
      case 'metrics':
        response = getMetrics(currentCategory);
        break;
        
      case 'connect':
        if (currentCategory === 'ingest') {
          response = `[${timestamp}] Connecting to ${args[0] || 'database'}...\n` +
                    `[${timestamp}] Connection established (endpoint: prod-db.aws.internal)\n` +
                    `[${timestamp}] Schema discovered: 47 tables, 892 columns\n` +
                    `[${timestamp}] Ready for data import`;
          status = 'success';
        } else {
          response = `[${timestamp}] Error: 'connect' requires ingest context. Switch to Ingest category.`;
          status = 'error';
        }
        break;
        
      case 'build':
        if (currentCategory === 'process' && args[0] === 'pipeline') {
          response = `[${timestamp}] Initializing pipeline: ${args[1] || 'customer_etl'}\n` +
                    `[${timestamp}] Loading DAG template...\n` +
                    `[${timestamp}] Configuring transformations (dbt)\n` +
                    `[${timestamp}] Setting up data quality checks\n` +
                    `[${timestamp}] Pipeline created: ID=pipe_20240823_001`;
          status = 'success';
        } else {
          response = `[${timestamp}] Error: 'build pipeline' requires process context.`;
          status = 'error';
        }
        break;
        
      case 'query':
        if (currentCategory === 'analyze' || !currentCategory) {
          const queryTime = Math.floor(Math.random() * 2000) + 500;
          response = `[${timestamp}] Executing query...\n` +
                    `[${timestamp}] Query plan optimized (cost: 1247)\n` +
                    `[${timestamp}] Scanning partitions: 2024-08-20 to 2024-08-23\n` +
                    `[${timestamp}] \n` +
                    `[${timestamp}] category  | count  | avg_value\n` +
                    `[${timestamp}] ----------|--------|----------\n` +
                    `[${timestamp}] sales     | 12,847 | 1,247.32\n` +
                    `[${timestamp}] returns   | 1,023  | 234.12\n` +
                    `[${timestamp}] exchanges | 342    | 567.89\n` +
                    `[${timestamp}] \n` +
                    `[${timestamp}] Query completed in ${queryTime}ms (3 rows)`;
        } else {
          response = `[${timestamp}] Switching to Analyze context for query execution...`;
          status = 'info';
        }
        break;
        
      case 'set':
        if (currentCategory === 'monitor' && args[0] === 'alert') {
          response = `[${timestamp}] Creating alert rule...\n` +
                    `[${timestamp}] Type: Pipeline failure detection\n` +
                    `[${timestamp}] Threshold: 3 failures in 5 minutes\n` +
                    `[${timestamp}] Channels: #data-alerts (Slack), oncall@company.com\n` +
                    `[${timestamp}] Alert rule created: alert_rule_892`;
          status = 'success';
        } else {
          response = `[${timestamp}] Error: 'set alert' requires monitor context.`;
          status = 'error';
        }
        break;
        
      default:
        if (cmd) {
          response = `[${timestamp}] bash: ${cmd}: command not found\n[${timestamp}] Type 'help' for available commands`;
          status = 'error';
        }
    }

    const executionTime = Date.now() - startTime;

    // Add to history
    const historyEntry: CommandHistory = {
      id: Date.now().toString(),
      command,
      response,
      timestamp: new Date(),
      status,
      executionTime
    };

    setHistory(prev => [...prev, historyEntry]);
    setInput('');
    setHistoryIndex(-1);
    setIsProcessing(false);
    setShowSuggestions(false);
  }, [currentCategory, commandSuggestions, history]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      executeCommand(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestion(Math.max(0, selectedSuggestion - 1));
      } else if (historyIndex < history.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex].command);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestion(Math.min(filteredSuggestions.length - 1, selectedSuggestion + 1));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(history[history.length - 1 - newIndex].command);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (filteredSuggestions.length > 0) {
        setInput(filteredSuggestions[selectedSuggestion].command + ' ');
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getStatusColor = (status: CommandHistory['status']) => {
    switch (status) {
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      case 'info': return 'text-gray-400';
    }
  };

  return (
    <div 
      className="absolute bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 overflow-hidden z-50 font-mono"
      style={{ height: isConsoleOpen ? '420px' : '36px' }}
    >
      {/* Header with agent color block */}
      <div 
        className="flex items-center h-9 cursor-pointer hover:bg-gray-900 transition-colors relative"
        onClick={toggleConsole}
        style={{ borderTop: `3px solid ${getCategoryColor(currentCategory)}` }}
      >
        {/* Color block indicator */}
        <div 
          className="w-1 h-full"
          style={{ backgroundColor: getCategoryColor(currentCategory) }}
        />
        
        <div className="flex items-center justify-between flex-1 px-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-gray-500">{getCategoryPrompt(currentCategory)}</span>
            {currentCategory && (
              <span 
                className="px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${getCategoryColor(currentCategory)}20`,
                  color: getCategoryColor(currentCategory),
                  border: `1px solid ${getCategoryColor(currentCategory)}40`
                }}
              >
                {currentCategory} agent
              </span>
            )}
            {isProcessing && (
              <span className="text-gray-500">[processing...]</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span>ctrl+`</span>
            <span>{isConsoleOpen ? '▼' : '▲'}</span>
          </div>
        </div>
      </div>

      {isConsoleOpen && (
        <>
          {/* Output Area */}
          <div 
            ref={outputRef}
            className="overflow-y-auto bg-gray-950 text-xs leading-relaxed"
            style={{ height: 'calc(100% - 72px)' }}
          >
            <div className="p-3">
              <AnimatePresence>
                {history.map((entry) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mb-2"
                  >
                    {/* Command */}
                    {entry.command && (
                      <div className="flex items-start gap-2">
                        <span className="text-green-500">{getCategoryPrompt(currentCategory)}$</span>
                        <span className="text-gray-300">{entry.command}</span>
                      </div>
                    )}
                    
                    {/* Response */}
                    {entry.response && (
                      <pre className={`${getStatusColor(entry.status)} whitespace-pre-wrap ml-2`}>
                        {entry.response}
                      </pre>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Processing indicator */}
              {isProcessing && (
                <div className="text-gray-500">
                  [{formatTimestamp()}] Processing...
                </div>
              )}
            </div>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute bottom-9 left-0 right-0 bg-gray-900 border border-gray-800 max-h-48 overflow-y-auto">
              {filteredSuggestions.map((suggestion, index) => (
                <div
                  key={suggestion.command}
                  className={`px-3 py-2 text-xs hover:bg-gray-800 cursor-pointer ${
                    index === selectedSuggestion ? 'bg-gray-800' : ''
                  }`}
                  onClick={() => {
                    setInput(suggestion.command + ' ');
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">
                      {suggestion.command}
                    </span>
                    <span className="text-gray-600">
                      {suggestion.category}
                    </span>
                  </div>
                  <div className="text-gray-500 mt-1">
                    {suggestion.description}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="border-t border-gray-800 bg-gray-900 px-3 py-2 flex items-center gap-2 text-xs">
            <span className="text-green-500">{getCategoryPrompt(currentCategory)}$</span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
                setSelectedSuggestion(0);
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(input.length > 0)}
              placeholder=""
              className="flex-1 bg-transparent text-gray-300 outline-none placeholder-gray-700"
              disabled={isProcessing}
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
            />
            <span className="text-gray-700 animate-pulse">█</span>
          </div>
        </>
      )}
    </div>
  );
}
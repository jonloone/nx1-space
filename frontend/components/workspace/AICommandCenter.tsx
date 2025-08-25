'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { cn } from '@/lib/utils/cn';

interface AISuggestion {
  id: string;
  severity: 'critical' | 'warning' | 'info' | 'opportunity';
  icon: string;
  title: string;
  description: string;
  action: string;
  taskType: string;
  confidence: number;
}

interface SystemMetric {
  label: string;
  value: number | string;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  status: 'healthy' | 'warning' | 'critical';
}

interface HotSpot {
  id: string;
  name: string;
  type: 'pipeline' | 'quality' | 'performance' | 'error';
  severity: 'low' | 'medium' | 'high';
  metric?: string;
}

export function AICommandCenter() {
  const [command, setCommand] = useState('');
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [metrics, setMetrics] = useState<SystemMetric[]>([]);
  const [hotSpots, setHotSpots] = useState<HotSpot[]>([]);
  const [aiContext, setAiContext] = useState('Analyzing system state...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [greeting, setGreeting] = useState('');
  const commandRef = useRef<HTMLInputElement>(null);

  // Generate personalized greeting and initial analysis
  useEffect(() => {
    const hour = new Date().getHours();
    let timeGreeting = 'Good morning';
    if (hour >= 12 && hour < 17) timeGreeting = 'Good afternoon';
    if (hour >= 17) timeGreeting = 'Good evening';
    
    setGreeting(`${timeGreeting}! Let me analyze your system...`);
    
    // Simulate AI analysis
    setTimeout(() => {
      generateProactiveSuggestions();
      loadSystemMetrics();
      identifyHotSpots();
      setAiContext('Monitoring 12 active pipelines, 3 require attention');
    }, 1000);
  }, []);

  const generateProactiveSuggestions = () => {
    // In production, this would call AI service with system state
    const mockSuggestions: AISuggestion[] = [
      {
        id: '1',
        severity: 'critical',
        icon: '⚠️',
        title: 'Customer ETL pipeline failing',
        description: 'Last 3 runs failed with timeout errors',
        action: 'Review pipeline errors',
        taskType: 'pipeline-debug',
        confidence: 0.95
      },
      {
        id: '2',
        severity: 'opportunity',
        icon: '🚀',
        title: 'Optimization opportunity detected',
        description: 'Product dimension can be 40% faster',
        action: 'Run optimization wizard',
        taskType: 'performance-optimize',
        confidence: 0.87
      },
      {
        id: '3',
        severity: 'warning',
        icon: '📊',
        title: 'Data quality degradation',
        description: '23% duplicate records in customer dimension',
        action: 'Investigate duplicates',
        taskType: 'data-quality',
        confidence: 0.92
      }
    ];
    setSuggestions(mockSuggestions);
  };

  const loadSystemMetrics = () => {
    const mockMetrics: SystemMetric[] = [
      {
        label: 'Active Pipelines',
        value: '12/45',
        trend: 'stable',
        status: 'healthy'
      },
      {
        label: 'Data Quality',
        value: 94,
        unit: '%',
        trend: 'down',
        status: 'warning'
      },
      {
        label: 'Throughput',
        value: '2.3M',
        unit: 'records/hr',
        trend: 'up',
        status: 'healthy'
      },
      {
        label: 'Error Rate',
        value: 0.03,
        unit: '%',
        trend: 'up',
        status: 'warning'
      }
    ];
    setMetrics(mockMetrics);
  };

  const identifyHotSpots = () => {
    const mockHotSpots: HotSpot[] = [
      {
        id: '1',
        name: 'Customer ETL',
        type: 'pipeline',
        severity: 'high',
        metric: '3 failures'
      },
      {
        id: '2',
        name: 'Product Dimension',
        type: 'quality',
        severity: 'medium',
        metric: '23% duplicates'
      },
      {
        id: '3',
        name: 'API Gateway',
        type: 'error',
        severity: 'low',
        metric: '0.1% errors'
      }
    ];
    setHotSpots(mockHotSpots);
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setIsProcessing(true);
    setAiContext(`Processing: "${command}"`);

    // Simulate AI processing
    setTimeout(() => {
      // Open relevant task based on command
      const taskMapping: Record<string, string> = {
        'pipeline': 'build_pipeline',
        'quality': 'data_quality_assessment',
        'monitor': 'real_time_monitoring',
        'optimize': 'performance_tuning'
      };

      const matchedTask = Object.keys(taskMapping).find(key => 
        command.toLowerCase().includes(key)
      );

      if (matchedTask && (window as any).openTaskTab) {
        (window as any).openTaskTab(
          taskMapping[matchedTask],
          command,
          'fas fa-robot'
        );
      }

      setCommand('');
      setIsProcessing(false);
      setAiContext(`Opened task for: ${command}`);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: AISuggestion) => {
    setAiContext(`Launching: ${suggestion.title}`);
    
    // Open task with context - pass the context to help with smart pane configuration
    if ((window as any).openTaskTab) {
      (window as any).openTaskTab(
        suggestion.taskType,
        suggestion.title,
        suggestion.icon === '⚠️' ? 'fas fa-exclamation-triangle' : 
        suggestion.icon === '🚀' ? 'fas fa-rocket' : 'fas fa-chart-bar',
        {
          hasErrors: suggestion.severity === 'critical',
          source: 'ai-suggestion',
          priority: suggestion.severity === 'critical' ? 'high' : 'medium'
        }
      );
    }
  };

  const getMetricIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (!trend) return '';
    switch (trend) {
      case 'up': return '↑';
      case 'down': return '↓';
      case 'stable': return '→';
    }
  };

  const getMetricColor = (status: 'healthy' | 'warning' | 'critical') => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      case 'opportunity': return 'border-green-500 bg-green-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  return (
    <div className="h-full overflow-auto bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* AI Context Bar */}
        <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-lg px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">AI Focus:</span>
            <span className="text-sm text-gray-200">{aiContext}</span>
          </div>
          <button className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            <i className="fas fa-info-circle mr-1" />
            Why?
          </button>
        </div>

        {/* Hero Section - AI Command Bar */}
        <div className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-6">
          <div className="text-lg text-gray-300 mb-4 flex items-center gap-2">
            <i className="fas fa-magic text-blue-400" />
            {greeting}
          </div>
          
          <form onSubmit={handleCommand} className="relative">
            <input
              ref={commandRef}
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="What would you like to do? Try: 'check pipeline health' or 'analyze data quality'"
              className="w-full px-4 py-3 pr-12 bg-gray-950/50 border border-gray-700 rounded-lg 
                       text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 
                       transition-colors"
              disabled={isProcessing}
              autoFocus
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-400 
                       hover:text-blue-300 transition-colors disabled:opacity-50"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <i className="fas fa-spinner fa-spin" />
              ) : (
                <i className="fas fa-arrow-right" />
              )}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Quick commands:</span>
            {['build pipeline', 'check quality', 'monitor performance', 'investigate anomalies'].map(cmd => (
              <button
                key={cmd}
                onClick={() => setCommand(cmd)}
                className="text-xs px-2 py-1 bg-gray-800/50 text-gray-400 rounded 
                         hover:bg-gray-700/50 hover:text-gray-300 transition-colors"
              >
                {cmd}
              </button>
            ))}
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Suggested Actions */}
          <div className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <i className="fas fa-bullseye text-yellow-400" />
              Suggested Actions
            </h2>
            
            <div className="space-y-3">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    "w-full p-4 rounded-lg border transition-all hover:scale-[1.02]",
                    "flex items-start gap-3 text-left",
                    getSeverityColor(suggestion.severity)
                  )}
                >
                  <span className="text-2xl">{suggestion.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium text-gray-200">{suggestion.title}</div>
                    <div className="text-sm text-gray-400 mt-1">{suggestion.description}</div>
                    <div className="text-xs text-blue-400 mt-2 flex items-center gap-1">
                      <span>{suggestion.action}</span>
                      <i className="fas fa-arrow-right text-xs" />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {Math.round(suggestion.confidence * 100)}% conf
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Right Column - System Pulse */}
          <div className="space-y-6">
            {/* Metrics Grid */}
            <div className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-heartbeat text-red-400" />
                System Pulse
              </h2>
              
              <div className="grid grid-cols-2 gap-4">
                {metrics.map(metric => (
                  <div key={metric.label} className="bg-gray-800/30 rounded-lg p-3">
                    <div className="text-xs text-gray-500 mb-1">{metric.label}</div>
                    <div className="flex items-baseline gap-2">
                      <span className={cn("text-xl font-bold", getMetricColor(metric.status))}>
                        {metric.value}
                      </span>
                      {metric.unit && (
                        <span className="text-xs text-gray-500">{metric.unit}</span>
                      )}
                      {metric.trend && (
                        <span className={cn("text-sm", getMetricColor(metric.status))}>
                          {getMetricIcon(metric.trend)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hot Spots */}
            <div className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <i className="fas fa-fire text-orange-400" />
                Hot Spots
              </h2>
              
              <div className="space-y-2">
                {hotSpots.map(spot => (
                  <div
                    key={spot.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-800/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        spot.severity === 'high' ? 'bg-red-400' :
                        spot.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                      )} />
                      <span className="text-sm text-gray-300">{spot.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {spot.metric}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Start Actions */}
        <div className="bg-gray-900/30 backdrop-blur border border-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <i className="fas fa-rocket text-purple-400" />
            Quick Start
          </h2>
          
          <div className="flex flex-wrap gap-3">
            {[
              { icon: 'fas fa-plus', label: 'Build Pipeline', task: 'build_pipeline' },
              { icon: 'fas fa-check-circle', label: 'Test Quality', task: 'data_quality_assessment' },
              { icon: 'fas fa-chart-line', label: 'Monitor', task: 'real_time_monitoring' },
              { icon: 'fas fa-microscope', label: 'Analyze', task: 'exploratory_analysis' }
            ].map(action => (
              <button
                key={action.task}
                onClick={() => {
                  if ((window as any).openTaskTab) {
                    (window as any).openTaskTab(action.task, action.label, action.icon);
                  }
                }}
                className="px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg hover:bg-gray-700/50 
                         hover:text-white transition-all flex items-center gap-2"
              >
                <i className={action.icon} />
                {action.label}
              </button>
            ))}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Or describe what you need in the command bar above
          </div>
        </div>
      </div>
    </div>
  );
}
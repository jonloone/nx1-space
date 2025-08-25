'use client';

import React, { useState } from 'react';
import { useTaskStore, TASKS } from '@/stores/taskStore';
import { cn } from '@/lib/utils';

export function NaturalLanguageInput() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<typeof TASKS>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { startTask, selectedPersona, getTasksForPersona } = useTaskStore();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;
    
    setIsProcessing(true);
    
    // Simulate NLP processing to match intent to tasks
    await processNaturalLanguage(query);
    
    setIsProcessing(false);
  };
  
  const processNaturalLanguage = async (input: string) => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const lowercaseInput = input.toLowerCase();
    const personaTasks = getTasksForPersona(selectedPersona);
    
    // Simple keyword matching for demo
    const matches = personaTasks.filter(task => {
      const keywords = [
        ...task.title.toLowerCase().split(' '),
        ...task.description.toLowerCase().split(' '),
        task.category
      ];
      
      return keywords.some(keyword => lowercaseInput.includes(keyword));
    });
    
    if (matches.length > 0) {
      setSuggestions(matches);
    } else {
      // If no matches, suggest based on common intents
      const intents = detectIntent(lowercaseInput);
      const intentMatches = personaTasks.filter(task => 
        intents.includes(task.category)
      );
      setSuggestions(intentMatches.length > 0 ? intentMatches : personaTasks.slice(0, 3));
    }
  };
  
  const detectIntent = (input: string): string[] => {
    const intents: string[] = [];
    
    if (input.includes('build') || input.includes('create') || input.includes('new')) {
      intents.push('build');
    }
    if (input.includes('analyze') || input.includes('investigate') || input.includes('explore')) {
      intents.push('analyze', 'explore');
    }
    if (input.includes('optimize') || input.includes('improve') || input.includes('speed')) {
      intents.push('optimize');
    }
    if (input.includes('monitor') || input.includes('check') || input.includes('validate')) {
      intents.push('monitor');
    }
    if (input.includes('help') || input.includes('collaborate') || input.includes('request')) {
      intents.push('collaborate');
    }
    
    return intents.length > 0 ? intents : ['analyze'];
  };
  
  const handleSuggestionClick = (task: typeof TASKS[0]) => {
    startTask(task, query || `Execute ${task.title}`);
    setQuery('');
    setSuggestions([]);
  };
  
  const exampleQueries = [
    "I need to build a pipeline from S3 to Snowflake",
    "My query is running slow and needs optimization",
    "Show me data lineage for customer_orders table",
    "Create a dashboard for monthly revenue",
    "Test data quality for the sales dataset"
  ];
  
  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <i className="fas fa-wand-magic-sparkles absolute left-4 top-1/2 -translate-y-1/2 text-purple-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.length > 3) {
                processNaturalLanguage(e.target.value);
              } else {
                setSuggestions([]);
              }
            }}
            placeholder="What would you like to do? (e.g., 'build a pipeline', 'optimize my query', 'analyze trends')"
            className="w-full pl-12 pr-32 py-3 bg-[#111111] border border-[#222222] rounded-lg text-sm text-[#FAFAFA] placeholder-[#71717A] focus:outline-none focus:border-purple-500/50 transition-colors"
            disabled={isProcessing}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {isProcessing && (
              <i className="fas fa-spinner fa-spin text-purple-400 text-sm" />
            )}
            <button
              type="submit"
              disabled={!query.trim() || isProcessing}
              className="px-4 py-1.5 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium flex items-center gap-2"
            >
              <i className="fas fa-arrow-right text-xs" />
              Process
            </button>
          </div>
        </div>
        
        {/* Example Queries */}
        {!query && (
          <div className="absolute top-full mt-2 left-0 right-0 flex flex-wrap gap-2">
            <span className="text-xs text-[#71717A]">Try:</span>
            {exampleQueries.slice(0, 3).map((example, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setQuery(example)}
                className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
              >
                "{example}"
              </button>
            ))}
          </div>
        )}
      </form>
      
      {/* Suggestions Dropdown */}
      {suggestions.length > 0 && (
        <div className="absolute top-full mt-2 left-0 right-0 bg-[#111111] border border-[#222222] rounded-lg shadow-xl z-10">
          <div className="p-2">
            <div className="text-xs text-[#71717A] px-3 py-1">Suggested Tasks</div>
            {suggestions.map(task => (
              <button
                key={task.id}
                onClick={() => handleSuggestionClick(task)}
                className="w-full text-left px-3 py-2 hover:bg-[#1A1A1A] rounded-lg transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center flex-shrink-0">
                    <i className={cn(task.icon, "text-sm")} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm text-[#FAFAFA] group-hover:text-purple-400 transition-colors">
                      {task.title}
                    </div>
                    <div className="text-xs text-[#71717A]">
                      {task.description}
                    </div>
                  </div>
                  <i className="fas fa-arrow-right text-[#71717A] group-hover:text-purple-400 transition-colors text-sm" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
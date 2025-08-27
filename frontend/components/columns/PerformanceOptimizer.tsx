'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAIColumnAssistant } from '@/hooks/useAIColumnAssistant';

interface Bottleneck {
  id: string;
  name: string;
  type: 'query' | 'pipeline' | 'resource' | 'network';
  impact: 'high' | 'medium' | 'low';
  currentTime: string;
  potentialSaving: string;
  recommendation: string;
}

interface CostOptimization {
  id: string;
  resource: string;
  currentCost: string;
  potentialSaving: string;
  action: string;
  effort: 'easy' | 'medium' | 'complex';
}

interface QueryPerformance {
  id: string;
  query: string;
  avgTime: string;
  executions: number;
  cost: string;
  issue: string;
}

interface ScalingRecommendation {
  id: string;
  component: string;
  current: string;
  recommended: string;
  reason: string;
  impact: string;
}

export function PerformanceOptimizer() {
  const { handleAICommand } = useAIColumnAssistant();
  
  const [bottlenecks] = useState<Bottleneck[]>([
    {
      id: '1',
      name: 'Product dimension query',
      type: 'query',
      impact: 'high',
      currentTime: '45s',
      potentialSaving: '40s',
      recommendation: 'Add composite index on (category_id, status, updated_at)'
    },
    {
      id: '2',
      name: 'Customer ETL pipeline',
      type: 'pipeline',
      impact: 'medium',
      currentTime: '35 min',
      potentialSaving: '15 min',
      recommendation: 'Parallelize transformation steps'
    },
    {
      id: '3',
      name: 'Spark cluster memory',
      type: 'resource',
      impact: 'high',
      currentTime: 'N/A',
      potentialSaving: '30% faster',
      recommendation: 'Increase executor memory from 4GB to 8GB'
    }
  ]);

  const [costOptimizations] = useState<CostOptimization[]>([
    {
      id: '1',
      resource: 'Unused dev cluster',
      currentCost: '$1,200/mo',
      potentialSaving: '$1,200/mo',
      action: 'Terminate idle cluster',
      effort: 'easy'
    },
    {
      id: '2',
      resource: 'Over-provisioned storage',
      currentCost: '$3,500/mo',
      potentialSaving: '$800/mo',
      action: 'Archive old data to cold storage',
      effort: 'medium'
    },
    {
      id: '3',
      resource: 'Unoptimized queries',
      currentCost: '$450/mo',
      potentialSaving: '$300/mo',
      action: 'Implement query caching',
      effort: 'easy'
    }
  ]);

  const [slowQueries] = useState<QueryPerformance[]>([
    {
      id: '1',
      query: 'SELECT * FROM sales_fact JOIN ...',
      avgTime: '45s',
      executions: 1250,
      cost: '$125',
      issue: 'Full table scan on 45M rows'
    },
    {
      id: '2',
      query: 'UPDATE inventory SET ...',
      avgTime: '12s',
      executions: 5400,
      cost: '$89',
      issue: 'Missing WHERE clause index'
    },
    {
      id: '3',
      query: 'SELECT COUNT(DISTINCT ...',
      avgTime: '8s',
      executions: 8900,
      cost: '$67',
      issue: 'Expensive DISTINCT operation'
    }
  ]);

  const [scalingRecommendations] = useState<ScalingRecommendation[]>([
    {
      id: '1',
      component: 'API Gateway',
      current: '2 nodes',
      recommended: '4 nodes',
      reason: 'Peak traffic exceeds capacity',
      impact: 'Reduce latency by 60%'
    },
    {
      id: '2',
      component: 'Kafka Cluster',
      current: '3 brokers',
      recommended: '5 brokers',
      reason: 'Message lag increasing',
      impact: 'Handle 2x throughput'
    }
  ]);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'complex': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleBottleneckClick = async (bottleneck: Bottleneck) => {
    await handleAICommand({
      type: 'workflow',
      target: 'optimize_bottleneck',
      params: { bottleneckId: bottleneck.id, type: bottleneck.type }
    });
  };

  const handleOptimizationClick = async (optimization: CostOptimization) => {
    await handleAICommand({
      type: 'workflow',
      target: 'apply_cost_optimization',
      params: { optimizationId: optimization.id, effort: optimization.effort }
    });
  };

  const handleQueryClick = async (query: QueryPerformance) => {
    await handleAICommand({
      type: 'workflow',
      target: 'optimize_query',
      params: { queryId: query.id, issue: query.issue }
    });
  };

  const totalSavings = costOptimizations.reduce((sum, opt) => {
    return sum + parseInt(opt.potentialSaving.replace(/[^0-9]/g, ''));
  }, 0);

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-200">
      {/* Summary Header */}
      <div className="flex-shrink-0 p-4 bg-gradient-to-r from-[#1d48e5]/10 to-blue-500/10 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-300">Optimization Potential</h3>
          <span className="text-lg font-bold text-green-400">
            ${totalSavings.toLocaleString()}/mo
          </span>
        </div>
        <div className="text-xs text-gray-400">
          3 critical bottlenecks • 6 optimization opportunities
        </div>
      </div>

      {/* Bottleneck Detection */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Bottleneck Detection</h3>
        <div className="space-y-2">
          {bottlenecks.map(bottleneck => (
            <button
              key={bottleneck.id}
              onClick={() => handleBottleneckClick(bottleneck)}
              className="w-full p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{bottleneck.name}</span>
                <span className={cn("text-xs", getImpactColor(bottleneck.impact))}>
                  {bottleneck.impact} impact
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Current: {bottleneck.currentTime}</span>
                <span className="text-green-400">Save: {bottleneck.potentialSaving}</span>
              </div>
              <div className="text-xs text-[#1d48e5] bg-[#1d48e5]/10 p-2 rounded">
                💡 {bottleneck.recommendation}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cost Optimization */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Cost Optimization</h3>
        <div className="space-y-2">
          {costOptimizations.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleOptimizationClick(opt)}
              className="w-full p-3 bg-gray-900/30 hover:bg-gray-800/30 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-white">{opt.resource}</span>
                <span className={cn("text-xs", getEffortColor(opt.effort))}>
                  {opt.effort}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-400">Current: {opt.currentCost}</span>
                <span className="text-green-400">Save: {opt.potentialSaving}</span>
              </div>
              <div className="text-xs text-gray-300">{opt.action}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Query Performance */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Slow Queries</h3>
        <div className="space-y-2">
          {slowQueries.map(query => (
            <button
              key={query.id}
              onClick={() => handleQueryClick(query)}
              className="w-full p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
            >
              <div className="font-mono text-xs text-gray-300 mb-2 truncate">
                {query.query}
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span>{query.avgTime} avg</span>
                <span>{query.executions} runs</span>
                <span className="text-yellow-400">{query.cost}</span>
              </div>
              <div className="text-xs text-red-400">
                ⚠️ {query.issue}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scaling Recommendations */}
      <div className="flex-shrink-0 p-4 bg-gray-900/50 border-t border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Scaling Recommendations</h3>
        <div className="space-y-2">
          {scalingRecommendations.map(rec => (
            <div key={rec.id} className="p-2 bg-gray-800/30 rounded">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="font-medium text-white">{rec.component}</span>
                <span className="text-green-400">{rec.impact}</span>
              </div>
              <div className="text-xs text-gray-400">
                {rec.current} → {rec.recommended}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
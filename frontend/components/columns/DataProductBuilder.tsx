'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils/cn';
import { useAIColumnAssistant } from '@/hooks/useAIColumnAssistant';

interface DataProduct {
  id: string;
  name: string;
  status: 'active' | 'building' | 'failed';
  lastUpdated: string;
  recordCount: string;
  quality: number;
}

interface QuickTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  task: string;
}

export function DataProductBuilder() {
  const { handleAICommand } = useAIColumnAssistant();
  
  const [activeProducts] = useState<DataProduct[]>([
    {
      id: '1',
      name: 'Customer 360',
      status: 'building',
      lastUpdated: '5 min ago',
      recordCount: '1.2M',
      quality: 92
    },
    {
      id: '2',
      name: 'Sales Analytics',
      status: 'active',
      lastUpdated: '2 hours ago',
      recordCount: '3.4M',
      quality: 98
    },
    {
      id: '3',
      name: 'Risk Metrics',
      status: 'failed',
      lastUpdated: '1 hour ago',
      recordCount: '450K',
      quality: 76
    }
  ]);

  const [quickTemplates] = useState<QuickTemplate[]>([
    {
      id: '1',
      name: 'Customer 360',
      icon: '👤',
      description: 'Unified customer view',
      task: 'build_customer_360'
    },
    {
      id: '2',
      name: 'Sales Analytics',
      icon: '📊',
      description: 'Sales performance metrics',
      task: 'build_sales_analytics'
    },
    {
      id: '3',
      name: 'Inventory Tracking',
      icon: '📦',
      description: 'Real-time inventory',
      task: 'build_inventory'
    }
  ]);

  const [dataSources] = useState([
    { name: 'customer_db', quality: 95, records: '2.3M', status: 'healthy' },
    { name: 'transaction_log', quality: 88, records: '45M', status: 'warning' },
    { name: 'product_catalog', quality: 99, records: '125K', status: 'healthy' },
    { name: 'crm_export', quality: 72, records: '890K', status: 'critical' }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'building': return 'text-yellow-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getQualityColor = (quality: number) => {
    if (quality >= 90) return 'text-green-400';
    if (quality >= 70) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleProductClick = async (product: DataProduct) => {
    if (product.status === 'failed') {
      // Open debugging workflow
      await handleAICommand({
        type: 'workflow',
        target: 'debug_data_product',
        params: { productId: product.id }
      });
    } else {
      // Open product management workflow
      await handleAICommand({
        type: 'workflow',
        target: 'manage_data_product',
        params: { productId: product.id }
      });
    }
  };

  const handleTemplateClick = async (template: QuickTemplate) => {
    await handleAICommand({
      type: 'workflow',
      target: template.task
    });
  };

  return (
    <div className="h-full flex flex-col bg-gray-950 text-gray-200">
      {/* Active Projects Section */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Active Projects</h3>
        <div className="space-y-2">
          {activeProducts.map(product => (
            <button
              key={product.id}
              onClick={() => handleProductClick(product)}
              className="w-full p-3 bg-gray-900/50 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-white">{product.name}</span>
                <span className={cn('text-xs', getStatusColor(product.status))}>
                  {product.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{product.recordCount} records</span>
                <span className={getQualityColor(product.quality)}>
                  {product.quality}% quality
                </span>
              </div>
              {product.status === 'failed' && (
                <div className="mt-2 text-xs text-red-400">
                  ⚠️ Pipeline failed - click to investigate
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Templates */}
      <div className="flex-shrink-0 p-4 border-b border-gray-800">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Quick Templates</h3>
        <div className="grid grid-cols-3 gap-2">
          {quickTemplates.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template)}
              className="p-3 bg-gray-900/30 hover:bg-gray-800/50 rounded-lg transition-all hover:scale-105"
            >
              <div className="text-2xl mb-1">{template.icon}</div>
              <div className="text-xs font-medium text-gray-200">{template.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Data Source Browser */}
      <div className="flex-1 overflow-auto p-4">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">Available Data Sources</h3>
        <div className="space-y-2">
          {dataSources.map(source => (
            <div
              key={source.name}
              className="p-3 bg-gray-900/30 rounded-lg hover:bg-gray-800/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-sm text-white">{source.name}</span>
                <div className={cn(
                  'w-2 h-2 rounded-full',
                  source.status === 'healthy' ? 'bg-green-400' :
                  source.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                )} />
              </div>
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{source.records}</span>
                <span className={getQualityColor(source.quality)}>
                  {source.quality}% quality
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestion Footer */}
      <div className="flex-shrink-0 p-4 bg-gray-900/50 border-t border-gray-800">
        <div className="flex items-start gap-2">
          <div className="w-1 h-1 bg-[#1d48e5] rounded-full mt-1.5 animate-pulse" />
          <div>
            <div className="text-xs text-[#1d48e5] mb-1">AI Suggestion</div>
            <div className="text-xs text-gray-300">
              Customer ETL has failed 3 times. Would you like me to investigate the schema changes?
            </div>
            <button className="mt-2 text-xs text-[#1d48e5] hover:text-[#1d48e5]/70">
              → Start Investigation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
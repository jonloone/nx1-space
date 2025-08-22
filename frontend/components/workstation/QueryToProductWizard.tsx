'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { processNaturalLanguage } from '@/lib/mock/agentResponses';
import { mockDataProducts } from '@/lib/mock/dataProducts';
import { useWorkstationStore } from '@/stores/workstationStore';

type WizardStage = 'input' | 'analysis' | 'design' | 'validation' | 'published';

interface QueryToProductWizardProps {
  onClose?: () => void;
}

export function QueryToProductWizard({ onClose }: QueryToProductWizardProps) {
  const [stage, setStage] = useState<WizardStage>('input');
  const [query, setQuery] = useState('');
  const [productSpec, setProductSpec] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const { setCurrentTask } = useWorkstationStore();

  const stages: WizardStage[] = ['input', 'analysis', 'design', 'validation', 'published'];
  
  const stageInfo = {
    input: { name: 'Query Input', icon: 'fas fa-code', color: 'text-blue-400' },
    analysis: { name: 'Analysis', icon: 'fas fa-microscope', color: 'text-purple-400' },
    design: { name: 'Design', icon: 'fas fa-drafting-compass', color: 'text-green-400' },
    validation: { name: 'Validation', icon: 'fas fa-shield-alt', color: 'text-orange-400' },
    published: { name: 'Published', icon: 'fas fa-rocket', color: 'text-cyan-400' }
  };

  const handleQuerySubmit = async () => {
    setIsProcessing(true);
    setStage('analysis');
    setAnalysisComplete(false);
    
    // Simulate agent analysis
    setTimeout(() => {
      setAgents([
        { name: 'Query Analyzer', status: 'complete', finding: '3 table joins detected' },
        { name: 'Query Optimizer', status: 'complete', finding: '86% improvement possible' },
        { name: 'Semantic Enricher', status: 'processing', finding: 'Mapping to business glossary...' }
      ]);
    }, 1000);

    setTimeout(() => {
      setAgents(prev => [
        ...prev.map(a => ({ ...a, status: 'complete' })),
        { name: 'Quality Engineer', status: 'complete', finding: '23% duplicate records found' }
      ]);
      setAnalysisComplete(true);
      setIsProcessing(false);
      
      // Generate mock product spec
      setProductSpec({
        openDataProductSpecVersion: '3.1',
        product: {
          id: `dp-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Customer 360 Analytics',
          description: 'Comprehensive customer view with order history',
          domain: 'Customer Intelligence',
          status: 'draft',
          version: '0.1.0'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          dataProductOwner: {
            name: 'Data Engineering Team',
            email: 'data-eng@company.com'
          },
          tags: ['customer', '360-view', 'analytics', 'marketing']
        },
        dataAccess: {
          interface: {
            api: { type: 'REST', endpoint: '/api/v1/customer360' },
            sql: { type: 'SQL', view: 'analytics.customer_360' },
            stream: { type: 'Kafka', topic: 'customer-updates' }
          },
          format: ['JSON', 'Parquet', 'CSV']
        },
        dataQuality: {
          sla: {
            availability: '99.5%',
            responseTime: '<2s',
            updateFrequency: '15 minutes'
          },
          qualityMetrics: {
            completeness: 0.95,
            accuracy: 0.98,
            consistency: 0.92,
            timeliness: 0.99
          }
        }
      });
    }, 3000);
  };

  const handleComplete = () => {
    // Return to task selector
    setCurrentTask('idle');
  };

  const getStageIndex = (s: WizardStage) => stages.indexOf(s);
  const currentIndex = getStageIndex(stage);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-3xl font-serif-display text-gray-100">Query to Data Product</h1>
            <p className="text-sm text-gray-500 mt-1 font-sans-ui">Transform your SQL into an ODPS-compliant data product</p>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-8 pb-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              {stages.map((s, idx) => {
                const info = stageInfo[s];
                const isActive = idx === currentIndex;
                const isComplete = idx < currentIndex;
                
                return (
                  <React.Fragment key={s}>
                    <div className="flex flex-col items-center gap-2">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-all",
                        isActive && "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50",
                        isComplete && "bg-green-500/20 border border-green-500/50",
                        !isActive && !isComplete && "bg-gray-800/50 border border-gray-700/50"
                      )}>
                        <i className={cn(
                          info.icon,
                          isActive && info.color,
                          isComplete && "text-green-400",
                          !isActive && !isComplete && "text-gray-600"
                        )} />
                      </div>
                      <span className={cn(
                        "text-xs font-sans-ui",
                        isActive && "text-gray-200",
                        !isActive && "text-gray-600"
                      )}>
                        {info.name}
                      </span>
                    </div>
                    {idx < stages.length - 1 && (
                      <div className={cn(
                        "flex-1 h-0.5 transition-all",
                        idx < currentIndex ? "bg-green-500/30" : "bg-gray-800"
                      )} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stage Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            {stage === 'input' && (
              <QueryInputStage
                query={query}
                onChange={setQuery}
                onSubmit={handleQuerySubmit}
              />
            )}
            
            {stage === 'analysis' && (
              <AnalysisStage 
                agents={agents} 
                query={query}
                analysisComplete={analysisComplete}
                onContinue={() => setStage('design')}
              />
            )}
            
            {stage === 'design' && (
              <DesignStage
                productSpec={productSpec}
                onEdit={setProductSpec}
                onContinue={() => setStage('validation')}
              />
            )}
            
            {stage === 'validation' && (
              <ValidationStage
                productSpec={productSpec}
                onContinue={() => setStage('published')}
              />
            )}
            
            {stage === 'published' && (
              <PublishedStage
                productSpec={productSpec}
                onComplete={handleComplete}
              />
            )}
          </div>
        </div>

        {/* Agent Activity Panel */}
        {agents.length > 0 && stage !== 'input' && stage !== 'published' && (
          <div className="px-8 pb-6">
            <div className="max-w-7xl mx-auto">
              <div className="p-4 bg-gray-900/50 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <i className="fas fa-robot text-blue-400 text-sm" />
                  <span className="text-sm font-sans-ui text-gray-400">Agent Activity</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {agents.map((agent, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        agent.status === 'complete' && "bg-green-400",
                        agent.status === 'processing' && "bg-blue-400 animate-pulse",
                        agent.status === 'pending' && "bg-gray-600"
                      )} />
                      <span className="text-gray-500">{agent.name}:</span>
                      <span className="text-gray-400">{agent.finding}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Query Input Stage
function QueryInputStage({ query, onChange, onSubmit }: any) {
  const examples = [
    {
      title: 'Customer Analytics',
      query: `SELECT 
  c.id, c.name, c.email,
  COUNT(o.id) as order_count,
  SUM(o.total) as lifetime_value
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE c.created_at > '2024-01-01'
GROUP BY c.id, c.name, c.email`
    },
    {
      title: 'Product Performance',
      query: `SELECT 
  p.category,
  COUNT(DISTINCT p.id) as products,
  AVG(r.rating) as avg_rating
FROM products p
JOIN reviews r ON p.id = r.product_id
GROUP BY p.category`
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-sans-ui text-gray-400 mb-2">
          Enter your SQL query or describe what you need
        </label>
        <textarea
          value={query}
          onChange={(e) => onChange(e.target.value)}
          placeholder="SELECT * FROM customers WHERE..."
          className="w-full h-64 p-4 glass-panel border border-gray-800 rounded-xl font-mono text-sm text-gray-200 placeholder:text-gray-600 focus:border-blue-500/50 focus:outline-none resize-none"
        />
      </div>

      <div>
        <p className="text-sm text-gray-500 mb-3 font-sans-ui">Or try an example:</p>
        <div className="grid grid-cols-2 gap-4">
          {examples.map((example, idx) => (
            <button
              key={idx}
              onClick={() => onChange(example.query)}
              className="p-4 glass-panel hover:border-blue-500/30 rounded-lg text-left transition-all"
            >
              <h3 className="font-sans-ui font-medium text-gray-300 mb-2">{example.title}</h3>
              <code className="text-xs text-gray-500 line-clamp-3">{example.query}</code>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onSubmit}
        disabled={!query.trim()}
        className="w-full py-3 glass-button disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <i className="fas fa-magic" />
        <span className="font-sans-ui font-medium">Analyze Query</span>
      </button>
    </div>
  );
}

// Analysis Stage
function AnalysisStage({ agents, query, analysisComplete, onContinue }: any) {
  const findings = [
    { title: 'Query Complexity', icon: 'fas fa-code-branch', items: ['3 table joins detected', 'Aggregation on 2.3M rows', 'Missing index on customer_id'] },
    { title: 'Optimization', icon: 'fas fa-tachometer-alt', items: ['86% improvement possible', 'Materialized view recommended', 'Partition by created_at'] },
    { title: 'Business Context', icon: 'fas fa-briefcase', items: ['Maps to Customer 360 domain', 'Used by Marketing team', 'Critical for campaigns'] },
    { title: 'Data Quality', icon: 'fas fa-shield-alt', items: ['23% duplicate customers', '15% missing emails', 'Schema drift detected'] }
  ];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-gray-900/30 rounded-xl">
        <p className="text-xs text-gray-500 font-mono mb-2">Analyzing query...</p>
        <code className="text-sm text-gray-400 font-mono line-clamp-3">{query}</code>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {findings.map((finding, idx) => (
          <div key={idx} className="p-4 glass-panel rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg flex items-center justify-center">
                <i className={cn(finding.icon, "text-blue-400")} />
              </div>
              <h3 className="font-sans-ui font-medium text-gray-200">{finding.title}</h3>
            </div>
            <ul className="space-y-1">
              {finding.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-400">
                  <i className="fas fa-check text-green-400 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      
      {analysisComplete && (
        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="px-6 py-3 glass-button rounded-lg flex items-center gap-2"
          >
            <span className="font-sans-ui font-medium">Confirm Analysis & Continue to Design</span>
            <i className="fas fa-arrow-right" />
          </button>
        </div>
      )}
    </div>
  );
}

// Design Stage
function DesignStage({ productSpec, onEdit, onContinue }: any) {
  const [activeTab, setActiveTab] = useState('metadata');
  
  const tabs = [
    { id: 'metadata', label: 'ODPS Metadata', icon: 'fas fa-file-alt' },
    { id: 'access', label: 'Access Patterns', icon: 'fas fa-network-wired' },
    { id: 'quality', label: 'Quality SLAs', icon: 'fas fa-chart-line' },
    { id: 'contract', label: 'Data Contract', icon: 'fas fa-handshake' }
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-900/50 rounded-lg">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2",
              activeTab === tab.id ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
            )}
          >
            <i className={tab.icon} />
            <span className="font-sans-ui text-sm">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'metadata' && productSpec && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-sans-ui">Product Name</label>
                <input
                  value={productSpec.product.name}
                  onChange={(e) => onEdit({
                    ...productSpec,
                    product: { ...productSpec.product, name: e.target.value }
                  })}
                  className="w-full mt-1 p-2 glass-panel border border-gray-800 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-sans-ui">Domain</label>
                <input
                  value={productSpec.product.domain}
                  onChange={(e) => onEdit({
                    ...productSpec,
                    product: { ...productSpec.product, domain: e.target.value }
                  })}
                  className="w-full mt-1 p-2 glass-panel border border-gray-800 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-sans-ui">Description</label>
              <textarea
                value={productSpec.product.description}
                onChange={(e) => onEdit({
                  ...productSpec,
                  product: { ...productSpec.product, description: e.target.value }
                })}
                className="w-full mt-1 p-2 glass-panel border border-gray-800 rounded-lg text-sm h-20"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-sans-ui">Tags</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {productSpec.metadata.tags.map((tag: string) => (
                  <span key={tag} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'access' && productSpec && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {Object.entries(productSpec.dataAccess.interface).map(([type, config]: [string, any]) => (
                <div key={type} className="p-4 glass-panel rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <i className={cn(
                      type === 'api' && 'fas fa-plug',
                      type === 'sql' && 'fas fa-database',
                      type === 'stream' && 'fas fa-water',
                      'text-blue-400'
                    )} />
                    <span className="font-sans-ui font-medium text-gray-200 uppercase text-xs">{type}</span>
                  </div>
                  <div className="space-y-1 text-xs text-gray-400">
                    <div>Type: {config.type}</div>
                    <div>{config.endpoint || config.view || config.topic}</div>
                  </div>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 font-sans-ui">Supported Formats</label>
              <div className="flex gap-2 mt-2">
                {productSpec.dataAccess.format.map((format: string) => (
                  <span key={format} className="px-3 py-1 bg-gray-800 rounded text-xs text-gray-400">
                    {format}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quality' && productSpec && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 glass-panel rounded-lg">
                <h3 className="font-sans-ui font-medium text-gray-200 mb-3">SLA Targets</h3>
                <div className="space-y-2">
                  {Object.entries(productSpec.dataQuality.sla).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      <span className="text-gray-300">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 glass-panel rounded-lg">
                <h3 className="font-sans-ui font-medium text-gray-200 mb-3">Quality Metrics</h3>
                <div className="space-y-2">
                  {Object.entries(productSpec.dataQuality.qualityMetrics).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-500 capitalize">{key}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
                            style={{ width: `${(value as number) * 100}%` }}
                          />
                        </div>
                        <span className="text-gray-300 text-xs">{((value as number) * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contract' && (
          <div className="space-y-4">
            <div className="p-4 glass-panel rounded-lg">
              <h3 className="font-sans-ui font-medium text-gray-200 mb-3">Data Contract</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">Schema Version</span>
                  <p className="text-sm text-gray-300 mt-1">v1.0.0 - 5 columns, 3 relationships</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Governance</span>
                  <p className="text-sm text-gray-300 mt-1">90 day retention, PII masked, GDPR compliant</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Quality Rules</span>
                  <p className="text-sm text-gray-300 mt-1">Automated monitoring, daily validation</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 glass-button rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <span className="font-sans-ui font-medium">Continue to Validation</span>
        <i className="fas fa-arrow-right" />
      </button>
    </div>
  );
}

// Validation Stage
function ValidationStage({ productSpec, onContinue }: any) {
  const validationResults = [
    { category: 'ODPS Compliance', score: 92, status: 'pass', issues: ['Missing optional field: pricing.discount'] },
    { category: 'Data Quality', score: 87, status: 'pass', issues: ['Completeness below target (95% < 97%)'] },
    { category: 'Security', score: 100, status: 'pass', issues: [] },
    { category: 'Performance', score: 78, status: 'warning', issues: ['Query time exceeds SLA (2.3s > 2s)', 'Consider materialization'] }
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-check-circle text-green-400 text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-serif-display text-gray-100">Ready to Publish</h3>
            <p className="text-sm text-gray-400 mt-1">Your data product meets all requirements</p>
          </div>
          <div className="ml-auto text-right">
            <div className="text-3xl font-bold text-green-400">89%</div>
            <div className="text-xs text-gray-500">Overall Score</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {validationResults.map((result, idx) => (
          <div key={idx} className="p-4 glass-panel rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-sans-ui font-medium text-gray-200">{result.category}</h3>
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-sm font-bold",
                  result.status === 'pass' && "text-green-400",
                  result.status === 'warning' && "text-orange-400",
                  result.status === 'fail' && "text-red-400"
                )}>
                  {result.score}%
                </span>
                <i className={cn(
                  "fas",
                  result.status === 'pass' && "fa-check-circle text-green-400",
                  result.status === 'warning' && "fa-exclamation-triangle text-orange-400",
                  result.status === 'fail' && "fa-times-circle text-red-400"
                )} />
              </div>
            </div>
            {result.issues.length > 0 && (
              <ul className="space-y-1">
                {result.issues.map((issue, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-2">
                    <i className="fas fa-info-circle text-gray-600 mt-0.5" />
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 glass-button rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <i className="fas fa-rocket" />
        <span className="font-sans-ui font-medium">Publish Data Product</span>
      </button>
    </div>
  );
}

// Published Stage
function PublishedStage({ productSpec, onComplete }: any) {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-500/30">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-xl flex items-center justify-center">
            <i className="fas fa-rocket text-cyan-400 text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-serif-display text-gray-100">Successfully Published!</h3>
            <p className="text-sm text-gray-400 mt-1">Your data product is now available in the marketplace</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <a href="#" className="p-4 glass-panel hover:border-blue-500/30 rounded-lg transition-all">
          <i className="fas fa-external-link-alt text-blue-400 mb-3" />
          <h4 className="font-sans-ui font-medium text-gray-200 mb-1">View in DataHub</h4>
          <p className="text-xs text-gray-500">datahub.company.com/products/{productSpec?.product?.id}</p>
        </a>
        
        <a href="#" className="p-4 glass-panel hover:border-blue-500/30 rounded-lg transition-all">
          <i className="fas fa-code text-green-400 mb-3" />
          <h4 className="font-sans-ui font-medium text-gray-200 mb-1">API Documentation</h4>
          <p className="text-xs text-gray-500">api.company.com/docs/customer360</p>
        </a>
        
        <a href="#" className="p-4 glass-panel hover:border-blue-500/30 rounded-lg transition-all">
          <i className="fas fa-chart-bar text-purple-400 mb-3" />
          <h4 className="font-sans-ui font-medium text-gray-200 mb-1">Usage Dashboard</h4>
          <p className="text-xs text-gray-500">Monitor usage and performance</p>
        </a>
      </div>

      <div className="p-4 bg-gray-900/50 rounded-lg">
        <h4 className="font-sans-ui font-medium text-gray-300 mb-3">Next Steps</h4>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-sm text-gray-400">
            <i className="fas fa-check text-green-400" />
            <span>Share with your team</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-400">
            <i className="fas fa-check text-green-400" />
            <span>Set up monitoring alerts</span>
          </li>
          <li className="flex items-center gap-2 text-sm text-gray-400">
            <i className="fas fa-check text-green-400" />
            <span>Create documentation</span>
          </li>
        </ul>
      </div>

      <button
        onClick={onComplete}
        className="w-full py-3 glass-button rounded-lg transition-all flex items-center justify-center gap-2"
      >
        <i className="fas fa-check" />
        <span className="font-sans-ui font-medium">Complete & Return to Tasks</span>
      </button>
    </div>
  );
}
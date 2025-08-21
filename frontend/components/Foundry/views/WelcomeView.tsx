'use client';

import React, { useState } from 'react';
import { useFoundryStore } from '@/lib/store/foundryStore';
import { 
  Search, 
  Sparkles, 
  Clock, 
  Package, 
  FileText,
  TrendingUp,
  Users,
  BarChart3,
  Network,
  Map,
  ArrowRight,
  Zap
} from 'lucide-react';

interface WelcomeViewProps {
  className?: string;
}

const quickStartTemplates = [
  {
    id: 'customer-360',
    name: 'Customer 360',
    description: 'Complete view of customer relationships and interactions',
    icon: <Users className="w-6 h-6" />,
    category: 'universal',
    lens: 'network' as const,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'operational-dashboard',
    name: 'Operational Dashboard',
    description: 'Real-time monitoring of operations and KPIs',
    icon: <BarChart3 className="w-6 h-6" />,
    category: 'universal',
    lens: 'temporal' as const,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'asset-tracker',
    name: 'Asset Tracker',
    description: 'Track and analyze physical assets across locations',
    icon: <Map className="w-6 h-6" />,
    category: 'universal',
    lens: 'spatial' as const,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'risk-monitor',
    name: 'Risk Monitor',
    description: 'Identify and assess potential risks and opportunities',
    icon: <TrendingUp className="w-6 h-6" />,
    category: 'universal',
    lens: 'hybrid' as const,
    color: 'from-orange-500 to-red-500',
  },
];

export const WelcomeView: React.FC<WelcomeViewProps> = ({ className = '' }) => {
  const { 
    setLens, 
    setUserQuery, 
    setActiveTemplate,
    recentViews,
    shared
  } = useFoundryStore();
  
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearch = () => {
    if (query.trim()) {
      setUserQuery(query);
      // Analyze query and determine best lens
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('map') || lowerQuery.includes('location') || lowerQuery.includes('where')) {
        setLens('spatial');
      } else if (lowerQuery.includes('relation') || lowerQuery.includes('connect') || lowerQuery.includes('network')) {
        setLens('network');
      } else if (lowerQuery.includes('time') || lowerQuery.includes('trend') || lowerQuery.includes('history')) {
        setLens('temporal');
      } else {
        setLens('spatial'); // Default to spatial
      }
    }
  };

  const handleTemplateClick = (template: typeof quickStartTemplates[0]) => {
    setActiveTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category as any,
      defaultLens: template.lens,
      dataRequirements: [],
    });
    setLens(template.lens);
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 ${className}`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-6xl px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            NexusOne Foundry
          </h1>
          <p className="text-xl text-white/60">
            Multi-lens intelligence platform for comprehensive analysis
          </p>
        </div>

        {/* Natural Language Query Bar */}
        <div className="mb-16">
          <div className={`
            relative group transition-all duration-300
            ${isSearchFocused ? 'scale-105' : 'scale-100'}
          `}>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 
                            rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity" />
            
            <div className="relative flex items-center gap-4 p-6 
                            bg-black/60 backdrop-blur-xl
                            border border-white/20 rounded-2xl
                            shadow-2xl">
              <Search className="w-6 h-6 text-white/60" />
              
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Ask anything about your data..."
                className="flex-1 bg-transparent border-none outline-none
                           text-white text-lg placeholder-white/40"
              />
              
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400" />
                <span className="text-white/60 text-sm">AI-powered</span>
              </div>
              
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500
                           rounded-xl text-white font-semibold
                           hover:shadow-lg transform hover:scale-105
                           transition-all duration-200"
              >
                Explore
              </button>
            </div>
          </div>

          {/* AI Suggestions */}
          {isSearchFocused && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <span className="text-white/40 text-sm">Try:</span>
              {[
                'Show ground station performance',
                'Analyze network connectivity',
                'Track maritime vessels',
                'Monitor system health'
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setQuery(suggestion);
                    handleSearch();
                  }}
                  className="px-3 py-1 bg-white/5 border border-white/10 
                             rounded-full text-white/60 text-sm
                             hover:bg-white/10 hover:text-white
                             transition-all duration-200"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Start Templates */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h2 className="text-2xl font-semibold text-white">Quick Start Templates</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStartTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateClick(template)}
                className="group relative overflow-hidden p-6
                           bg-black/40 backdrop-blur-md
                           border border-white/10 rounded-xl
                           hover:border-white/30 hover:bg-black/60
                           transition-all duration-300"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-10`} />
                </div>
                
                <div className="relative">
                  <div className={`
                    w-12 h-12 mb-4 rounded-lg
                    bg-gradient-to-br ${template.color}
                    flex items-center justify-center
                    shadow-lg
                  `}>
                    {template.icon}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {template.name}
                  </h3>
                  
                  <p className="text-sm text-white/60 mb-4">
                    {template.description}
                  </p>
                  
                  <div className="flex items-center gap-2 text-white/40">
                    <ArrowRight className="w-4 h-4" />
                    <span className="text-xs">Opens in {template.lens} lens</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Recent Work */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-white/60" />
              <h3 className="text-lg font-semibold text-white">Recent Work</h3>
            </div>
            
            {recentViews.length > 0 ? (
              <div className="space-y-2">
                {recentViews.slice(0, 3).map((view) => (
                  <button
                    key={view.id}
                    className="w-full p-3 bg-black/40 backdrop-blur-md
                               border border-white/10 rounded-lg
                               hover:bg-black/60 hover:border-white/20
                               transition-all duration-200 text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{view.name}</div>
                        <div className="text-white/40 text-sm">{view.description}</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-white/40" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-8 bg-black/20 border border-white/10 rounded-lg text-center">
                <p className="text-white/40">No recent work yet</p>
                <p className="text-white/20 text-sm mt-2">Your recent views will appear here</p>
              </div>
            )}
          </div>

          {/* Available Data Products */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-white/60" />
              <h3 className="text-lg font-semibold text-white">Data Products</h3>
            </div>
            
            <div className="space-y-2">
              {[
                { name: 'Ground Stations', count: 127, status: 'live' },
                { name: 'Maritime Vessels', count: 3420, status: 'live' },
                { name: 'Satellite Orbits', count: 89, status: 'updating' },
              ].map((product) => (
                <div
                  key={product.name}
                  className="p-3 bg-black/40 backdrop-blur-md
                             border border-white/10 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-white/40" />
                      <div>
                        <div className="text-white">{product.name}</div>
                        <div className="text-white/40 text-sm">{product.count} entities</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        product.status === 'live' ? 'bg-green-400' : 'bg-yellow-400'
                      }`} />
                      <span className="text-white/40 text-xs">{product.status}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
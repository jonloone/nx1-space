'use client';

import React from 'react';
import { useFoundryStore } from '@/lib/store/foundryStore';
import { Network, Search, Filter, Settings, Download } from 'lucide-react';

interface NetworkLensProps {
  className?: string;
}

const NetworkLens: React.FC<NetworkLensProps> = ({ className = '' }) => {
  const { shared, updateLensState } = useFoundryStore();

  React.useEffect(() => {
    updateLensState('network', {
      enteredAt: new Date(),
      layout: 'force-directed',
    });
  }, []);

  return (
    <div className={`relative w-full h-full bg-gradient-to-br from-gray-900 via-black to-purple-900/20 ${className}`}>
      {/* Network Visualization Placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-8">
            <div className="w-32 h-32 mx-auto mb-4 rounded-full 
                            bg-gradient-to-br from-purple-500 to-pink-500
                            flex items-center justify-center shadow-2xl">
              <Network className="w-16 h-16 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Network Analysis</h2>
            <p className="text-white/60">Relationship and connection visualization</p>
          </div>
          
          <div className="px-6 py-3 bg-black/40 backdrop-blur-md 
                          border border-white/20 rounded-lg inline-block">
            <p className="text-white/80 mb-2">Sigma.js integration coming soon</p>
            <p className="text-white/40 text-sm">Graph-based analysis with force-directed layouts</p>
          </div>
        </div>
      </div>

      {/* Network Controls Panel */}
      <div className="absolute top-6 left-6 z-50">
        <div className="flex flex-col gap-2">
          <button className="p-3 bg-black/60 backdrop-blur-md border border-white/20 
                             rounded-lg hover:bg-black/80 transition-colors">
            <Search className="w-5 h-5 text-white/80" />
          </button>
          <button className="p-3 bg-black/60 backdrop-blur-md border border-white/20 
                             rounded-lg hover:bg-black/80 transition-colors">
            <Filter className="w-5 h-5 text-white/80" />
          </button>
          <button className="p-3 bg-black/60 backdrop-blur-md border border-white/20 
                             rounded-lg hover:bg-black/80 transition-colors">
            <Settings className="w-5 h-5 text-white/80" />
          </button>
        </div>
      </div>

      {/* Query/Template Indicators */}
      {shared.userQuery && (
        <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="px-4 py-2 bg-black/60 backdrop-blur-md 
                          border border-white/20 rounded-full text-white/80 text-sm">
            Query: "{shared.userQuery}"
          </div>
        </div>
      )}
    </div>
  );
};

export default NetworkLens;
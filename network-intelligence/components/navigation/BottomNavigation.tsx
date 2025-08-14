import React from 'react';
import { motion } from 'framer-motion';

export const BottomNavigation: React.FC = () => {
  const [activeView, setActiveView] = React.useState('operations');
  
  const navItems = [
    { id: 'operations', icon: 'fa-chart-line', label: 'Operations' },
    { id: 'optimizer', icon: 'fa-cog', label: 'Optimizer' },
    { id: 'opportunities', icon: 'fa-lightbulb', label: 'Opportunities' }
  ];
  
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-full px-2 py-1">
        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`relative px-4 py-2 rounded-full transition-all
                       ${activeView === item.id
                         ? 'bg-white/10 text-white'
                         : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
              aria-label={item.label}
            >
              {activeView === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full"
                />
              )}
              <div className="relative flex items-center gap-2">
                <i className={`fas ${item.icon}`}></i>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
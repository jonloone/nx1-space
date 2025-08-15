'use client';

import { motion } from 'framer-motion';
import { Globe2, Map, Orbit } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';

const VIEW_MODES = [
  { id: '2d', name: '2D Map', icon: Map },
  { id: '3d', name: '3D Globe', icon: Globe2 },
  { id: 'orbit', name: 'Orbit', icon: Orbit },
];

export function ViewModeToggle() {
  const { viewMode, setViewMode } = useMapStore();
  
  return (
    <div className="glass rounded-lg p-1 flex gap-1">
      {VIEW_MODES.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;
        
        return (
          <motion.button
            key={mode.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setViewMode(mode.id as any)}
            className={`
              relative px-3 py-2 rounded-md flex items-center gap-2
              transition-all duration-300
              ${isActive 
                ? 'bg-geo-blue text-white' 
                : 'hover:bg-white/10 text-white/70 hover:text-white'}
            `}
            title={mode.name}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium hidden sm:inline">{mode.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
'use client';

import React from 'react';
import { useFoundryStore, LensType } from '@/lib/store/foundryStore';
import { 
  Map, 
  Network, 
  Clock, 
  LayoutGrid, 
  Home,
  ChevronLeft 
} from 'lucide-react';

interface LensOption {
  id: LensType;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

const lensOptions: LensOption[] = [
  {
    id: 'welcome',
    label: 'Home',
    icon: <Home className="w-5 h-5" />,
    description: 'Return to entry point',
    color: 'from-gray-500 to-gray-600',
  },
  {
    id: 'spatial',
    label: 'Spatial',
    icon: <Map className="w-5 h-5" />,
    description: 'Geographic intelligence',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'network',
    label: 'Network',
    icon: <Network className="w-5 h-5" />,
    description: 'Relationship analysis',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'temporal',
    label: 'Temporal',
    icon: <Clock className="w-5 h-5" />,
    description: 'Time-series patterns',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'hybrid',
    label: 'Hybrid',
    icon: <LayoutGrid className="w-5 h-5" />,
    description: 'Synchronized multi-view',
    color: 'from-orange-500 to-red-500',
  },
];

export const LensSelector: React.FC = () => {
  const { currentLens, setLens, previousLens } = useFoundryStore();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleLensChange = (lens: LensType) => {
    if (lens !== currentLens) {
      setLens(lens);
      setIsExpanded(false);
    }
  };

  const currentLensOption = lensOptions.find(opt => opt.id === currentLens);

  return (
    <>
      {/* Floating Lens Selector - Top Center */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000]">
        <div className={`
          flex items-center gap-2 px-4 py-2
          bg-black/80 backdrop-blur-xl
          border border-white/20 rounded-full
          shadow-2xl shadow-black/50
          transition-all duration-300 ease-out
          ${isExpanded ? 'scale-105' : 'scale-100'}
        `}>
          {/* Back Button */}
          {previousLens && previousLens !== currentLens && (
            <button
              onClick={() => handleLensChange(previousLens)}
              className="p-2 rounded-full hover:bg-white/10 
                         transition-colors duration-200"
              title={`Back to ${previousLens}`}
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>
          )}

          {/* Current Lens Indicator */}
          <div className="flex items-center gap-2 px-3 py-1">
            <div className={`
              p-2 rounded-lg bg-gradient-to-br ${currentLensOption?.color}
              shadow-lg
            `}>
              {currentLensOption?.icon}
            </div>
            <div className="flex flex-col">
              <span className="text-white font-semibold text-sm">
                {currentLensOption?.label}
              </span>
              <span className="text-white/40 text-xs">
                {currentLensOption?.description}
              </span>
            </div>
          </div>

          {/* Separator */}
          <div className="w-px h-8 bg-white/20" />

          {/* Lens Options */}
          <div className="flex items-center gap-1">
            {lensOptions.map((lens) => {
              if (lens.id === currentLens || lens.id === 'welcome') return null;
              
              return (
                <button
                  key={lens.id}
                  onClick={() => handleLensChange(lens.id)}
                  onMouseEnter={() => setIsExpanded(true)}
                  onMouseLeave={() => setIsExpanded(false)}
                  className={`
                    group relative p-2 rounded-lg
                    hover:bg-white/10 transition-all duration-200
                    ${isExpanded ? 'scale-110' : 'scale-100'}
                  `}
                  title={lens.description}
                >
                  <div className={`
                    p-1.5 rounded-md bg-gradient-to-br ${lens.color}
                    opacity-60 group-hover:opacity-100
                    transition-opacity duration-200
                  `}>
                    {lens.icon}
                  </div>
                  
                  {/* Tooltip */}
                  <div className={`
                    absolute top-full mt-2 left-1/2 transform -translate-x-1/2
                    px-3 py-1.5 bg-black/90 backdrop-blur-xl
                    border border-white/20 rounded-lg
                    text-white text-xs whitespace-nowrap
                    opacity-0 group-hover:opacity-100
                    pointer-events-none transition-opacity duration-200
                    ${isExpanded ? 'block' : 'hidden'}
                  `}>
                    <div className="font-semibold">{lens.label}</div>
                    <div className="text-white/60">{lens.description}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Home Button */}
          <button
            onClick={() => handleLensChange('welcome')}
            className="p-2 rounded-full hover:bg-white/10 
                       transition-colors duration-200"
            title="Return to Home"
          >
            <Home className="w-4 h-4 text-white/60" />
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="absolute top-6 right-6 z-[999]">
        <div className="px-3 py-1 bg-black/60 backdrop-blur-md rounded-full
                        border border-white/20 text-white/40 text-xs">
          Press <kbd className="px-1.5 py-0.5 mx-1 bg-white/10 rounded">1-5</kbd> to switch lens
        </div>
      </div>
    </>
  );
};
'use client';

import { motion } from 'framer-motion';
import { 
  Anchor, Shield, Radio, Package, AlertTriangle, Satellite
} from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';

const DOMAINS = [
  { id: 'ground-stations', name: 'Ground Stations', icon: Satellite, color: 'from-blue-500 to-cyan-500' },
  { id: 'maritime', name: 'Maritime', icon: Anchor, color: 'from-blue-600 to-blue-400' },
  { id: 'defense', name: 'Defense', icon: Shield, color: 'from-green-500 to-emerald-500' },
  { id: 'telco', name: 'Telco', icon: Radio, color: 'from-purple-500 to-pink-500' },
  { id: 'supply-chain', name: 'Supply Chain', icon: Package, color: 'from-orange-500 to-yellow-500' },
  { id: 'risk', name: 'Risk', icon: AlertTriangle, color: 'from-red-500 to-orange-500' },
];

export function DomainSelector() {
  const { domain, setDomain } = useMapStore();
  
  return (
    <div className="glass rounded-xl p-2 space-y-2">
      {DOMAINS.map((d) => {
        const Icon = d.icon;
        const isActive = domain === d.id;
        
        return (
          <motion.button
            key={d.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setDomain(d.id as any)}
            className={`
              relative w-48 px-3 py-2 rounded-lg flex items-center gap-3
              transition-all duration-300
              ${isActive 
                ? 'bg-gradient-to-r ' + d.color + ' text-white shadow-lg' 
                : 'hover:bg-white/10 text-white/70 hover:text-white'}
            `}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{d.name}</span>
            {isActive && (
              <motion.div
                layoutId="domain-indicator"
                className="absolute inset-0 rounded-lg border-2 border-white/30"
                initial={false}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
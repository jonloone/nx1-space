'use client';

import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-20 h-20 mx-auto mb-4"
        >
          <div className="w-full h-full rounded-full bg-gradient-to-br from-geo-blue to-geo-cyan 
                          flex items-center justify-center">
            <Globe className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        
        <h2 className="text-2xl font-bold text-gradient mb-2">NexusOne GeoCore</h2>
        <p className="text-white/50 text-sm">Initializing Intelligence Platform...</p>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '200px' }}
          transition={{ duration: 1.5 }}
          className="h-1 bg-gradient-to-r from-geo-blue to-geo-cyan rounded-full mx-auto mt-4"
        />
      </div>
    </div>
  );
}
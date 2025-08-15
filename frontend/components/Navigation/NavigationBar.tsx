'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Globe, Settings, Bell, HelpCircle, User } from 'lucide-react';

export function NavigationBar() {
  const [notifications, setNotifications] = useState(3);
  
  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="absolute top-0 left-0 right-0 z-50 h-16 glass-dark border-b border-white/10"
    >
      <div className="h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-geo-blue to-geo-cyan 
                          flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gradient">NexusOne GeoCore</h1>
            <p className="text-xs text-white/50">Intelligence Platform</p>
          </div>
        </div>
        
        {/* Center Status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-white/70">Live Data</span>
          </div>
          <div className="text-sm text-white/50">
            {new Date().toLocaleTimeString()}
          </div>
        </div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-2">
          <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Bell className="w-5 h-5 text-white/70" />
            {notifications > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-geo-red rounded-full 
                             text-xs flex items-center justify-center">
                {notifications}
              </span>
            )}
          </button>
          
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <Settings className="w-5 h-5 text-white/70" />
          </button>
          
          <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <HelpCircle className="w-5 h-5 text-white/70" />
          </button>
          
          <div className="ml-2 pl-2 border-l border-white/10">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
              <User className="w-5 h-5 text-white/70" />
            </button>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
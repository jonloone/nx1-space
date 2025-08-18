'use client';

import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DetailPanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ElementType;
  children: ReactNode;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  className?: string;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  isExpanded = false,
  onToggleExpand,
  className,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className={cn(
            "fixed right-0 top-0 h-full bg-black/95 backdrop-blur-xl border-l border-white/10 z-50",
            isExpanded ? "w-full lg:w-3/4" : "w-full lg:w-[60%] xl:w-[50%]",
            className
          )}
        >
          {/* Header */}
          <div className="sticky top-0 bg-black/95 backdrop-blur-xl border-b border-white/10 z-10">
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                    {Icon && <Icon className="h-5 w-5" />}
                    {title}
                  </h2>
                  {subtitle && (
                    <p className="text-xs text-white/50 mt-1">{subtitle}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {onToggleExpand && (
                    <button
                      onClick={onToggleExpand}
                      className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                      title={isExpanded ? "Collapse panel" : "Expand panel"}
                    >
                      {isExpanded ? (
                        <Minimize2 className="h-5 w-5 text-white/70" />
                      ) : (
                        <Maximize2 className="h-5 w-5 text-white/70" />
                      )}
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                    title="Close panel"
                  >
                    <X className="h-5 w-5 text-white/70" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="h-[calc(100%-73px)] overflow-y-auto">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
'use client';

import React, { ReactNode } from 'react';
import { ParentSize } from '@visx/responsive';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ChartWrapperProps {
  children: (dimensions: { width: number; height: number }) => ReactNode;
  className?: string;
  loading?: boolean;
  error?: Error | null;
  minHeight?: number;
  aspectRatio?: number;
  title?: string;
  description?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  children,
  className,
  loading = false,
  error = null,
  minHeight = 300,
  aspectRatio,
  title,
  description,
}) => {
  if (error) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 p-4",
        className
      )} style={{ minHeight }}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-2 text-sm text-red-500/70">Failed to load chart</p>
          <p className="text-xs text-red-500/50 mt-1">{error.message}</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn(
        "flex items-center justify-center rounded-lg border border-white/10 bg-white/5",
        className
      )} style={{ minHeight }}>
        <div className="text-center">
          <div className="inline-flex h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/60" />
          <p className="mt-2 text-sm text-white/50">Loading chart...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn("relative", className)}
    >
      {(title || description) && (
        <div className="mb-4">
          {title && (
            <h3 className="text-sm font-semibold text-white/90">{title}</h3>
          )}
          {description && (
            <p className="text-xs text-white/50 mt-1">{description}</p>
          )}
        </div>
      )}
      
      <div 
        className="w-full" 
        style={{ 
          minHeight,
          aspectRatio: aspectRatio ? `${aspectRatio}` : undefined 
        }}
      >
        <ParentSize>
          {({ width, height }) => {
            if (width === 0) return null;
            
            const chartHeight = aspectRatio 
              ? width / aspectRatio 
              : height || minHeight;
            
            return children({ 
              width, 
              height: Math.max(chartHeight, minHeight) 
            });
          }}
        </ParentSize>
      </div>
    </motion.div>
  );
};

// Error boundary wrapper
export class ChartErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Chart error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex items-center justify-center min-h-[200px] rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <div className="text-center">
            <p className="text-sm text-red-500/70">Chart failed to render</p>
            <p className="text-xs text-red-500/50 mt-1">
              {this.state.error?.message || 'Unknown error'}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
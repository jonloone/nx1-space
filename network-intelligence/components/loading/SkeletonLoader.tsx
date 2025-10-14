'use client'

import React from 'react'
import { motion } from 'framer-motion'

interface SkeletonLoaderProps {
  type?: 'dashboard' | 'table' | 'chart' | 'panel' | 'card' | 'text'
  count?: number
  className?: string
}

/**
 * Skeleton Loader Component
 * Provides loading placeholders with shimmer effect
 */
export function SkeletonLoader({ type = 'card', count = 1, className = '' }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'dashboard':
        return <DashboardSkeleton />

      case 'table':
        return <TableSkeleton />

      case 'chart':
        return <ChartSkeleton />

      case 'panel':
        return <PanelSkeleton />

      case 'card':
        return <CardSkeleton />

      case 'text':
        return <TextSkeleton />

      default:
        return <CardSkeleton />
    }
  }

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  )
}

// Shimmer animation wrapper
function ShimmerBox({ className = '', children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={`relative overflow-hidden bg-white/5 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
          ease: 'linear'
        }}
      />
      {children}
    </div>
  )
}

// Dashboard skeleton (full analytics view)
function DashboardSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <ShimmerBox className="h-8 w-48 rounded-lg" />
        <div className="flex gap-2">
          <ShimmerBox className="h-10 w-24 rounded-lg" />
          <ShimmerBox className="h-10 w-24 rounded-lg" />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Table */}
      <TableSkeleton />
    </div>
  )
}

// Table skeleton
function TableSkeleton() {
  return (
    <div className="space-y-2">
      {/* Table Header */}
      <div className="grid grid-cols-5 gap-4 px-4 py-3 bg-white/5 rounded-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <ShimmerBox key={i} className="h-5 rounded" />
        ))}
      </div>

      {/* Table Rows */}
      {Array.from({ length: 8 }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid grid-cols-5 gap-4 px-4 py-3">
          {Array.from({ length: 5 }).map((_, colIndex) => (
            <ShimmerBox key={colIndex} className="h-5 rounded" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Chart skeleton
function ChartSkeleton() {
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Chart Title */}
      <ShimmerBox className="h-6 w-40 rounded mb-4" />

      {/* Chart Area */}
      <div className="h-64 flex items-end gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <ShimmerBox
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>

      {/* Chart Legend */}
      <div className="flex gap-4 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <ShimmerBox key={i} className="h-4 w-20 rounded" />
        ))}
      </div>
    </div>
  )
}

// Panel skeleton
function PanelSkeleton() {
  return (
    <div className="bg-black/90 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <ShimmerBox className="h-6 w-32 rounded" />
        <ShimmerBox className="h-8 w-8 rounded-lg" />
      </div>

      {/* Content */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

// Card skeleton
function CardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-3 space-y-2">
      <div className="flex items-start gap-3">
        <ShimmerBox className="h-10 w-10 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmerBox className="h-4 w-3/4 rounded" />
          <ShimmerBox className="h-3 w-full rounded" />
          <ShimmerBox className="h-3 w-2/3 rounded" />
        </div>
      </div>
    </div>
  )
}

// Text skeleton
function TextSkeleton() {
  return (
    <div className="space-y-2">
      <ShimmerBox className="h-4 w-full rounded" />
      <ShimmerBox className="h-4 w-5/6 rounded" />
      <ShimmerBox className="h-4 w-4/6 rounded" />
    </div>
  )
}

/**
 * Map Loading Skeleton
 * Specific skeleton for map initialization
 */
export function MapLoadingSkeleton() {
  return (
    <div className="absolute inset-0 bg-slate-950 flex items-center justify-center">
      <div className="text-center space-y-6">
        {/* Animated Globe */}
        <motion.div
          animate={{
            rotate: 360
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
            ease: 'linear'
          }}
          className="w-24 h-24 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full"
        />

        {/* Loading Text */}
        <div className="space-y-2">
          <h3 className="text-white text-xl font-semibold">Initializing Platform</h3>
          <div className="space-y-1">
            <ShimmerBox className="h-3 w-64 rounded mx-auto" />
            <ShimmerBox className="h-3 w-48 rounded mx-auto" />
          </div>
        </div>

        {/* Progress Indicators */}
        <div className="space-y-2 w-80">
          <LoadingStep label="Loading stations" delay={0} />
          <LoadingStep label="Generating coverage" delay={0.2} />
          <LoadingStep label="Initializing AI" delay={0.4} />
          <LoadingStep label="Preparing visualization" delay={0.6} />
        </div>
      </div>
    </div>
  )
}

function LoadingStep({ label, delay }: { label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex items-center gap-3 text-sm text-gray-400"
    >
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{
          repeat: Infinity,
          duration: 1,
          delay: delay + 0.5
        }}
        className="w-2 h-2 bg-purple-500 rounded-full"
      />
      <span>{label}</span>
      <ShimmerBox className="flex-1 h-1 rounded-full" />
    </motion.div>
  )
}

export default SkeletonLoader

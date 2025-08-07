'use client'

import React from 'react'
import { motion, HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

// Glass Card Component
const glassCardVariants = cva(
  'backdrop-blur-md bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-xl shadow-lg',
  {
    variants: {
      size: {
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
      },
      hover: {
        true: 'hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 transition-all duration-300',
        false: ''
      }
    },
    defaultVariants: {
      size: 'md',
      hover: false
    }
  }
)

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassCardVariants> {}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, size, hover, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(glassCardVariants({ size, hover, className }))}
        {...props}
      />
    )
  }
)
GlassCard.displayName = 'GlassCard'

// Animated Glass Card
export interface AnimatedGlassCardProps extends GlassCardProps, HTMLMotionProps<'div'> {}

export const AnimatedGlassCard = React.forwardRef<HTMLDivElement, AnimatedGlassCardProps>(
  ({ className, size, hover, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(glassCardVariants({ size, hover, className }))}
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        {...props}
      />
    )
  }
)
AnimatedGlassCard.displayName = 'AnimatedGlassCard'

// Glass Button Component
const glassButtonVariants = cva(
  'relative inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:pointer-events-none disabled:opacity-50 backdrop-blur-sm',
  {
    variants: {
      variant: {
        default: 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-white border border-white/20 hover:from-blue-500/30 hover:to-purple-500/30 hover:border-white/30',
        secondary: 'bg-gradient-to-r from-white/10 to-white/5 text-white border border-white/20 hover:from-white/15 hover:to-white/10 hover:border-white/30',
        success: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-white border border-green-400/30 hover:from-green-500/30 hover:to-emerald-500/30',
        danger: 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-white border border-red-400/30 hover:from-red-500/30 hover:to-pink-500/30',
        ghost: 'text-white hover:bg-white/10 border border-transparent hover:border-white/20'
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4 text-sm',
        lg: 'h-11 px-8 text-base',
        icon: 'h-9 w-9'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'md'
    }
  }
)

export interface GlassButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof glassButtonVariants> {}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <motion.button
        ref={ref}
        className={cn(glassButtonVariants({ variant, size, className }))}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        {...props}
      />
    )
  }
)
GlassButton.displayName = 'GlassButton'

// Status Badge Component
const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium backdrop-blur-sm border',
  {
    variants: {
      status: {
        online: 'bg-green-500/20 text-green-100 border-green-400/30',
        offline: 'bg-red-500/20 text-red-100 border-red-400/30',
        warning: 'bg-yellow-500/20 text-yellow-100 border-yellow-400/30',
        info: 'bg-blue-500/20 text-blue-100 border-blue-400/30',
        neutral: 'bg-gray-500/20 text-gray-100 border-gray-400/30'
      }
    },
    defaultVariants: {
      status: 'neutral'
    }
  }
)

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  showDot?: boolean
}

export const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, status, showDot = true, children, ...props }, ref) => {
    const dotColor = {
      online: 'bg-green-400',
      offline: 'bg-red-400',
      warning: 'bg-yellow-400',
      info: 'bg-blue-400',
      neutral: 'bg-gray-400'
    }[status || 'neutral']

    return (
      <div
        ref={ref}
        className={cn(statusBadgeVariants({ status, className }))}
        {...props}
      >
        {showDot && (
          <div className={cn('w-1.5 h-1.5 rounded-full', dotColor)} />
        )}
        {children}
      </div>
    )
  }
)
StatusBadge.displayName = 'StatusBadge'

// Progress Bar Component
export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  label?: string
  showValue?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, label, showValue = true, variant = 'default', ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const variantClasses = {
      default: 'from-blue-500 to-purple-500',
      success: 'from-green-500 to-emerald-500',
      warning: 'from-yellow-500 to-orange-500',
      danger: 'from-red-500 to-pink-500'
    }

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm text-white/80">
            {label && <span>{label}</span>}
            {showValue && <span>{value}/{max}</span>}
          </div>
        )}
        <div className="h-2 bg-white/10 rounded-full backdrop-blur-sm border border-white/20 overflow-hidden">
          <motion.div
            className={cn(
              'h-full bg-gradient-to-r rounded-full',
              variantClasses[variant]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = 'ProgressBar'

// Glass Input Component
export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-9 w-full rounded-lg backdrop-blur-sm bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-white/30 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
          className
        )}
        {...props}
      />
    )
  }
)
GlassInput.displayName = 'GlassInput'

// Glass Panel Component
export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg' | 'xl'
  opacity?: 'low' | 'medium' | 'high'
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, blur = 'md', opacity = 'medium', ...props }, ref) => {
    const blurClasses = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl'
    }

    const opacityClasses = {
      low: 'bg-gradient-to-br from-white/5 to-white/2',
      medium: 'bg-gradient-to-br from-white/10 to-white/5',
      high: 'bg-gradient-to-br from-white/20 to-white/10'
    }

    return (
      <div
        ref={ref}
        className={cn(
          blurClasses[blur],
          opacityClasses[opacity],
          'border border-white/20 rounded-xl shadow-lg',
          className
        )}
        {...props}
      />
    )
  }
)
GlassPanel.displayName = 'GlassPanel'
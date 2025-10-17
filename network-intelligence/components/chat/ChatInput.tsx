'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useChatStore } from '@/lib/stores/chatStore'

interface ChatInputProps {
  onSubmit?: (query: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

/**
 * ChatInput Component
 *
 * Bottom-anchored chat input for conversational queries
 * Features:
 * - Auto-focus on mount
 * - 16px font (prevents iOS zoom)
 * - Loading states
 * - Suggestion chips
 */
export default function ChatInput({
  onSubmit,
  placeholder = "Ask anything or search places...",
  disabled = false,
  className = ""
}: ChatInputProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const { isLoading, suggestions } = useChatStore()

  // Auto-focus on mount (desktop only)
  useEffect(() => {
    // Only auto-focus on desktop (not mobile)
    if (window.innerWidth >= 768) {
      inputRef.current?.focus()
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!query.trim() || isLoading) return

    // Call onSubmit handler
    onSubmit?.(query.trim())

    // Clear input
    setQuery('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    onSubmit?.(suggestion)
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Suggestion Chips (above input) */}
      {suggestions.length > 0 && !isLoading && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.slice(0, 4).map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-all
                       bg-primary/10 hover:bg-primary/20 text-primary
                       border border-primary/20 hover:border-primary/40
                       hover:scale-105 active:scale-95"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-2">
          {/* AI Indicator */}
          <div className="absolute left-4 pointer-events-none">
            <Sparkles className="h-4 w-4 text-primary opacity-60" />
          </div>

          {/* Input Field */}
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className="pl-11 pr-12 h-12 text-base rounded-xl
                     glass-search border-0 shadow-lg
                     placeholder:text-muted-foreground/60
                     focus-visible:ring-2 focus-visible:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ fontSize: '16px' }} // Prevents iOS zoom
            autoComplete="off"
            spellCheck={false}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={!query.trim() || isLoading}
            size="icon"
            className="absolute right-2 h-8 w-8 rounded-lg
                     bg-primary hover:bg-primary/90
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all hover:scale-105 active:scale-95"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Loading Indicator */}
        {isLoading && (
          <div className="absolute left-4 -bottom-6 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span>Thinking...</span>
          </div>
        )}
      </form>

      {/* Keyboard Hint (desktop only) */}
      <div className="mt-2 text-center text-xs text-muted-foreground/50 hidden md:block">
        Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">Enter</kbd> to send
        • <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">/</kbd> to focus
      </div>
    </div>
  )
}

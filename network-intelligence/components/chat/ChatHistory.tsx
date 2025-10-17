'use client'

import React, { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useChatStore } from '@/lib/stores/chatStore'
import type { ChatMessage } from '@/lib/stores/chatStore'
import ReactMarkdown from 'react-markdown'

interface ChatHistoryProps {
  className?: string
  maxHeight?: string
}

/**
 * ChatHistory Component
 *
 * Displays conversation history with messages
 * Features:
 * - Auto-scroll to latest
 * - Message animations
 * - Markdown rendering for assistant messages
 * - Error states
 */
export default function ChatHistory({
  className = "",
  maxHeight = "400px"
}: ChatHistoryProps) {
  const { messages } = useChatStore()
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  if (messages.length === 0) {
    return null
  }

  return (
    <div
      ref={scrollRef}
      className={`overflow-y-auto space-y-6 ${className}`}
      style={{ maxHeight }}
    >
      <AnimatePresence initial={false}>
        {messages.map((message, index) => (
          <MessageBubble
            key={message.id}
            message={message}
            index={index}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  index: number
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
      className="flex flex-col gap-2"
    >
      {/* Assistant messages with avatar on left */}
      {!isUser && (
        <div className="flex gap-3 items-start">
          <div className="flex-shrink-0 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              {message.error ? (
                <AlertCircle className="h-4 w-4 text-destructive" />
              ) : (
                <Sparkles className="h-4 w-4 text-primary" />
              )}
            </div>
          </div>

          <div className="flex-1 space-y-1">
            <div
              className={`rounded-2xl px-4 py-3 ${
                message.error
                  ? 'bg-destructive/5 text-destructive border border-destructive/20'
                  : isSystem
                  ? 'bg-muted/50 text-muted-foreground'
                  : 'bg-muted/30'
              }`}
            >
              <div className="prose prose-sm max-w-none dark:prose-invert
                            prose-p:my-1 prose-p:leading-relaxed prose-p:text-foreground
                            prose-headings:mt-3 prose-headings:mb-2 prose-headings:text-foreground
                            prose-ul:my-2 prose-li:my-0.5
                            prose-strong:text-foreground prose-strong:font-semibold
                            prose-code:text-xs prose-code:bg-background/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-foreground">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>

              {/* Intent Badge (if available) */}
              {message.intent && (
                <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>
                    {message.intent.type}
                    {message.intent.confidence > 0 && (
                      <> • {(message.intent.confidence * 100).toFixed(0)}%</>
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Timestamp */}
            <div className="px-1 text-[10px] text-muted-foreground/60">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
      )}

      {/* User messages aligned right */}
      {isUser && (
        <div className="flex gap-3 items-start justify-end">
          <div className="flex-1 flex flex-col items-end space-y-1">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>

            {/* Timestamp */}
            <div className="px-1 text-[10px] text-muted-foreground/60">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          <div className="flex-shrink-0 mt-1">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <User className="h-4 w-4 text-primary-foreground" />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

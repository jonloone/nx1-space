/**
 * Command Palette Bar
 *
 * Minimized AI chat interface that stays at the bottom of the screen
 * Expands to full chat when focused or clicked
 */

'use client'

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, X, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface CommandPaletteBarProps {
  onSendMessage?: (message: string) => Promise<void>
  placeholder?: string
  className?: string
}

export function CommandPaletteBar({
  onSendMessage,
  placeholder = 'Ask AI Navigator anything...',
  className
}: CommandPaletteBarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isExpanded])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      if (onSendMessage) {
        await onSendMessage(input.trim())
      }

      // For now, add a placeholder assistant response
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: 'AI Navigator response will appear here.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleMinimize = () => {
    setIsExpanded(false)
  }

  const handleClear = () => {
    setMessages([])
    setInput('')
  }

  const barHeight = isExpanded ? 400 : 60

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      className={`fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl z-30 ${className || ''}`}
      style={{ height: `${barHeight}px` }}
      transition={{
        type: 'spring',
        damping: 25,
        stiffness: 300
      }}
    >
      {/* Minimized State */}
      {!isExpanded && (
        <div
          className="h-full flex items-center px-6 cursor-text"
          onClick={() => setIsExpanded(true)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2.5 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/40 text-sm"
                onFocus={() => setIsExpanded(true)}
                readOnly
              />
            </div>
          </div>
        </div>
      )}

      {/* Expanded State */}
      {isExpanded && (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="h-[60px] px-6 flex items-center justify-between border-b border-white/20 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">AI Navigator</h3>
                <p className="text-xs text-white/70">Ask me anything about the operation</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-8 text-xs text-white hover:bg-white/10"
                >
                  Clear
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleMinimize}
                className="h-8 w-8 text-white hover:bg-white/10"
                title="Minimize"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-white/70">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 text-white/50" />
                  <p className="text-sm">Start a conversation with AI Navigator</p>
                  <p className="text-xs mt-1">Ask about subjects, locations, or request analysis</p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-4 py-2.5 ${
                        message.role === 'user'
                          ? 'bg-white text-gray-900'
                          : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-[10px] mt-1 ${
                        message.role === 'user' ? 'text-gray-500' : 'text-white/60'
                      }`}>
                        {message.timestamp.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2.5 border border-white/20">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs text-white/70">Thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          <div className="px-6 py-4 border-t border-white/20 flex-shrink-0">
            <div className="flex items-end gap-3">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                rows={1}
                className="flex-1 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/60 focus:ring-white/40 resize-none text-sm"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-10 w-10 bg-white hover:bg-white/90 text-purple-600 disabled:opacity-50"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

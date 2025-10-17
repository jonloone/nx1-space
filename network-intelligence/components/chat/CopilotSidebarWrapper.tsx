'use client'

import React, { useRef, useEffect, useState } from 'react'
import { Sparkles, User, Send, Paperclip } from 'lucide-react'
import styles from './copilot-custom.module.css'

interface CopilotSidebarWrapperProps {
  className?: string
  onAction?: (action: string, data: any) => void
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: number
}

/**
 * CopilotSidebarWrapper Component
 *
 * Premium AI chat interface with Vercel AI SDK backend
 * Features:
 * - Full-height sidebar (420px width)
 * - Project blue (#1D48E5) accent colors
 * - Generous Mundi-inspired spacing
 * - Glassmorphism effects
 * - Custom message bubbles and input
 * - Direct integration with /api/copilot endpoint
 */
export default function CopilotSidebarWrapper({
  className = '',
  onAction
}: CopilotSidebarWrapperProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isLoading) return

    const userMessage = inputValue.trim()
    setInputValue('')

    // Add user message to chat
    const userMessageObj: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      createdAt: Date.now()
    }

    setMessages(prev => [...prev, userMessageObj])
    setIsLoading(true)

    try {
      // Send to our Vercel AI SDK endpoint
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [...messages, userMessageObj].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Extract assistant message from OpenAI-format response
      const assistantContent = data.choices?.[0]?.message?.content || 'No response generated'

      const assistantMessage: Message = {
        id: data.id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        createdAt: Date.now()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Execute map action on client side if action data is present
      if (data.actionData && onAction) {
        console.log('Executing map action:', data.actionData.action, data.actionData.data)
        onAction(data.actionData.action, data.actionData.data)
      }
    } catch (error) {
      console.error('Failed to send message:', error)

      // Show error message to user
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        createdAt: Date.now()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  return (
    <div className={`${styles.copilotSidebar} ${className}`}>
      {/* Header */}
      <div className={styles.copilotHeader}>
        <div className={styles.copilotTitle}>
          AI Assistant
        </div>
        <div className={styles.copilotSubtitle}>
          Ask me to search locations, analyze patterns, or explore map data
        </div>
      </div>

      {/* Messages Container */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <ChatWelcome onSuggestionClick={handleSuggestionClick} />
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                index={index}
              />
            ))}
            {isLoading && (
              <div className={styles.messageWrapper}>
                <div className={`${styles.avatar} ${styles.avatarAssistant}`}>
                  <Sparkles size={14} />
                </div>
                <div className={styles.loadingDots}>
                  <div className={styles.loadingDot} />
                  <div className={styles.loadingDot} />
                  <div className={styles.loadingDot} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Container */}
      <div className={styles.inputContainer}>
        <form onSubmit={handleSubmit}>
          <div className={styles.inputWrapper}>
            <button
              type="button"
              className={styles.attachButton}
              aria-label="Attach file"
            >
              <Paperclip size={18} />
            </button>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything or search places..."
              className={styles.input}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!inputValue.trim() || isLoading}
              aria-label="Send message"
            >
              <Send size={16} />
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * MessageBubble Component
 * Renders individual message with avatar and styling
 */
interface MessageBubbleProps {
  message: Message
  index: number
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'

  return (
    <div
      className={`${styles.messageWrapper} ${
        isUser ? styles.messageWrapperUser : ''
      } ${styles.messageEnter}`}
    >
      {/* Avatar */}
      <div
        className={`${styles.avatar} ${
          isUser ? styles.avatarUser : styles.avatarAssistant
        }`}
      >
        {isUser ? <User size={14} /> : <Sparkles size={14} />}
      </div>

      {/* Message Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div
          className={isUser ? styles.messageUser : styles.messageAssistant}
        >
          {message.content}
        </div>

        {/* Timestamp */}
        <div className={styles.messageMeta}>
          {new Date(message.createdAt || Date.now()).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          })}
        </div>
      </div>
    </div>
  )
}

/**
 * ChatWelcome Component
 * Empty state with suggestions
 */
interface ChatWelcomeProps {
  onSuggestionClick: (suggestion: string) => void
}

function ChatWelcome({ onSuggestionClick }: ChatWelcomeProps) {
  const suggestions = [
    { icon: '🔍', text: 'Show me coffee shops near Central Park' },
    { icon: '🏙️', text: 'Zoom to Los Angeles' },
    { icon: '📍', text: 'What\'s around here?' },
    { icon: '📊', text: 'Analyze downtown LA' }
  ]

  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyStateIcon}>
        <Sparkles size={48} style={{ color: 'var(--copilot-blue-primary)' }} />
      </div>
      <div className={styles.emptyStateTitle}>
        How can I help you today?
      </div>
      <div className={styles.emptyStateDescription}>
        Ask me to search locations, analyze patterns, or explore map data.
        I can control the map with natural language commands.
      </div>

      {/* Suggestion Chips */}
      <div className={styles.suggestionsGrid}>
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            className={styles.suggestionChip}
            onClick={() => onSuggestionClick(suggestion.text)}
          >
            <span className={styles.suggestionIcon}>{suggestion.icon}</span>
            <span>{suggestion.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

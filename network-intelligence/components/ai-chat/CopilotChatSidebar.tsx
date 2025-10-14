'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, X, Send, Sparkles, Minimize2, Maximize2 } from 'lucide-react'
import gsap from 'gsap'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface CopilotChatSidebarProps {
  onActionExecute?: (action: string, params: any) => void
  context?: any
}

export default function CopilotChatSidebar({
  onActionExecute,
  context = {}
}: CopilotChatSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your geospatial intelligence assistant. I can help you analyze ground stations, control map layers, and discover insights. Try asking me to "analyze SES stations" or "toggle the maritime layer".',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)

    try {
      // Call CopilotKit API
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMessage.content }
          ],
          context
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.choices[0]?.message?.content || 'Sorry, I couldn\'t process that.',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])

      // Check if we need to execute an action
      await detectAndExecuteAction(userMessage.content, assistantMessage.content)
    } catch (error) {
      console.error('Chat error:', error)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const detectAndExecuteAction = async (userInput: string, assistantResponse: string) => {
    const lowerInput = userInput.toLowerCase()

    // Detect layer toggle commands
    if (lowerInput.includes('toggle') || lowerInput.includes('enable') || lowerInput.includes('disable')) {
      if (lowerInput.includes('maritime') || lowerInput.includes('ship')) {
        onActionExecute?.('toggleLayer', { layerId: 'maritime-routes' })
      } else if (lowerInput.includes('hex') || lowerInput.includes('coverage')) {
        onActionExecute?.('toggleLayer', { layerId: 'hex-coverage' })
      } else if (lowerInput.includes('station') || lowerInput.includes('ground')) {
        onActionExecute?.('toggleLayer', { layerId: 'ground-stations' })
      }
    }

    // Detect analysis commands
    if (lowerInput.includes('analyze') || lowerInput.includes('summary')) {
      // Let the parent component handle this
      onActionExecute?.('analyze', { query: userInput })
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setIsMinimized(false)
    }
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <motion.button
          onClick={toggleOpen}
          className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-shadow"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
        >
          <MessageSquare className="w-6 h-6" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </motion.button>
      )}

      {/* Chat Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 z-50 bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl ${
              isMinimized ? 'h-16 w-96' : 'h-full w-96'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-white font-semibold">AI Assistant</h3>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={toggleOpen}
                  className="text-gray-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 h-[calc(100vh-140px)]">
                  {messages.map((message, idx) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                            : 'bg-white/5 text-gray-200 border border-white/10'
                        }`}
                      >
                        <div className="text-sm leading-relaxed">{message.content}</div>
                        <div className="text-xs opacity-50 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                  <div className="relative">
                    <textarea
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Ask me anything about the data..."
                      rows={2}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white placeholder-gray-500 resize-none focus:outline-none focus:border-blue-400 transition-colors"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading}
                      className="absolute right-2 bottom-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    {['Analyze stations', 'Toggle layers', 'Find opportunities'].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInputValue(suggestion)}
                        className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import React, { useState } from 'react'
import { Sparkles } from 'lucide-react'
import styles from './copilot-custom.module.css'
import AIChatPanel, { ChatMessage } from '@/components/ai/AIChatPanel'
import { getInvestigationCommandHandler } from '@/lib/services/investigationCommandHandler'

interface CopilotSidebarWrapperProps {
  className?: string
  onAction?: (action: string, data: any) => void
}

/**
 * CopilotSidebarWrapper Component
 *
 * Premium AI chat interface with Citizens 360 artifact support
 * Features:
 * - Full-height sidebar (420px width)
 * - Project blue (#1D48E5) accent colors
 * - Rich artifact rendering (Subject Profiles, Timelines, Intelligence Analysis)
 * - Investigation command processing
 * - Map action integration
 * - Direct integration with /api/copilot endpoint
 */
export default function CopilotSidebarWrapper({
  className = '',
  onAction
}: CopilotSidebarWrapperProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleQuery = async (query: string): Promise<ChatMessage> => {
    setIsLoading(true)

    try {
      // First, check if this is an investigation command
      const investigationHandler = getInvestigationCommandHandler()
      const command = investigationHandler.parseQuery(query)

      if (command) {
        console.log('🔍 Processing investigation command:', command.type)
        const messages = await investigationHandler.executeCommand(command)

        // Return the first message (Citizens 360 commands return multiple, but we'll handle that differently)
        // For now, return the first artifact message
        return messages[0]
      }

      // If not an investigation command, use the LLM copilot endpoint
      const response = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: query
          }]
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Extract assistant message from OpenAI-format response
      const assistantContent = data.choices?.[0]?.message?.content || 'No response generated'

      // Execute map action on client side if action data is present
      if (data.actionData && onAction) {
        console.log('Executing map action:', data.actionData.action, data.actionData.data)
        onAction(data.actionData.action, data.actionData.data)
      }

      // Return as ChatMessage
      return {
        id: data.id || `assistant-${Date.now()}`,
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Failed to process query:', error)

      // Return error message
      return {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={`${styles.copilotSidebar} ${className}`}>
      <AIChatPanel
        onQuery={handleQuery}
        isLoading={isLoading}
        placeholder="Ask about investigations, search locations, or analyze patterns..."
      />
    </div>
  )
}

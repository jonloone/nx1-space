'use client'

import React, { useState } from 'react'
import AIChatPanel, { ChatMessage } from '@/components/ai/AIChatPanel'
import { getInvestigationCommandHandler } from '@/lib/services/investigationCommandHandler'

/**
 * Citizens 360 Test Page
 * Simple test page to demonstrate Citizens 360 artifact system
 */
export default function Citizens360TestPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleQuery = async (query: string): Promise<ChatMessage> => {
    setIsLoading(true)

    try {
      // Check if this is an investigation command
      const investigationHandler = getInvestigationCommandHandler()
      const command = investigationHandler.parseQuery(query)

      if (command) {
        console.log('🔍 Processing investigation command:', command.type)
        const messages = await investigationHandler.executeCommand(command)

        // Return the first message (Citizens 360 commands return multiple)
        return messages[0]
      }

      // If not an investigation command, return a help message
      return {
        id: `help-${Date.now()}`,
        role: 'assistant',
        content: `Try these commands:

• "Load investigation case CT-2024-8473"
• "Analyze subject SUBJECT-8473"
• "Show route for SUBJECT-8473"
• "List investigation subjects"`,
        timestamp: new Date()
      }
    } catch (error) {
      console.error('Failed to process query:', error)

      return {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        metadata: { error: String(error) }
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-6 py-4">
        <h1 className="text-2xl font-bold text-foreground">Citizens 360 Test</h1>
        <p className="text-sm text-muted-foreground">
          Test investigation intelligence artifact system
        </p>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-6">
        <div className="max-w-4xl mx-auto h-full">
          <AIChatPanel
            onQuery={handleQuery}
            isLoading={isLoading}
            placeholder='Try: "Load investigation case CT-2024-8473"'
          />
        </div>
      </div>
    </div>
  )
}

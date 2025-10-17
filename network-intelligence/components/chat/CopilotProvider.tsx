'use client'

import React from 'react'

interface CopilotProviderProps {
  children: React.ReactNode
}

/**
 * CopilotProvider Component
 *
 * Simplified provider for AI chat functionality using Vercel AI SDK
 * No longer requires CopilotKit - just a pass-through wrapper
 */
export default function CopilotProvider({ children }: CopilotProviderProps) {
  // No provider context needed - chat component manages its own state
  // and communicates directly with /api/copilot endpoint
  return <>{children}</>
}

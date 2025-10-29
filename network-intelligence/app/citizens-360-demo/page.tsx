'use client'

/**
 * Citizens 360 Intelligence Alert Demo
 * Demonstrates the chat-centric alert workflow
 */

import React, { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Brain } from 'lucide-react'
import MissionControlLayout from '@/components/opintel/layout/MissionControlLayout'
import CopilotSidebarWrapper from '@/components/chat/CopilotSidebarWrapper'
import { AIChatPanelRef } from '@/components/ai/AIChatPanel'
import type { IntelligenceAlert } from '@/lib/types/chatArtifacts'

// Sample alert data
const sampleAlert: IntelligenceAlert = {
  id: 'alert-demo-001',
  timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  priority: 'critical',
  category: 'behavioral-anomaly',
  title: 'Unusual Movement Pattern Detected',
  description: 'Subject proceeded directly to LaGuardia Airport Terminal B without scheduled flight. Deviated from known routine (typical commute ends at 18:00). Credit card activity shows last-minute ticket purchase 45 minutes prior.',
  caseNumber: 'OP-2025-1138',
  caseName: 'Operation Nightfall',
  subjectId: 'SUB-1138',
  subjectName: 'Marcus Rahman',
  location: {
    name: 'LaGuardia Airport Terminal B',
    coordinates: [-73.8740, 40.7769],
    address: 'Queens, NY 11371'
  },
  confidence: 'high',
  actionRequired: true,
  tags: ['travel', 'deviation', 'high-risk-location', 'financial-anomaly']
}

export default function Citizens360Demo() {
  const chatRef = useRef<AIChatPanelRef>(null)

  // Inject alert into chat
  const handleInjectAlert = () => {
    chatRef.current?.injectMessage({
      id: `chat-${Date.now()}`,
      role: 'assistant',
      content: `**Intelligence Alert Detected**\n\nI've detected a critical behavioral anomaly for ${sampleAlert.subjectName}. Analyzing the situation now...`,
      timestamp: new Date(),
      artifact: {
        type: 'intelligence-alert',
        data: sampleAlert
      }
    })
  }

  return (
    <div className="h-screen w-full bg-[#FAFAFA] dark:bg-gray-950">
      <MissionControlLayout useChatInterface={true}>
        {/* Map placeholder */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F5F5F5] to-[#E5E5E5] dark:from-gray-900 dark:to-gray-800">
          <div className="text-center space-y-4">
            <div className="text-6xl text-[#A3A3A3] dark:text-gray-700">🗺️</div>
            <h2 className="text-2xl font-bold text-[#171717] dark:text-gray-100">
              Citizens 360 Demo
            </h2>
            <p className="text-sm text-[#525252] dark:text-gray-400 max-w-md">
              Chat-centric intelligence workflow demonstration
            </p>

            {/* Demo Controls */}
            <div className="mt-8 space-y-3">
              <Button
                onClick={handleInjectAlert}
                className="bg-[#176BF8] hover:bg-[#0D4DB8] text-white shadow-lg"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Inject Critical Alert
              </Button>

              <p className="text-xs text-[#737373] dark:text-gray-500 max-w-sm mx-auto">
                Click to inject an intelligence alert into the chat panel.
                The alert will appear as an expandable artifact within the conversation.
              </p>
            </div>

            {/* Features List */}
            <div className="mt-8 p-6 bg-white dark:bg-gray-800 rounded-lg border border-[#E5E5E5] dark:border-gray-700 max-w-md mx-auto text-left">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="h-5 w-5 text-[#176BF8]" />
                <h3 className="text-sm font-semibold text-[#171717] dark:text-gray-100">
                  Chat-Centric Features
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-[#525252] dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-[#737373]">•</span>
                  <span>Inline expandable alert cards (compact → full details)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#737373]">•</span>
                  <span>AI-powered analysis with Vultr LLM</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#737373]">•</span>
                  <span>Progressive disclosure (3-unit cognitive load)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#737373]">•</span>
                  <span>WCAG AA compliant color hierarchy</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#737373]">•</span>
                  <span>Smooth animations (slides in from left)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Chat Sidebar with ref */}
        <aside className="absolute top-0 left-0 bottom-0 z-40">
          <CopilotSidebarWrapper ref={chatRef} />
        </aside>
      </MissionControlLayout>
    </div>
  )
}

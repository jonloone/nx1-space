'use client'

import React from 'react'
import { usePanelStore } from '@/lib/stores/panelStore'
import SearchResultsPanel from './SearchResultsPanel'
import POIContextPanel from './POIContextPanel'
import IntelligencePanel from './IntelligencePanel'

/**
 * PanelRouter Component
 *
 * Routes panel content to the appropriate panel component
 * based on the panel store's content type
 */
export default function PanelRouter() {
  const { content } = usePanelStore()

  if (!content) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <p>No content to display</p>
      </div>
    )
  }

  switch (content.type) {
    case 'search-results':
      return <SearchResultsPanel />

    case 'poi-context':
      return <POIContextPanel />

    case 'intelligence-analysis':
      return <IntelligencePanel />

    case 'timeline':
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Timeline visualization coming soon...
          </p>
        </div>
      )

    case 'document':
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold">Document</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Document viewer coming soon...
          </p>
        </div>
      )

    case 'help':
      return (
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Help & Features</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">🔍 Search & Explore</h3>
              <p className="text-sm text-muted-foreground">
                Find locations, places, and categories by typing in plain English
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">🧠 Intelligence Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Ask about suspicious activity, patterns, and behavioral insights
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">🗺️ Map Layers</h3>
              <p className="text-sm text-muted-foreground">
                Control map layers with commands like "show buildings" or "enable roads"
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">⏱️ Timeline</h3>
              <p className="text-sm text-muted-foreground">
                View temporal data and patterns with "show timeline" or "what happened at night?"
              </p>
            </div>
          </div>
        </div>
      )

    default:
      return (
        <div className="p-6 text-center text-muted-foreground">
          <p>Unknown panel type: {content.type}</p>
        </div>
      )
  }
}

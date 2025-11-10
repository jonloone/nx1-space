'use client'

/**
 * Dock Analysis Panel
 * Analysis tools and timeline controls for the unified dock
 */

import { Calendar, Filter, TrendingUp } from 'lucide-react'

export function DockAnalysisPanel() {
  return (
    <div className="h-full flex flex-col bg-gray-900 p-6">
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-blue-600/20 flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">Analysis Tools</h3>
        <p className="text-sm text-gray-400 max-w-md mb-6">
          Timeline controls, filters, and analysis tools will appear here
        </p>

        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
              <Calendar className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">Timeline</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
              <Filter className="w-6 h-6 text-gray-400" />
            </div>
            <span className="text-xs text-gray-500">Filters</span>
          </div>
        </div>
      </div>
    </div>
  )
}

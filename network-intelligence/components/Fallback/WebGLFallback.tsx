'use client'

import React from 'react'

interface WebGLFallbackProps {
  onRetry?: () => void
}

export const WebGLFallback: React.FC<WebGLFallbackProps> = ({ onRetry }) => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900">
      <div className="text-center p-8 max-w-md">
        {/* Earth icon */}
        <div className="text-6xl mb-6">🌍</div>
        
        <h2 className="text-white text-2xl font-bold mb-4">
          3D Globe Unavailable
        </h2>
        
        <p className="text-blue-200 mb-6 leading-relaxed">
          WebGL is required for the 3D globe visualization. This might be due to:
        </p>
        
        <ul className="text-blue-300 text-sm text-left mb-8 space-y-2 bg-blue-800/30 p-4 rounded-lg">
          <li>• Browser compatibility issues</li>
          <li>• Hardware acceleration disabled</li>
          <li>• Outdated graphics drivers</li>
          <li>• Running in a restricted environment</li>
        </ul>
        
        {/* Simplified 2D representation */}
        <div className="bg-blue-800/50 rounded-lg p-6 mb-6">
          <div className="text-center">
            <div className="text-3xl mb-2">📡</div>
            <p className="text-blue-200 text-sm">Ground Station Network</p>
            <p className="text-blue-300 text-xs mt-1">8 Active Stations</p>
            
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-500/20 text-green-300 p-2 rounded">
                <div>Virginia</div>
                <div>75% Util</div>
              </div>
              <div className="bg-yellow-500/20 text-yellow-300 p-2 rounded">
                <div>Maryland</div>
                <div>45% Util</div>
              </div>
              <div className="bg-green-500/20 text-green-300 p-2 rounded">
                <div>Hawaii</div>
                <div>88% Util</div>
              </div>
              <div className="bg-blue-500/20 text-blue-300 p-2 rounded">
                <div>California</div>
                <div>72% Util</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {onRetry && (
            <button
              onClick={onRetry}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                       transition-colors font-medium"
            >
              Try Again
            </button>
          )}
          
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 
                     transition-colors font-medium"
          >
            Refresh Page
          </button>
          
          <div className="text-xs text-blue-400 mt-4">
            <p>For best experience, use Chrome, Firefox, or Safari with WebGL enabled.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
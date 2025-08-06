/**
 * Test Page for Opportunity Analysis
 * Simple version without complex dependencies
 */

"use client";

import React from 'react';

export default function OpportunityAnalysisTestPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">
          Ground Station Opportunity Analysis (Test)
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Test Cards */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">SES Stations</h2>
            <div className="space-y-2">
              <div className="text-gray-400">Betzdorf, Luxembourg</div>
              <div className="text-gray-400">Gibraltar</div>
              <div className="text-gray-400">Stockholm, Sweden</div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Intelsat Stations</h2>
            <div className="space-y-2">
              <div className="text-gray-400">Riverside CA, USA</div>
              <div className="text-gray-400">Mountainside MD, USA</div>
              <div className="text-gray-400">Fuchsstadt, Germany</div>
            </div>
          </div>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Analysis Status</h2>
            <div className="space-y-2">
              <div className="text-green-500">✓ Page Loading</div>
              <div className="text-green-500">✓ Components Rendered</div>
              <div className="text-yellow-500">⚠ Data Processing Simplified</div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 p-6 bg-blue-900/20 border border-blue-700 rounded-lg">
          <p className="text-blue-300">
            This is a simplified test page to verify the application is working.
            The full multi-agent analysis has been temporarily disabled due to client-side processing limitations.
          </p>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

export function DataQualityTask() {
  const [selectedDataset, setSelectedDataset] = useState('customer_dimension');
  const [qualityScore, setQualityScore] = useState(77);
  const [issues, setIssues] = useState([
    { type: 'Duplicates', count: '23%', severity: 'high', details: '5,234 duplicate records found' },
    { type: 'Null Values', count: '3%', severity: 'medium', details: 'Missing email addresses' },
    { type: 'Format Issues', count: '8%', severity: 'low', details: 'Inconsistent date formats' },
    { type: 'Outliers', count: '1%', severity: 'low', details: 'Suspicious values detected' }
  ]);

  return (
    <div className="h-full bg-gray-950 text-gray-200 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Data Quality Assessment</h1>
        <p className="text-gray-400">Analyzing quality issues and generating improvement recommendations</p>
      </div>

      {/* Dataset Selector */}
      <div className="mb-6">
        <label className="block text-sm text-gray-400 mb-2">Select Dataset</label>
        <select 
          value={selectedDataset}
          onChange={(e) => setSelectedDataset(e.target.value)}
          className="w-full md:w-64 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
        >
          <option value="customer_dimension">Customer Dimension</option>
          <option value="product_catalog">Product Catalog</option>
          <option value="transaction_fact">Transaction Fact</option>
          <option value="inventory_snapshot">Inventory Snapshot</option>
        </select>
      </div>

      {/* Quality Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-1">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Overall Quality Score</h3>
            <div className="relative h-40 flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-gray-800"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 56}`}
                  strokeDashoffset={`${2 * Math.PI * 56 * (1 - qualityScore / 100)}`}
                  className={cn(
                    "transition-all duration-500",
                    qualityScore > 90 ? "text-green-400" :
                    qualityScore > 70 ? "text-yellow-400" : "text-red-400"
                  )}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{qualityScore}%</span>
                <span className="text-xs text-gray-400">Quality Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Issues Breakdown */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-xl p-6 h-full">
            <h3 className="text-lg font-semibold mb-4">Quality Issues Detected</h3>
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      issue.severity === 'high' ? 'bg-red-400' :
                      issue.severity === 'medium' ? 'bg-yellow-400' : 'bg-blue-400'
                    )} />
                    <div>
                      <div className="font-medium">{issue.type}</div>
                      <div className="text-sm text-gray-400">{issue.details}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{issue.count}</div>
                    <div className="text-xs text-gray-500">affected</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2">
          <i className="fas fa-play" />
          Run Full Analysis
        </button>
        <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
          <i className="fas fa-wrench" />
          Configure Rules
        </button>
        <button className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">
          <i className="fas fa-download" />
          Export Report
        </button>
      </div>
    </div>
  );
}
'use client'

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface TestingValidationProps {
  issueId: string
  onAddColumn?: (column: any) => void
  onFocusColumn?: (id: string) => void
}

export function TestingValidation({ issueId }: TestingValidationProps) {
  const [testProgress, setTestProgress] = useState(0)
  const [currentTest, setCurrentTest] = useState('')
  const [testResults, setTestResults] = useState<any[]>([])

  useEffect(() => {
    // Simulate test execution
    const tests = [
      { name: 'Schema validation', duration: 1000 },
      { name: 'Data integrity check', duration: 1500 },
      { name: 'Performance benchmark', duration: 2000 },
      { name: 'Downstream impact analysis', duration: 1200 }
    ]

    let currentIndex = 0
    const runTests = () => {
      if (currentIndex < tests.length) {
        const test = tests[currentIndex]
        setCurrentTest(test.name)
        setTestProgress((currentIndex / tests.length) * 100)
        
        setTimeout(() => {
          setTestResults(prev => [...prev, {
            name: test.name,
            status: 'passed',
            time: `${test.duration}ms`
          }])
          currentIndex++
          runTests()
        }, test.duration)
      } else {
        setTestProgress(100)
        setCurrentTest('All tests completed')
      }
    }

    runTests()
  }, [])

  return (
    <div className="h-full overflow-y-auto p-8 text-white">
      <h1 className="text-2xl font-light mb-8 tracking-wide flex items-center gap-3">
        <span className="text-3xl">🧪</span>
        TESTING & VALIDATION
      </h1>

      {/* Test Progress */}
      <div className="mb-8">
        <h2 className="text-lg text-[#94a3b8] mb-4">TEST EXECUTION:</h2>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#64748b]">{currentTest}</span>
            <span className="text-[#94a3b8]">{Math.round(testProgress)}%</span>
          </div>
          <div className="w-full bg-[#1e293b] rounded-full h-2">
            <div 
              className="bg-[#22c55e] h-full rounded-full transition-all duration-500"
              style={{ width: `${testProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Test Results */}
      <div className="mb-8">
        <h2 className="text-lg text-[#94a3b8] mb-4">TEST RESULTS:</h2>
        <div className="space-y-2">
          {testResults.map((result, idx) => (
            <div 
              key={idx}
              className="flex items-center justify-between p-3 bg-[#0f172a] border border-[#334155] rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-[#22c55e]">✅</span>
                <span>{result.name}</span>
              </div>
              <span className="text-[#64748b] text-sm">{result.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Validation Summary */}
      {testProgress === 100 && (
        <div className="mb-8">
          <div className="border border-[#22c55e] rounded-lg p-6 bg-[#22c55e]/5">
            <h3 className="text-lg mb-4 flex items-center gap-2">
              <span>✅</span> ALL TESTS PASSED
            </h3>
            <div className="space-y-2 text-[#94a3b8]">
              <div>• Schema changes validated successfully</div>
              <div>• No data integrity issues detected</div>
              <div>• Performance within acceptable thresholds</div>
              <div>• Downstream systems ready for update</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button 
          className="px-6 py-3 bg-white text-black rounded-md hover:bg-[#94a3b8] transition-colors"
          disabled={testProgress < 100}
        >
          Deploy to Production
        </button>
        <button className="px-6 py-3 border border-[#334155] rounded-md hover:bg-[#334155] transition-colors">
          View Detailed Report
        </button>
      </div>

      {/* Navigation Hint */}
      <div className="mt-12 text-right text-[#64748b] text-sm">
        Next: Deploy → <span className="text-[#94a3b8]">(peek)</span>
      </div>
    </div>
  )
}
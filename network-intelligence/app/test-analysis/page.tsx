'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Play, Loader2 } from 'lucide-react'

export default function TestAnalysisPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [testType, setTestType] = useState<string>('')

  const runTest = async (type: string) => {
    setLoading(true)
    setTestType(type)
    setResults(null)

    try {
      switch (type) {
        case 'route':
          const { getRouteAnalysisService } = await import('@/lib/services/routeAnalysisService')
          const routeService = getRouteAnalysisService()
          const routeResult = await routeService.generateAnalyzedRoute({
            from: [-58.3816, -34.6037],
            to: [-58.4173, -34.6131],
            mode: 'driving',
            startTime: new Date()
          })
          setResults(routeResult)
          break

        case 'imagery':
          const { getSatelliteImageryService } = await import('@/lib/services/satelliteImageryService')
          const { getImageryAnalysisService } = await import('@/lib/services/imageryAnalysisService')

          const imageryService = getSatelliteImageryService()
          const analysisService = getImageryAnalysisService()

          const timeSeries = await imageryService.getTimeSeries(
            [-58.3816, -34.6037],
            new Date('2024-09-01'),
            new Date('2024-11-01')
          )

          const activity = await analysisService.analyzeActivity(timeSeries, 'Buenos Aires')
          setResults(activity)
          break

        case 'isochrone':
          const { getIsochroneAnalysisService } = await import('@/lib/services/isochroneAnalysisService')
          const isochroneService = getIsochroneAnalysisService()
          const isochroneResult = await isochroneService.analyzeReachability({
            center: [-58.3816, -34.6037],
            locationName: 'Buenos Aires City Center',
            modes: ['driving', 'walking', 'cycling'],
            contours: [15, 30, 45]
          })
          setResults(isochroneResult)
          break

        case 'multi':
          const { getMultiLayerAnalysisService } = await import('@/lib/services/multiLayerAnalysisService')
          const multiService = getMultiLayerAnalysisService()
          const multiResult = await multiService.analyzeLocation({
            center: [-58.3816, -34.6037],
            locationName: 'Buenos Aires',
            analysisTypes: ['route', 'imagery', 'isochrone'],
            route: {
              from: [-58.3816, -34.6037],
              to: [-58.4173, -34.6131],
              mode: 'driving'
            },
            imagery: {
              startDate: new Date('2024-09-01'),
              endDate: new Date('2024-11-01'),
              includeChangeDetection: true,
              includeActivityAnalysis: true
            },
            isochrone: {
              modes: ['driving', 'walking'],
              contours: [15, 30]
            }
          })
          setResults(multiResult)
          break
      }
    } catch (error) {
      console.error('Test failed:', error)
      setResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Multi-Layer Analysis - Test Suite
          </h1>
          <p className="text-gray-600 mb-8">
            Test the intelligence analysis services. Results will appear below.
          </p>

          {/* Test Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <TestButton
              onClick={() => runTest('route')}
              loading={loading && testType === 'route'}
              label="Route Analysis"
              description="Test route with multi-INT"
              emoji="🗺️"
            />
            <TestButton
              onClick={() => runTest('imagery')}
              loading={loading && testType === 'imagery'}
              label="Satellite Imagery"
              description="Test change detection"
              emoji="🛰️"
            />
            <TestButton
              onClick={() => runTest('isochrone')}
              loading={loading && testType === 'isochrone'}
              label="Isochrone"
              description="Test reachability"
              emoji="🎯"
            />
            <TestButton
              onClick={() => runTest('multi')}
              loading={loading && testType === 'multi'}
              label="Multi-Layer"
              description="Integrated analysis"
              emoji="🎖️"
            />
          </div>

          {/* Results */}
          {loading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-blue-900 font-semibold">
                Running {testType} analysis...
              </p>
              <p className="text-blue-700 text-sm mt-2">
                This may take 5-10 seconds
              </p>
            </div>
          )}

          {results && !loading && (
            <div className="bg-gray-900 rounded-lg p-6 overflow-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">
                  Results: {testType.toUpperCase()}
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(results, null, 2))
                    alert('Copied to clipboard!')
                  }}
                  className="bg-white"
                >
                  Copy JSON
                </Button>
              </div>

              {/* Summary Cards */}
              {testType === 'route' && results.riskAssessment && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <SummaryCard
                    label="Risk Level"
                    value={results.riskAssessment.riskLevel.toUpperCase()}
                    color="orange"
                  />
                  <SummaryCard
                    label="Risk Score"
                    value={`${results.riskAssessment.overallRiskScore}/100`}
                    color="red"
                  />
                  <SummaryCard
                    label="Distance"
                    value={`${(results.route.distance / 1000).toFixed(1)}km`}
                    color="blue"
                  />
                  <SummaryCard
                    label="Anomalies"
                    value={results.anomalyDetection.anomalyCount}
                    color="yellow"
                  />
                </div>
              )}

              {testType === 'imagery' && results.activityLevel && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <SummaryCard
                    label="Activity Level"
                    value={results.activityLevel.replace('_', ' ').toUpperCase()}
                    color="green"
                  />
                  <SummaryCard
                    label="Activity Score"
                    value={`${results.activityScore}/100`}
                    color="blue"
                  />
                  <SummaryCard
                    label="Indicators"
                    value={results.indicators.length}
                    color="orange"
                  />
                  <SummaryCard
                    label="Change Freq"
                    value={`${results.changeFrequency.toFixed(1)}/mo`}
                    color="purple"
                  />
                </div>
              )}

              {testType === 'isochrone' && results.accessibility && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <SummaryCard
                    label="Accessibility"
                    value={results.accessibility.level.replace('_', ' ').toUpperCase()}
                    color="green"
                  />
                  <SummaryCard
                    label="Score"
                    value={`${results.accessibility.overallScore}/100`}
                    color="blue"
                  />
                  <SummaryCard
                    label="Best Mode"
                    value={results.comparison.fastestMode}
                    color="purple"
                  />
                  <SummaryCard
                    label="Coverage"
                    value={`${results.statistics.totalArea.toFixed(0)} km²`}
                    color="cyan"
                  />
                </div>
              )}

              {testType === 'multi' && results.integration && (
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <SummaryCard
                    label="Risk Level"
                    value={results.integration.riskLevel.toUpperCase()}
                    color="red"
                  />
                  <SummaryCard
                    label="Risk Score"
                    value={`${results.integration.overallRiskScore}/100`}
                    color="orange"
                  />
                  <SummaryCard
                    label="Confidence"
                    value={`${results.metadata.confidenceScore}%`}
                    color="green"
                  />
                  <SummaryCard
                    label="Findings"
                    value={results.integration.keyFindings.length}
                    color="blue"
                  />
                </div>
              )}

              {/* Full JSON */}
              <pre className="text-green-400 text-xs font-mono whitespace-pre-wrap">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}

          {!results && !loading && (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <p className="text-gray-600">
                Click a test button above to run analysis
              </p>
            </div>
          )}
        </div>

        {/* Documentation */}
        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quick Console Tests
          </h2>
          <p className="text-gray-600 mb-4">
            You can also test in the browser console. Open DevTools and run:
          </p>
          <div className="bg-gray-900 rounded-lg p-4 text-green-400 text-sm font-mono overflow-x-auto">
            <div className="mb-2">// Quick Route Test (NYC to LGA)</div>
            <div>{`(async () => {
  const { getRouteAnalysisService } = await import('/lib/services/routeAnalysisService')
  const result = await getRouteAnalysisService().generateAnalyzedRoute({
    from: [-74.0060, 40.7128],
    to: [-73.9352, 40.7306],
    mode: 'driving'
  })
  console.log('Route Analysis:', result)
  return result
})()`}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function TestButton({
  onClick,
  loading,
  label,
  description,
  emoji
}: {
  onClick: () => void
  loading: boolean
  label: string
  description: string
  emoji: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
    >
      <div className="text-3xl mb-3">{emoji}</div>
      <div className="font-semibold text-gray-900 mb-1">{label}</div>
      <div className="text-xs text-gray-600">{description}</div>
      {loading && (
        <div className="mt-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        </div>
      )}
    </button>
  )
}

function SummaryCard({
  label,
  value,
  color
}: {
  label: string
  value: string | number
  color: string
}) {
  const colorMap: Record<string, string> = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500'
  }

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-700">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className="text-lg font-bold text-white flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${colorMap[color] || 'bg-gray-500'}`} />
        {value}
      </div>
    </div>
  )
}

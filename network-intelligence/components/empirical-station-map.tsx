'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import Map from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { MapView } from '@deck.gl/core'
import { ScatterplotLayer, TextLayer } from '@deck.gl/layers'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle,
  X,
  Info,
  DollarSign,
  Target,
  BarChart3
} from 'lucide-react'
import { empiricalStationScoring, type ScoredStation } from '@/lib/services/empirical-station-scoring'

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

const INITIAL_VIEW_STATE = {
  longitude: -40,
  latitude: 30,
  zoom: 2.5,
  pitch: 0,
  bearing: 0
}

export function EmpiricalStationMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE)
  const [scoredStations, setScoredStations] = useState<ScoredStation[]>([])
  const [selectedStation, setSelectedStation] = useState<ScoredStation | null>(null)
  const [validationMetrics, setValidationMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [showHalos, setShowHalos] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  
  // Load and score stations
  useEffect(() => {
    const loadStations = async () => {
      setLoading(true)
      try {
        const stations = await empiricalStationScoring.scoreAllStations()
        setScoredStations(stations)
        
        const metrics = await empiricalStationScoring.getValidationMetrics()
        setValidationMetrics(metrics)
      } catch (error) {
        console.error('Failed to load stations:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadStations()
  }, [])
  
  // Create deck.gl layers
  const layers = useMemo(() => {
    const baseLayers = []
    
    // Halo layer (outer glow for emphasis)
    if (showHalos) {
      baseLayers.push(
        new ScatterplotLayer({
          id: 'station-halos',
          data: scoredStations.filter(s => s.haloIntensity > 0.3),
          getPosition: (d: ScoredStation) => [d.longitude, d.latitude],
          getRadius: (d: ScoredStation) => d.visualSize * 2000,
          getFillColor: (d: ScoredStation) => {
            const color = d.visualColor
            const rgb = hexToRgb(color)
            return [...rgb, Math.floor(d.haloIntensity * 100)]
          },
          radiusMinPixels: 15,
          radiusMaxPixels: 60,
          stroked: false,
          filled: true
        })
      )
    }
    
    // Main station markers
    baseLayers.push(
      new ScatterplotLayer({
        id: 'stations',
        data: scoredStations,
        getPosition: (d: ScoredStation) => [d.longitude, d.latitude],
        getRadius: (d: ScoredStation) => d.visualSize * 1000,
        getFillColor: (d: ScoredStation) => {
          const rgb = hexToRgb(d.visualColor)
          return [...rgb, Math.floor(d.visualOpacity * 255)]
        },
        getLineColor: [255, 255, 255, 200],
        lineWidthMinPixels: 2,
        radiusMinPixels: 8,
        radiusMaxPixels: 40,
        stroked: true,
        filled: true,
        pickable: true,
        onClick: (info: any) => setSelectedStation(info.object)
      })
    )
    
    // Confidence indicator rings
    baseLayers.push(
      new ScatterplotLayer({
        id: 'confidence-rings',
        data: scoredStations,
        getPosition: (d: ScoredStation) => [d.longitude, d.latitude],
        getRadius: (d: ScoredStation) => d.visualSize * 1500,
        getFillColor: [0, 0, 0, 0],
        getLineColor: (d: ScoredStation) => {
          // Color based on confidence level
          if (d.empiricalConfidence > 0.8) return [100, 255, 100, 150] // High confidence - green
          if (d.empiricalConfidence > 0.6) return [255, 255, 100, 150] // Medium - yellow
          return [255, 100, 100, 150] // Low - red
        },
        lineWidthMinPixels: 1,
        lineWidthMaxPixels: 2,
        radiusMinPixels: 12,
        radiusMaxPixels: 50,
        stroked: true,
        filled: false
      })
    )
    
    // Station labels
    if (showLabels) {
      // Only show labels for top stations and those with issues
      const labeledStations = scoredStations.filter((s, i) => 
        i < 10 || // Top 10 by score
        s.performanceCategory === 'loss' || // Loss-making stations
        s.empiricalConfidence < 0.5 || // Low confidence stations
        s.modelAccuracy < 0.5 // Poor model predictions
      )
      
      baseLayers.push(
        new TextLayer({
          id: 'station-labels',
          data: labeledStations,
          getPosition: (d: ScoredStation) => [d.longitude, d.latitude],
          getText: (d: ScoredStation) => d.name,
          getSize: 11,
          getColor: [255, 255, 255, 220],
          getAngle: 0,
          getTextAnchor: 'middle',
          getAlignmentBaseline: 'bottom',
          billboard: true,
          fontSettings: {
            sdf: true,
            fontSize: 128,
            buffer: 4
          },
          outlineWidth: 2,
          outlineColor: [0, 0, 0, 255]
        })
      )
    }
    
    return baseLayers
  }, [scoredStations, showLabels, showHalos])
  
  // Helper function to convert hex to RGB
  const hexToRgb = (hex: string): number[] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [128, 128, 128]
  }
  
  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (scoredStations.length === 0) return null
    
    const profitable = scoredStations.filter(s => s.performanceCategory === 'profitable')
    const marginal = scoredStations.filter(s => s.performanceCategory === 'marginal')
    const loss = scoredStations.filter(s => s.performanceCategory === 'loss')
    
    const avgScore = scoredStations.reduce((sum, s) => sum + s.empiricalScore, 0) / scoredStations.length
    const avgConfidence = scoredStations.reduce((sum, s) => sum + s.empiricalConfidence, 0) / scoredStations.length
    const avgAccuracy = scoredStations.reduce((sum, s) => sum + s.modelAccuracy, 0) / scoredStations.length
    
    const totalRevenue = scoredStations.reduce((sum, s) => sum + s.revenue, 0)
    const totalProfit = scoredStations.reduce((sum, s) => sum + s.profit, 0)
    
    return {
      total: scoredStations.length,
      profitable: profitable.length,
      marginal: marginal.length,
      loss: loss.length,
      avgScore: (avgScore * 100).toFixed(1),
      avgConfidence: (avgConfidence * 100).toFixed(1),
      avgAccuracy: (avgAccuracy * 100).toFixed(1),
      totalRevenue: totalRevenue.toFixed(1),
      totalProfit: totalProfit.toFixed(1),
      avgMargin: ((totalProfit / totalRevenue) * 100).toFixed(1)
    }
  }, [scoredStations])
  
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading empirically-validated station data...</div>
      </div>
    )
  }
  
  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Map */}
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState }: any) => setViewState(viewState)}
        controller={true}
        layers={layers}
        views={new MapView()}
      >
        <Map 
          mapStyle={MAP_STYLE}
          mapLib={import('maplibre-gl')}
        />
      </DeckGL>
      
      {/* Top Bar - Title and Controls */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm p-3 pointer-events-auto">
          <h1 className="text-lg font-bold text-white">
            Phase 2: Empirically-Validated Ground Station Intelligence
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            32 Known SES/Intelsat Stations with Performance Metrics
          </p>
        </Card>
        
        <div className="flex gap-2 pointer-events-auto">
          <Button
            size="sm"
            variant={showLabels ? 'default' : 'outline'}
            onClick={() => setShowLabels(!showLabels)}
            className="bg-gray-800 border-gray-600"
          >
            Labels
          </Button>
          <Button
            size="sm"
            variant={showHalos ? 'default' : 'outline'}
            onClick={() => setShowHalos(!showHalos)}
            className="bg-gray-800 border-gray-600"
          >
            Halos
          </Button>
        </div>
      </div>
      
      {/* Left Panel - Summary Statistics */}
      {summaryStats && (
        <div className="absolute top-20 left-4 z-10 w-80">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="validation">Validation</TabsTrigger>
                <TabsTrigger value="legend">Legend</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-xs text-gray-400">Total Stations</div>
                    <div className="text-xl font-bold text-white">{summaryStats.total}</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-2">
                    <div className="text-xs text-gray-400">Avg Score</div>
                    <div className="text-xl font-bold text-white">{summaryStats.avgScore}%</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Profitable</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-green-400">{summaryStats.profitable}</span>
                      <div className="w-20 h-2 bg-gray-700 rounded">
                        <div 
                          className="h-full bg-green-500 rounded"
                          style={{ width: `${(summaryStats.profitable / summaryStats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Marginal</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-yellow-400">{summaryStats.marginal}</span>
                      <div className="w-20 h-2 bg-gray-700 rounded">
                        <div 
                          className="h-full bg-yellow-500 rounded"
                          style={{ width: `${(summaryStats.marginal / summaryStats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Loss</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-400">{summaryStats.loss}</span>
                      <div className="w-20 h-2 bg-gray-700 rounded">
                        <div 
                          className="h-full bg-red-500 rounded"
                          style={{ width: `${(summaryStats.loss / summaryStats.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-gray-700">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Total Revenue</span>
                    <span className="text-white font-medium">${summaryStats.totalRevenue}M</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">Total Profit</span>
                    <span className="text-white font-medium">${summaryStats.totalProfit}M</span>
                  </div>
                  <div className="flex justify-between text-xs mt-1">
                    <span className="text-gray-400">Avg Margin</span>
                    <span className="text-white font-medium">{summaryStats.avgMargin}%</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="validation" className="p-4 space-y-3">
                {validationMetrics && (
                  <>
                    <div className="bg-gray-800/50 rounded p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-white font-medium">Model Accuracy</span>
                        <Badge variant={validationMetrics.overallAccuracy >= 70 ? 'default' : 'secondary'}>
                          {validationMetrics.overallAccuracy.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-400">
                        Target: 70% • Status: {validationMetrics.overallAccuracy >= 70 ? 'PASS' : 'FAIL'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 font-medium">Precision by Category</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Profitable</span>
                          <span className="text-green-400">
                            {(validationMetrics.profitablePrecision * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Marginal</span>
                          <span className="text-yellow-400">
                            {(validationMetrics.marginalPrecision * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Loss</span>
                          <span className="text-red-400">
                            {(validationMetrics.lossPrecision * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-xs text-gray-400 font-medium">Confidence Distribution</div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">High (&gt;70%)</span>
                          <span className="text-white">
                            {validationMetrics.confidenceDistribution.high.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Medium (40-70%)</span>
                          <span className="text-white">
                            {validationMetrics.confidenceDistribution.medium.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-300">Low (&lt;40%)</span>
                          <span className="text-white">
                            {validationMetrics.confidenceDistribution.low.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <Info className="w-3 h-3" />
                        <span>Model validated against empirical weights</span>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="legend" className="p-4 space-y-3">
                <div>
                  <div className="text-xs text-gray-400 font-medium mb-2">Visual Encoding</div>
                  
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-gray-300 mb-1">Size = Revenue/Importance</div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-gray-500" />
                        <span className="text-xs text-gray-400">Low</span>
                        <div className="w-6 h-6 rounded-full bg-gray-500" />
                        <span className="text-xs text-gray-400">Medium</span>
                        <div className="w-8 h-8 rounded-full bg-gray-500" />
                        <span className="text-xs text-gray-400">High</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-300 mb-1">Color = Performance</div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500" />
                          <span className="text-xs text-gray-400">Profitable (&gt;25% margin)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500" />
                          <span className="text-xs text-gray-400">Marginal (10-25% margin)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500" />
                          <span className="text-xs text-gray-400">Loss (&lt;10% margin)</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-300 mb-1">Opacity = Confidence</div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-500 opacity-40" />
                        <span className="text-xs text-gray-400">Low</span>
                        <div className="w-3 h-3 rounded-full bg-gray-500 opacity-70" />
                        <span className="text-xs text-gray-400">Medium</span>
                        <div className="w-3 h-3 rounded-full bg-gray-500 opacity-100" />
                        <span className="text-xs text-gray-400">High</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-xs text-gray-300 mb-1">Halo = Emphasis</div>
                      <div className="text-xs text-gray-400">
                        Bright halo indicates high utilization, margin, or score
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      )}
      
      {/* Station Details Panel */}
      {selectedStation && (
        <div className="absolute top-20 right-4 z-10 w-96">
          <Card className="bg-gray-900/95 border-gray-700 backdrop-blur-sm">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedStation.name}</h3>
                  <p className="text-sm text-gray-400">{selectedStation.city}, {selectedStation.country}</p>
                </div>
                <button 
                  onClick={() => setSelectedStation(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-xs text-gray-400">Utilization</div>
                  <div className="text-lg font-bold text-white">{selectedStation.utilization}%</div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-xs text-gray-400">Margin</div>
                  <div className="text-lg font-bold text-white">
                    {(selectedStation.margin * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-2">
                  <div className="text-xs text-gray-400">Score</div>
                  <div className="text-lg font-bold text-white">
                    {(selectedStation.empiricalScore * 100).toFixed(1)}
                  </div>
                </div>
              </div>
              
              {/* Financial Metrics */}
              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Revenue</span>
                  <span className="text-white font-medium">${selectedStation.revenue.toFixed(1)}M</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Profit</span>
                  <span className={`font-medium ${selectedStation.profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${selectedStation.profit.toFixed(1)}M
                  </span>
                </div>
              </div>
              
              {/* Model Performance */}
              <div className="bg-gray-800/50 rounded p-3 mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Model Confidence</span>
                  <Badge variant={selectedStation.empiricalConfidence > 0.7 ? 'default' : 'secondary'}>
                    {(selectedStation.empiricalConfidence * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-400">Prediction Accuracy</span>
                  <Badge variant={selectedStation.modelAccuracy > 0.7 ? 'default' : 'destructive'}>
                    {(selectedStation.modelAccuracy * 100).toFixed(1)}%
                  </Badge>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-700">
                  <div className="text-xs text-gray-400">Uncertainty Band</div>
                  <div className="text-xs text-white">
                    {(selectedStation.uncertaintyBand[0] * 100).toFixed(1)} - {(selectedStation.uncertaintyBand[1] * 100).toFixed(1)}
                  </div>
                </div>
              </div>
              
              {/* Performance Category */}
              <div className="flex items-center justify-between p-2 bg-gray-800/30 rounded">
                <span className="text-xs text-gray-400">Category</span>
                <Badge 
                  variant={
                    selectedStation.performanceCategory === 'profitable' ? 'default' :
                    selectedStation.performanceCategory === 'marginal' ? 'secondary' :
                    'destructive'
                  }
                  className={
                    selectedStation.performanceCategory === 'profitable' ? 'bg-green-600' :
                    selectedStation.performanceCategory === 'marginal' ? 'bg-yellow-600' :
                    'bg-red-600'
                  }
                >
                  {selectedStation.performanceCategory.toUpperCase()}
                </Badge>
              </div>
              
              {/* Opportunities and Risks */}
              {selectedStation.opportunities && selectedStation.opportunities.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Opportunities</div>
                  {selectedStation.opportunities.slice(0, 2).map((opp, idx) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-start gap-1 mb-1">
                      <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                      <span>{opp}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {selectedStation.risks && selectedStation.risks.length > 0 && (
                <div className="mt-2">
                  <div className="text-xs text-gray-400 mb-2">Risks</div>
                  {selectedStation.risks.slice(0, 2).map((risk, idx) => (
                    <div key={idx} className="text-xs text-gray-300 flex items-start gap-1 mb-1">
                      <AlertCircle className="w-3 h-3 text-yellow-500 mt-0.5" />
                      <span>{risk}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
'use client'

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  TrendingUp,
  PieChart as PieChartIcon,
  Table as TableIcon,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import StationDataTable, { type StationTableData } from '@/components/visualizations/StationDataTable'
import UtilizationTrendChart, { type UtilizationDataPoint } from '@/components/visualizations/UtilizationTrendChart'
import OperatorComparisonChart, { type OperatorData } from '@/components/visualizations/OperatorComparisonChart'
import ServiceDistributionChart, { type ServiceData } from '@/components/visualizations/ServiceDistributionChart'

interface AnalyticsDashboardProps {
  stations: StationTableData[]
  onClose?: () => void
  onStationSelect?: (station: StationTableData) => void
}

type ViewMode = 'grid' | 'table' | 'charts'

export default function AnalyticsDashboard({
  stations,
  onClose,
  onStationSelect
}: AnalyticsDashboardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Process data for visualizations
  const { utilizationData, operatorData, serviceData } = useMemo(() => {
    // Generate utilization trend data (last 7 days)
    const utilizationData: UtilizationDataPoint[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const avgUtilization = stations.reduce((acc, s) => acc + s.utilization, 0) / stations.length
      // Add some randomness for demo
      utilizationData.push({
        date,
        utilization: avgUtilization + (Math.random() * 10 - 5)
      })
    }

    // Aggregate operator data
    const operatorMap = new Map<string, { utilization: number[], stationCount: number, revenue: number }>()
    stations.forEach(station => {
      const existing = operatorMap.get(station.operator) || {
        utilization: [],
        stationCount: 0,
        revenue: 0
      }
      existing.utilization.push(station.utilization)
      existing.stationCount++
      existing.revenue += station.revenue
      operatorMap.set(station.operator, existing)
    })

    const operatorData: OperatorData[] = Array.from(operatorMap.entries()).map(([operator, data]) => ({
      operator,
      utilization: data.utilization.reduce((acc, u) => acc + u, 0) / data.utilization.length,
      stationCount: data.stationCount,
      revenue: data.revenue
    }))

    // Generate service distribution data
    const serviceMap = new Map<string, { count: number, revenue: number }>()
    stations.forEach(station => {
      if (station.services) {
        const services = station.services.split(',').map(s => s.trim())
        services.forEach(service => {
          const existing = serviceMap.get(service) || { count: 0, revenue: 0 }
          existing.count++
          existing.revenue += station.revenue / services.length
          serviceMap.set(service, existing)
        })
      }
    })

    const totalServices = Array.from(serviceMap.values()).reduce((acc, s) => acc + s.count, 0)
    const serviceData: ServiceData[] = Array.from(serviceMap.entries()).map(([service, data]) => ({
      service,
      percentage: (data.count / totalServices) * 100,
      revenue: data.revenue
    }))

    return { utilizationData, operatorData, serviceData }
  }, [stations])

  const handleExport = (format: 'csv' | 'json') => {
    console.log(`Exporting data as ${format}`)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`fixed ${
          isFullscreen
            ? 'inset-4'
            : 'top-20 left-1/2 -translate-x-1/2 w-[95vw] max-w-7xl h-[85vh]'
        } z-50 bg-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/50">
          <div className="flex items-center gap-4">
            <BarChart3 className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-white font-semibold text-lg">Analytics Dashboard</h2>
              <p className="text-gray-400 text-sm">
                {stations.length} stations • Real-time insights
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                  viewMode === 'grid'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Grid
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                  viewMode === 'table'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <TableIcon className="w-4 h-4" />
                Table
              </button>
              <button
                onClick={() => setViewMode('charts')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                  viewMode === 'charts'
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <PieChartIcon className="w-4 h-4" />
                Charts
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Utilization Trend */}
              <div className="col-span-2">
                <UtilizationTrendChart
                  data={utilizationData}
                  width={isFullscreen ? 1400 : 1100}
                  height={250}
                  title="7-Day Utilization Trend"
                />
              </div>

              {/* Operator Comparison */}
              <OperatorComparisonChart
                data={operatorData}
                width={isFullscreen ? 680 : 530}
                height={300}
                title="Operator Comparison"
                metric="utilization"
              />

              {/* Service Distribution */}
              <ServiceDistributionChart
                data={serviceData}
                width={isFullscreen ? 400 : 350}
                height={300}
                title="Service Distribution"
              />

              {/* Data Table */}
              <div className="col-span-2">
                <StationDataTable
                  data={stations}
                  onRowClick={onStationSelect}
                  onExport={handleExport}
                />
              </div>
            </div>
          )}

          {viewMode === 'table' && (
            <StationDataTable
              data={stations}
              onRowClick={onStationSelect}
              onExport={handleExport}
            />
          )}

          {viewMode === 'charts' && (
            <div className="grid grid-cols-1 gap-6">
              <UtilizationTrendChart
                data={utilizationData}
                width={isFullscreen ? 1400 : 1100}
                height={300}
                title="7-Day Utilization Trend"
              />

              <div className="grid grid-cols-2 gap-6">
                <OperatorComparisonChart
                  data={operatorData}
                  width={isFullscreen ? 680 : 530}
                  height={350}
                  title="Operator Comparison"
                  metric="utilization"
                />

                <ServiceDistributionChart
                  data={serviceData}
                  width={isFullscreen ? 450 : 400}
                  height={350}
                  title="Service Distribution"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/50">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div>
              Last updated: {new Date().toLocaleTimeString()}
            </div>
            <div className="flex items-center gap-4">
              <div>Avg Utilization: {(stations.reduce((acc, s) => acc + s.utilization, 0) / stations.length).toFixed(1)}%</div>
              <div>Total Revenue: ${stations.reduce((acc, s) => acc + s.revenue, 0).toFixed(1)}M</div>
              <div>Active Stations: {stations.filter(s => s.status === 'active').length}</div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

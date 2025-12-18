'use client'

/**
 * Risk Analysis View
 * Risk-scored vessel list with compliance and risk factor breakdown
 *
 * Features:
 * - Risk scoring display with severity colors
 * - Compliance status indicators
 * - Risk factor breakdown
 * - AIS gap and dark period tracking
 */

import React, { useMemo, useState, useCallback } from 'react'
import { Shield, AlertTriangle, ShieldAlert, ShieldCheck, Eye, EyeOff, Ship } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MaritimeDataTable } from '../MaritimeDataTable'
import { KPIGrid } from '../shared/KPICard'
import { MiniPieChart, MiniBarChart } from '../shared/AnalysisCharts'
import type {
  TableColumn,
  SortState,
  KPIData,
  VesselRiskAssessment,
  AnalysisViewProps
} from '@/lib/types/maritime-analysis'

// ============================================================================
// Types
// ============================================================================

export interface RiskAnalysisViewProps extends AnalysisViewProps<VesselRiskAssessment> {
  /** Risk threshold for alerts */
  alertThreshold?: number
}

// ============================================================================
// Constants
// ============================================================================

const RISK_LEVEL_COLORS: Record<string, string> = {
  low: 'bg-green-500/20 text-green-400 border-green-500/50',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  high: 'bg-orange-500/20 text-orange-400 border-orange-500/50',
  critical: 'bg-red-500/20 text-red-400 border-red-500/50'
}

const COMPLIANCE_COLORS: Record<string, string> = {
  compliant: 'bg-green-500/20 text-green-400 border-green-500/50',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  'non-compliant': 'bg-red-500/20 text-red-400 border-red-500/50'
}

// ============================================================================
// Column Definitions
// ============================================================================

function getColumns(): TableColumn<VesselRiskAssessment>[] {
  return [
    {
      key: 'mmsi',
      label: 'MMSI',
      width: 100,
      sortable: true,
      type: 'text',
      render: (value) => (
        <span className="font-mono text-xs">{value}</span>
      )
    },
    {
      key: 'name',
      label: 'Vessel',
      width: 140,
      sortable: true,
      type: 'text',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <span className="truncate">{value || row.mmsi}</span>
        </div>
      )
    },
    {
      key: 'riskLevel',
      label: 'Risk Level',
      width: 90,
      sortable: true,
      type: 'badge',
      badgeColors: RISK_LEVEL_COLORS
    },
    {
      key: 'riskScore',
      label: 'Score',
      width: 70,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          <div className={cn(
            'w-2 h-2 rounded-full',
            value >= 70 ? 'bg-red-400' :
            value >= 40 ? 'bg-orange-400' :
            value >= 20 ? 'bg-yellow-400' : 'bg-green-400'
          )} />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'complianceStatus',
      label: 'Compliance',
      width: 100,
      sortable: true,
      type: 'badge',
      badgeColors: COMPLIANCE_COLORS
    },
    {
      key: 'aisGapCount',
      label: 'AIS Gaps',
      width: 80,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <span className={cn(
          value > 5 ? 'text-red-400' :
          value > 2 ? 'text-orange-400' :
          value > 0 ? 'text-yellow-400' : 'text-slate-500'
        )}>
          {value}
        </span>
      )
    },
    {
      key: 'darkPeriodHours',
      label: 'Dark Time',
      width: 90,
      sortable: true,
      type: 'number',
      align: 'right',
      render: (value) => (
        <div className="flex items-center gap-1.5 justify-end">
          {value > 0 && <EyeOff className="w-3 h-3 text-orange-400" />}
          <span className={value > 24 ? 'text-red-400' : value > 0 ? 'text-orange-400' : 'text-slate-500'}>
            {value.toFixed(1)}h
          </span>
        </div>
      )
    },
    {
      key: 'loiteringEvents',
      label: 'Loitering',
      width: 80,
      sortable: true,
      type: 'number',
      align: 'right'
    },
    {
      key: 'rendezvousEvents',
      label: 'Rendezvous',
      width: 85,
      sortable: true,
      type: 'number',
      align: 'right'
    },
    {
      key: 'vesselType',
      label: 'Type',
      width: 90,
      sortable: true,
      type: 'badge'
    },
    {
      key: 'flag',
      label: 'Flag',
      width: 60,
      sortable: true,
      type: 'text'
    }
  ]
}

// ============================================================================
// Main Component
// ============================================================================

export function RiskAnalysisView({
  data,
  isLoading,
  error,
  onRowClick,
  onShowOnMap,
  selectedId,
  alertThreshold = 50
}: RiskAnalysisViewProps) {
  const [sortState, setSortState] = useState<SortState>({
    key: 'riskScore',
    direction: 'desc'
  })

  // Calculate KPIs
  const kpis = useMemo((): KPIData[] => {
    const critical = data.filter(v => v.riskLevel === 'critical').length
    const high = data.filter(v => v.riskLevel === 'high').length
    const nonCompliant = data.filter(v => v.complianceStatus === 'non-compliant').length
    const avgScore = data.length > 0
      ? data.reduce((sum, v) => sum + v.riskScore, 0) / data.length
      : 0
    const totalDarkHours = data.reduce((sum, v) => sum + v.darkPeriodHours, 0)

    return [
      {
        id: 'critical',
        label: 'Critical Risk',
        value: critical,
        color: critical > 0 ? 'danger' : 'success',
        icon: ShieldAlert
      },
      {
        id: 'high',
        label: 'High Risk',
        value: high,
        color: high > 0 ? 'warning' : 'success',
        icon: AlertTriangle
      },
      {
        id: 'nonCompliant',
        label: 'Non-Compliant',
        value: nonCompliant,
        color: nonCompliant > 0 ? 'danger' : 'success',
        icon: Shield
      },
      {
        id: 'avgScore',
        label: 'Avg Risk Score',
        value: Math.round(avgScore),
        color: avgScore > alertThreshold ? 'warning' : 'default'
      }
    ]
  }, [data, alertThreshold])

  // Risk level distribution
  const riskDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0
    }
    data.forEach(v => {
      distribution[v.riskLevel]++
    })
    return [
      { label: 'Critical', value: distribution.critical, color: '#f87171' },
      { label: 'High', value: distribution.high, color: '#fb923c' },
      { label: 'Medium', value: distribution.medium, color: '#fbbf24' },
      { label: 'Low', value: distribution.low, color: '#34d399' }
    ]
  }, [data])

  // Compliance distribution
  const complianceDistribution = useMemo(() => {
    const distribution: Record<string, number> = {
      compliant: 0,
      warning: 0,
      'non-compliant': 0
    }
    data.forEach(v => {
      distribution[v.complianceStatus]++
    })
    return [
      { label: 'Compliant', value: distribution.compliant, color: '#34d399' },
      { label: 'Warning', value: distribution.warning, color: '#fbbf24' },
      { label: 'Non-Compliant', value: distribution['non-compliant'], color: '#f87171' }
    ]
  }, [data])

  // Risk factor breakdown
  const riskFactorBreakdown = useMemo(() => {
    const factors: Record<string, number> = {}
    data.forEach(v => {
      v.riskFactors.forEach(f => {
        factors[f.type] = (factors[f.type] || 0) + 1
      })
    })
    return Object.entries(factors)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({
        label: type.replace(/_/g, ' '),
        value: count
      }))
  }, [data])

  const columns = useMemo(() => getColumns(), [])

  // Handle row click
  const handleRowClick = useCallback((row: VesselRiskAssessment) => {
    if (onRowClick) {
      onRowClick(row)
    }
  }, [onRowClick])

  // Handle show on map
  const handleShowOnMap = useCallback((row: VesselRiskAssessment) => {
    if (onShowOnMap) {
      onShowOnMap(row)
    }
  }, [onShowOnMap])

  return (
    <div className="h-full flex flex-col">
      {/* Header with KPIs and charts */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800/50">
        <div className="flex items-start justify-between gap-4">
          {/* KPIs */}
          <div className="flex-1 max-w-[480px]">
            <KPIGrid kpis={kpis} columns={4} size="sm" />
          </div>

          {/* Risk Level Pie Chart */}
          <div className="hidden lg:block">
            <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
              Risk Levels
            </span>
            <MiniPieChart
              data={riskDistribution}
              size={90}
              innerRadius={0.5}
              showLegend={false}
            />
          </div>

          {/* Compliance Pie Chart */}
          <div className="hidden xl:block">
            <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
              Compliance
            </span>
            <MiniPieChart
              data={complianceDistribution}
              size={90}
              innerRadius={0.5}
              showLegend={false}
            />
          </div>

          {/* Risk Factor Bar Chart */}
          {riskFactorBreakdown.length > 0 && (
            <div className="hidden 2xl:block">
              <span className="text-xs text-slate-400 uppercase tracking-wide block mb-2">
                Top Risk Factors
              </span>
              <MiniBarChart
                data={riskFactorBreakdown}
                width={180}
                height={80}
                showLabels={true}
                showValues={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden">
        <MaritimeDataTable
          data={data}
          columns={columns}
          sortState={sortState}
          onSortChange={setSortState}
          onRowClick={handleRowClick}
          onShowOnMap={handleShowOnMap}
          selectedId={selectedId}
          idKey="mmsi"
          isLoading={isLoading}
          emptyMessage="No risk assessments available"
          pageSize={100}
        />
      </div>
    </div>
  )
}

export default RiskAnalysisView

'use client'

/**
 * EntityDetailView - Detailed Entity Information
 *
 * Displays vessel info, port details, satellite data, etc. in document panel.
 * Similar to QuickInfoPanel but designed for chat flow integration.
 */

import React from 'react'
import {
  Ship,
  Anchor,
  Satellite,
  MapPin,
  Activity,
  Navigation,
  AlertTriangle,
  Clock,
  ExternalLink,
  Route,
  Globe,
  Radio
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EntityType } from '@/lib/services/responseRouterService'

// ============================================================================
// Types
// ============================================================================

export interface EntityDetailViewProps {
  entityType: EntityType
  data: any
  onShowOnMap?: () => void
  onShowHistory?: () => void
  onAnalyze?: () => void
  className?: string
}

// ============================================================================
// Entity Icons
// ============================================================================

const ENTITY_ICONS: Record<EntityType, typeof Ship> = {
  vessel: Ship,
  port: Anchor,
  route: Route,
  anomaly: AlertTriangle,
  satellite: Satellite,
  'ground-station': Radio,
  generic: Globe
}

const ENTITY_COLORS: Record<EntityType, string> = {
  vessel: 'text-blue-400 bg-blue-500/20',
  port: 'text-cyan-400 bg-cyan-500/20',
  route: 'text-emerald-400 bg-emerald-500/20',
  anomaly: 'text-amber-400 bg-amber-500/20',
  satellite: 'text-purple-400 bg-purple-500/20',
  'ground-station': 'text-orange-400 bg-orange-500/20',
  generic: 'text-slate-400 bg-slate-500/20'
}

// ============================================================================
// Component
// ============================================================================

export default function EntityDetailView({
  entityType,
  data,
  onShowOnMap,
  onShowHistory,
  onAnalyze,
  className
}: EntityDetailViewProps) {
  const Icon = ENTITY_ICONS[entityType] || Globe
  const colorClass = ENTITY_COLORS[entityType] || ENTITY_COLORS.generic

  // Extract common fields
  const name = data.name || data.vessel_name || data.NAME || 'Unknown'
  const status = data.status || data.STATUS
  const type = data.type || data.vessel_type || data.port_type || data.entityType

  return (
    <div className={cn('p-4 space-y-4', className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={cn('p-3 rounded-xl', colorClass)}>
          <Icon className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-slate-100 truncate">{name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {type && (
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                {type}
              </span>
            )}
            {status && (
              <StatusBadge status={status} />
            )}
          </div>
        </div>
      </div>

      {/* Entity-specific content */}
      {entityType === 'vessel' && <VesselDetails data={data} />}
      {entityType === 'port' && <PortDetails data={data} />}
      {entityType === 'satellite' && <SatelliteDetails data={data} />}
      {entityType === 'anomaly' && <AnomalyDetails data={data} />}
      {entityType === 'ground-station' && <GroundStationDetails data={data} />}
      {(entityType === 'generic' || entityType === 'route') && <GenericDetails data={data} />}

      {/* Actions */}
      <div className="pt-4 border-t border-slate-700/50 space-y-2">
        {onShowOnMap && (
          <button
            onClick={onShowOnMap}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-slate-700/50 hover:bg-slate-700/70 text-slate-200
                       transition-colors text-sm font-medium"
          >
            <MapPin className="w-4 h-4" />
            Show on Map
          </button>
        )}
        {onShowHistory && entityType === 'vessel' && (
          <button
            onClick={onShowHistory}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-slate-700/50 hover:bg-slate-700/70 text-slate-200
                       transition-colors text-sm font-medium"
          >
            <Route className="w-4 h-4" />
            Show Track History
          </button>
        )}
        {onAnalyze && (
          <button
            onClick={onAnalyze}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl
                       bg-blue-600 hover:bg-blue-500 text-white
                       transition-colors text-sm font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            Full Analysis
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Status Badge
// ============================================================================

function StatusBadge({ status }: { status: string }) {
  const statusColors: Record<string, string> = {
    moving: 'bg-green-500/20 text-green-400',
    active: 'bg-green-500/20 text-green-400',
    anchored: 'bg-purple-500/20 text-purple-400',
    moored: 'bg-blue-500/20 text-blue-400',
    idle: 'bg-yellow-500/20 text-yellow-400',
    offline: 'bg-red-500/20 text-red-400',
    unknown: 'bg-slate-500/20 text-slate-400'
  }

  return (
    <span className={cn(
      'px-2 py-0.5 rounded-full text-xs font-medium',
      statusColors[status.toLowerCase()] || statusColors.unknown
    )}>
      {status}
    </span>
  )
}

// ============================================================================
// Vessel Details
// ============================================================================

function VesselDetails({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Activity}
          label="Speed"
          value={data.speed ? `${data.speed.toFixed(1)} kn` : 'N/A'}
        />
        <MetricCard
          icon={Navigation}
          label="Heading"
          value={data.heading ? `${Math.round(data.heading)}°` : 'N/A'}
        />
      </div>

      {/* Position */}
      {(data.lat || data.latitude) && (
        <div className="p-3 rounded-xl bg-slate-800/50">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs uppercase tracking-wide">Position</span>
          </div>
          <p className="text-sm font-medium text-slate-200">
            {formatCoord(data.lat || data.latitude, 'lat')}, {formatCoord(data.lng || data.longitude, 'lng')}
          </p>
        </div>
      )}

      {/* Additional Info */}
      <DetailList items={[
        { label: 'MMSI', value: data.mmsi },
        { label: 'IMO', value: data.imo },
        { label: 'Call Sign', value: data.callSign || data.call_sign },
        { label: 'Flag', value: data.flag || data.flag_country },
        { label: 'Destination', value: data.destination },
        { label: 'ETA', value: data.eta }
      ]} />
    </div>
  )
}

// ============================================================================
// Port Details
// ============================================================================

function PortDetails({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Ship}
          label="Cargo Volume"
          value={data.cargo_teu ? `${(data.cargo_teu / 1000000).toFixed(1)}M TEU` : 'N/A'}
        />
        <MetricCard
          icon={Anchor}
          label="Port Type"
          value={data.port_type || 'N/A'}
        />
      </div>

      <DetailList items={[
        { label: 'Country', value: data.country },
        { label: 'Region', value: data.region },
        { label: 'Max Draft', value: data.max_draft ? `${data.max_draft}m` : null },
        { label: 'Berths', value: data.berths }
      ]} />
    </div>
  )
}

// ============================================================================
// Satellite Details
// ============================================================================

function SatelliteDetails({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Activity}
          label="Altitude"
          value={data.altitude_km ? `${data.altitude_km} km` : 'N/A'}
        />
        <MetricCard
          icon={Globe}
          label="Orbit Type"
          value={data.orbit_type || 'N/A'}
        />
      </div>

      <DetailList items={[
        { label: 'NORAD ID', value: data.norad_id },
        { label: 'Inclination', value: data.inclination_deg ? `${data.inclination_deg}°` : null },
        { label: 'Period', value: data.period_min ? `${data.period_min} min` : null },
        { label: 'Operator', value: data.operator },
        { label: 'Launch Date', value: data.launch_date }
      ]} />
    </div>
  )
}

// ============================================================================
// Anomaly Details
// ============================================================================

function AnomalyDetails({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <div className="flex items-center gap-2 text-amber-400 mb-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">Anomaly Detected</span>
        </div>
        <p className="text-sm text-slate-300">{data.description || 'Suspicious activity detected'}</p>
      </div>

      <DetailList items={[
        { label: 'Type', value: data.anomaly_type },
        { label: 'Severity', value: data.severity },
        { label: 'Confidence', value: data.confidence ? `${(data.confidence * 100).toFixed(0)}%` : null },
        { label: 'Detected At', value: data.detected_at },
        { label: 'Duration', value: data.duration }
      ]} />
    </div>
  )
}

// ============================================================================
// Ground Station Details
// ============================================================================

function GroundStationDetails({ data }: { data: any }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={Radio}
          label="Antennas"
          value={data.antennas || 'N/A'}
        />
        <MetricCard
          icon={Activity}
          label="Utilization"
          value={data.utilization_pct ? `${data.utilization_pct}%` : 'N/A'}
        />
      </div>

      <DetailList items={[
        { label: 'Operator', value: data.operator },
        { label: 'Country', value: data.country },
        { label: 'Frequency Band', value: data.frequency_band },
        { label: 'Coverage', value: data.coverage }
      ]} />
    </div>
  )
}

// ============================================================================
// Generic Details
// ============================================================================

function GenericDetails({ data }: { data: any }) {
  const entries = Object.entries(data).filter(([key]) =>
    !['id', 'ID', 'lat', 'lng', 'latitude', 'longitude'].includes(key)
  )

  return (
    <div className="space-y-2">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700/50">
          <span className="text-sm text-slate-400">{formatKey(key)}</span>
          <span className="text-sm text-slate-200">{String(value)}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Helper Components
// ============================================================================

function MetricCard({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-800/50">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-lg font-semibold text-slate-200">{value}</p>
    </div>
  )
}

function DetailList({ items }: { items: { label: string; value: any }[] }) {
  const validItems = items.filter(item => item.value !== undefined && item.value !== null)

  if (validItems.length === 0) return null

  return (
    <div className="space-y-1">
      {validItems.map((item, i) => (
        <div key={i} className="flex items-center justify-between py-2 border-b border-slate-700/50">
          <span className="text-sm text-slate-400">{item.label}</span>
          <span className="text-sm text-slate-200">{String(item.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ============================================================================
// Helpers
// ============================================================================

function formatCoord(value: number, type: 'lat' | 'lng'): string {
  const direction = type === 'lat' ? (value >= 0 ? 'N' : 'S') : (value >= 0 ? 'E' : 'W')
  return `${Math.abs(value).toFixed(4)}° ${direction}`
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

/**
 * Maritime Analysis Type Definitions
 * Shared types for the reusable maritime analytics UI system
 */

import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { DetectedAnomaly, AnomalyType, AnomalySeverity } from './ais-anomaly'

// ============================================================================
// Analysis Types
// ============================================================================

/**
 * Available analysis view types
 */
export type AnalysisType =
  | 'anomalies'   // AIS gaps, loitering, rendezvous, speed anomalies
  | 'fleet'       // Fleet overview and statistics
  | 'vessels'     // Individual vessel list and search
  | 'routes'      // Route analysis and port-to-port stats
  | 'ports'       // Port performance metrics
  | 'risk'        // Risk scoring and compliance

/**
 * Sort direction for table columns
 */
export type SortDirection = 'asc' | 'desc'

/**
 * Cell renderer types for the unified data table
 */
export type CellType =
  | 'text'        // Plain text
  | 'number'      // Formatted number
  | 'badge'       // Status badge with color
  | 'progress'    // Progress bar
  | 'sparkline'   // Mini trend chart
  | 'status'      // Status indicator dot
  | 'timestamp'   // Formatted date/time
  | 'location'    // Lat/lng coordinates
  | 'duration'    // Time duration

// ============================================================================
// Table Column Definitions
// ============================================================================

/**
 * Column definition for the unified maritime data table
 */
export interface TableColumn<T = any> {
  /** Unique key matching the data property */
  key: keyof T | string
  /** Display label for the column header */
  label: string
  /** Column width in pixels (optional) */
  width?: number
  /** Minimum width in pixels */
  minWidth?: number
  /** Whether the column is sortable */
  sortable?: boolean
  /** Cell renderer type */
  type?: CellType
  /** Custom render function */
  render?: (value: any, row: T) => ReactNode
  /** Alignment: left, center, right */
  align?: 'left' | 'center' | 'right'
  /** Whether the column is hidden by default */
  hidden?: boolean
  /** Badge color mapping for badge type */
  badgeColors?: Record<string, string>
  /** Number format options */
  numberFormat?: Intl.NumberFormatOptions
}

/**
 * Sort state for tables
 */
export interface SortState {
  key: string
  direction: SortDirection
}

// ============================================================================
// Analysis Tab Configuration
// ============================================================================

/**
 * Configuration for an analysis tab
 */
export interface AnalysisTab<T = any> {
  /** Unique identifier for the tab */
  id: AnalysisType
  /** Display label */
  label: string
  /** Icon component */
  icon: LucideIcon
  /** Column definitions for this view */
  columns: TableColumn<T>[]
  /** Default sort configuration */
  defaultSort?: SortState
  /** Whether KPI cards are shown above the table */
  showKPIs?: boolean
  /** Whether filters are available */
  hasFilters?: boolean
}

// ============================================================================
// Fleet Analytics Types
// ============================================================================

/**
 * Fleet overview statistics
 */
export interface FleetStats {
  totalVessels: number
  activeVessels: number
  inactiveVessels: number
  coverageAreaKm2: number
  avgSpeedKnots: number
  totalDistanceKm: number
  vesselTypeBreakdown: Record<string, number>
  activityByHour: number[]
}

/**
 * Vessel in fleet list
 */
export interface FleetVessel {
  mmsi: string
  name: string
  vesselType: string
  flag?: string
  status: 'active' | 'inactive' | 'unknown'
  position: {
    lat: number
    lng: number
  }
  speed: number
  heading: number
  lastUpdate: Date
  trackQuality: number
  anomalyCount: number
}

// ============================================================================
// Vessel Analytics Types
// ============================================================================

/**
 * Detailed vessel information for analytics
 */
export interface VesselAnalytics {
  mmsi: string
  name: string
  vesselType: string
  flag?: string
  imo?: string
  callSign?: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  anomalyCount: number
  aisGapCount: number
  darkPeriodHours: number
  trackQuality: number
  lastPosition: {
    lat: number
    lng: number
    timestamp: Date
  }
  totalDistanceKm: number
  avgSpeedKnots: number
  portCalls: number
}

// ============================================================================
// Route Analytics Types
// ============================================================================

/**
 * Route statistics between ports
 */
export interface RouteAnalytics {
  id: string
  originPort: string
  originCountry: string
  destinationPort: string
  destinationCountry: string
  vesselCount: number
  avgDurationHours: number
  distanceNm: number
  avgSpeedKnots: number
  routeGeometry?: [number, number][]
}

// ============================================================================
// Port Analytics Types
// ============================================================================

/**
 * Port performance metrics
 */
export interface PortAnalytics {
  id: string
  name: string
  country: string
  position: {
    lat: number
    lng: number
  }
  arrivals: number
  departures: number
  avgDwellHours: number
  congestionIndex: number
  vesselTypesServed: string[]
  currentVessels: number
}

// ============================================================================
// Risk Analytics Types
// ============================================================================

/**
 * Risk factors for a vessel
 */
export interface RiskFactor {
  type: string
  description: string
  severity: AnomalySeverity
  weight: number
}

/**
 * Vessel risk assessment
 */
export interface VesselRiskAssessment {
  mmsi: string
  name: string
  vesselType: string
  flag?: string
  riskScore: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  riskFactors: RiskFactor[]
  aisGapCount: number
  darkPeriodHours: number
  loiteringEvents: number
  rendezvousEvents: number
  lastInspection?: Date
  complianceStatus: 'compliant' | 'warning' | 'non-compliant'
}

// ============================================================================
// KPI Card Types
// ============================================================================

/**
 * Trend direction for KPI cards
 */
export type TrendDirection = 'up' | 'down' | 'neutral'

/**
 * KPI card configuration
 */
export interface KPIData {
  id: string
  label: string
  value: number | string
  previousValue?: number
  trend?: TrendDirection
  trendValue?: string
  format?: 'number' | 'percent' | 'currency' | 'duration'
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  sparklineData?: number[]
  icon?: LucideIcon
}

// ============================================================================
// Filter Types
// ============================================================================

/**
 * Filter option
 */
export interface FilterOption {
  value: string
  label: string
  count?: number
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  key: string
  label: string
  type: 'select' | 'multiselect' | 'daterange' | 'range' | 'search'
  options?: FilterOption[]
  min?: number
  max?: number
}

/**
 * Active filter state
 */
export interface ActiveFilters {
  [key: string]: string | string[] | [Date, Date] | [number, number]
}

// ============================================================================
// Analysis Panel Props
// ============================================================================

/**
 * Props for the base analysis panel
 */
export interface BaseAnalysisPanelProps {
  /** Panel title */
  title: string
  /** Available tabs */
  tabs: AnalysisTab[]
  /** Currently active tab */
  activeTab: AnalysisType
  /** Tab change handler */
  onTabChange: (tab: AnalysisType) => void
  /** Whether the panel is open */
  isOpen: boolean
  /** Close handler */
  onClose: () => void
  /** Export handler */
  onExport?: (format: 'csv' | 'json') => void
  /** Row count for display */
  rowCount?: number
  /** Panel content */
  children: ReactNode
  /** Left offset for sidebar */
  leftOffset?: number
}

// ============================================================================
// Table Props
// ============================================================================

/**
 * Props for the maritime data table
 */
export interface MaritimeDataTableProps<T> {
  /** Data rows */
  data: T[]
  /** Column definitions */
  columns: TableColumn<T>[]
  /** Current sort state */
  sortState?: SortState
  /** Sort change handler */
  onSortChange?: (sort: SortState) => void
  /** Row click handler */
  onRowClick?: (row: T) => void
  /** Row hover handler */
  onRowHover?: (row: T | null) => void
  /** Show on map handler */
  onShowOnMap?: (row: T) => void
  /** Selected row ID */
  selectedId?: string | null
  /** Row ID key */
  idKey?: keyof T | string
  /** Loading state */
  isLoading?: boolean
  /** Empty state message */
  emptyMessage?: string
  /** Whether to show pagination */
  showPagination?: boolean
  /** Items per page */
  pageSize?: number
  /** Max height */
  maxHeight?: string
}

// ============================================================================
// Analysis View Props
// ============================================================================

/**
 * Common props for analysis views
 */
export interface AnalysisViewProps<T = any> {
  /** Data for the view */
  data: T[]
  /** Loading state */
  isLoading?: boolean
  /** Error message */
  error?: string | null
  /** Row click handler */
  onRowClick?: (row: T) => void
  /** Show on map handler */
  onShowOnMap?: (row: T) => void
  /** Selected item ID */
  selectedId?: string | null
  /** Active filters */
  filters?: ActiveFilters
  /** Filter change handler */
  onFilterChange?: (filters: ActiveFilters) => void
}

// ============================================================================
// Anomaly View Extended Types
// ============================================================================

/**
 * Anomaly row for table display
 */
export interface AnomalyTableRow {
  id: string
  vesselMmsi: string
  vesselName: string
  type: AnomalyType
  severity: AnomalySeverity
  timestamp: Date
  endTime?: Date
  duration?: number
  location: {
    lat: number
    lng: number
  }
  description: string
  confidence: number
}

// ============================================================================
// Export Types
// ============================================================================

/**
 * Export format options
 */
export type ExportFormat = 'csv' | 'json' | 'xlsx'

/**
 * Export configuration
 */
export interface ExportConfig {
  format: ExportFormat
  filename?: string
  columns?: string[]
  includeHeaders?: boolean
}

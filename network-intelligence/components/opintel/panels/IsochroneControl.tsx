/**
 * Isochrone Control Panel
 *
 * UI controls for isochrone reachability analysis.
 * Allows users to:
 * - Toggle isochrone visibility
 * - Select transport mode (driving, walking, cycling)
 * - Customize time contours
 * - Adjust opacity
 *
 * Perfect for ground station accessibility analysis.
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Map, Car, PersonStanding, Bike, Clock, Eye, EyeOff } from 'lucide-react'
import { type TransportMode } from '@/lib/services/valhallaRoutingService'
import { formatIsochroneTime, getIsochroneLegend } from '@/lib/layers/IsochroneLayer'

interface IsochroneControlProps {
  visible: boolean
  mode: TransportMode
  contours: number[]
  opacity: number
  onVisibilityChange: (visible: boolean) => void
  onModeChange: (mode: TransportMode) => void
  onContoursChange: (contours: number[]) => void
  onOpacityChange: (opacity: number) => void
  centerPoint?: [number, number]
  loading?: boolean
}

const TRANSPORT_MODES: Array<{
  value: TransportMode
  label: string
  icon: React.ReactNode
}> = [
  { value: 'driving', label: 'Driving', icon: <Car className="h-4 w-4" /> },
  { value: 'walking', label: 'Walking', icon: <PersonStanding className="h-4 w-4" /> },
  { value: 'cycling', label: 'Cycling', icon: <Bike className="h-4 w-4" /> }
]

const PRESET_CONTOURS: Array<{
  label: string
  value: number[]
}> = [
  { label: 'Quick (15, 30, 45 min)', value: [15, 30, 45] },
  { label: 'Standard (30, 60, 90 min)', value: [30, 60, 90] },
  { label: 'Extended (60, 120, 180 min)', value: [60, 120, 180] },
  { label: 'Short (5, 10, 15 min)', value: [5, 10, 15] }
]

export default function IsochroneControl({
  visible,
  mode,
  contours,
  opacity,
  onVisibilityChange,
  onModeChange,
  onContoursChange,
  onOpacityChange,
  centerPoint,
  loading = false
}: IsochroneControlProps) {
  const [expanded, setExpanded] = useState(false)

  const legend = getIsochroneLegend(contours, mode)

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-3 border-b border-[#E5E5E5] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-[#176BF8]" />
          <h3 className="text-sm font-semibold text-[#171717]">
            Reachability Analysis
          </h3>
          {loading && (
            <div className="w-3 h-3 border-2 border-[#176BF8] border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          className="h-7 w-7"
        >
          {expanded ? (
            <EyeOff className="h-3 w-3" />
          ) : (
            <Eye className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Visibility Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="isochrone-visible" className="text-xs text-[#171717] font-medium">
            Show Isochrones
          </Label>
          <Switch
            id="isochrone-visible"
            checked={visible}
            onCheckedChange={onVisibilityChange}
          />
        </div>

        {visible && expanded && (
          <>
            {/* Transport Mode */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#737373]">Transport Mode</Label>
              <div className="grid grid-cols-3 gap-1">
                {TRANSPORT_MODES.map((tm) => (
                  <Button
                    key={tm.value}
                    variant={mode === tm.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onModeChange(tm.value)}
                    className="text-xs h-8 gap-1"
                  >
                    {tm.icon}
                    <span className="hidden sm:inline">{tm.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Time Contours Preset */}
            <div className="space-y-1.5">
              <Label className="text-xs text-[#737373]">Time Intervals</Label>
              <Select
                value={JSON.stringify(contours)}
                onValueChange={(value) => onContoursChange(JSON.parse(value))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESET_CONTOURS.map((preset) => (
                    <SelectItem
                      key={preset.label}
                      value={JSON.stringify(preset.value)}
                      className="text-xs"
                    >
                      {preset.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-[#737373]">Opacity</Label>
                <span className="text-xs text-[#737373] font-mono">
                  {Math.round(opacity * 100)}%
                </span>
              </div>
              <Slider
                value={[opacity]}
                onValueChange={([value]) => onOpacityChange(value)}
                min={0.1}
                max={1.0}
                step={0.1}
                className="w-full"
              />
            </div>
          </>
        )}

        {/* Legend */}
        {visible && (
          <div className="space-y-1.5">
            <Label className="text-xs text-[#737373]">Travel Time Zones</Label>
            <div className="space-y-1">
              {legend.map((item) => (
                <div key={item.time} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded border border-[#E5E5E5]"
                    style={{
                      backgroundColor: item.color,
                      opacity: opacity
                    }}
                  />
                  <span className="text-xs text-[#171717]">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info */}
        {visible && centerPoint && (
          <div className="pt-2 border-t border-[#E5E5E5]">
            <p className="text-[10px] text-[#737373] leading-relaxed">
              <Clock className="h-3 w-3 inline mr-1" />
              Shows areas reachable from selected point within specified travel times
            </p>
          </div>
        )}

        {/* Valhalla Attribution */}
        {visible && (
          <div className="pt-2 border-t border-[#E5E5E5]">
            <p className="text-[10px] text-[#737373] leading-relaxed">
              Powered by Valhalla routing engine
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Minimal version for compact UIs
 */
export function IsochroneControlCompact({
  visible,
  onVisibilityChange,
  loading
}: Pick<IsochroneControlProps, 'visible' | 'onVisibilityChange' | 'loading'>) {
  return (
    <Button
      variant={visible ? 'default' : 'outline'}
      size="sm"
      onClick={() => onVisibilityChange(!visible)}
      className="gap-2"
    >
      <Map className="h-3 w-3" />
      Reachability
      {loading && (
        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
      )}
    </Button>
  )
}

/**
 * FocusPanel Component
 *
 * Camera controls panel for map navigation
 * Features:
 * - Pitch control (0° to 75°)
 * - Bearing/rotation control
 * - Zoom level presets
 * - Reset to default view
 * - Compact 280px width panel
 */

'use client'

import React, { useState, useEffect, forwardRef } from 'react'
import { motion } from 'framer-motion'
import {
  Target,
  X,
  RotateCw,
  Compass,
  ZoomIn,
  ZoomOut,
  Home,
  Eye
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { useMapStore } from '@/lib/stores/mapStore'

export interface FocusPanelProps {
  onClose?: () => void
  className?: string
}

const PITCH_PRESETS = [
  { label: 'Top', value: 0, icon: '⊥' },
  { label: 'Slight', value: 30, icon: '⟋' },
  { label: 'Medium', value: 45, icon: '⟍' },
  { label: 'Steep', value: 60, icon: '⧹' },
  { label: 'Max', value: 75, icon: '⧹' }
]

const ZOOM_PRESETS = [
  { label: 'City', zoom: 10, desc: 'Overview' },
  { label: 'District', zoom: 13, desc: 'Area' },
  { label: 'Street', zoom: 16, desc: 'Detail' },
  { label: 'Building', zoom: 18, desc: 'Close' }
]

const FocusPanel = forwardRef<HTMLDivElement, FocusPanelProps>(
  function FocusPanel({ onClose, className }, ref) {
    const map = useMapStore((state) => state.map)

    const [pitch, setPitch] = useState(0)
    const [bearing, setBearing] = useState(0)
    const [zoom, setZoom] = useState(12)

    // Sync with map state
    useEffect(() => {
      if (!map) return

      const updateCameraState = () => {
        setPitch(Math.round(map.getPitch()))
        setBearing(Math.round(map.getBearing()))
        setZoom(Math.round(map.getZoom() * 10) / 10)
      }

      updateCameraState()

      map.on('pitch', updateCameraState)
      map.on('rotate', updateCameraState)
      map.on('zoom', updateCameraState)

      return () => {
        map.off('pitch', updateCameraState)
        map.off('rotate', updateCameraState)
        map.off('zoom', updateCameraState)
      }
    }, [map])

    const handlePitchChange = (value: number) => {
      if (!map) return
      map.easeTo({ pitch: value, duration: 500 })
    }

    const handleBearingChange = (value: number) => {
      if (!map) return
      map.easeTo({ bearing: value, duration: 500 })
    }

    const handleZoomPreset = (zoomLevel: number) => {
      if (!map) return
      map.easeTo({ zoom: zoomLevel, duration: 800 })
    }

    const handleResetView = () => {
      if (!map) return
      map.easeTo({
        pitch: 0,
        bearing: 0,
        zoom: 12,
        duration: 1000
      })
    }

    const handleResetNorth = () => {
      if (!map) return
      map.easeTo({ bearing: 0, duration: 500 })
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className={cn('panel-card w-[280px] flex flex-col', className)}
      >
        {/* Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-gray-100 bg-white/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#176BF8] flex items-center justify-center">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#171717]">
                Camera Focus
              </h2>
              <p className="text-xs text-[#737373]">
                Control view
              </p>
            </div>
          </div>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-[#F5F5F5]"
              aria-label="Close Focus Panel"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Pitch Control */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide">
                Pitch
              </label>
              <span className="text-xs font-mono text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded">
                {pitch}°
              </span>
            </div>

            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {PITCH_PRESETS.map((preset) => (
                <Button
                  key={preset.value}
                  variant={pitch === preset.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handlePitchChange(preset.value)}
                  className={cn(
                    'h-12 flex flex-col items-center justify-center gap-0.5 p-1',
                    pitch === preset.value
                      ? 'bg-[#176BF8] text-white'
                      : 'bg-white hover:bg-[#F5F5F5]'
                  )}
                >
                  <span className="text-base">{preset.icon}</span>
                  <span className="text-[9px] font-medium">{preset.label}</span>
                </Button>
              ))}
            </div>

            <Slider
              value={[pitch]}
              onValueChange={(values) => handlePitchChange(values[0])}
              min={0}
              max={75}
              step={5}
              className="w-full"
            />
          </div>

          {/* Bearing/Rotation Control */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide">
                Rotation
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded">
                  {bearing}°
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetNorth}
                  className="h-7 px-2 text-xs hover:bg-[#F5F5F5]"
                >
                  <Compass className="w-3 h-3 mr-1" />
                  North
                </Button>
              </div>
            </div>

            <Slider
              value={[bearing]}
              onValueChange={(values) => handleBearingChange(values[0])}
              min={0}
              max={360}
              step={15}
              className="w-full"
            />

            <div className="grid grid-cols-4 gap-2 mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBearingChange(0)}
                className="h-9 text-xs"
              >
                N
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBearingChange(90)}
                className="h-9 text-xs"
              >
                E
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBearingChange(180)}
                className="h-9 text-xs"
              >
                S
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBearingChange(270)}
                className="h-9 text-xs"
              >
                W
              </Button>
            </div>
          </div>

          {/* Zoom Presets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-[#171717] uppercase tracking-wide">
                Zoom Level
              </label>
              <span className="text-xs font-mono text-[#525252] bg-[#F5F5F5] px-2 py-0.5 rounded">
                {zoom.toFixed(1)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {ZOOM_PRESETS.map((preset) => (
                <Button
                  key={preset.zoom}
                  variant="outline"
                  size="sm"
                  onClick={() => handleZoomPreset(preset.zoom)}
                  className="h-14 flex flex-col items-start justify-center gap-0.5 p-3 bg-white hover:bg-[#F5F5F5]"
                >
                  <span className="text-xs font-semibold text-[#171717]">
                    {preset.label}
                  </span>
                  <span className="text-[10px] text-[#737373]">
                    {preset.desc} • z{preset.zoom}
                  </span>
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => map?.zoomIn({ duration: 500 })}
                className="h-9 text-xs"
              >
                <ZoomIn className="w-3.5 h-3.5 mr-1.5" />
                Zoom In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => map?.zoomOut({ duration: 500 })}
                className="h-9 text-xs"
              >
                <ZoomOut className="w-3.5 h-3.5 mr-1.5" />
                Zoom Out
              </Button>
            </div>
          </div>

          {/* Current View Info */}
          <div className="bg-[#F5F5F5] rounded-lg p-3 border border-[#E5E5E5]">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-3.5 h-3.5 text-[#525252]" />
              <span className="text-[10px] font-semibold text-[#171717] uppercase tracking-wide">
                Current View
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <div className="text-[#737373]">Pitch</div>
                <div className="font-mono font-semibold text-[#171717]">{pitch}°</div>
              </div>
              <div>
                <div className="text-[#737373]">Bearing</div>
                <div className="font-mono font-semibold text-[#171717]">{bearing}°</div>
              </div>
              <div>
                <div className="text-[#737373]">Zoom</div>
                <div className="font-mono font-semibold text-[#171717]">{zoom.toFixed(1)}</div>
              </div>
            </div>
          </div>

          {/* Reset All */}
          <Button
            variant="outline"
            className="w-full h-10 bg-white hover:bg-[#F5F5F5] border-[#E5E5E5] text-sm font-medium"
            onClick={handleResetView}
          >
            <Home className="w-3.5 h-3.5 mr-2" />
            Reset to Default View
          </Button>
        </div>
      </motion.div>
    )
  }
)

export default FocusPanel

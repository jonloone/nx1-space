'use client'

/**
 * Satellite Timeline Panel
 * Bottom panel for browsing satellite imagery time-series
 */

import React, { useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Loader2, GitCompare, Sliders } from 'lucide-react'
import { ImageryThumbnail } from './ImageryThumbnail'
import { useSpaceStore } from '@/lib/stores/spaceStore'

interface SatelliteTimelinePanelProps {
  className?: string
}

export function SatelliteTimelinePanel({ className = '' }: SatelliteTimelinePanelProps) {
  const {
    images,
    selectedImage,
    isLoading,
    imageOpacity,
    compareMode,
    compareBeforeImage,
    compareAfterImage,
    setSelectedImage,
    setImageOpacity,
    enableCompareMode,
    disableCompareMode
  } = useSpaceStore()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showDatePicker, setShowDatePicker] = React.useState(false)
  const [compareSelectionStep, setCompareSelectionStep] = React.useState<0 | 1 | 2>(0) // 0 = off, 1 = selecting before, 2 = selecting after

  // Auto-scroll to selected image
  useEffect(() => {
    if (!selectedImage || !scrollContainerRef.current) return

    const selectedIndex = images.findIndex(img => img.id === selectedImage.id)
    if (selectedIndex === -1) return

    const thumbnailWidth = 128 // including margins
    const scrollPosition = selectedIndex * thumbnailWidth - (scrollContainerRef.current.clientWidth / 2)

    scrollContainerRef.current.scrollTo({
      left: Math.max(0, scrollPosition),
      behavior: 'smooth'
    })
  }, [selectedImage, images])

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return

    const scrollAmount = scrollContainerRef.current.clientWidth * 0.8
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth'
    })
  }

  const handleThumbnailClick = (image: typeof images[0]) => {
    if (compareSelectionStep === 1) {
      // Selecting "before" image
      setCompareSelectionStep(2)
      enableCompareMode(image, image) // Temporary, will be updated with "after"
    } else if (compareSelectionStep === 2) {
      // Selecting "after" image
      if (compareBeforeImage) {
        enableCompareMode(compareBeforeImage, image)
      }
      setCompareSelectionStep(0)
    } else {
      // Normal selection
      setSelectedImage(image)
    }
  }

  const startCompareMode = () => {
    setCompareSelectionStep(1)
    disableCompareMode()
  }

  const cancelCompareMode = () => {
    setCompareSelectionStep(0)
    disableCompareMode()
  }

  if (isLoading) {
    return (
      <div className={`h-40 bg-gray-900/95 backdrop-blur border-t border-gray-800 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-2 text-gray-400">Loading satellite imagery...</span>
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className={`h-40 bg-gray-900/95 backdrop-blur border-t border-gray-800 ${className}`}>
        <div className="flex items-center justify-center h-full text-gray-500">
          No imagery loaded. Select a location to view satellite imagery.
        </div>
      </div>
    )
  }

  return (
    <div className={`h-40 bg-gray-900/95 backdrop-blur border-t border-gray-800 flex flex-col ${className}`}>
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <Calendar className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-300">
            Satellite Imagery Timeline
          </span>
          <span className="text-xs text-gray-500">
            {images.length} images available
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Opacity Control */}
          <div className="flex items-center gap-2 px-3 py-1 bg-gray-800 rounded">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={imageOpacity * 100}
              onChange={(e) => setImageOpacity(parseInt(e.target.value) / 100)}
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
            <span className="text-xs text-gray-400 w-8">{Math.round(imageOpacity * 100)}%</span>
          </div>

          {/* Compare Mode Button */}
          {compareSelectionStep === 0 && !compareMode && (
            <button
              onClick={startCompareMode}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
          )}

          {compareSelectionStep > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400">
                {compareSelectionStep === 1 ? 'Select BEFORE image' : 'Select AFTER image'}
              </span>
              <button
                onClick={cancelCompareMode}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {compareMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-blue-400">Comparing 2 images</span>
              <button
                onClick={() => {
                  disableCompareMode()
                  setCompareSelectionStep(0)
                }}
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded transition-colors"
              >
                Exit Compare
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div className="flex-1 relative">
        {/* Left scroll button */}
        <button
          onClick={() => handleScroll('left')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 p-2 rounded-full transition-colors"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4 text-gray-300" />
        </button>

        {/* Thumbnails container */}
        <div
          ref={scrollContainerRef}
          className="h-full overflow-x-auto overflow-y-hidden px-12 py-3 flex items-center gap-4"
          style={{ scrollbarWidth: 'thin' }}
        >
          {images.map((image) => (
            <ImageryThumbnail
              key={image.id}
              image={image}
              selected={
                selectedImage?.id === image.id ||
                compareBeforeImage?.id === image.id ||
                compareAfterImage?.id === image.id
              }
              onClick={() => handleThumbnailClick(image)}
              showDate={true}
              showCloudCover={true}
              size="md"
            />
          ))}
        </div>

        {/* Right scroll button */}
        <button
          onClick={() => handleScroll('right')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-gray-800/90 hover:bg-gray-700 p-2 rounded-full transition-colors"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4 text-gray-300" />
        </button>
      </div>
    </div>
  )
}

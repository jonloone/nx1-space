'use client'

/**
 * Imagery Thumbnail Component
 * Displays a single satellite image thumbnail in the timeline
 */

import React, { useState } from 'react'
import { Cloud, Check } from 'lucide-react'
import type { SatelliteImage } from '@/lib/services/satelliteImageryService'
import { getSentinel2StacService } from '@/lib/services/sentinel2StacService'

interface ImageryThumbnailProps {
  image: SatelliteImage
  selected?: boolean
  onClick: () => void
  onDoubleClick?: () => void
  showDate?: boolean
  showCloudCover?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ImageryThumbnail({
  image,
  selected = false,
  onClick,
  onDoubleClick,
  showDate = true,
  showCloudCover = true,
  size = 'md'
}: ImageryThumbnailProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Size configurations
  const sizeClasses = {
    sm: 'w-20 h-20',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const textSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm'
  }

  // Get thumbnail URL
  const thumbnailUrl = React.useMemo(() => {
    if (image.source === 'sentinel-2') {
      const stacService = getSentinel2StacService()
      return stacService.getThumbnailUrl(image, 256)
    }

    // Fallback for other sources
    return image.url || '/images/no-image.png'
  }, [image])

  // Format date
  const dateStr = image.acquisitionDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })

  // Cloud cover badge color
  const getCloudCoverColor = (cloudCover: number) => {
    if (cloudCover < 10) return 'bg-green-600/80'
    if (cloudCover < 30) return 'bg-yellow-600/80'
    return 'bg-red-600/80'
  }

  return (
    <div
      className={`
        relative flex-shrink-0 cursor-pointer
        transition-all duration-200
        ${sizeClasses[size]}
        ${selected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-900 scale-105' : 'hover:scale-102'}
      `}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      title={`${image.acquisitionDate.toLocaleString()} | Cloud Cover: ${image.cloudCover}%`}
    >
      {/* Thumbnail Image */}
      <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-800">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <img
          src={thumbnailUrl}
          alt={`Satellite imagery ${dateStr}`}
          className={`
            w-full h-full object-cover
            transition-opacity duration-300
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          `}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true)
            setImageLoaded(true)
          }}
        />

        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-gray-500 text-xs">
            No preview
          </div>
        )}

        {/* Selected indicator */}
        {selected && (
          <div className="absolute top-1 right-1 bg-blue-600 rounded-full p-0.5">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}

        {/* Cloud cover badge */}
        {showCloudCover && (
          <div
            className={`
              absolute bottom-1 right-1
              ${getCloudCoverColor(image.cloudCover)}
              px-1.5 py-0.5 rounded
              flex items-center gap-1
              ${textSizeClasses[size]}
              text-white font-medium
            `}
          >
            <Cloud className="w-2.5 h-2.5" />
            <span>{Math.round(image.cloudCover)}%</span>
          </div>
        )}

        {/* Mock indicator */}
        {image.metadata.mock && (
          <div className="absolute top-1 left-1 bg-yellow-600/90 px-1.5 py-0.5 rounded text-[9px] text-white font-medium">
            MOCK
          </div>
        )}
      </div>

      {/* Date label */}
      {showDate && (
        <div className={`
          absolute -bottom-6 left-0 right-0
          text-center ${textSizeClasses[size]} text-gray-400
          ${selected ? 'text-blue-400 font-medium' : ''}
        `}>
          {dateStr}
        </div>
      )}
    </div>
  )
}

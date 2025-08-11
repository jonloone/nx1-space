'use client'

import ProfessionalIntelligencePlatform from '@/components/ProfessionalIntelligencePlatform'

/**
 * Professional Ground Station Intelligence Platform
 * 
 * Features:
 * - Two-view navigation (Ground Stations vs Satellites) 
 * - Operations mode: Station performance with halos
 * - Opportunities mode: Maritime analysis with heatmaps
 * - Real-time data integration (9,370 satellites, 500+ vessels)
 * - FontAwesome icons, professional styling
 * - Click interaction panels
 * - Dynamic layer visibility rules
 */
export default function ProfessionalPlatformPage() {
  return (
    <div className="w-full h-screen">
      <ProfessionalIntelligencePlatform />
    </div>
  )
}
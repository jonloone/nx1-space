/**
 * Artifact Helper Functions
 * Utility functions for working with chat artifacts
 */

import type { ChatMessage } from '@/components/ai/AIChatPanel'
import type { ChatArtifact, ArtifactType } from '@/lib/types/chatArtifacts'

/**
 * Create a chat message with artifact
 */
export function createMessageWithArtifact(
  content: string,
  artifact: ChatArtifact
): ChatMessage {
  return {
    id: Date.now().toString(),
    role: 'assistant',
    content,
    timestamp: new Date(),
    artifact
  }
}

/**
 * Get artifact icon by type
 */
export function getArtifactIcon(type: ArtifactType): string {
  const icons: Record<ArtifactType, string> = {
    'subject-profile': '👤',
    'timeline': '📅',
    'route': '🚗',
    'investigation-list': '📋',
    'intelligence-analysis': '🧠',
    'heatmap-summary': '🗺️',
    'network-graph': '🕸️',
    'location-details': '📍'
  }
  return icons[type] || '📄'
}

/**
 * Get severity color class
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-[#10B981] text-white',
    medium: 'bg-[#F59E0B] text-white',
    high: 'bg-[#F59E0B] text-white',
    critical: 'bg-[#EF4444] text-white'
  }
  return colors[severity] || 'bg-[#A3A3A3] text-white'
}

/**
 * Get severity color (just background)
 */
export function getSeverityBgColor(severity: string): string {
  const colors: Record<string, string> = {
    low: 'bg-[#10B981]',
    medium: 'bg-[#F59E0B]',
    high: 'bg-[#F59E0B]',
    critical: 'bg-[#EF4444]'
  }
  return colors[severity] || 'bg-[#A3A3A3]'
}

/**
 * Get classification color class
 */
export function getClassificationColor(classification: string): string {
  const colors: Record<string, string> = {
    'person-of-interest': 'bg-[#F59E0B] text-white',
    'suspect': 'bg-[#EF4444] text-white',
    'associate': 'bg-[#8B5CF6] text-white',
    'witness': 'bg-[#3B82F6] text-white'
  }
  return colors[classification] || 'bg-[#A3A3A3] text-white'
}

/**
 * Get significance color class
 */
export function getSignificanceColor(significance: string): string {
  const colors: Record<string, string> = {
    routine: 'bg-[#10B981] text-white',
    suspicious: 'bg-[#F59E0B] text-white',
    anomaly: 'bg-[#EF4444] text-white'
  }
  return colors[significance] || 'bg-[#A3A3A3] text-white'
}

/**
 * Format duration in seconds to human readable
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Format distance in meters to human readable
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Format risk score with label
 */
export function formatRiskScore(score: number): {
  score: number
  level: 'low' | 'medium' | 'high' | 'critical'
  label: string
  color: string
} {
  let level: 'low' | 'medium' | 'high' | 'critical'
  let label: string

  if (score >= 75) {
    level = 'critical'
    label = 'Critical Risk'
  } else if (score >= 50) {
    level = 'high'
    label = 'High Risk'
  } else if (score >= 25) {
    level = 'medium'
    label = 'Medium Risk'
  } else {
    level = 'low'
    label = 'Low Risk'
  }

  return {
    score,
    level,
    label,
    color: getSeverityColor(level)
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}

/**
 * Format timestamp relative to now
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

/**
 * Get priority badge color
 */
export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    immediate: 'bg-[#EF4444] text-white',
    high: 'bg-[#F59E0B] text-white',
    medium: 'bg-[#3B82F6] text-white',
    low: 'bg-[#A3A3A3] text-white'
  }
  return colors[priority] || 'bg-[#A3A3A3] text-white'
}

/**
 * Check if artifact has actions
 */
export function hasArtifactActions(artifact: ChatArtifact): boolean {
  return artifact.actions !== undefined && artifact.actions.length > 0
}

/**
 * Get artifact type display name
 */
export function getArtifactTypeName(type: ArtifactType): string {
  const names: Record<ArtifactType, string> = {
    'subject-profile': 'Subject Profile',
    'timeline': 'Timeline',
    'route': 'Route',
    'investigation-list': 'Investigation List',
    'intelligence-analysis': 'Intelligence Analysis',
    'heatmap-summary': 'Heatmap Summary',
    'network-graph': 'Network Graph',
    'location-details': 'Location Details'
  }
  return names[type] || 'Unknown'
}

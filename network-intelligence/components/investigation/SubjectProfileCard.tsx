/**
 * Subject Profile Card
 *
 * Displays comprehensive subject biographical and background data
 * Part of the progressive investigation drill-down workflow
 */

'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  X,
  MapPin,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Globe,
  FileText,
  ChevronRight,
  Eye,
  Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SubjectProfileData } from '@/lib/types/chatArtifacts'

export interface SubjectProfileCardProps {
  profile: SubjectProfileData
  onAction?: (action: string, data: any) => void
  onClose?: () => void
  className?: string
}

export function SubjectProfileCard({
  profile,
  onAction,
  onClose,
  className
}: SubjectProfileCardProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['identity'])

  const toggleSection = (section: string) => {
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'w-full min-w-[380px] bg-white rounded-lg border border-blue-200 shadow-md',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-blue-100 bg-blue-50/50">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-gray-900 leading-tight">
                {profile.name.full}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
                <span className="font-medium">{profile.subjectId}</span>
                <span>•</span>
                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-semibold">
                  {profile.classification}
                </span>
              </div>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-7 w-7 rounded hover:bg-white/50 shrink-0"
            >
              <X className="h-3.5 w-3.5 text-gray-500 hover:text-gray-900" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {/* Quick Overview */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-md p-2.5 border border-gray-100">
            <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Age</div>
            <div className="text-sm font-bold text-gray-900">{profile.demographics.age}</div>
          </div>
          <div className="bg-gray-50 rounded-md p-2.5 border border-gray-100">
            <div className="text-[9px] text-gray-500 uppercase tracking-wide mb-1">Status</div>
            <div className="text-sm font-bold text-gray-900">{profile.status}</div>
          </div>
        </div>

        {/* Identity Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('identity')}
            className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-600" />
              <span className="text-xs font-semibold text-gray-900">Identity & Demographics</span>
            </div>
            <ChevronRight className={cn(
              'w-4 h-4 text-gray-400 transition-transform',
              expandedSections.includes('identity') && 'rotate-90'
            )} />
          </button>
          {expandedSections.includes('identity') && (
            <div className="p-3 space-y-2 text-xs">
              {profile.name.aliases && profile.name.aliases.length > 0 && (
                <div>
                  <span className="text-gray-500">Aliases:</span>
                  <span className="ml-2 text-gray-900 font-medium">
                    {profile.name.aliases.join(', ')}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500">DOB:</span>
                <span className="ml-2 text-gray-900 font-medium">{profile.demographics.dateOfBirth}</span>
              </div>
              <div>
                <span className="text-gray-500">Nationality:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {profile.demographics.nationality.join(', ')}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Languages:</span>
                <span className="ml-2 text-gray-900 font-medium">
                  {profile.demographics.languages.join(', ')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Employment Section */}
        {profile.employment && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('employment')}
              className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-900">Employment</span>
              </div>
              <ChevronRight className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expandedSections.includes('employment') && 'rotate-90'
              )} />
            </button>
            {expandedSections.includes('employment') && (
              <div className="p-3 space-y-2 text-xs">
                <div>
                  <span className="text-gray-500">Current:</span>
                  <span className="ml-2 text-gray-900 font-medium">
                    {profile.employment.current.position} at {profile.employment.current.employer}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Since:</span>
                  <span className="ml-2 text-gray-900 font-medium">{profile.employment.current.since}</span>
                </div>
                {profile.employment.current.salary && (
                  <div>
                    <span className="text-gray-500">Salary:</span>
                    <span className="ml-2 text-gray-900 font-medium">{profile.employment.current.salary}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Address Section */}
        {profile.addresses && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('address')}
              className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-900">Known Addresses</span>
              </div>
              <ChevronRight className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expandedSections.includes('address') && 'rotate-90'
              )} />
            </button>
            {expandedSections.includes('address') && (
              <div className="p-3 space-y-3 text-xs">
                <button
                  onClick={() => onAction?.('show-on-map', {
                    address: profile.addresses.current.address,
                    city: profile.addresses.current.city,
                    state: profile.addresses.current.state,
                    zip: profile.addresses.current.zip
                  })}
                  className="w-full p-2 bg-blue-50 rounded border border-blue-100 hover:border-blue-300 hover:bg-blue-100 transition-colors cursor-pointer text-left"
                >
                  <div className="text-[9px] text-blue-600 font-semibold uppercase mb-1">Current</div>
                  <div className="text-gray-900 font-medium">
                    {profile.addresses.current.address}
                  </div>
                  <div className="text-gray-600 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {profile.addresses.current.city}, {profile.addresses.current.state} {profile.addresses.current.zip}
                  </div>
                  <div className="text-gray-500 text-[10px] mt-1">
                    Since: {profile.addresses.current.since}
                  </div>
                </button>
                {profile.addresses.previous && profile.addresses.previous.length > 0 && (
                  <div>
                    <div className="text-[9px] text-gray-500 uppercase mb-1.5">Previous</div>
                    {profile.addresses.previous.slice(0, 2).map((addr, i) => (
                      <button
                        key={i}
                        onClick={() => onAction?.('show-on-map', {
                          address: addr.address,
                          city: addr.city,
                          state: addr.state
                        })}
                        className="w-full p-2 bg-gray-50 rounded border border-gray-100 hover:border-gray-300 hover:bg-gray-100 transition-colors cursor-pointer text-left mb-1.5"
                      >
                        <div className="text-gray-900">{addr.address}</div>
                        <div className="text-gray-600 text-[10px] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {addr.city}, {addr.state} • {addr.duration}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Contact Information */}
        {profile.identifiers && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('contact')}
              className="w-full px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-600" />
                <span className="text-xs font-semibold text-gray-900">Contact Information</span>
              </div>
              <ChevronRight className={cn(
                'w-4 h-4 text-gray-400 transition-transform',
                expandedSections.includes('contact') && 'rotate-90'
              )} />
            </button>
            {expandedSections.includes('contact') && (
              <div className="p-3 space-y-2 text-xs">
                {profile.identifiers.phoneNumbers && profile.identifiers.phoneNumbers.length > 0 && (
                  <div>
                    <span className="text-gray-500">Phones:</span>
                    {profile.identifiers.phoneNumbers.map((phone, i) => (
                      <div key={i} className="ml-2 text-gray-900 font-mono text-[11px]">{phone}</div>
                    ))}
                  </div>
                )}
                {profile.identifiers.emailAddresses && profile.identifiers.emailAddresses.length > 0 && (
                  <div>
                    <span className="text-gray-500">Emails:</span>
                    {profile.identifiers.emailAddresses.map((email, i) => (
                      <div key={i} className="ml-2 text-gray-900 font-mono text-[11px] break-all">{email}</div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions Footer */}
      <div className="border-t border-gray-200 p-3 bg-gray-50/50 space-y-2">
        <Button
          className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
          onClick={() => onAction?.('view-timeline', profile)}
        >
          <Activity className="w-3.5 h-3.5 mr-2" />
          View Timeline
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            className="h-8 text-xs border-gray-200 hover:bg-white"
            onClick={() => onAction?.('show-network', profile)}
          >
            Show Network
          </Button>
          <Button
            variant="outline"
            className="h-8 text-xs border-gray-200 hover:bg-white"
            onClick={() => onAction?.('track-movements', profile)}
          >
            Track Movements
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

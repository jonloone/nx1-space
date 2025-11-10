/**
 * Node Detail Panel
 *
 * Shows rich details about clicked nodes or edges in the network graph
 * Slides up from the bottom of the screen
 */

'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, User, MapPin, Building2, Circle, ArrowRight, Calendar, Shield, Phone, Mail, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { NetworkNode, NetworkConnection } from '@/components/investigation/NetworkAnalysisCard'

export interface NodeDetailPanelProps {
  item: NetworkNode | NetworkConnection | null
  itemType: 'node' | 'edge' | null
  onClose: () => void
  onAction?: (action: string, data: any) => void
}

export function NodeDetailPanel({
  item,
  itemType,
  onClose,
  onAction
}: NodeDetailPanelProps) {
  if (!item || !itemType) return null

  const isNode = itemType === 'node'
  const node = isNode ? (item as NetworkNode) : null
  const edge = !isNode ? (item as NetworkConnection) : null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-blue-500 shadow-2xl z-50 max-h-[40vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-50 to-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isNode && node ? (
              <>
                {node.type === 'subject' && <User className="w-5 h-5 text-blue-600" />}
                {node.type === 'associate' && <Users className="w-5 h-5 text-purple-600" />}
                {node.type === 'location' && <MapPin className="w-5 h-5 text-green-600" />}
                {node.type === 'organization' && <Building2 className="w-5 h-5 text-gray-600" />}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{node.name}</h3>
                  {node.subtype && (
                    <p className="text-sm text-gray-600 capitalize">
                      {node.subtype.replace(/-/g, ' ')}
                    </p>
                  )}
                </div>
              </>
            ) : edge ? (
              <>
                <ArrowRight className="w-5 h-5 text-gray-600" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900 capitalize">{edge.type} Connection</h3>
                  <p className="text-sm text-gray-600">
                    {edge.frequency} interaction{edge.frequency !== 1 ? 's' : ''}
                    {edge.confidence && ` • ${Math.round(edge.confidence * 100)}% confidence`}
                  </p>
                </div>
              </>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-lg hover:bg-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {isNode && node ? (
            <div className="space-y-4">
              {/* Type and Risk Level */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full">
                  <Circle className="w-3 h-3 text-blue-600" fill="currentColor" />
                  <span className="text-sm font-medium text-blue-900 capitalize">{node.type}</span>
                </div>
                {node.riskLevel && (
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-1.5 rounded-full',
                    node.riskLevel === 'high' ? 'bg-red-50' :
                    node.riskLevel === 'medium' ? 'bg-amber-50' :
                    'bg-green-50'
                  )}>
                    <Shield className={cn(
                      'w-3 h-3',
                      node.riskLevel === 'high' ? 'text-red-600' :
                      node.riskLevel === 'medium' ? 'text-amber-600' :
                      'text-green-600'
                    )} />
                    <span className={cn(
                      'text-sm font-medium capitalize',
                      node.riskLevel === 'high' ? 'text-red-900' :
                      node.riskLevel === 'medium' ? 'text-amber-900' :
                      'text-green-900'
                    )}>
                      {node.riskLevel} Risk
                    </span>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {node.metadata && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {node.metadata.occupation && (
                    <div className="flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Occupation</div>
                        <div className="text-sm text-gray-900">{node.metadata.occupation}</div>
                      </div>
                    </div>
                  )}
                  {node.metadata.relationship && (
                    <div className="flex items-start gap-2">
                      <Users className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Relationship</div>
                        <div className="text-sm text-gray-900">{node.metadata.relationship}</div>
                      </div>
                    </div>
                  )}
                  {node.metadata.notes && (
                    <div className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Notes</div>
                        <div className="text-sm text-gray-900">{node.metadata.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAction?.('view-profile', node)}
                  className="h-9 text-xs"
                >
                  View Full Profile
                </Button>
                {node.type !== 'location' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onAction?.('show-timeline', node)}
                    className="h-9 text-xs"
                  >
                    Show Timeline
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onAction?.('expand-network', node)}
                  className="h-9 text-xs"
                >
                  Expand Network
                </Button>
              </div>
            </div>
          ) : edge ? (
            <div className="space-y-4">
              {/* Connection Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 font-medium mb-1">Frequency</div>
                  <div className="text-2xl font-bold text-gray-900">{edge.frequency}x</div>
                </div>
                {edge.confidence && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs text-gray-500 font-medium mb-1">Confidence</div>
                    <div className="text-2xl font-bold text-gray-900">{Math.round(edge.confidence * 100)}%</div>
                  </div>
                )}
              </div>

              {/* Temporal Data */}
              {(edge.firstObserved || edge.lastContact) && (
                <div className="bg-blue-50/30 rounded-lg p-4 space-y-2">
                  {edge.firstObserved && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600">First observed:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(edge.firstObserved).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {edge.lastContact && (
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-gray-600">Last contact:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(edge.lastContact).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Metadata */}
              {edge.metadata && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {edge.metadata.method && (
                    <div className="flex items-center gap-2">
                      {edge.metadata.method === 'phone' && <Phone className="w-4 h-4 text-gray-500" />}
                      {edge.metadata.method === 'email' && <Mail className="w-4 h-4 text-gray-500" />}
                      {edge.metadata.method === 'in-person' && <Users className="w-4 h-4 text-gray-500" />}
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Method</div>
                        <div className="text-sm text-gray-900 capitalize">{edge.metadata.method}</div>
                      </div>
                    </div>
                  )}
                  {edge.source && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Source</div>
                        <div className="text-sm text-gray-900">{edge.source}</div>
                      </div>
                    </div>
                  )}
                  {edge.metadata.notes && (
                    <div className="flex items-start gap-2">
                      <Circle className="w-4 h-4 text-gray-500 mt-0.5" />
                      <div>
                        <div className="text-xs text-gray-500 font-medium">Notes</div>
                        <div className="text-sm text-gray-900">{edge.metadata.notes}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Bidirectional Badge */}
              {edge.bidirectional && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ArrowRight className="w-4 h-4" />
                  <span>Bidirectional relationship</span>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

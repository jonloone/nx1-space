'use client'

/**
 * Legal Disclaimer Screen
 *
 * Mandatory disclaimer displayed when loading investigation intelligence preset.
 * Ensures proper authorization and legal compliance for law enforcement use.
 *
 * ⚠️ CRITICAL: This disclaimer must be acknowledged before accessing any investigation data.
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Scale,
  Lock,
  Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

interface LegalDisclaimerProps {
  onAcknowledge: () => void
  onCancel: () => void
}

export default function LegalDisclaimer({ onAcknowledge, onCancel }: LegalDisclaimerProps) {
  const [hasReadRequirements, setHasReadRequirements] = useState(false)
  const [acknowledgesLegal, setAcknowledgesLegal] = useState(false)
  const [acknowledgesDemoData, setAcknowledgesDemoData] = useState(false)

  const canProceed = hasReadRequirements && acknowledgesLegal && acknowledgesDemoData

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <Card className="border-2 border-[#F59E0B] shadow-2xl">
            {/* Header */}
            <CardHeader className="bg-gradient-to-r from-[#F59E0B] to-[#EF4444] text-white">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8" />
                <div>
                  <CardTitle className="text-xl font-bold">
                    Investigation Intelligence System
                  </CardTitle>
                  <p className="text-sm text-white/90 mt-1">Authorized Use Only</p>
                </div>
              </div>
            </CardHeader>

            {/* Content */}
            <CardContent className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Critical Warning */}
              <Card className="bg-[#FEE2E2] border-2 border-[#EF4444]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-[#EF4444] mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-[#991B1B] mb-1">
                        RESTRICTED ACCESS SYSTEM
                      </h3>
                      <p className="text-xs text-[#991B1B] leading-relaxed">
                        This system is for <strong>authorized law enforcement and intelligence
                        operations only</strong>. Unauthorized access, use, or disclosure is strictly
                        prohibited and may result in criminal prosecution.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="bg-[#E5E5E5]" />

              {/* Legal Requirements */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-5 w-5 text-[#525252]" />
                  <h3 className="text-sm font-semibold text-[#171717]">Legal Requirements</h3>
                </div>

                <div className="space-y-2">
                  {[
                    {
                      icon: CheckCircle2,
                      text: 'Valid legal authorization (warrant, court order, or lawful directive)',
                      color: 'text-[#10B981]'
                    },
                    {
                      icon: FileText,
                      text: 'Proper case documentation and investigative justification',
                      color: 'text-[#3B82F6]'
                    },
                    {
                      icon: Lock,
                      text: 'Compliance with applicable federal, state, and local laws',
                      color: 'text-[#8B5CF6]'
                    },
                    {
                      icon: Shield,
                      text: 'Adherence to departmental policies and privacy regulations',
                      color: 'text-[#F59E0B]'
                    }
                  ].map((req, i) => (
                    <Card key={i} className="bg-white border border-[#E5E5E5]">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <req.icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', req.color)} />
                          <span className="text-xs text-[#171717]">{req.text}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator className="bg-[#E5E5E5]" />

              {/* Demo Data Notice */}
              <Card className="bg-[#DBEAFE] border-2 border-[#3B82F6]">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-[#1E40AF] mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-[#1E3A8A] mb-1">
                        Demonstration Data Only
                      </h3>
                      <p className="text-xs text-[#1E3A8A] leading-relaxed">
                        This demonstration uses <strong>FICTIONAL data</strong> for training and
                        demonstration purposes only. All subjects, locations, and events are
                        entirely fabricated. No real individuals or investigations are represented.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Separator className="bg-[#E5E5E5]" />

              {/* Acknowledgment Checkboxes */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[#171717]">Required Acknowledgments</h3>

                <div className="space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={hasReadRequirements}
                      onCheckedChange={(checked) => setHasReadRequirements(checked as boolean)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-[#171717] leading-relaxed group-hover:text-[#176BF8]">
                      I have read and understand the legal requirements for accessing this system
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={acknowledgesLegal}
                      onCheckedChange={(checked) => setAcknowledgesLegal(checked as boolean)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-[#171717] leading-relaxed group-hover:text-[#176BF8]">
                      I possess valid legal authorization to access investigation intelligence data
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <Checkbox
                      checked={acknowledgesDemoData}
                      onCheckedChange={(checked) => setAcknowledgesDemoData(checked as boolean)}
                      className="mt-0.5"
                    />
                    <span className="text-xs text-[#171717] leading-relaxed group-hover:text-[#176BF8]">
                      I understand this is a demonstration using fictional data only
                    </span>
                  </label>
                </div>
              </div>

              <Separator className="bg-[#E5E5E5]" />

              {/* Additional Notices */}
              <div className="text-[10px] text-[#737373] leading-relaxed space-y-1">
                <p>
                  <strong>Privacy Notice:</strong> All data accessed through this system must be
                  handled in accordance with applicable privacy laws and regulations, including but
                  not limited to the Privacy Act, CJIS Security Policy, and state privacy statutes.
                </p>
                <p>
                  <strong>Audit Trail:</strong> All access to this system is logged and monitored.
                  Your session activity will be recorded for security and compliance purposes.
                </p>
                <p>
                  <strong>Data Retention:</strong> Investigation data must be retained or destroyed
                  in accordance with applicable records retention schedules and legal hold requirements.
                </p>
              </div>
            </CardContent>

            {/* Footer Actions */}
            <div className="p-6 bg-[#F5F5F5] border-t border-[#E5E5E5] flex gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1 border-[#E5E5E5] text-[#525252] hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                onClick={onAcknowledge}
                disabled={!canProceed}
                className={cn(
                  'flex-1',
                  canProceed
                    ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                    : 'bg-[#E5E5E5] text-[#A3A3A3] cursor-not-allowed'
                )}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                I Acknowledge
              </Button>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/**
 * Compact version for quick re-acknowledgment
 */
export function LegalDisclaimerCompact({ onAcknowledge, onCancel }: LegalDisclaimerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#FEF3C7] border-l-4 border-[#F59E0B] p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <Shield className="h-5 w-5 text-[#F59E0B]" />
        <div>
          <p className="text-sm font-semibold text-[#92400E]">Authorized Investigation Mode</p>
          <p className="text-xs text-[#92400E]">This session uses restricted investigation data</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onCancel}
          variant="outline"
          size="sm"
          className="border-[#F59E0B] text-[#92400E] hover:bg-[#FEF3C7]"
        >
          Exit
        </Button>
        <Button
          onClick={onAcknowledge}
          size="sm"
          className="bg-[#F59E0B] hover:bg-[#D97706] text-white"
        >
          Continue
        </Button>
      </div>
    </motion.div>
  )
}

'use client'

import React, { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { CATEGORY_GROUPS } from '@/lib/config/placesCategories'
import type { CategoryGroup } from '@/lib/config/placesCategories'

interface PlacesLayerControlProps {
  onToggleGroup?: (groupId: string, enabled: boolean) => void
  visibleCounts?: Map<string, number> // Category ID -> visible count
}

export default function PlacesLayerControl({
  onToggleGroup,
  visibleCounts = new Map()
}: PlacesLayerControlProps) {
  // Initialize enabled groups from default config
  const [enabledGroups, setEnabledGroups] = useState<Set<string>>(
    new Set(
      CATEGORY_GROUPS.filter(g => g.defaultExpanded).map(g => g.id)
    )
  )

  const toggleGroup = (group: CategoryGroup) => {
    const isEnabled = enabledGroups.has(group.id)
    const newEnabled = new Set(enabledGroups)

    if (isEnabled) {
      newEnabled.delete(group.id)
    } else {
      newEnabled.add(group.id)
    }

    setEnabledGroups(newEnabled)
    onToggleGroup?.(group.id, !isEnabled)
  }

  const getGroupVisibleCount = (group: CategoryGroup): number => {
    return group.categories.reduce((sum, catId) => {
      return sum + (visibleCounts.get(catId) || 0)
    }, 0)
  }

  return (
    <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
      {CATEGORY_GROUPS.map((group) => {
        const isEnabled = enabledGroups.has(group.id)
        const visibleCount = getGroupVisibleCount(group)

        return (
          <div
            key={group.id}
            className={cn(
              'flex items-center gap-3 p-3 rounded-md border border-border bg-white hover:bg-muted/50 transition-colors cursor-pointer',
              isEnabled && 'bg-blue-50 border-blue-200'
            )}
            onClick={() => toggleGroup(group)}
          >
            <Checkbox
              checked={isEnabled}
              onCheckedChange={() => toggleGroup(group)}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0"
            />

            <div className="text-xl shrink-0">{group.icon}</div>

            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {group.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {group.categories.length} categories
                {visibleCount > 0 && ` • ${visibleCount.toLocaleString()} visible`}
              </div>
            </div>
          </div>
        )
      })}

      {/* Summary Footer */}
      <div className="p-2 bg-muted/30 rounded-md border border-border mt-2">
        <div className="text-xs text-muted-foreground text-center">
          {enabledGroups.size} of {CATEGORY_GROUPS.length} groups enabled
        </div>
      </div>
    </div>
  )
}

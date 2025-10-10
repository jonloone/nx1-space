/**
 * Template Registry
 *
 * Central registry for all operational intelligence templates
 */

import { createTemplateRegistry } from '@/lib/models/Template'
import { fleetTrackingTemplate } from './fleet-tracking'
import { maritimeTrackingTemplate } from './maritime-tracking'
import { satelliteOperationsTemplate } from './satellite-operations'

// Create global template registry
export const templateRegistry = createTemplateRegistry()

// Register all templates
templateRegistry.register(fleetTrackingTemplate)
templateRegistry.register(maritimeTrackingTemplate)
templateRegistry.register(satelliteOperationsTemplate)

// Export templates
export { fleetTrackingTemplate } from './fleet-tracking'
export { maritimeTrackingTemplate } from './maritime-tracking'
export { satelliteOperationsTemplate } from './satellite-operations'

// Export template utilities
export * from '@/lib/models/Template'

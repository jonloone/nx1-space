/**
 * Template Registry
 *
 * Central registry for all operational intelligence templates
 */

import { createTemplateRegistry } from '@/lib/models/Template'
import { fleetTrackingTemplate } from './fleet-tracking'
import { maritimeTrackingTemplate } from './maritime-tracking'
import { satelliteOperationsTemplate } from './satellite-operations'
import { investigationIntelligenceTemplate } from './investigation-intelligence'

// Create global template registry
export const templateRegistry = createTemplateRegistry()

// Register all templates
templateRegistry.register(fleetTrackingTemplate)
templateRegistry.register(maritimeTrackingTemplate)
templateRegistry.register(satelliteOperationsTemplate)
templateRegistry.register(investigationIntelligenceTemplate)

// Export templates
export { fleetTrackingTemplate } from './fleet-tracking'
export { maritimeTrackingTemplate } from './maritime-tracking'
export { satelliteOperationsTemplate } from './satellite-operations'
export { investigationIntelligenceTemplate } from './investigation-intelligence'

// Export template utilities
export * from '@/lib/models/Template'

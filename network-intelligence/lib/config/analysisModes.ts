/**
 * Analysis Mode Configuration
 * Defines different analysis modes for the AI copilot interface
 *
 * Each mode provides:
 * - Dedicated handler logic
 * - Mode-specific examples
 * - Optional structured inputs
 * - Natural language support scoped to the mode
 */

export interface StructuredInput {
  type: 'text' | 'location' | 'select' | 'date' | 'number'
  name: string
  label: string
  placeholder?: string
  options?: string[]
  required?: boolean
}

export interface AnalysisMode {
  id: string
  name: string
  description: string
  icon: string  // Lucide icon name
  category: 'routing' | 'investigation' | 'imagery' | 'multi-int' | 'osint' | 'general'

  // Capabilities
  capabilities: {
    naturalLanguage: boolean      // Support free-form text queries
    structuredInput: boolean       // Show form fields for structured input
    toolCalling: boolean           // Use LLM for complex query interpretation
  }

  // Examples shown to user
  examples: string[]

  // Optional structured input fields
  structuredInputs?: StructuredInput[]

  // Handler identifier (maps to handler function)
  handler: 'routing' | 'investigation' | 'imagery' | 'multi-int' | 'osint' | 'general'
}

/**
 * Available Analysis Modes
 */
export const ANALYSIS_MODES: Record<string, AnalysisMode> = {
  // Routing Intelligence Mode
  ROUTING: {
    id: 'routing',
    name: 'Route Intelligence',
    description: 'Multi-INT route analysis with GEOINT, SIGINT, OSINT, and temporal intelligence',
    icon: 'Route',
    category: 'routing',
    capabilities: {
      naturalLanguage: true,
      structuredInput: true,
      toolCalling: false  // Direct parsing, no LLM needed
    },
    examples: [
      'Show route from Central Park to Times Square',
      'Analyze route between JFK Airport and Manhattan',
      'Find safest route from Brooklyn to Queens',
      'Route from 123 Main St to Empire State Building'
    ],
    structuredInputs: [
      {
        type: 'location',
        name: 'from',
        label: 'From',
        placeholder: 'Enter starting location',
        required: true
      },
      {
        type: 'location',
        name: 'to',
        label: 'To',
        placeholder: 'Enter destination',
        required: true
      },
      {
        type: 'select',
        name: 'mode',
        label: 'Travel Mode',
        options: ['driving', 'walking', 'cycling'],
        required: false
      }
    ],
    handler: 'routing'
  },

  // Subject Investigation Mode
  INVESTIGATION: {
    id: 'investigation',
    name: 'Subject Investigation',
    description: 'Investigate subjects with timeline analysis, pattern detection, and network mapping',
    icon: 'UserSearch',
    category: 'investigation',
    capabilities: {
      naturalLanguage: true,
      structuredInput: false,
      toolCalling: true  // Complex queries benefit from LLM interpretation
    },
    examples: [
      'Show all subjects',
      'Show me the alerts',
      'Load investigation case CT-2024-8473',
      'Analyze subject SUBJECT-0001',
      'Show subject route'
    ],
    handler: 'investigation'
  },

  // Satellite Imagery Analysis Mode
  IMAGERY: {
    id: 'imagery',
    name: 'Imagery Intelligence',
    description: 'Satellite imagery analysis with change detection and activity monitoring',
    icon: 'Satellite',
    category: 'imagery',
    capabilities: {
      naturalLanguage: true,
      structuredInput: true,
      toolCalling: false
    },
    examples: [
      'Analyze satellite imagery for Manhattan',
      'Show change detection for Central Park over last 30 days',
      'Monitor activity at JFK Airport',
      'Compare imagery from January to March'
    ],
    structuredInputs: [
      {
        type: 'location',
        name: 'location',
        label: 'Location',
        placeholder: 'Enter location to analyze',
        required: true
      },
      {
        type: 'date',
        name: 'startDate',
        label: 'Start Date',
        required: false
      },
      {
        type: 'date',
        name: 'endDate',
        label: 'End Date',
        required: false
      }
    ],
    handler: 'imagery'
  },

  // Multi-INT Analysis Mode
  MULTI_INT: {
    id: 'multi-int',
    name: 'Multi-INT Analysis',
    description: 'Comprehensive analysis combining route, imagery, isochrone, and OSINT intelligence',
    icon: 'Network',
    category: 'multi-int',
    capabilities: {
      naturalLanguage: true,
      structuredInput: true,
      toolCalling: true
    },
    examples: [
      'Full intelligence analysis for Brooklyn',
      'Multi-layer analysis of Times Square',
      'Comprehensive assessment of Central Park area',
      'All available intelligence for Manhattan'
    ],
    structuredInputs: [
      {
        type: 'location',
        name: 'location',
        label: 'Location',
        placeholder: 'Enter location for analysis',
        required: true
      }
    ],
    handler: 'multi-int'
  },

  // OSINT Research Mode
  OSINT: {
    id: 'osint',
    name: 'Open Source Intelligence',
    description: 'OSINT research with business data, ownership records, and social media analysis',
    icon: 'FileSearch',
    category: 'osint',
    capabilities: {
      naturalLanguage: true,
      structuredInput: true,
      toolCalling: true
    },
    examples: [
      'Research businesses in Manhattan',
      'Find ownership information for 123 Main St',
      'Analyze social media activity in area',
      'Search for suspicious businesses near location'
    ],
    structuredInputs: [
      {
        type: 'location',
        name: 'location',
        label: 'Location',
        placeholder: 'Enter location or business name',
        required: true
      },
      {
        type: 'text',
        name: 'query',
        label: 'Research Query',
        placeholder: 'What are you looking for?',
        required: false
      }
    ],
    handler: 'osint'
  },

  // General Copilot Mode (default)
  GENERAL: {
    id: 'general',
    name: 'General Assistant',
    description: 'General-purpose AI assistant for map interaction and location queries',
    icon: 'MessageSquare',
    category: 'general',
    capabilities: {
      naturalLanguage: true,
      structuredInput: false,
      toolCalling: true
    },
    examples: [
      'What is this area like?',
      'Show me nearby restaurants',
      'Explain what I\'m looking at',
      'Search for coffee shops',
      'Tell me about this neighborhood'
    ],
    handler: 'general'
  }
}

/**
 * Get analysis mode by ID
 */
export function getAnalysisMode(modeId: string): AnalysisMode | null {
  return ANALYSIS_MODES[modeId.toUpperCase().replace(/-/g, '_')] || null
}

/**
 * Get all analysis modes
 */
export function getAllAnalysisModes(): AnalysisMode[] {
  return Object.values(ANALYSIS_MODES)
}

/**
 * Get analysis modes by category
 */
export function getAnalysisModesByCategory(category: AnalysisMode['category']): AnalysisMode[] {
  return Object.values(ANALYSIS_MODES).filter(mode => mode.category === category)
}

/**
 * Get default analysis mode
 */
export function getDefaultAnalysisMode(): AnalysisMode {
  return ANALYSIS_MODES.GENERAL
}

/**
 * Get mode by handler type
 */
export function getModeByHandler(handler: string): AnalysisMode | null {
  return Object.values(ANALYSIS_MODES).find(mode => mode.handler === handler) || null
}

/**
 * Tool definitions and handlers for Assistant chat
 * These tools allow the AI to interact with the map and data
 */

export interface ToolCall {
  toolName: string;
  args: any;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: any;
}

// Tool definitions for the AI
export const ASSISTANT_TOOLS = {
  zoomToLocation: {
    description: 'Zoom the map to a specific location',
    parameters: {
      type: 'object',
      properties: {
        latitude: { 
          type: 'number', 
          description: 'Latitude coordinate',
          minimum: -90,
          maximum: 90
        },
        longitude: { 
          type: 'number', 
          description: 'Longitude coordinate',
          minimum: -180,
          maximum: 180
        },
        zoom: { 
          type: 'number', 
          description: 'Zoom level (1-20)',
          minimum: 1,
          maximum: 20
        }
      },
      required: ['latitude', 'longitude']
    }
  },
  
  highlightStations: {
    description: 'Highlight specific ground stations on the map',
    parameters: {
      type: 'object',
      properties: {
        stationIds: { 
          type: 'array', 
          items: { type: 'string' }, 
          description: 'Array of station IDs to highlight' 
        },
        color: {
          type: 'string',
          description: 'Highlight color (hex or named color)',
          default: '#ffff00'
        }
      },
      required: ['stationIds']
    }
  },
  
  applyFilter: {
    description: 'Apply a filter to the displayed data',
    parameters: {
      type: 'object',
      properties: {
        filterType: { 
          type: 'string', 
          enum: ['score', 'utilization', 'status', 'region'],
          description: 'Type of filter to apply' 
        },
        operator: { 
          type: 'string', 
          enum: ['gt', 'lt', 'eq', 'gte', 'lte', 'contains'],
          description: 'Comparison operator' 
        },
        value: { 
          type: ['number', 'string'], 
          description: 'Filter value' 
        }
      },
      required: ['filterType', 'operator', 'value']
    }
  },
  
  showOpportunities: {
    description: 'Display deployment opportunities on the map',
    parameters: {
      type: 'object',
      properties: {
        minScore: {
          type: 'number',
          description: 'Minimum opportunity score (0-1)',
          minimum: 0,
          maximum: 1,
          default: 0.7
        },
        region: {
          type: 'string',
          description: 'Region to focus on (optional)'
        }
      }
    }
  },
  
  compareStations: {
    description: 'Compare performance metrics between stations',
    parameters: {
      type: 'object',
      properties: {
        stationIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of station IDs to compare',
          minItems: 2,
          maxItems: 5
        },
        metrics: {
          type: 'array',
          items: { 
            type: 'string',
            enum: ['score', 'utilization', 'latency', 'throughput', 'uptime']
          },
          description: 'Metrics to compare',
          default: ['score', 'utilization']
        }
      },
      required: ['stationIds']
    }
  }
};

// Tool execution handlers
export class ToolHandlers {
  static async executeToolCall(toolCall: ToolCall): Promise<ToolResult> {
    console.log('[Tools] Executing tool:', toolCall.toolName, toolCall.args);

    switch (toolCall.toolName) {
      case 'zoomToLocation':
        return this.zoomToLocation(toolCall.args);
      
      case 'highlightStations':
        return this.highlightStations(toolCall.args);
      
      case 'applyFilter':
        return this.applyFilter(toolCall.args);
      
      case 'showOpportunities':
        return this.showOpportunities(toolCall.args);
      
      case 'compareStations':
        return this.compareStations(toolCall.args);
      
      default:
        return {
          success: false,
          message: `Unknown tool: ${toolCall.toolName}`
        };
    }
  }

  private static zoomToLocation(args: any): ToolResult {
    const { latitude, longitude, zoom = 12 } = args;
    
    // Dispatch navigation event
    window.dispatchEvent(new CustomEvent('navigate-to-location', {
      detail: { latitude, longitude, zoom }
    }));

    return {
      success: true,
      message: `Zooming to ${latitude.toFixed(4)}, ${longitude.toFixed(4)} at zoom level ${zoom}`
    };
  }

  private static highlightStations(args: any): ToolResult {
    const { stationIds, color = '#ffff00' } = args;
    
    // Dispatch highlight event
    window.dispatchEvent(new CustomEvent('highlight-features', {
      detail: { 
        type: 'stations',
        ids: stationIds,
        color
      }
    }));

    return {
      success: true,
      message: `Highlighted ${stationIds.length} station(s)`,
      data: { stationIds, color }
    };
  }

  private static applyFilter(args: any): ToolResult {
    const { filterType, operator, value } = args;
    
    // Dispatch filter event
    window.dispatchEvent(new CustomEvent('apply-data-filter', {
      detail: { filterType, operator, value }
    }));

    return {
      success: true,
      message: `Applied filter: ${filterType} ${operator} ${value}`
    };
  }

  private static showOpportunities(args: any): ToolResult {
    const { minScore = 0.7, region } = args;
    
    // Dispatch opportunity display event
    window.dispatchEvent(new CustomEvent('show-opportunities', {
      detail: { minScore, region }
    }));

    return {
      success: true,
      message: `Showing opportunities with score >= ${minScore}${region ? ` in ${region}` : ''}`
    };
  }

  private static async compareStations(args: any): Promise<ToolResult> {
    const { stationIds, metrics = ['score', 'utilization'] } = args;
    
    // In a real implementation, this would fetch data from the store
    // For now, return a mock comparison
    const comparisonData = stationIds.map((id: string) => ({
      id,
      name: `Station ${id}`,
      metrics: metrics.reduce((acc: any, metric: string) => {
        acc[metric] = Math.random(); // Mock data
        return acc;
      }, {})
    }));

    // Dispatch comparison event
    window.dispatchEvent(new CustomEvent('show-comparison', {
      detail: { stations: comparisonData, metrics }
    }));

    return {
      success: true,
      message: `Comparing ${stationIds.length} stations across ${metrics.length} metrics`,
      data: comparisonData
    };
  }
}

// Hook to handle tool calls in components
export function useToolHandler() {
  const handleToolCall = useCallback(async (toolCall: ToolCall) => {
    return await ToolHandlers.executeToolCall(toolCall);
  }, []);

  return { handleToolCall };
}
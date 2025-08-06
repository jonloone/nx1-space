# Advanced Heatmap Visualization Implementation Guide

## Overview

This implementation provides a comprehensive business intelligence visualization system using deck.gl's HeatmapLayer and TerrainLayer. The system supports three analysis modes with dynamic filtering, real-time updates, and 3D terrain visualization when zooming into specific locations.

## Architecture

### Core Components

1. **HeatmapAnalysisEngine** (`/lib/visualization/heatmap-analysis.ts`)
   - Central engine for data processing and weight calculations
   - Supports three analysis modes: Utilization, Profit, and Growth Opportunity
   - Handles filtering and statistical calculations

2. **EnhancedTerrainPortal** (`/lib/terrain/enhanced-terrain-portal.ts`)
   - Manages 3D terrain data loading from Mapbox elevation tiles
   - Calculates terrain suitability metrics
   - Handles tile caching and portal lifecycle

3. **AdvancedHeatmapView** (`/components/advanced-heatmap-view.tsx`)
   - Main visualization component integrating deck.gl layers
   - Manages view state and layer transitions
   - Handles user interactions and mode switching

4. **OpportunityControls** (`/components/opportunity-controls.tsx`)
   - Interactive control panel for filtering
   - Real-time slider adjustments
   - Visual feedback on opportunity scoring

## Analysis Modes

### 1. Utilization Analysis
Shows current capacity usage patterns across the network.

**Weight Calculation:**
- High utilization (>85%) = Red/Critical
- Optimal utilization (40-70%) = Green
- Low utilization (<40%) = Blue (opportunity for growth)

**Use Cases:**
- Identify capacity bottlenecks
- Find underutilized assets
- Plan capacity expansions

### 2. Profit Analysis
Visualizes profit margins and revenue concentration.

**Weight Calculation:**
- Combines profit margin, revenue, and ROI
- Applies capacity efficiency bonuses
- Color scale from red (loss) to purple (exceptional)

**Use Cases:**
- Identify most profitable locations
- Find areas needing pricing optimization
- Prioritize investment decisions

### 3. Growth Opportunity Analysis
Identifies expansion and improvement potential.

**Weight Calculation:**
- Considers underutilization + high profitability
- Evaluates market demand and strategic importance
- Blends current performance with future potential

**Use Cases:**
- Strategic planning
- Investment prioritization
- Market expansion decisions

## Implementation Details

### HeatmapLayer Configuration

```typescript
const heatmapConfig = {
  radiusPixels: 30-100,     // Varies by zoom level
  intensity: 1-2,           // Higher for global view
  threshold: 0.05,          // Edge fade control
  colorRange: [...],        // Mode-specific colors
  colorDomain: [0, 100],    // Value mapping range
  aggregation: 'SUM'        // or 'MEAN' for profit
};
```

### Dynamic Weight Calculation

The system calculates weights based on multiple factors:

1. **Base Metrics**: Utilization, profit margin, revenue
2. **Opportunity Scoring**: Market potential, strategic value
3. **Filter Adjustments**: User-controlled blending of current vs. future

### Zoom-Based Visualization

- **Z0-6 (Global)**: Overview heatmap, small station dots
- **Z6-10 (Regional)**: Detailed heatmap, larger stations
- **Z10-14 (Local)**: 3D columns, station labels
- **Z14+ (Detail)**: Real terrain with elevation data

### Terrain Integration

When zooming to Z12+, clicking a station triggers:

1. Portal creation at station location
2. Tile calculation for required bounds
3. Elevation data loading from Mapbox
4. Terrain metric calculation
5. 3D terrain layer rendering

### Performance Optimizations

1. **Tile Caching**: Reuses loaded elevation tiles
2. **Portal Limits**: Maximum 3 concurrent portals
3. **Lazy Loading**: Terrain only loads on demand
4. **Debounced Updates**: Prevents excessive re-renders

## Color Schemes

### Business Intelligence Colors
```typescript
const BusinessIntelligenceColors = {
  excellent: [59, 130, 246],    // Blue
  good: [34, 197, 94],          // Green
  warning: [234, 179, 8],       // Yellow
  critical: [239, 68, 68],      // Red
  highOpportunity: [251, 146, 60],  // Orange
  highProfit: [147, 51, 234],   // Purple
};
```

## Data Flow

1. **Station Analytics** → HeatmapAnalysisEngine
2. **User Filters** → Weight Recalculation
3. **Processed Data** → deck.gl Layers
4. **User Interaction** → Terrain Portal Creation
5. **Elevation Tiles** → Terrain Metrics
6. **Metrics** → Business Insights

## API Integration

### Required Environment Variables
```bash
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Data Structure
```typescript
interface GroundStationAnalytics {
  station_id: string;
  location: { latitude: number; longitude: number; };
  utilization_metrics: { current_utilization: number; };
  business_metrics: { profit_margin: number; monthly_revenue: number; };
  growth_opportunities: OpportunityData[];
}
```

## Usage Example

```typescript
// Initialize the analysis view
<AdvancedHeatmapView 
  onSelectAsset={handleAssetSelection}
  filters={opportunityFilters}
  onStatsUpdate={updateNetworkStatistics}
/>

// Control panel integration
<OpportunityControls 
  onFiltersChange={updateFilters}
  stationStats={currentStats}
/>
```

## Terrain Metrics

The system calculates several terrain suitability metrics:

- **Accessibility Score**: Based on slope and elevation
- **Stability Score**: Consistency of terrain
- **Visibility Score**: Line-of-sight potential
- **Construction Cost**: Multiplier based on difficulty

## Best Practices

1. **Start with Overview**: Begin at low zoom for network overview
2. **Use Filters**: Narrow down to specific performance ranges
3. **Switch Modes**: Compare different analysis perspectives
4. **Zoom for Detail**: Click stations at Z12+ for terrain analysis
5. **Monitor Metrics**: Use terrain scores for site planning

## Troubleshooting

### Common Issues

1. **Terrain Not Loading**
   - Check Mapbox token validity
   - Ensure zoom level ≥ 12
   - Verify network connectivity

2. **Performance Issues**
   - Reduce radiusPixels for large datasets
   - Limit active portals
   - Use filtering to reduce data points

3. **Color Inconsistency**
   - Verify colorDomain settings
   - Check weight calculation logic
   - Ensure proper data normalization

## Future Enhancements

1. **Additional Analysis Modes**
   - Customer density analysis
   - Competitive landscape
   - Weather impact visualization

2. **Advanced Terrain Features**
   - Watershed analysis
   - Solar exposure calculation
   - Infrastructure proximity

3. **Real-time Updates**
   - WebSocket integration
   - Live utilization updates
   - Alert notifications

## Conclusion

This implementation provides a powerful, flexible system for visualizing complex business metrics with geographic context. The combination of heatmaps for overview analysis and detailed terrain visualization for site-specific planning creates a comprehensive tool for strategic decision-making.
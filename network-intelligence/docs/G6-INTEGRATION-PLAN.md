# G6 Graph Visualization Integration Plan
## Citizens 360 Intelligence Platform

**Created:** 2025-10-28
**Status:** Approved
**Priority:** High

---

## Executive Summary

This document outlines the integration of AntV G6 graph visualization library into the Citizens 360 intelligence platform. G6 will replace the current basic SVG network visualization and enable advanced graph-based analysis across multiple investigation workflows.

**Key Benefits:**
- Handle 10,000+ nodes vs current 8-node limit
- 10+ layout algorithms vs manual positioning
- Rich interactions (zoom, pan, expand, filter, search)
- Professional intelligence-grade visualizations
- Significant development time savings

---

## Current State Analysis

### Existing Network Visualization
**File:** `components/investigation/NetworkAnalysisCard.tsx`

**Limitations:**
- ❌ Limited to 8 visible nodes (line 173)
- ❌ Manual circular layout only
- ❌ Basic hover/click interactions
- ❌ No zoom/pan capabilities
- ❌ Performance degrades with complexity
- ❌ High maintenance burden (custom code)
- ❌ Static visualization

**Current Features:**
- ✅ Node types (subject, associate, location, organization)
- ✅ Risk levels (high, medium, low)
- ✅ Connection types (communication, meeting, financial, social)
- ✅ Connection frequency tracking
- ✅ Click to view node details

---

## G6 Integration Roadmap

### Phase 1: Core Network Visualization (Week 1)
**Priority: P0 - Critical**

**Objective:** Replace existing NetworkAnalysisCard with G6-powered visualization

**Tasks:**
1. Install G6 and dependencies
   ```bash
   npm install @antv/g6 @antv/g6-react-node
   ```

2. Create G6 wrapper component (`G6NetworkGraph.tsx`)
   - Data transformation layer (your format → G6 format)
   - Layout configuration (force-directed default)
   - Interaction handlers
   - Style mappings

3. Update NetworkAnalysisCard
   - Replace SVG visualization (lines 157-236)
   - Integrate G6NetworkGraph component
   - Maintain existing props/API
   - Preserve connection stats panel

4. Data Model Mapping
   ```typescript
   // Your format
   NetworkNode: { id, name, type, riskLevel }
   NetworkConnection: { from, to, type, frequency }

   // G6 format
   G6Node: { id, label, type, style, state }
   G6Edge: { source, target, type, style, label }
   ```

5. Visual Enhancements
   - Risk-based node colors (red=high, amber=medium, blue=low)
   - Connection type styling (dashed, solid, width variations)
   - Icon overlays for node types
   - Animated edges for active connections

**Deliverables:**
- ✅ G6NetworkGraph component
- ✅ Updated NetworkAnalysisCard using G6
- ✅ Data transformation utilities
- ✅ Style configuration presets
- ✅ Test with Citizens 360 demo data

---

### Phase 2: Timeline Graph Visualization (Week 2)
**Priority: P1 - High**

**Objective:** Create interactive timeline graph showing event relationships

**Use Case:** `TimelineCard.tsx` - Currently displays linear timeline

**New Features:**
- **Dagre hierarchical layout** - events flow top-to-bottom chronologically
- **Branching paths** - show parallel event streams
- **Causal links** - connect related events (cause → effect)
- **Time clustering** - group events by day/week/month
- **Path tracing** - highlight event chains leading to current situation

**Implementation:**
```typescript
// components/investigation/TimelineGraphCard.tsx
<G6TimelineGraph
  events={timelineEvents}
  layout="dagre" // Top-down temporal flow
  enableClustering={true}
  highlightPaths={true}
/>
```

**Data Structure:**
```typescript
interface TimelineGraphNode {
  id: string
  timestamp: Date
  type: 'movement' | 'communication' | 'transaction' | 'alert'
  severity: 'critical' | 'warning' | 'info'
  title: string
  details: Record<string, any>
}

interface TimelineGraphEdge {
  from: string // Earlier event
  to: string   // Later event
  relationship: 'caused-by' | 'related-to' | 'concurrent'
  confidence: number // 0-1
}
```

**Deliverables:**
- ✅ TimelineGraphCard component
- ✅ Dagre layout configuration
- ✅ Temporal edge styling
- ✅ Event type icon system
- ✅ Path highlighting on hover

---

### Phase 3: Location Network Graph (Week 3)
**Priority: P1 - High**

**Objective:** Visualize geographic movement patterns and location relationships

**Use Case:** Track subject movements, identify hotspots, find pattern overlaps

**New Features:**
- **Force-directed layout** with geographic clustering
- **Location nodes** + **Movement edges**
- **Frequency heatmaps** - thicker edges for frequent routes
- **Co-location detection** - highlight when subjects visit same places
- **Temporal animation** - replay movements over time

**Implementation:**
```typescript
// components/analysis/LocationNetworkGraph.tsx
<G6LocationGraph
  locations={visitedPlaces}
  movements={subjectMovements}
  subjects={trackedSubjects}
  layout="force"
  enableHeatmap={true}
  enableAnimation={true}
/>
```

**Integration Points:**
- Click location → show on map + add marker
- Click subject → filter to their movements only
- Time slider → animate movements chronologically
- Export → GeoJSON for map overlay

**Deliverables:**
- ✅ LocationNetworkGraph component
- ✅ Geographic force layout tuning
- ✅ Movement animation system
- ✅ Co-location detection algorithm
- ✅ Map integration hooks

---

### Phase 4: Alert Correlation Graph (Week 4)
**Priority: P2 - Medium**

**Objective:** Show how different alerts relate to each other

**Use Case:** Intelligence analysts need to see alert patterns and clusters

**New Features:**
- **Circular layout** - alerts arranged by type/severity
- **Edge bundling** - clean up dense connections
- **Clustering** - group related alerts (same subject, location, time)
- **Severity gradient** - visual flow from low → high risk
- **Correlation scoring** - edge thickness = correlation strength

**Implementation:**
```typescript
// components/opintel/AlertCorrelationGraph.tsx
<G6AlertGraph
  alerts={allAlerts}
  correlations={alertCorrelations}
  layout="circular"
  enableBundling={true}
  groupBy="subject" // or "location" or "type"
/>
```

**Data Structure:**
```typescript
interface AlertNode {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  type: string
  subjects: string[]
  location?: Location
  timestamp: Date
}

interface AlertCorrelation {
  alert1: string
  alert2: string
  score: number // 0-1
  factors: string[] // ["same-subject", "nearby-location", "temporal-proximity"]
}
```

**Deliverables:**
- ✅ AlertCorrelationGraph component
- ✅ Correlation algorithm
- ✅ Circular + force hybrid layout
- ✅ Edge bundling configuration
- ✅ Cluster detection

---

### Phase 5: Evidence/Artifact Graph (Week 5)
**Priority: P2 - Medium**

**Objective:** Show relationships between evidence, documents, and artifacts

**Use Case:** Build case narratives, identify evidence chains, find gaps

**New Features:**
- **Tree layout** - hierarchical evidence structure
- **Evidence types** - documents, photos, recordings, digital artifacts
- **Chain of custody** - track evidence provenance
- **Content linking** - entities mentioned in multiple pieces
- **Gap detection** - highlight missing links

**Implementation:**
```typescript
// components/investigation/EvidenceGraphCard.tsx
<G6EvidenceGraph
  artifacts={caseArtifacts}
  relationships={artifactLinks}
  layout="tree"
  enableChainOfCustody={true}
  highlightGaps={true}
/>
```

**Node Types:**
- 📄 Document
- 📸 Photo/Video
- 🎤 Audio Recording
- 💾 Digital Artifact
- 🏢 Physical Evidence
- 👤 Witness Statement

**Deliverables:**
- ✅ EvidenceGraphCard component
- ✅ Tree layout with expandable branches
- ✅ Chain of custody tracking
- ✅ Gap detection algorithm
- ✅ Evidence type icon library

---

### Phase 6: Organization Hierarchy Graph (Week 6)
**Priority: P3 - Low

**Objective:** Visualize organizational structures and command chains

**Use Case:** Understand criminal organizations, corporate structures, government agencies

**New Features:**
- **Dagre tree layout** - top-down hierarchy
- **Rank visualization** - clear leadership levels
- **Dual hierarchies** - formal vs informal structures
- **Influence mapping** - show actual power vs official titles
- **Expansion on demand** - click to reveal sub-organizations

**Implementation:**
```typescript
// components/investigation/OrgHierarchyGraph.tsx
<G6OrgGraph
  organization={orgData}
  members={orgMembers}
  layout="dagre"
  showInformalStructure={true}
  enableExpansion={true}
/>
```

**Deliverables:**
- ✅ OrgHierarchyGraph component
- ✅ Dagre tree configuration
- ✅ Dual-structure overlay
- ✅ Influence scoring
- ✅ Expandable sub-orgs

---

### Phase 7: Financial Flow Graph (Week 7)
**Priority: P3 - Low**

**Objective:** Track money movement between entities

**Use Case:** Money laundering detection, financial fraud analysis

**New Features:**
- **Sankey-style flow** - visualize money amounts
- **Source/sink detection** - identify origins and destinations
- **Circular flow detection** - find layering schemes
- **Threshold filtering** - hide small transactions
- **Temporal analysis** - animate flows over time

**Implementation:**
```typescript
// components/analysis/FinancialFlowGraph.tsx
<G6FinancialGraph
  transactions={financialData}
  accounts={accountList}
  layout="force"
  enableFlowAnimation={true}
  minTransactionAmount={1000}
/>
```

**Deliverables:**
- ✅ FinancialFlowGraph component
- ✅ Flow layout with thickness = amount
- ✅ Circular flow detection
- ✅ Animation system
- ✅ Filtering controls

---

## Technical Architecture

### Component Structure

```
lib/
  g6/
    ├── config/
    │   ├── layouts.ts          # Layout configurations
    │   ├── styles.ts           # Node/edge styling
    │   └── behaviors.ts        # Interaction configs
    ├── utils/
    │   ├── dataTransform.ts    # Data format converters
    │   ├── layoutHelpers.ts    # Layout algorithms
    │   └── animations.ts       # Animation utilities
    └── hooks/
        ├── useG6Graph.ts       # Main G6 hook
        └── useG6Layout.ts      # Layout management hook

components/
  g6/
    ├── G6NetworkGraph.tsx      # Core network viz
    ├── G6TimelineGraph.tsx     # Timeline viz
    ├── G6LocationGraph.tsx     # Location network
    └── G6GraphControls.tsx     # Shared controls (zoom, layout picker, etc.)
```

### Shared Configuration

```typescript
// lib/g6/config/styles.ts
export const CITIZENS360_THEME = {
  nodes: {
    subject: { fill: '#3b82f6', stroke: '#2563eb' },
    associate: { fill: '#8b5cf6', stroke: '#7c3aed' },
    location: { fill: '#10b981', stroke: '#059669' },
    organization: { fill: '#6b7280', stroke: '#4b5563' },
    alert: { fill: '#ef4444', stroke: '#dc2626' },
    evidence: { fill: '#f59e0b', stroke: '#d97706' }
  },
  riskLevels: {
    high: { fill: '#dc2626', stroke: '#b91c1c', opacity: 1 },
    medium: { fill: '#f59e0b', stroke: '#d97706', opacity: 0.8 },
    low: { fill: '#10b981', stroke: '#059669', opacity: 0.6 }
  },
  edges: {
    communication: { stroke: '#3b82f6', lineWidth: 2 },
    meeting: { stroke: '#8b5cf6', lineWidth: 2 },
    financial: { stroke: '#10b981', lineWidth: 3, lineDash: [5, 5] },
    social: { stroke: '#6b7280', lineWidth: 1 }
  }
}
```

---

## Implementation Priority Matrix

| Phase | Use Case | Priority | Complexity | Value | Timeline |
|-------|----------|----------|------------|-------|----------|
| 1 | Network Visualization | P0 | Medium | High | Week 1 |
| 2 | Timeline Graph | P1 | Medium | High | Week 2 |
| 3 | Location Network | P1 | High | High | Week 3 |
| 4 | Alert Correlation | P2 | High | Medium | Week 4 |
| 5 | Evidence Graph | P2 | Medium | Medium | Week 5 |
| 6 | Org Hierarchy | P3 | Low | Low | Week 6 |
| 7 | Financial Flow | P3 | High | Medium | Week 7 |

---

## Data Integration Strategy

### Citizens360 Data Service Extensions

```typescript
// lib/services/citizens360DataService.ts

// Add new methods for G6 integration:

export interface Citizens360DataService {
  // Existing methods...

  // New G6-specific methods:
  getNetworkGraphData(subjectId: string): Promise<G6GraphData>
  getTimelineGraphData(caseId: string): Promise<G6GraphData>
  getLocationGraphData(subjectIds: string[]): Promise<G6GraphData>
  getAlertCorrelationGraph(alertIds: string[]): Promise<G6GraphData>
  getEvidenceGraphData(caseId: string): Promise<G6GraphData>
  getOrgHierarchyGraph(orgId: string): Promise<G6GraphData>
  getFinancialFlowGraph(subjectId: string): Promise<G6GraphData>
}

interface G6GraphData {
  nodes: G6Node[]
  edges: G6Edge[]
  combos?: G6Combo[] // For grouping
}
```

---

## Performance Considerations

### Large Graph Optimization

1. **Virtual Rendering** - Only render visible nodes
2. **LOD (Level of Detail)** - Simplify distant nodes
3. **Lazy Loading** - Load node details on demand
4. **Edge Bundling** - Reduce edge clutter
5. **WebGL Mode** - For 5,000+ nodes

```typescript
// Enable performance optimizations
const graph = new G6.Graph({
  modes: {
    default: ['drag-canvas', 'zoom-canvas']
  },
  // Performance settings
  renderer: 'webgl', // Use WebGL for large graphs
  enabledStack: true,
  minZoom: 0.1,
  maxZoom: 10,
  // Virtual rendering
  enableVirtualRender: true,
  virtualRenderThreshold: 1000
})
```

---

## UI/UX Enhancements

### Graph Control Panel

```typescript
// components/g6/G6GraphControls.tsx
<G6GraphControls>
  <LayoutSelector
    options={['force', 'circular', 'dagre', 'radial', 'grid']}
    onChange={handleLayoutChange}
  />
  <ZoomControls
    onZoomIn={zoomIn}
    onZoomOut={zoomOut}
    onFit={fitView}
  />
  <FilterPanel
    nodeTypes={nodeTypes}
    edgeTypes={edgeTypes}
    onFilter={handleFilter}
  />
  <ExportButton
    formats={['PNG', 'SVG', 'JSON']}
    onExport={handleExport}
  />
</G6GraphControls>
```

### Minimap

```typescript
// Add minimap for navigation in large graphs
const minimap = new G6.Minimap({
  size: [200, 150],
  className: 'g6-minimap',
  type: 'delegate'
})

graph.addPlugin(minimap)
```

### Context Menu

```typescript
// Right-click on nodes/edges
const contextMenu = new G6.Menu({
  getContent: (evt) => {
    const { item } = evt
    if (item && item.getType() === 'node') {
      return `
        <ul>
          <li>View Profile</li>
          <li>Expand Network</li>
          <li>Show Timeline</li>
          <li>Add to Map</li>
        </ul>
      `
    }
  },
  handleMenuClick: (target, item) => {
    const action = target.textContent
    onAction?.(action, item.getModel())
  }
})

graph.addPlugin(contextMenu)
```

---

## Testing Strategy

### Unit Tests
- Data transformation functions
- Layout calculation utilities
- Style mapping logic

### Integration Tests
- G6 component rendering
- Interaction handlers (click, hover, drag)
- Data updates and re-renders

### Visual Regression Tests
- Snapshot testing for layouts
- Style consistency checks
- Animation playback tests

### Performance Tests
- Benchmark with 100, 1000, 10000 nodes
- Memory usage profiling
- Render time measurements

---

## Migration Strategy

### Phased Rollout

**Week 1-2: Parallel Development**
- Build G6NetworkGraph alongside existing component
- Feature flag to toggle between old/new visualization
- Internal testing and feedback

**Week 3: Beta Testing**
- Deploy to staging environment
- Selected users test new visualization
- Collect feedback and iterate

**Week 4: Production Release**
- Full rollout to production
- Monitor performance metrics
- Keep fallback to old version for 2 weeks

**Week 5+: Deprecation**
- Remove old NetworkAnalysisCard SVG code
- Clean up feature flags
- Archive old implementation

---

## Documentation Requirements

### Developer Documentation
- [ ] G6 integration guide
- [ ] Component API documentation
- [ ] Data format specifications
- [ ] Style customization guide
- [ ] Performance optimization tips

### User Documentation
- [ ] Graph interaction guide (zoom, pan, select)
- [ ] Layout selector usage
- [ ] Filter and search capabilities
- [ ] Export functionality
- [ ] Keyboard shortcuts

---

## Success Metrics

### Technical Metrics
- ✅ Support 1,000+ nodes (from 8)
- ✅ <100ms initial render time
- ✅ <50ms interaction response time
- ✅ <200MB memory usage for 1000 nodes

### User Experience Metrics
- ✅ 90% user satisfaction score
- ✅ <2 clicks to access key features
- ✅ <5 second time to insight
- ✅ Zero data loss during migration

### Business Metrics
- ✅ 50% reduction in development time for new graph features
- ✅ 80% reduction in bug reports vs old visualization
- ✅ Increase analyst productivity by 30%

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Performance degradation with large graphs | High | Medium | WebGL mode, virtual rendering, lazy loading |
| Learning curve for developers | Medium | High | Comprehensive docs, training sessions |
| Data format incompatibility | High | Low | Robust transformation layer, validation |
| Browser compatibility issues | Medium | Low | Polyfills, feature detection, graceful degradation |
| Third-party dependency risk | Low | Low | G6 is maintained by AntV (Alibaba), active community |

---

## Next Steps - Phase 1 Implementation

### Immediate Actions (Day 1)
1. ✅ Install G6: `npm install @antv/g6 @antv/g6-react-node`
2. ✅ Create G6 config structure (`lib/g6/config/`)
3. ✅ Create data transformation utilities (`lib/g6/utils/dataTransform.ts`)
4. ✅ Build G6NetworkGraph component

### Week 1 Deliverables
- ✅ Working G6NetworkGraph replacing SVG visualization
- ✅ Force-directed layout with node clustering
- ✅ Risk-based styling (high/medium/low)
- ✅ Connection type edge styling
- ✅ Hover states and tooltips
- ✅ Click to expand/select nodes
- ✅ Zoom/pan controls
- ✅ Layout switcher (force, circular, radial)

### Testing Checklist
- [ ] Render with Marcus Rahman network (from demo data)
- [ ] Test with 10, 50, 100, 500 nodes
- [ ] Verify all interaction handlers work
- [ ] Check mobile responsiveness
- [ ] Validate accessibility (keyboard navigation)
- [ ] Performance profiling

---

## Appendix: G6 Resource Links

- **Official Documentation:** https://g6.antv.antgroup.com/en
- **GitHub Repository:** https://github.com/antvis/G6
- **Examples Gallery:** https://g6.antv.antgroup.com/en/examples
- **API Reference:** https://g6.antv.antgroup.com/en/api
- **Community Forum:** https://github.com/antvis/G6/discussions

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-10-28 | AI Assistant | Initial comprehensive plan |

---

**Plan Status:** ✅ Approved - Ready for Phase 1 Implementation

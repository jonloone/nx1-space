# Citizens 360: Investigation Intelligence UI

## Overview

Citizens 360 is a dual-artifact investigation intelligence system that combines AI-powered chat analysis with synchronized map visualization for pattern-of-life intelligence analysis.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Operations Intelligence UI                    │
├──────────────────────────┬──────────────────────────────────────┤
│   LEFT: AI Chat Panel    │     RIGHT: Map Visualization         │
│   ─────────────────────  │     ────────────────────────         │
│   • Text responses        │     • Movement paths (red lines)     │
│   • Rich artifacts:       │     • Location markers (colored)     │
│     - Timeline cards      │     • Frequency heatmap             │
│     - Subject profiles    │     • Building coloring             │
│     - Stats dashboards    │     • Route playback                │
│     - Location lists      │     • Associate network             │
│     - Risk assessments    │                                     │
│     - Recommendations     │   Synchronized with chat artifacts   │
└──────────────────────────┴──────────────────────────────────────┘
```

## Core Principles

1. **Dual Representation**: Every insight exists in both chat (textual/data) and map (spatial) forms
2. **Bidirectional Sync**: Clicking artifacts updates map; selecting map features updates chat
3. **Progressive Disclosure**: Start with executive summary, drill down to details
4. **Action-Oriented**: Every artifact has actionable buttons (View, Track, Export, Flag)
5. **Real-Time Updates**: Investigation data updates in real-time as new intelligence arrives

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Map**: Deck.gl, MapLibre GL
- **AI**: Vultr LLM (Llama 2 13B)
- **State**: Zustand
- **Data**: Overture Maps (Buildings, Places), Valhalla (Routing)
- **Styling**: Tailwind CSS, shadcn/ui

## Implementation Phases

### Phase 1: Extend Chat Message Format (1-2 days)
Add artifact support to chat messages with type-safe interfaces.

### Phase 2: Create Artifact Components (2-3 days)
Build reusable React components for each artifact type.

### Phase 3: Integrate with Map Actions (2-3 days)
Wire up bidirectional synchronization between chat and map.

### Phase 4: Connect Investigation Intelligence (2-3 days)
Integrate AI intelligence analysis with chat artifacts.

## Key Features

### Investigation Queries
- `"Load investigation case CT-2024-8473"` - Load full investigation scenario
- `"Show me the route of suspicious activity"` - Display movement path
- `"Show me a list of individuals to investigate"` - List subjects and associates
- `"Analyze pattern-of-life for this subject"` - AI behavioral analysis

### Artifact Types

#### 1. Subject Profile Card
- Subject ID, classification, risk score
- Quick stats (locations, anomalies, associates)
- Actions: View Timeline, Show Heatmap, Export

#### 2. Timeline Card
- Chronological list of locations
- Visual timeline with timestamps
- Dwell time indicators
- Actions: Play Route, View Details, Flag Alert

#### 3. Route Card
- Route summary with distance/duration
- Playback controls
- Significant stops highlighted
- Actions: Animate, Export GPX, View Street View

#### 4. Investigation List Card
- Searchable/filterable list
- Risk scores and status
- Connection indicators
- Actions: View Profile, Track, Create Watchlist

#### 5. Intelligence Analysis Card
- AI-generated behavioral insights
- Geographic intelligence summary
- Network inference
- Actionable recommendations
- Actions: View Full Report, Export PDF, Flag High Priority

#### 6. Heatmap Summary Card
- Location frequency statistics
- Top clusters
- Time-of-day breakdown
- Actions: Toggle Heatmap, Adjust Radius, Export Data

## Map Visualization Layers

### Investigation Intelligence Preset
- **Movement Path Layer**: Red line showing subject trajectory
- **Location Markers Layer**: Colored dots (routine=green, suspicious=orange, anomaly=red)
- **Frequency Heatmap Layer**: Heat intensity showing most-visited areas
- **Building Context Layer**: 3D buildings colored by visit type
- **Associates Layer**: Purple dots showing known associates
- **Network Lines Layer**: Lines connecting subject to associates

## Data Flow

```
User Query
    ↓
Chat Handler
    ↓
Query Parser (determine intent)
    ↓
    ├─ "load case" → Investigation Loader Service
    ├─ "show route" → Route Analyzer Service
    ├─ "list individuals" → Subject Manager Service
    └─ "analyze" → Investigation Intelligence Service
                        ↓
                    AI Analysis (Vultr LLM)
                        ↓
                    Generate Artifact Data
                        ↓
    ┌───────────────────┴───────────────────┐
    ↓                                       ↓
Chat Artifact Component              Map Action Handler
    ↓                                       ↓
Render Rich UI Card                 Update Map Layers
    ↓                                       ↓
User Clicks Action                  User Clicks Feature
    ↓                                       ↓
    └──────────────→ Sync ←────────────────┘
```

## Security & Compliance

⚠️ **Legal Disclaimer**
- For authorized law enforcement use only
- Requires proper legal authorization (warrant/court order)
- Complies with applicable privacy laws and regulations
- All data access is logged and auditable

## Success Metrics

- **Time to Insight**: Reduce investigation analysis time from hours to minutes
- **Pattern Detection**: AI identifies suspicious patterns with 85%+ accuracy
- **User Engagement**: Investigators spend 80%+ time in Citizens 360 interface
- **Export Frequency**: 90%+ of investigations exported for court documentation

## Future Enhancements

- Real-time surveillance feed integration
- Multi-subject comparative analysis
- Predictive behavior modeling
- Social network graph visualization
- Mobile app for field operations
- Voice command interface

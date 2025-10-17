# Citizens 360 Documentation

Complete documentation for the Citizens 360 Investigation Intelligence system.

## Quick Links

- **[Implementation Roadmap](./IMPLEMENTATION_ROADMAP.md)** - Start here for timeline and overview
- **[Architecture Overview](./CITIZENS_360_OVERVIEW.md)** - System design and principles
- **[Phase 1: Chat Message Extension](./PHASE_1_CHAT_MESSAGE_EXTENSION.md)** - Foundation (1-2 days)
- **[Phase 2: Artifact Components](./PHASE_2_ARTIFACT_COMPONENTS.md)** - UI Components (2-3 days)
- **[Phase 3: Map-Chat Sync](./PHASE_3_MAP_CHAT_SYNC.md)** - Integration (2-3 days)
- **[Phase 4: Investigation Intel](./PHASE_4_INVESTIGATION_INTEL.md)** - AI Intelligence (2-3 days)

## What is Citizens 360?

Citizens 360 is a dual-artifact investigation intelligence system that combines:
- **AI-Powered Chat Interface**: Natural language queries with rich artifact responses
- **Synchronized Map Visualization**: Real-time geospatial intelligence display
- **Pattern-of-Life Analysis**: AI-generated behavioral insights
- **Investigation Management**: Case loading, subject tracking, route playback

## Key Features

### Chat Artifacts
1. **Subject Profile Card** - Subject details, risk score, classification, stats
2. **Timeline Card** - Chronological location history with playback
3. **Route Card** - Movement paths with animation and export
4. **Investigation List** - Searchable list of subjects and associates
5. **Intelligence Analysis** - AI insights, recommendations, risk assessment
6. **Heatmap Summary** - Location frequency and time-of-day analysis

### Map Visualization
- Movement paths (red lines)
- Location markers (color-coded by significance)
- Frequency heatmaps
- 3D building context
- Associate network visualization
- Route playback animation

### Investigation Queries
```
"Load investigation case CT-2024-8473"
"Analyze pattern-of-life for this subject"
"Show me the route of suspicious activity"
"Show me a list of individuals to investigate"
```

## Technology Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Map**: Deck.gl, MapLibre GL
- **AI**: Vultr LLM (Llama 2 13B)
- **State**: Zustand
- **Data**: Overture Maps, Valhalla Routing
- **UI**: Tailwind CSS, shadcn/ui

## Implementation Phases

### Phase 1: Foundation (1-2 days)
Extend chat message format to support rich artifacts
- Create artifact type definitions
- Update chat panel rendering
- Build artifact router component

### Phase 2: Components (2-3 days)
Build all artifact UI components
- Subject Profile Card
- Timeline Card
- Route Card
- Investigation List Card
- Intelligence Analysis Card
- Heatmap Summary Card

### Phase 3: Integration (2-3 days)
Synchronize chat and map
- Bidirectional sync manager
- Map layer management
- Route playback animation
- Feature selection handling

### Phase 4: Intelligence (2-3 days)
Connect AI and investigation services
- Command parser and handler
- Artifact factories
- AI intelligence integration
- Case loading workflow

## Development Workflow

1. **Read Phase Documentation** - Understand requirements and architecture
2. **Create Branch** - `git checkout -b feature/citizens-360-phase-N`
3. **Implement** - Follow step-by-step guide in phase document
4. **Test** - Unit tests, integration tests, E2E tests
5. **Review** - Code review with team
6. **Merge** - Merge to main branch
7. **Deploy** - Deploy to staging for QA

## Testing Strategy

### Unit Tests
```bash
npm test -- chatArtifacts.test.ts
```

### Integration Tests
```bash
npm test -- artifactRenderer.test.ts
```

### E2E Tests
```bash
npm run test:e2e -- investigation-workflow.spec.ts
```

## Code Examples

### Creating an Artifact

```typescript
import { createSubjectProfileArtifact } from '@/lib/utils/artifactFactories'

const artifact = createSubjectProfileArtifact(subject, intelligence)

const message: ChatMessage = {
  id: Date.now().toString(),
  role: 'assistant',
  content: `Investigation case loaded`,
  timestamp: new Date(),
  artifact
}
```

### Handling Artifact Actions

```typescript
const handleAction = async (actionId: string, data: any) => {
  const syncManager = getChatMapSyncManager()
  await syncManager.handleArtifactAction('subject-profile', actionId, data)
}
```

### Displaying Investigation on Map

```typescript
const layerManager = getInvestigationMapLayerManager()
layerManager.displayInvestigation(demoData)
```

## Security & Compliance

⚠️ **Legal Requirements**
- For authorized law enforcement use only
- Requires proper legal authorization (warrant/court order)
- Complies with privacy laws and regulations
- All data access is logged and auditable

## Performance Targets

- **Artifact Render Time**: <50ms
- **Map Sync Latency**: <100ms
- **Route Animation**: 60fps
- **AI Intelligence Generation**: <5 seconds
- **Case Load Time**: <3 seconds

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## API Documentation

### Investigation Command Handler

```typescript
interface InvestigationQuery {
  type: 'load-case' | 'analyze-subject' | 'show-route' | 'list-subjects'
  params: {
    caseNumber?: string
    subjectId?: string
    location?: string
    timeRange?: { start: Date; end: Date }
  }
}
```

### Chat Artifact Types

```typescript
type ArtifactType =
  | 'subject-profile'
  | 'timeline'
  | 'route'
  | 'investigation-list'
  | 'intelligence-analysis'
  | 'heatmap-summary'
```

## Troubleshooting

### Artifacts Not Rendering
- Check that Phase 1 is complete
- Verify `artifact` field exists on ChatMessage
- Check console for TypeScript errors

### Map Not Updating
- Verify `ChatMapSyncManager` is initialized
- Check that artifact actions have handlers
- Inspect map layer visibility

### AI Intelligence Fails
- Verify `VULTR_API_KEY` is set
- Check LLM response format
- Review fallback intelligence methods

## Contributing

1. Read phase documentation
2. Follow TypeScript best practices
3. Write tests for new components
4. Update documentation
5. Submit PR with detailed description

## License

Proprietary - For authorized law enforcement use only

## Support

Contact: [your team contact]
Documentation: `/docs/citizens-360/`
Issues: GitHub Issues

---

**Last Updated**: {current_date}
**Version**: 1.0.0-alpha
**Status**: 📝 Documentation Complete, Ready for Implementation

# Citizens 360 Intelligence Platform: Graph Data Model Analysis

**Version:** 1.0
**Date:** 2025-10-29
**Status:** Critical Analysis & Recommendations

---

## Executive Summary

This document provides a comprehensive analysis of the Citizens 360 intelligence platform's graph data model, evaluating its current state and providing recommendations for creating a robust, investigation-ready data structure that effectively tells the story of subjects, their relationships, movements, and activities.

**Key Findings:**
- ✅ **Strengths**: Basic node/edge structure is in place with type categorization
- ⚠️ **Gaps**: Limited relationship types, no temporal context, missing critical intelligence categories
- 🎯 **Priority**: Expand entity types and relationship semantics to support comprehensive investigation narratives

---

## Table of Contents

1. [Current State Analysis](#current-state-analysis)
2. [Investigation Story Requirements](#investigation-story-requirements)
3. [Recommended Entity Types](#recommended-entity-types)
4. [Recommended Relationship Types](#recommended-relationship-types)
5. [Temporal Intelligence Integration](#temporal-intelligence-integration)
6. [Risk Assessment Framework](#risk-assessment-framework)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Integration with Citizens 360 Components](#integration-with-citizens360-components)

---

## 1. Current State Analysis

### Current Data Structures

#### NetworkNode (Current)
```typescript
interface NetworkNode {
  id: string
  name: string
  type: 'subject' | 'associate' | 'location' | 'organization'
  riskLevel?: 'high' | 'medium' | 'low'
}
```

#### NetworkConnection (Current)
```typescript
interface NetworkConnection {
  from: string
  to: string
  type: 'communication' | 'meeting' | 'financial' | 'social'
  frequency: number
  lastContact?: Date
}
```

### Strengths

1. **Type System**: Basic categorization exists for both nodes and edges
2. **Risk Indication**: Node-level risk assessment provides quick visual priority
3. **Frequency Tracking**: Connection frequency helps identify patterns
4. **Simplicity**: Easy to understand and implement initially

### Critical Gaps

#### Entity Type Gaps
- ❌ No **Vehicle** entities (critical for surveillance)
- ❌ No **Phone Number** / **Email** entities (communication tracking)
- ❌ No **Address** / **Property** entities (distinct from general locations)
- ❌ No **Document** / **Evidence** entities (case building)
- ❌ No **Event** / **Incident** entities (timeline integration)
- ❌ No **Financial Account** entities (money flow tracking)
- ❌ No **Group** / **Gang** entities (affiliation tracking)

#### Relationship Semantic Gaps
- ❌ No **Family** relationships (parent, sibling, spouse)
- ❌ No **Employment** relationships (employer, employee, contractor)
- ❌ No **Ownership** relationships (owns vehicle, owns property)
- ❌ No **Presence** relationships (was at location, lives at address)
- ❌ No **Association** relationships (member of gang, affiliated with org)
- ❌ No **Transaction** relationships (sent money, received payment)
- ❌ No **Communication** channel specification (phone call vs. text vs. email)

#### Temporal Context Gaps
- ❌ No **start date** for relationships
- ❌ No **end date** for relationships (are they still active?)
- ❌ No **observation timestamps** (when was this connection observed?)
- ❌ No **historical snapshots** (network state at different times)
- ❌ No **event linking** (which events triggered these connections?)

#### Metadata Gaps
- ❌ No **source attribution** (where did this intelligence come from?)
- ❌ No **confidence level** (how certain are we about this connection?)
- ❌ No **classification level** (public, sensitive, classified)
- ❌ No **investigator notes** (contextual observations)
- ❌ No **tags** / **categories** (flexible classification)

---

## 2. Investigation Story Requirements

### What Makes a Good Investigation Graph?

A compelling investigation graph must answer these key questions:

#### 1. **WHO**
- Who is the subject?
- Who are their associates?
- Who are their family members?
- Who do they work for/with?
- Who else was present at key events?

#### 2. **WHAT**
- What activities occurred?
- What relationships exist?
- What assets do they control?
- What communications took place?
- What transactions occurred?

#### 3. **WHERE**
- Where does the subject live?
- Where do they work?
- Where do they frequent?
- Where were key meetings?
- Where were incidents observed?

#### 4. **WHEN**
- When did relationships start?
- When did activities occur?
- When was the subject at each location?
- When did communications happen?
- When did patterns change?

#### 5. **WHY**
- Why is this person of interest?
- Why are these connections significant?
- Why did the network change?
- Why is this relationship suspicious?

#### 6. **HOW**
- How do they communicate?
- How do they move money?
- How did they meet associates?
- How often do they interact?
- How has the network evolved?

### Investigation Narrative Types

The graph must support multiple narrative structures:

1. **Subject-Centric**: Focus on one person and their entire network
2. **Location-Centric**: Focus on a place and everyone connected to it
3. **Event-Centric**: Focus on an incident and all participants
4. **Organization-Centric**: Focus on a group and its members
5. **Timeline-Centric**: Focus on chronological evolution of activities
6. **Financial-Centric**: Focus on money flow and transactions
7. **Communication-Centric**: Focus on who talks to whom and how

---

## 3. Recommended Entity Types

### Core Entities

#### Person Entities
```typescript
type PersonEntityType =
  | 'primary-subject'    // Main investigation target
  | 'secondary-subject'  // Related person of interest
  | 'associate'          // Known associate
  | 'family-member'      // Family relation
  | 'witness'            // Witnessed an event
  | 'victim'             // Victim of incident
  | 'suspect'            // Suspect in incident
  | 'informant'          // Confidential source

interface PersonNode extends BaseNode {
  type: 'person'
  subtype: PersonEntityType
  attributes: {
    fullName: string
    aliases?: string[]
    dateOfBirth?: Date
    age?: number
    gender?: 'male' | 'female' | 'other' | 'unknown'
    nationality?: string
    occupation?: string
    criminalHistory?: string[]
    identifiers: {
      ssn?: string         // Last 4 digits only
      driverLicense?: string
      passport?: string
      biometricId?: string
    }
  }
}
```

#### Place Entities
```typescript
type PlaceEntityType =
  | 'residence'          // Where someone lives
  | 'workplace'          // Where someone works
  | 'meeting-location'   // Where meetings occur
  | 'incident-location'  // Where incidents happened
  | 'frequent-location'  // Regularly visited
  | 'property'           // Owned property
  | 'landmark'           // Reference point

interface PlaceNode extends BaseNode {
  type: 'place'
  subtype: PlaceEntityType
  attributes: {
    address: string
    city: string
    state: string
    country: string
    postalCode?: string
    coordinates: [number, number]
    propertyType?: 'residential' | 'commercial' | 'industrial'
    ownership?: string
  }
}
```

#### Communication Entities
```typescript
type CommunicationEntityType =
  | 'phone-number'
  | 'email-address'
  | 'social-media-account'
  | 'messaging-app-id'

interface CommunicationNode extends BaseNode {
  type: 'communication'
  subtype: CommunicationEntityType
  attributes: {
    value: string          // Phone number, email, username
    platform?: string      // WhatsApp, Signal, Twitter, etc.
    verified: boolean
    activeStatus: 'active' | 'inactive' | 'unknown'
    firstObserved?: Date
    lastObserved?: Date
  }
}
```

#### Asset Entities
```typescript
type AssetEntityType =
  | 'vehicle'
  | 'property'
  | 'financial-account'
  | 'business'
  | 'valuable-item'

interface AssetNode extends BaseNode {
  type: 'asset'
  subtype: AssetEntityType
  attributes: {
    // Vehicle-specific
    make?: string
    model?: string
    year?: number
    licensePlate?: string
    vin?: string
    color?: string

    // Financial-specific
    accountNumber?: string    // Last 4 digits only
    institution?: string
    accountType?: string

    // Property-specific
    propertyAddress?: string
    propertyValue?: number

    // Common
    estimatedValue?: number
    registeredOwner?: string
  }
}
```

#### Organization Entities
```typescript
type OrganizationEntityType =
  | 'employer'
  | 'gang'
  | 'criminal-org'
  | 'club'
  | 'business'
  | 'government-agency'
  | 'nonprofit'

interface OrganizationNode extends BaseNode {
  type: 'organization'
  subtype: OrganizationEntityType
  attributes: {
    legalName: string
    dba?: string           // Doing Business As
    industry?: string
    founded?: Date
    headquarters?: string
    threatLevel?: 'high' | 'medium' | 'low'
    memberCount?: number
    knownActivities?: string[]
  }
}
```

#### Event Entities
```typescript
type EventEntityType =
  | 'incident'
  | 'meeting'
  | 'transaction'
  | 'communication-event'
  | 'movement'
  | 'surveillance-observation'

interface EventNode extends BaseNode {
  type: 'event'
  subtype: EventEntityType
  attributes: {
    timestamp: Date
    duration?: number      // Minutes
    location?: string      // Reference to place node
    description: string
    participants?: string[]  // References to person nodes
    significance: 'critical' | 'high' | 'medium' | 'low'
    outcome?: string
    evidence?: string[]      // References to document nodes
  }
}
```

#### Evidence Entities
```typescript
type EvidenceEntityType =
  | 'photograph'
  | 'video'
  | 'audio'
  | 'document'
  | 'physical-evidence'
  | 'digital-evidence'

interface EvidenceNode extends BaseNode {
  type: 'evidence'
  subtype: EvidenceEntityType
  attributes: {
    collectionDate: Date
    collectedBy: string
    description: string
    location?: string
    chainOfCustody: {
      timestamp: Date
      handler: string
      action: string
    }[]
    fileReference?: string
    classification: 'public' | 'sensitive' | 'classified'
  }
}
```

### Base Node Structure

```typescript
interface BaseNode {
  id: string
  type: string
  subtype?: string
  label: string                    // Display name
  riskLevel?: 'critical' | 'high' | 'medium' | 'low' | 'none'
  confidenceLevel?: number         // 0-100%
  metadata: {
    source: string[]               // Where this data came from
    createdAt: Date
    updatedAt: Date
    createdBy: string
    tags: string[]
    notes: string
    classification: 'public' | 'sensitive' | 'classified'
  }
}
```

---

## 4. Recommended Relationship Types

### Relationship Categories

#### 1. Personal Relationships
```typescript
type PersonalRelationshipType =
  | 'family-parent'
  | 'family-child'
  | 'family-sibling'
  | 'family-spouse'
  | 'family-extended'
  | 'romantic-partner'
  | 'friend'
  | 'acquaintance'
  | 'roommate'

interface PersonalRelationship extends BaseEdge {
  category: 'personal'
  type: PersonalRelationshipType
  attributes: {
    strength: 'strong' | 'moderate' | 'weak'
    startDate?: Date
    endDate?: Date              // null = still active
    status: 'active' | 'inactive' | 'estranged'
  }
}
```

#### 2. Professional Relationships
```typescript
type ProfessionalRelationshipType =
  | 'employer'
  | 'employee'
  | 'coworker'
  | 'client'
  | 'contractor'
  | 'business-partner'
  | 'supervisor'
  | 'subordinate'

interface ProfessionalRelationship extends BaseEdge {
  category: 'professional'
  type: ProfessionalRelationshipType
  attributes: {
    jobTitle?: string
    department?: string
    startDate?: Date
    endDate?: Date
    employmentType?: 'full-time' | 'part-time' | 'contract'
  }
}
```

#### 3. Communication Relationships
```typescript
type CommunicationRelationshipType =
  | 'phone-call'
  | 'text-message'
  | 'email'
  | 'social-media-message'
  | 'in-person-conversation'

interface CommunicationRelationship extends BaseEdge {
  category: 'communication'
  type: CommunicationRelationshipType
  attributes: {
    frequency: number           // Contacts per month
    lastContact: Date
    firstContact: Date
    totalContacts: number
    averageDuration?: number    // Minutes
    direction?: 'outgoing' | 'incoming' | 'bidirectional'
    platform?: string           // WhatsApp, Signal, etc.
  }
}
```

#### 4. Location Relationships
```typescript
type LocationRelationshipType =
  | 'lives-at'
  | 'works-at'
  | 'frequents'
  | 'visited'
  | 'owns'
  | 'was-present-at'

interface LocationRelationship extends BaseEdge {
  category: 'location'
  type: LocationRelationshipType
  attributes: {
    frequency?: 'daily' | 'weekly' | 'monthly' | 'rare'
    firstObserved?: Date
    lastObserved?: Date
    dwellTime?: number          // Average minutes per visit
    visitCount?: number
  }
}
```

#### 5. Financial Relationships
```typescript
type FinancialRelationshipType =
  | 'payment-sent'
  | 'payment-received'
  | 'loan'
  | 'account-holder'
  | 'beneficiary'
  | 'transaction'

interface FinancialRelationship extends BaseEdge {
  category: 'financial'
  type: FinancialRelationshipType
  attributes: {
    amount?: number
    currency: string
    date: Date
    method?: 'wire' | 'check' | 'cash' | 'crypto' | 'other'
    purpose?: string
    suspicious: boolean
    totalAmount?: number        // Sum of all transactions
    transactionCount?: number
  }
}
```

#### 6. Association Relationships
```typescript
type AssociationRelationshipType =
  | 'member-of'
  | 'affiliated-with'
  | 'suspected-member'
  | 'former-member'
  | 'leader-of'

interface AssociationRelationship extends BaseEdge {
  category: 'association'
  type: AssociationRelationshipType
  attributes: {
    role?: string
    joinDate?: Date
    leaveDate?: Date
    rank?: string
    status: 'active' | 'inactive' | 'suspected'
    loyaltyLevel?: 'high' | 'medium' | 'low'
  }
}
```

#### 7. Event Participation
```typescript
type EventParticipationType =
  | 'attended'
  | 'organized'
  | 'witnessed'
  | 'victim-of'
  | 'perpetrator-of'
  | 'implicated-in'

interface EventParticipation extends BaseEdge {
  category: 'event'
  type: EventParticipationType
  attributes: {
    role: string
    arrivalTime?: Date
    departureTime?: Date
    actions?: string[]
  }
}
```

### Base Edge Structure

```typescript
interface BaseEdge {
  id: string
  source: string                   // Node ID
  target: string                   // Node ID
  category: string
  type: string
  label?: string                   // Display text
  weight?: number                  // Relationship strength (0-100)
  significance: 'critical' | 'high' | 'medium' | 'low'
  confidenceLevel?: number         // 0-100% how sure we are
  metadata: {
    source: string[]               // Evidence sources
    observedAt: Date[]             // When was this observed
    createdAt: Date
    updatedAt: Date
    tags: string[]
    notes: string
    classification: 'public' | 'sensitive' | 'classified'
  }
}
```

---

## 5. Temporal Intelligence Integration

### Time-Based Graph Queries

The graph must support temporal queries:

```typescript
interface TemporalQuery {
  // Snapshot: "Show me the network as it was on this date"
  snapshot: {
    date: Date
    includeInactive: boolean
  }

  // Timeline: "Show me how the network changed over time"
  timeline: {
    startDate: Date
    endDate: Date
    granularity: 'day' | 'week' | 'month'
  }

  // Pattern: "Show me relationships that formed during this period"
  pattern: {
    startDate: Date
    endDate: Date
    changeType: 'new' | 'ended' | 'strengthened' | 'weakened'
  }
}
```

### Integration with Timeline Component

The network graph must bidirectionally link with the timeline:

1. **Timeline → Network**: Clicking a timeline event highlights related network nodes
2. **Network → Timeline**: Clicking a network node shows that person's timeline
3. **Synchronization**: Both views share the same temporal filter state

```typescript
interface TimelineNetworkSync {
  // Shared temporal state
  currentTimeRange: {
    start: Date
    end: Date
  }

  // Selected entities (shared between both views)
  selectedEntities: string[]  // Node IDs

  // Actions
  onTimeRangeChange: (start: Date, end: Date) => void
  onEntitySelect: (nodeId: string) => void
  onEventSelect: (eventId: string) => void
}
```

---

## 6. Risk Assessment Framework

### Multi-Dimensional Risk Scoring

Instead of simple "high/medium/low", implement comprehensive risk assessment:

```typescript
interface RiskAssessment {
  // Overall risk level (computed from factors)
  overallRisk: 'critical' | 'high' | 'medium' | 'low' | 'none'

  // Individual risk factors
  factors: {
    criminalHistory: {
      score: number          // 0-100
      weight: number         // Importance multiplier
      details: string[]
    }
    associations: {
      score: number
      weight: number
      details: string[]      // "Associated with 3 known gang members"
    }
    behaviorPatterns: {
      score: number
      weight: number
      details: string[]      // "Unusual financial activity"
    }
    communications: {
      score: number
      weight: number
      details: string[]      // "Frequent contact with suspects"
    }
    locations: {
      score: number
      weight: number
      details: string[]      // "Frequents high-crime areas"
    }
  }

  // Risk trends
  trend: 'increasing' | 'decreasing' | 'stable'
  trendData: {
    date: Date
    score: number
  }[]

  // Justification for risk level
  rationale: string

  // Last assessment
  assessedAt: Date
  assessedBy: string
}
```

---

## 7. Implementation Roadmap

### Phase 1: Core Entity Types (Week 1-2)
- [ ] Expand `NetworkNode` to support all entity types
- [ ] Add `PersonNode`, `PlaceNode`, `CommunicationNode`
- [ ] Update data transformation utilities
- [ ] Update G6 styling for new types

### Phase 2: Relationship Semantics (Week 3-4)
- [ ] Expand `NetworkConnection` with relationship categories
- [ ] Add temporal fields (startDate, endDate, observedAt)
- [ ] Add confidence levels and source attribution
- [ ] Update edge styling based on relationship type

### Phase 3: Temporal Integration (Week 5-6)
- [ ] Add temporal query capabilities
- [ ] Implement timeline-network synchronization
- [ ] Add time-based filtering UI
- [ ] Implement historical snapshots

### Phase 4: Risk Framework (Week 7-8)
- [ ] Implement multi-factor risk scoring
- [ ] Add risk trend visualization
- [ ] Create risk assessment UI panel
- [ ] Add risk-based graph filtering

### Phase 5: Advanced Features (Week 9-10)
- [ ] Add evidence linking
- [ ] Implement graph analytics (centrality, clustering)
- [ ] Add export capabilities (formats: JSON, GraphML, CSV)
- [ ] Create investigation report generation

---

## 8. Integration with Citizens 360 Components

### Component Integration Matrix

| Component | Data Needs | Integration Method |
|-----------|------------|-------------------|
| **SubjectProfileCard** | PersonNode data | Direct read from graph |
| **TimelineCard** | EventNode + temporal edges | Bidirectional sync |
| **NetworkAnalysisCard** | Full graph subset | Current implementation |
| **IntelligenceAlertArtifact** | EventNode + participants | Create event nodes |
| **MapVisualization** | PlaceNode + location edges | Spatial query layer |
| **CopilotChat** | Natural language → graph queries | Query generation |

### Data Flow Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Citizens 360 UI                     │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Profile  │ Timeline │ Network  │  Map     │   Chat      │
│  Card    │   Card   │   Card   │  View    │  Interface  │
└──────────┴──────────┴──────────┴──────────┴─────────────┘
           │          │          │          │
           └──────────┴────┬─────┴──────────┘
                           │
                 ┌─────────▼──────────┐
                 │  Graph Data Store  │
                 │   (Zustand/State)  │
                 └─────────┬──────────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │   Citizens  │ │   G6 Graph  │ │  Temporal   │
    │ 360 Service │ │  Transform  │ │   Queries   │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### API Design

```typescript
// Graph Query API
interface GraphQueryAPI {
  // Node operations
  getNode(id: string): Promise<BaseNode>
  getNodesByType(type: string): Promise<BaseNode[]>
  addNode(node: BaseNode): Promise<void>
  updateNode(id: string, updates: Partial<BaseNode>): Promise<void>
  deleteNode(id: string): Promise<void>

  // Edge operations
  getEdge(id: string): Promise<BaseEdge>
  getEdgesByType(type: string): Promise<BaseEdge[]>
  getEdgesForNode(nodeId: string): Promise<BaseEdge[]>
  addEdge(edge: BaseEdge): Promise<void>
  updateEdge(id: string, updates: Partial<BaseEdge>): Promise<void>
  deleteEdge(id: string): Promise<void>

  // Graph queries
  getSubgraph(centerNodeId: string, depth: number): Promise<GraphData>
  getShortestPath(fromId: string, toId: string): Promise<BaseEdge[]>
  findConnections(nodeId1: string, nodeId2: string): Promise<BaseEdge[][]>

  // Temporal queries
  getGraphSnapshot(date: Date): Promise<GraphData>
  getGraphEvolution(startDate: Date, endDate: Date): Promise<GraphData[]>
  getNodeHistory(nodeId: string): Promise<NodeHistory[]>

  // Analytics
  getCentralityScores(): Promise<Map<string, number>>
  detectCommunities(): Promise<string[][]>
  findAnomalies(): Promise<string[]>
}
```

---

## 9. Example Use Cases

### Use Case 1: Investigating Organized Crime

**Scenario:** Track a suspected gang leader and their network

**Entities:**
- 1 × Primary Subject (gang leader)
- 8 × Associates (gang members)
- 3 × Organizations (legitimate businesses, front companies)
- 12 × Places (residences, meeting locations, crime scenes)
- 6 × Vehicles (personal, gang fleet)
- 15 × Phone Numbers
- 4 × Financial Accounts

**Relationships:**
- "member-of" → Organization (gang)
- "lives-at" → Places
- "owns" → Vehicles, Properties
- "phone-call" → Communication patterns
- "transaction" → Money flow
- "was-present-at" → Crime scenes

**Intelligence Questions Answered:**
1. Who are the key members?
2. Where do they operate?
3. How do they communicate?
4. Where does the money go?
5. What are their assets?

### Use Case 2: Missing Person Investigation

**Scenario:** Locate a missing person using their network

**Entities:**
- 1 × Primary Subject (missing person)
- 12 × Family Members
- 8 × Friends
- 5 × Coworkers
- 20 × Places (home, work, frequently visited)
- 3 × Vehicles (owned, borrowed)
- Last known communications

**Relationships:**
- "family-*" → Family tree
- "friend" → Social network
- "coworker" → Professional connections
- "phone-call", "text-message" → Last communications
- "visited" → Location history
- "lives-at" → Primary residence

**Intelligence Questions Answered:**
1. Who saw them last?
2. Where do they usually go?
3. Who might they contact?
4. What vehicles have they used?
5. What's their routine?

### Use Case 3: Financial Crime Investigation

**Scenario:** Trace money laundering operation

**Entities:**
- 3 × Primary Subjects (principals)
- 6 × Shell Companies
- 15 × Financial Accounts
- 8 × Properties
- 4 × Business Associates

**Relationships:**
- "owns" → Companies, Accounts
- "transaction" → Money transfers
- "account-holder" → Financial accounts
- "beneficiary" → Property ownership
- "business-partner" → Corporate structure

**Intelligence Questions Answered:**
1. Where does the money come from?
2. Where does it go?
3. Who controls the accounts?
4. What assets were purchased?
5. Who benefits financially?

---

## 10. Visualization Recommendations

### Node Visual Encoding

```typescript
interface NodeVisualEncoding {
  // Size: Importance/centrality
  size: 'small' | 'medium' | 'large' | 'x-large'

  // Color: Entity type
  fillColor: string  // Based on type

  // Border: Risk level
  borderColor: string    // Red (high risk), amber (medium), green (low)
  borderWidth: number    // Thicker = higher risk

  // Shape: Entity category
  shape: 'circle' | 'square' | 'diamond' | 'triangle'

  // Icon: Entity subtype
  icon: React.ReactNode

  // Opacity: Confidence level
  opacity: number  // 0.3 (low confidence) to 1.0 (high confidence)
}
```

### Edge Visual Encoding

```typescript
interface EdgeVisualEncoding {
  // Width: Relationship strength/frequency
  width: number  // 1-6px

  // Color: Relationship category
  color: string  // Based on category

  // Style: Relationship type
  lineDash: number[]  // Solid, dashed, dotted

  // Direction: Arrow configuration
  arrow: 'none' | 'single' | 'double'

  // Opacity: Temporal relevance
  opacity: number  // Fade old relationships

  // Animation: Active relationships
  animated: boolean  // Animated flow for recent activity
}
```

---

## 11. Conclusion

### Critical Next Steps

1. **Data Model Expansion**: Implement the enhanced entity and relationship types
2. **Temporal Framework**: Add time-based querying and historical snapshots
3. **Risk Framework**: Implement multi-factor risk assessment
4. **Timeline Integration**: Create bidirectional synchronization
5. **Advanced Analytics**: Add graph algorithms and pattern detection

### Success Metrics

- ✅ Graph can represent any investigation narrative
- ✅ Temporal context is always visible
- ✅ Risk assessment is multi-dimensional and justified
- ✅ Timeline and network are synchronized
- ✅ Investigators can answer "WHO, WHAT, WHERE, WHEN, WHY, HOW"
- ✅ Export supports multiple formats for reporting
- ✅ Performance remains smooth with 500+ nodes

### Long-Term Vision

The Citizens 360 graph should become the **single source of truth** for all intelligence operations, integrating:
- Real-time surveillance feeds
- Historical case data
- External databases (DMV, criminal records, etc.)
- AI-generated insights
- Collaborative investigator notes
- Automated anomaly detection
- Predictive analytics

---

**Document Prepared By:** Claude (Anthropic AI)
**Review Status:** Pending stakeholder review
**Next Review:** After Phase 1 implementation

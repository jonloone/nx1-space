# Geospatial Operational Intelligence Platform
## Open Source Strategy for Real-Time Situational Awareness

**Document Version:** 1.0.0
**Date:** 2025-10-10
**Inspiration:** Felt.com + Windward.ai
**Philosophy:** Open source tools, enterprise capabilities, fraction of the cost

---

## Executive Summary

This document outlines the strategy for building a **Geospatial Operational Intelligence Platform** - a real-time, collaborative mapping and monitoring system for industries requiring live situational awareness. Unlike traditional BI tools focused on historical analysis, this platform emphasizes:

- **Real-time monitoring** over batch reporting
- **Alert-driven** over query-driven
- **Action-oriented** over analysis-oriented
- **Collaboration-first** over single-user
- **Live data streams** over static datasets

**Target Industries:**
1. Maritime Operations (ship tracking, port management)
2. Logistics & Last-Mile Delivery (fleet monitoring, dispatch)
3. Emergency Response (incident tracking, resource deployment)
4. Field Services (technician dispatch, service coverage)
5. Smart Cities (traffic, transit, infrastructure)
6. Supply Chain (container tracking, warehouse operations)
7. Security & Border Control (surveillance, threat detection)
8. Utilities (outage management, crew dispatch)

**Open Source Advantage:**
- **$0 licensing fees** for core stack (deck.gl, PostgreSQL, PostGIS, Mapbox open styles)
- **Self-hosted option** - Deploy on your infrastructure
- **1/10th cost** of enterprise platforms ($29-99/user vs $300-800)
- **Extensible** - Plugin architecture for custom integrations
- **Transparent** - No vendor lock-in, open APIs

---

## Part 1: Platform Analysis - Felt & Windward

### 1.1 Felt.com - Collaboration-First Mapping

**Key UX Patterns:**

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ ☰ Felt | Project Name          👤 Share | •••        │ ← Minimal top bar
├─┬───────────────────────────────────────────────────────┤
│ │                                                       │
│L│                                                       │
│a│                                                       │
│y│                                                       │
│e│                                                       │
│r│              MAP (95% of screen)                     │
│s│                                                       │
│ │                                                       │
│+│                                                       │
│ │                                                       │
│ │                                                       │
└─┴───────────────────────────────────────────────────────┘
   ↑
   Collapsible 240px sidebar
```

**Core Principles:**
1. **Map-first** - 95% screen real estate for map
2. **Minimal chrome** - No visual clutter
3. **Slide-out panels** - Everything context-sensitive
4. **Real-time collaboration** - See others' cursors
5. **Drawing tools** - Sketching and annotation
6. **Comments** - Pin conversations to locations
7. **Version history** - Time travel through changes
8. **Mobile-first** - Works beautifully on tablets

**Interaction Model:**
- Click map → Select feature → Right panel slides in with details
- Draw → Annotation toolbar appears at bottom
- Comment → @ mention teammates → Real-time notification
- Share → Invite by email → Live collaboration starts

**What Makes It Great:**
- ✅ Zero learning curve (feels like Google Maps)
- ✅ Instant gratification (upload → visualize in seconds)
- ✅ Beautiful default styling
- ✅ Multiplayer experience (like Figma for maps)
- ✅ No GIS expertise required

### 1.2 Windward.ai - Maritime Intelligence

**Key UX Patterns:**

**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ ⚓ Windward | Alerts: 3  Status: Live     Admin | Help  │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┐                        │
│ │ ⚠️ ALERTS & EVENTS           │  Map (65%)             │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━  │                        │
│ │ 🔴 High Risk Vessel          │                        │
│ │ Port of Singapore · 2m ago   │                        │
│ │                              │                        │
│ │ 🟡 Route Deviation           │                        │
│ │ Indian Ocean · 15m ago       │                        │
│ ├──────────────────────────────┤                        │
│ │ 📊 ANALYTICS                 │                        │
│ │ ━━━━━━━━━━━━━━━━━━━━━━━━━━  │                        │
│ │ Risk Score: 73/100           │                        │
│ │ Vessels Tracked: 12,458      │                        │
│ └──────────────────────────────┘                        │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐│
│ │ Timeline: [████████████░░░░░░░░░░] ▶ | ⏸ | ⏮ | ⏭    ││
│ │ Oct 8, 2:00 PM ────────────────── Oct 10, 2:00 PM    ││
│ └──────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

**Core Principles:**
1. **Alert-driven** - Notifications front and center
2. **Risk-focused** - Scoring and threat assessment
3. **Timeline control** - Historical playback
4. **Dense information** - Operational control room aesthetic
5. **Live updates** - Real-time vessel positions
6. **Predictive** - Where will vessel be in 2 hours?
7. **Actionable** - Every alert has suggested action
8. **Dark theme** - 24/7 operations-friendly

**Interaction Model:**
- Alert fires → Notification badge → Click → Map zooms to incident
- Select vessel → Side panel shows: Risk score, route, history, AIS data
- Timeline scrubbing → Replay last 24 hours
- Draw zone → Get notified when vessels enter/exit
- Export report → PDF with map snapshots and analysis

**What Makes It Great:**
- ✅ Mission-critical reliability (Lloyd's approved)
- ✅ Actionable intelligence (not just data)
- ✅ Predictive capabilities (ML-powered)
- ✅ Compliance-ready (regulations built-in)
- ✅ 24/7 operations focus

### 1.3 Synthesis - Best of Both Worlds

**Our Platform Combines:**

| Feature | Felt Approach | Windward Approach | Our Implementation |
|---------|---------------|-------------------|-------------------|
| **Layout** | Minimal, clean | Dense, info-rich | Adaptive: Clean by default, dense on demand |
| **Collaboration** | Core feature | Limited | Real-time + commenting like Felt |
| **Alerts** | Not emphasized | Central feature | Alert center with priority system |
| **Timeline** | Version history | Playback control | Both: versions + temporal playback |
| **Mobile** | Excellent | Desktop-first | Mobile-optimized like Felt |
| **Complexity** | Low barrier | Domain-specific | Progressive disclosure |
| **Theme** | Light | Dark | Both, auto-switch for operations |
| **Speed** | Instant | Real-time | Optimized for both |

**Unique Differentiators:**
- ✅ **Open source core** (deck.gl, PostGIS, Mapbox GL)
- ✅ **Self-hosted option** (no SaaS lock-in)
- ✅ **AI-native** (NL queries, auto-insights)
- ✅ **Industry templates** (maritime, logistics, utilities, etc.)
- ✅ **Plugin marketplace** (community extensions)
- ✅ **1/10th the cost** ($29-99/user vs $300-800)

---

## Part 2: Operational Intelligence Layout Design

### 2.1 Primary Layout - "Mission Control"

**Philosophy:** Map takes center stage, everything else is contextual.

```
┌─────────────────────────────────────────────────────────────────┐
│ ☰ Logo | Project ▼    🔔 3  ⚡ Live  👥 5  🔍 Search  👤 User   │ ← 48px
├─┬───────────────────────────────────────────────────────────┬───┤
│ │                                                           │   │
│L│                                                           │ R │
│a│                                                           │ i │
│y│                                                           │ g │
│e│                     MAP CANVAS                            │ h │
│r│                     (deck.gl)                             │ t │
│s│                                                           │   │
│ │                     85% width                             │ P │
│&│                                                           │ a │
│ │                                                           │ n │
│D│                                                           │ e │
│a│                                                           │ l │
│t│                                                           │   │
│a│                                                           │ 0 │
│ │                                                           │ - │
│ │                                                           │ 4 │
│ │                                                           │ 0 │
│ │                                                           │ 0 │
│ │                                                           │ p │
│2│                                                           │ x │
│4│                                                           │   │
│0│                                                           │   │
│p│                                                           │   │
│x│                                                           │   │
│ │                                                           │   │
├─┴───────────────────────────────────────────────────────────┴───┤
│ ⏮ ⏸ ⏯ ⏭  Timeline: [████████░░░░░░░] Now  ⚙️ Settings      │ ← 60px
└─────────────────────────────────────────────────────────────────┘

Left Sidebar States:
[Collapsed: 48px] [Expanded: 240px] [Wide: 320px]

Right Panel States:
[Hidden: 0px] [Standard: 400px] [Wide: 600px]

Bottom Timeline:
[Hidden: 0px] [Visible: 60px] [Expanded: 200px with charts]
```

**Measurements:**
- Top bar: 48px (fixed)
- Left sidebar: 48px (collapsed) → 240px (normal) → 320px (wide)
- Right panel: 0px (hidden) → 400px (normal) → 600px (wide)
- Bottom bar: 0px (hidden) → 60px (slim) → 200px (expanded)
- Map: Fills remaining space (responsive)

**Interaction Zones:**

```
Map Overlay Elements (floating above map):

┌─ Top Left ──┐
│ Zoom +/-    │
│ 2D/3D toggle│
│ Compass     │
│ Fullscreen  │
└─────────────┘

┌─ Top Right ─┐
│ Basemap ▼   │
│ Measure     │
│ Draw        │
│ Screenshot  │
└─────────────┘

┌─ Bottom Left ┐
│ Scale        │
│ Coordinates  │
│ Attribution  │
└──────────────┘

┌─ Bottom Right ┐
│ Live indicator│
│ Last update   │
│ Data quality  │
└───────────────┘
```

### 2.2 Left Sidebar - Data & Layers

**Three Tabs:**

```
┌────────────────────────┐
│ 📊 Data | 🗺️ Layers | ⚡ Live │
├────────────────────────┤
│                        │
│ [TAB CONTENT]          │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
│                        │
└────────────────────────┘
```

#### **📊 Data Tab**

```
┌─ Data Sources ──────────────────┐
│                                 │
│ ┌─ Connected ─────────────────┐ │
│ │ 🟢 Fleet Tracker (Live)     │ │
│ │    12,458 vehicles          │ │
│ │    Updated 2s ago           │ │
│ │                             │ │
│ │ 🟢 Weather API (Live)       │ │
│ │    US & Europe              │ │
│ │    Updated 5m ago           │ │
│ │                             │ │
│ │ 🔵 Customer Locations       │ │
│ │    8,234 addresses          │ │
│ │    Static                   │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Available ─────────────────┐ │
│ │ + PostgreSQL                │ │
│ │ + Upload File               │ │
│ │ + Google Sheets             │ │
│ │ + REST API                  │ │
│ │ + WebSocket Stream          │ │
│ └─────────────────────────────┘ │
│                                 │
│ [+ Add Data Source]             │
└─────────────────────────────────┘
```

**Key Features:**
- ✅ Live status indicators (🟢 green = live, 🔵 blue = static)
- ✅ Last update timestamp
- ✅ Record count
- ✅ Quick actions (refresh, disconnect, settings)
- ✅ Easy add new source

#### **🗺️ Layers Tab**

```
┌─ Layers ────────────────────────┐
│ [All ▼] [+ Add Layer]           │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👁️ 🔒 Vehicles (12,458)      │ │ ← Always on top
│ │    Colored by: Status       │ │
│ │    Size: Default            │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👁️ ⋮⋮ Routes (234)           │ │ ← Drag to reorder
│ │    Width: 3px               │ │
│ │    Color: #FF6B35           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👁️ ⋮⋮ Delivery Zones (50)   │ │
│ │    Fill: Semi-transparent   │ │
│ │    Stroke: 2px              │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 👀 ⋮⋮ Weather Radar         │ │ ← Hidden layer
│ │    Opacity: 60%             │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Suggested ─────────────────┐ │
│ │ 💡 Add heatmap for density  │ │
│ │ 💡 Show vehicle trails      │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Layer Actions (hover/right-click):**
- 👁️ Toggle visibility
- ⚙️ Style settings
- 🔍 Zoom to layer
- 📤 Export layer
- 🗑️ Remove layer
- 🔒 Lock position
- 📊 View data table

**Smart Suggestions:**
- Based on data type and current view
- "Your vehicles have speed data, add speed gradient?"
- "Cluster 12k points for better performance"

#### **⚡ Live Tab - Real-time Streams**

```
┌─ Live Data Streams ─────────────┐
│                                 │
│ ┌─ Active Streams ────────────┐ │
│ │ 🟢 Fleet Telemetry          │ │
│ │    WebSocket                │ │
│ │    127 msg/sec              │ │
│ │    Latency: 45ms            │ │
│ │    [⏸ Pause] [⚙️]           │ │
│ │                             │ │
│ │ 🟢 Weather Updates          │ │
│ │    SSE                      │ │
│ │    2 msg/min                │ │
│ │    Latency: 120ms           │ │
│ │    [⏸ Pause] [⚙️]           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Stream Health ─────────────┐ │
│ │ Connection: ●●●●● Excellent │ │
│ │ Throughput: ████░ 80%       │ │
│ │ Buffer: ███░░ 60% (12 sec)  │ │
│ │                             │ │
│ │ [Advanced Settings]         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─ Playback Control ──────────┐ │
│ │ ⏮ ⏸ ⏯ ⏭                     │ │
│ │ Speed: [1x ▼]               │ │
│ │ [●] Record Stream           │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

**Key Features:**
- Live stream monitoring
- Performance metrics
- Pause/resume streams
- Record for playback
- Buffer management
- Connection quality indicator

### 2.3 Right Panel - Context & Details

**Trigger Conditions:**
1. Click on map feature → Feature details
2. Click alert → Alert details
3. Click layer → Layer settings
4. Click analysis tool → Tool panel
5. Click comment → Thread view

```
┌─ Feature Details ───────────────────────────────┐
│ ✕                                    [⋯ Actions]│
│                                                  │
│ ┌──────────────────────────────────────────────┐│
│ │  🚛 Vehicle #1247                            ││
│ │  Status: En Route                            ││
│ │  Last Update: 2 seconds ago                  ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌─ Live Metrics ──────────────────────────────┐│
│ │ Speed: 65 mph  📈 +2 mph                    ││
│ │ Heading: NE (42°)                           ││
│ │ ETA: 2:45 PM (23 min)                       ││
│ │ Fuel: 67% ████████░░                        ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌─ Route Info ────────────────────────────────┐│
│ │ Origin: Warehouse A                         ││
│ │ Destination: Customer #8234                 ││
│ │ Stops: 0 / 3 completed                      ││
│ │ Distance: 47 mi (23 mi remaining)           ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌─ History ───────────────────────────────────┐│
│ │ [Last 24h ▼]                                ││
│ │                                              ││
│ │ 📊 Speed Chart                              ││
│ │ [Time series graph]                         ││
│ │                                              ││
│ │ 📍 Location History                         ││
│ │ 2:15 PM - Warehouse A (departed)            ││
│ │ 2:18 PM - Highway 101 on-ramp              ││
│ │ 2:22 PM - Current location                 ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌─ Actions ───────────────────────────────────┐│
│ │ [📞 Contact Driver]                         ││
│ │ [📝 Add Note]                               ││
│ │ [⚠️ Report Issue]                           ││
│ │ [📍 Set Geofence]                           ││
│ └──────────────────────────────────────────────┘│
│                                                  │
│ ┌─ Properties ────────────────────────────────┐│
│ │ Driver: John Smith                          ││
│ │ Vehicle Type: Box Truck                     ││
│ │ License: ABC-1234                           ││
│ │ Max Speed: 75 mph                           ││
│ │ Weight: 14,000 lbs                          ││
│ └──────────────────────────────────────────────┘│
└──────────────────────────────────────────────────┘
```

**Panel Modes:**

1. **Feature Details** (shown above)
2. **Alert Details** (incident analysis)
3. **Layer Style** (color, size, filters)
4. **Analysis Results** (spatial query output)
5. **Comment Thread** (collaboration)
6. **Data Table** (spreadsheet view)

### 2.4 Top Navigation Bar

```
┌──────────────────────────────────────────────────────────────────┐
│ ☰  🗺️ OpIntel  Project: Fleet Ops ▼  | 🔔 3  ⚡ Live  👥 5  🔍  👤│
└──────────────────────────────────────────────────────────────────┘
 ↑   ↑          ↑                        ↑    ↑      ↑    ↑   ↑
 │   │          │                        │    │      │    │   User
 │   │          │                        │    │      │    Search
 │   │          │                        │    │      Collaborators (5 online)
 │   │          │                        │    Live status indicator
 │   │          │                        Notifications (3 unread)
 │   │          Project selector
 │   Logo/Home
 Menu (collapse sidebar)
```

**Notification Center (click 🔔):**

```
┌─ Notifications ──────────────────────────────┐
│ [All] [Alerts] [Comments] [System]          │
├──────────────────────────────────────────────┤
│ 🔴 High Priority Alert · 2m ago             │
│    Vehicle #1247 speeding (82 mph)          │
│    [View on Map] [Dismiss]                  │
│                                              │
│ 💬 Comment · 5m ago                         │
│    @you: Check this route deviation         │
│    [Reply] [View]                           │
│                                              │
│ 🟡 Medium Alert · 15m ago                   │
│    Vehicle #8834 delayed (ETA +30 min)      │
│    [View] [Snooze]                          │
│                                              │
│ 📊 Report Ready · 1h ago                    │
│    Daily fleet summary completed            │
│    [Download] [View]                        │
└──────────────────────────────────────────────┘
```

**Collaborators Panel (click 👥):**

```
┌─ Active Users ───────────────────────────────┐
│                                              │
│ 🟢 Sarah Chen (You)                         │
│    Viewing: Fleet Operations                │
│                                              │
│ 🟢 Mike Torres                              │
│    Editing: Route #234                      │
│    [Follow View]                            │
│                                              │
│ 🟢 Anna Kim                                 │
│    Viewing: Vehicle #1247                   │
│    [Follow View]                            │
│                                              │
│ 🟠 Jake Wilson (Idle - 5m)                  │
│                                              │
│ 🔴 Alex Brown (Offline)                     │
│    Last seen: 2h ago                        │
│                                              │
│ [+ Invite Team Members]                     │
└──────────────────────────────────────────────┘
```

### 2.5 Bottom Timeline Control

**Collapsed State (60px):**
```
┌────────────────────────────────────────────────────────────┐
│ ⏮ ⏸ ⏯ ⏭  [████████████████░░░░░░] Live  ⚙️ ↕️           │
│ Oct 10, 12:00 PM ──────────────────── Oct 10, 2:30 PM     │
└────────────────────────────────────────────────────────────┘
```

**Expanded State (200px):**
```
┌────────────────────────────────────────────────────────────┐
│ ⏮ ⏸ ⏯ ⏭   Speed: [1x ▼]   Range: [Last 24h ▼]  ↕️      │
│                                                            │
│ Timeline Scrubber:                                         │
│ ├─────────────●────────────────────────────┤               │
│ 12:00 PM      2:22 PM (current)       2:30 PM             │
│                                                            │
│ Event Markers:                                             │
│ 📍Departure  🚨Alert  💬Comment  ⭐Bookmark                │
│                                                            │
│ Density Chart (events over time):                         │
│ │█│█│││█│█│█│█│││█│                                        │
│ └─┴─┴┴┴─┴─┴─┴─┴┴┴─┴                                        │
└────────────────────────────────────────────────────────────┘
```

**Timeline Features:**
- Scrub through time (drag slider)
- Play/pause animation
- Speed control (0.5x, 1x, 2x, 5x, 10x)
- Event markers (alerts, comments, milestones)
- Density visualization
- Bookmarks (save interesting moments)
- Loop mode (repeat time range)
- Export animation (video/GIF)

### 2.6 Mobile/Tablet Layout

**Tablet (768px+):**
- Full layout with collapsible sidebars
- Touch-optimized controls (larger tap targets)
- Swipe gestures (swipe right = open sidebar, swipe left = close)

**Mobile (< 768px):**
```
┌─────────────────┐
│ ☰ 🗺️ OpIntel 🔔│ ← 56px header
├─────────────────┤
│                 │
│                 │
│                 │
│      MAP        │
│   (Full screen) │
│                 │
│                 │
│                 │
├─────────────────┤
│ 🗂️ 🗺️ ⚡ 👥 ⚙️  │ ← Bottom tab bar (60px)
└─────────────────┘

Bottom Tabs:
- 🗂️ Data & Layers
- 🗺️ Map (default)
- ⚡ Alerts
- 👥 Team
- ⚙️ Settings

Swipe up on tabs = Full screen sheet
Swipe down = Dismiss sheet
```

**Mobile Interactions:**
- Long press → Context menu
- Pinch to zoom
- Two-finger rotate
- Tap → Select feature → Bottom sheet slides up
- Double tap → Zoom in
- Swipe between bottom tabs

---

## Part 3: Real-Time Data Architecture

### 3.1 Data Flow for Operational Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATA SOURCES                               │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │ WebSocket   │    │ REST API    │    │ Database    │
  │ (Live)      │    │ (Polling)   │    │ (Historical)│
  └─────────────┘    └─────────────┘    └─────────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
         ┌──────────────────────────────────────────┐
         │     BACKEND (Optional - can be client)   │
         │  ┌────────────────────────────────────┐  │
         │  │ Stream Processor                   │  │
         │  │ - Validation                       │  │
         │  │ - Transformation                   │  │
         │  │ - Aggregation                      │  │
         │  │ - Alert Engine                     │  │
         │  └────────────────────────────────────┘  │
         │  ┌────────────────────────────────────┐  │
         │  │ PostgreSQL + PostGIS + TimescaleDB │  │
         │  │ - Current state                    │  │
         │  │ - Historical time-series           │  │
         │  │ - Spatial indexes                  │  │
         │  └────────────────────────────────────┘  │
         └──────────────────────────────────────────┘
                              │
                              │ WebSocket / SSE
                              │
                              ▼
         ┌──────────────────────────────────────────┐
         │          FRONTEND CLIENT                 │
         │  ┌────────────────────────────────────┐  │
         │  │ State Management (Zustand)         │  │
         │  │ - Live data buffer (IndexedDB)     │  │
         │  │ - Layer state                      │  │
         │  │ - UI state                         │  │
         │  └────────────────────────────────────┘  │
         │  ┌────────────────────────────────────┐  │
         │  │ deck.gl Rendering                  │  │
         │  │ - GPU-accelerated                  │  │
         │  │ - 60 FPS updates                   │  │
         │  │ - LOD optimization                 │  │
         │  └────────────────────────────────────┘  │
         └──────────────────────────────────────────┘
```

### 3.2 WebSocket Protocol

**Connection:**
```typescript
const ws = new WebSocket('wss://api.example.com/stream')

ws.onopen = () => {
  // Subscribe to specific data feeds
  ws.send(JSON.stringify({
    type: 'subscribe',
    channels: ['fleet.vehicles', 'fleet.alerts'],
    filters: {
      region: 'us-west',
      priority: ['high', 'critical']
    }
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)

  switch (message.type) {
    case 'vehicle_update':
      updateVehiclePosition(message.data)
      break
    case 'alert':
      showNotification(message.data)
      break
    case 'batch':
      processBatchUpdate(message.data)
      break
  }
}
```

**Message Format:**
```json
{
  "type": "vehicle_update",
  "timestamp": "2025-10-10T14:22:35.123Z",
  "data": {
    "id": "vehicle-1247",
    "position": {
      "type": "Point",
      "coordinates": [-118.2437, 34.0522]
    },
    "properties": {
      "speed": 65,
      "heading": 42,
      "status": "en_route",
      "fuel_level": 67,
      "eta": "2025-10-10T14:45:00Z"
    }
  }
}
```

### 3.3 Client-Side Buffering

**Strategy:**
```typescript
// Buffer for smooth rendering
class LiveDataBuffer {
  private buffer: Map<string, SpatialEntity[]> = new Map()
  private maxSize = 10000 // Max entities per layer
  private maxAge = 3600000 // 1 hour in ms

  add(layerId: string, entity: SpatialEntity) {
    if (!this.buffer.has(layerId)) {
      this.buffer.set(layerId, [])
    }

    const layerBuffer = this.buffer.get(layerId)!

    // Remove old entities
    const now = Date.now()
    const filtered = layerBuffer.filter(e =>
      now - e.metadata.timestamp.getTime() < this.maxAge
    )

    // Add new entity
    filtered.push(entity)

    // Limit size
    if (filtered.length > this.maxSize) {
      filtered.shift() // Remove oldest
    }

    this.buffer.set(layerId, filtered)
  }

  get(layerId: string): SpatialEntity[] {
    return this.buffer.get(layerId) || []
  }

  // Persist to IndexedDB for offline access
  async persist() {
    const db = await openDB('operational-intelligence')
    const tx = db.transaction('buffers', 'readwrite')

    for (const [layerId, entities] of this.buffer) {
      await tx.store.put({ layerId, entities, timestamp: Date.now() })
    }

    await tx.done
  }
}
```

### 3.4 Alert Engine

**Alert Rules:**
```typescript
interface AlertRule {
  id: string
  name: string
  condition: AlertCondition
  priority: 'low' | 'medium' | 'high' | 'critical'
  actions: AlertAction[]
  enabled: boolean
}

type AlertCondition =
  | { type: 'speed_threshold', value: number }
  | { type: 'geofence_exit', zoneId: string }
  | { type: 'eta_delay', minutes: number }
  | { type: 'idle_time', minutes: number }
  | { type: 'route_deviation', distance: number }
  | { type: 'custom_sql', query: string }

type AlertAction =
  | { type: 'notification', message: string }
  | { type: 'email', recipients: string[] }
  | { type: 'sms', phoneNumbers: string[] }
  | { type: 'webhook', url: string }
  | { type: 'highlight_map', duration: number }

// Example rule
const speedingAlert: AlertRule = {
  id: 'speeding-1',
  name: 'Speed Limit Violation',
  condition: { type: 'speed_threshold', value: 75 },
  priority: 'high',
  actions: [
    { type: 'notification', message: 'Vehicle {id} speeding at {speed} mph' },
    { type: 'highlight_map', duration: 60000 },
    { type: 'email', recipients: ['supervisor@example.com'] }
  ],
  enabled: true
}
```

**Alert Evaluation:**
```typescript
class AlertEngine {
  private rules: AlertRule[] = []

  evaluate(entity: SpatialEntity): Alert[] {
    const alerts: Alert[] = []

    for (const rule of this.rules) {
      if (!rule.enabled) continue

      if (this.matchesCondition(entity, rule.condition)) {
        alerts.push(this.createAlert(entity, rule))
      }
    }

    return alerts
  }

  private matchesCondition(entity: SpatialEntity, condition: AlertCondition): boolean {
    switch (condition.type) {
      case 'speed_threshold':
        return (entity.properties.speed || 0) > condition.value

      case 'geofence_exit':
        const zone = this.getGeofence(condition.zoneId)
        return !this.isWithinZone(entity.geometry, zone)

      case 'eta_delay':
        const delay = this.calculateDelay(entity)
        return delay > condition.minutes

      // ... other conditions
    }
  }
}
```

---

## Part 4: Open Source Cost Advantage

### 4.1 Technology Stack (100% Open Source)

**Frontend:**
```typescript
{
  "dependencies": {
    // Core framework - FREE
    "react": "^19.1.0",
    "next": "^15.4.5",

    // Mapping - FREE
    "deck.gl": "^9.0.0",              // Apache 2.0
    "mapbox-gl": "^3.0.0",            // BSD 3-Clause
    "maplibre-gl": "^4.0.0",          // BSD 3-Clause (Mapbox alternative)

    // UI Components - FREE
    "@radix-ui/react-*": "latest",    // MIT (shadcn/ui base)
    "tailwindcss": "^3.4.0",          // MIT

    // State & Data - FREE
    "zustand": "^4.5.0",              // MIT
    "tanstack/react-table": "^8.0.0", // MIT
    "tanstack/react-query": "^5.0.0", // MIT

    // Charts - FREE
    "recharts": "^2.12.0",            // MIT
    "@visx/*": "^3.10.0",             // MIT

    // Spatial Libraries - FREE
    "@turf/turf": "^6.5.0",           // MIT (spatial operations)
    "h3-js": "^4.1.0",                // Apache 2.0 (Uber H3)

    // Real-time - FREE
    "socket.io-client": "^4.7.0",     // MIT
    "ws": "^8.16.0"                   // MIT
  }
}
```

**Total Frontend License Costs: $0**

**Backend (Optional - Self-Hosted):**
```yaml
services:
  # Database - FREE
  postgres:
    image: postgis/postgis:16-3.4    # PostgreSQL + PostGIS
    # License: PostgreSQL License (MIT-like)

  # Time-series extension - FREE
  timescaledb:
    image: timescale/timescaledb:latest-pg16
    # License: Apache 2.0 (Community Edition)

  # API Layer - FREE
  api:
    build: ./api
    # Next.js API routes or Express.js (MIT)

  # Real-time messaging - FREE (optional)
  redis:
    image: redis:7-alpine
    # License: BSD 3-Clause

  # Message queue - FREE (optional)
  rabbitmq:
    image: rabbitmq:3-management
    # License: MPL 2.0
```

**Total Backend License Costs: $0**

**Infrastructure Costs (AWS Example):**
```
Monthly costs for 100 users:

EC2 (t3.xlarge): $150/month
RDS PostgreSQL (db.t3.large): $170/month
S3 Storage (100 GB): $3/month
CloudFront CDN: $20/month
Data Transfer: $50/month

Total Infrastructure: ~$400/month = $4/user/month
```

### 4.2 Cost Comparison

**Our Platform (Open Source):**
```
Free Tier: $0/user/month
  - Self-hosted
  - Unlimited users
  - All features
  - Community support

Pro Tier: $29/user/month
  - Managed hosting
  - Automatic updates
  - Email support
  - 99.9% SLA

Enterprise: $99/user/month
  - Dedicated infrastructure
  - SSO, advanced security
  - 24/7 support
  - Custom integrations
```

**Windward.ai (Proprietary):**
```
Estimated: $500-800/user/month
  - Closed source
  - Maritime-specific
  - Long-term contracts
  - Limited customization
```

**CARTO (Proprietary):**
```
Builder: $149/user/month
Enterprise: $299+/user/month
  - Closed source
  - Vendor lock-in
  - Usage limits
  - Expensive integrations
```

**ESRI ArcGIS (Proprietary):**
```
Creator: $500/user/year = $42/month
Professional: $8,700/user/year = $725/month
  - Desktop + Cloud
  - Complex licensing
  - GIS experts only
  - Expensive ecosystem
```

**Cost Savings Analysis:**

| Users | Windward | CARTO | ESRI Pro | Our Pro | Savings vs Windward |
|-------|----------|-------|----------|---------|---------------------|
| 10    | $8,000   | $2,990| $7,250   | $290    | **96% savings**     |
| 50    | $40,000  | $14,950|$36,250   | $1,450  | **96% savings**     |
| 100   | $80,000  | $29,900|$72,500   | $2,900  | **96% savings**     |
| 500   | $400,000 | $149,500|$362,500 | $14,500 | **96% savings**     |

**Self-Hosted (Free Tier) is $0 for any number of users!**

### 4.3 Open Source Advantages

**1. No Vendor Lock-In**
- Export data anytime (open formats)
- Switch hosting providers freely
- Customize without limits
- Fork and modify source code

**2. Community Innovation**
- Plugin marketplace (community extensions)
- Open issue tracking
- Public roadmap
- Contribution opportunities

**3. Transparency**
- Inspect all code
- Security audits
- No hidden fees
- Clear pricing

**4. Flexibility**
- Deploy anywhere (cloud, on-premise, edge)
- Integrate with anything (open APIs)
- Customize deeply (access to source)
- Scale infinitely (horizontal scaling)

**5. Future-Proof**
- No discontinuation risk
- Community can maintain
- Standards-based (GeoJSON, MVT, WMS, etc.)
- Portable data

---

## Part 5: MVP Demo - "Last-Mile Delivery Command Center"

### 5.1 Demo Scenario

**Industry:** Last-Mile Logistics
**Use Case:** Real-time fleet monitoring and dispatch optimization
**Persona:** Operations manager at delivery company
**Duration:** 7 minutes

**Story:**
"Monitor 200 delivery vehicles in real-time, respond to delays, optimize routes, and ensure on-time delivery performance."

### 5.2 Demo Flow

#### **Act 1: Live Fleet Monitoring (2 min)**

**Scene 1: Opening (30 sec)**
```
User lands on platform
→ Clean map interface loads
→ "Last-Mile Delivery" template auto-selected
→ Map shows city (San Francisco)
→ 200 vehicle icons appear (animated fade-in)
→ Color-coded by status:
   🟢 Green = On Time (150)
   🟡 Yellow = Delayed <15min (35)
   🔴 Red = Delayed >15min (15)
```

**Scene 2: Real-Time Updates (30 sec)**
```
Vehicles move across map (smooth animation)
→ Speed indicator shows "127 updates/sec"
→ Click on green vehicle (#127)
→ Right panel slides in with details:
   - Driver: Sarah Chen
   - Status: On Route
   - Speed: 35 mph
   - Next Stop: 123 Market St (ETA 8 min)
   - Progress: 4/7 deliveries complete
→ Mini-chart shows speed over last hour
→ Green path shows route taken
→ Blue dotted line shows planned route ahead
```

**Scene 3: Alert Triggers (1 min)**
```
🔴 Alert notification appears (top-right)
→ "Vehicle #089 - Delayed >15 min"
→ Click notification
→ Map zooms to vehicle #089
→ Right panel shows:
   - Current delay: 18 minutes
   - Reason: Traffic jam detected
   - 3 remaining deliveries at risk
   - Suggested action: "Reroute via Highway 101"
→ Click "Apply Reroute"
→ New route calculates and displays
→ Updated ETA: 2:45 PM (+5 min improvement)
→ Alert auto-resolves to yellow
→ Notification: "Reroute successful"
```

#### **Act 2: Spatial Analysis & Optimization (2 min)**

**Scene 4: Geofence Alert (30 sec)**
```
Draw circle on map around downtown
→ "Create Geofence" dialog appears
→ Name: "Downtown Zone"
→ Alert rule: "Notify when vehicle enters"
→ Click "Save"
→ Purple circle appears on map
→ Vehicle #156 crosses boundary
→ Immediate notification: "Vehicle #156 entered Downtown Zone"
→ Auto-tags delivery as "downtown delivery" for analytics
```

**Scene 5: Heatmap Analysis (1 min)**
```
Click "Add Layer" button
→ Select "Delivery Density Heatmap"
→ Heatmap layer fades in
→ Shows concentration of deliveries
→ Red hotspots: High delivery areas (downtown, SOMA)
→ Blue coldspots: Low delivery areas (residential outskirts)
→ Toggle between heatmap and vehicles
→ AI Insight appears:
   💡 "Downtown has 3x higher delivery density.
       Consider dedicated downtown fleet."
→ Click insight → Generates recommendation report
```

**Scene 6: Timeline Playback (30 sec)**
```
Expand timeline control (bottom)
→ Scrub back 2 hours
→ Map rewinds showing vehicle paths
→ See morning rush hour traffic patterns
→ Identify bottleneck on Bay Bridge
→ Event markers show:
   📍 Dispatch (8:00 AM)
   🚨 Traffic Alert (9:15 AM)
   ✅ First Delivery (9:30 AM)
→ Click "Play" → Fast-forward at 10x speed
→ Watch fleet disperse across city
→ Return to "Live" mode
```

#### **Act 3: Collaboration & Decision Making (2 min)**

**Scene 7: Team Collaboration (1 min)**
```
Click collaborators icon (👥)
→ Shows 3 team members online:
   🟢 Mike Torres (Dispatcher)
   🟢 Anna Kim (Route Planner)
   🟢 You (Operations Manager)
→ Mike drops a comment pin on vehicle #089:
   💬 "This vehicle keeps getting delayed on this route"
→ Notification badge appears
→ Click comment
→ Reply: "@Mike Let's permanently adjust this route"
→ Anna responds: "I'll optimize the route for tomorrow"
→ Tag vehicle for route optimization
→ Comment thread stays attached to vehicle
```

**Scene 8: Dashboard View (1 min)**
```
Click "Dashboard" button
→ Grid layout appears with 6 widgets:

┌─────────────────┬─────────────────┐
│  Map            │ Performance KPIs│
│  (Live Fleet)   │ On-time: 92%    │
│                 │ Avg Speed: 28mph│
│                 │ Deliveries: 847 │
└─────────────────┴─────────────────┤
│  Delivery Status Chart            │
│  [Bar chart by hour]              │
├───────────────────────────────────┤
│  Top Delays (Table)               │
│  Vehicle | Delay | Reason         │
│  #089    | 18min | Traffic        │
│  #156    | 12min | Weather        │
└───────────────────────────────────┘

→ Charts update in real-time
→ Click bar in chart → Filters map to that hour
→ Map highlights vehicles from selected time
→ Cross-filtering demonstration
```

#### **Act 4: Export & AI Insights (1 min)**

**Scene 9: AI Summary (30 sec)**
```
AI Insights panel (bottom-left) shows:

🤖 Real-Time Insights

🔴 Critical (2)
"15 vehicles at risk of missing delivery windows.
 Recommend immediate rerouting."
 [Take Action]

🟡 High Priority (5)
"Traffic congestion on US-101 causing 12-minute
 average delay. Consider alternate routes."
 [View Details]

💡 Optimization (3)
"Downtown route efficiency is 23% below optimal.
 AI suggests route consolidation could save 45min/day."
 [Optimize Routes]

📊 Daily Summary
"Today's performance: 92% on-time (↑3% vs yesterday)
 847 deliveries completed, 53 in progress."

→ Click "Optimize Routes"
→ AI generates 3 optimized route scenarios
→ Shows projected time savings
→ One-click apply
```

**Scene 10: Share & Export (30 sec)**
```
Click "Share" button
→ Options appear:
   📱 Share Live Link (real-time view)
   📸 Export Screenshot
   📊 Export Report (PDF)
   🎥 Record Animation
   🔗 Embed Code

→ Click "Share Live Link"
→ Generate URL with permissions:
   ☑ View only
   ☐ Edit
   ☐ Comment
   ⏰ Expires in: 7 days

→ Copy link → Send to stakeholder
→ Click "Export Report"
→ PDF generates with:
   - Current map view
   - Performance metrics
   - Top insights
   - Delivery summary table
→ Download completes
```

### 5.3 Demo Highlights

**Features Demonstrated:**

✅ **Real-Time Monitoring**
- Live vehicle tracking (200 vehicles)
- Smooth 60 FPS updates
- Color-coded status (green/yellow/red)
- 127 updates/second

✅ **Alerts & Notifications**
- Automated delay detection
- Traffic-based rerouting
- Geofence alerts
- Priority-based notifications

✅ **Spatial Analysis**
- Geofence creation (draw on map)
- Delivery density heatmap
- Hotspot identification
- Route optimization

✅ **Temporal Features**
- Timeline scrubbing
- Historical playback
- Speed controls (1x, 10x)
- Event markers

✅ **Collaboration**
- Multi-user presence
- Comment threads
- @mentions
- Live cursor tracking

✅ **Dashboard & Analytics**
- Drag-drop widgets
- Real-time charts
- Cross-filtering
- KPI cards

✅ **AI Insights**
- Auto-generated recommendations
- Anomaly detection
- Predictive ETA
- Route optimization

✅ **Export & Sharing**
- Live link sharing
- PDF reports
- Screenshot capture
- Embed code

### 5.4 Technical Stack for Demo

**Data:**
```javascript
// Simulated live fleet data
const generateFleetData = () => {
  return Array.from({ length: 200 }, (_, i) => ({
    id: `vehicle-${i}`,
    position: randomPointInSF(),
    speed: randomBetween(0, 45),
    heading: randomBetween(0, 360),
    status: weightedRandom(['on_time', 'delayed_minor', 'delayed_major']),
    deliveriesComplete: randomBetween(0, 7),
    deliveriesTotal: 7,
    driver: randomDriver(),
    eta: futureTime(randomBetween(5, 30))
  }))
}

// WebSocket simulation
setInterval(() => {
  fleetData.forEach(vehicle => {
    // Simulate movement
    vehicle.position = moveAlongRoute(vehicle.position, vehicle.speed)
    vehicle.speed += randomBetween(-2, 2)

    // Emit update
    ws.send(JSON.stringify({
      type: 'vehicle_update',
      data: vehicle
    }))
  })
}, 1000) // 1 update per second per vehicle = 200 updates/sec
```

**Frontend:**
```tsx
// Real-time layer
<IconLayer
  id="fleet-vehicles"
  data={liveVehicles}
  getPosition={d => d.position}
  getIcon={d => 'truck'}
  getColor={d => getStatusColor(d.status)}
  getSize={20}
  updateTriggers={{
    getPosition: liveUpdateTimestamp,
    getColor: liveUpdateTimestamp
  }}
  transitions={{
    getPosition: 1000 // 1 second smooth transition
  }}
/>

// Heatmap layer
<HeatmapLayer
  id="delivery-density"
  data={deliveryPoints}
  getPosition={d => d.position}
  getWeight={d => 1}
  radiusPixels={50}
  intensity={2}
  threshold={0.05}
/>

// Geofence layer
<PolygonLayer
  id="geofences"
  data={geofences}
  getPolygon={d => d.coordinates}
  getFillColor={[128, 0, 255, 50]}
  getLineColor={[128, 0, 255, 200]}
  getLineWidth={3}
  pickable={true}
/>
```

**Deployment:**
```bash
# Build optimized production bundle
npm run build

# Deploy to Vercel (free tier)
vercel deploy --prod

# Or self-host with Docker
docker build -t opintel-demo .
docker run -p 3000:3000 opintel-demo

# Demo URL: https://demo.opintel.com
```

**Performance Targets:**
- Initial load: < 2 seconds
- Time to interactive: < 3 seconds
- Frame rate: 60 FPS
- Update latency: < 100ms
- Supports: 10,000+ simultaneous points
- Memory usage: < 500MB

---

## Part 6: Implementation Roadmap

### Phase 0: Foundation (2 weeks)

**Week 1: Setup & Architecture**
```bash
# 1. Install shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add card button sheet tabs dialog separator

# 2. Create new layout branch
git checkout -b feature/opintel-layout

# 3. New folder structure
mkdir -p components/opintel/{panels,controls,overlays}
mkdir -p lib/opintel/{connectors,engines,templates}
```

**Tasks:**
- ✅ Install and configure shadcn/ui
- ✅ Create new layout components (sidebar, panels, timeline)
- ✅ Set up Zustand stores (map state, layer state, alert state)
- ✅ Design generic `SpatialEntity` data model
- ✅ Create template system architecture

**Deliverables:**
- New layout working with existing map
- Collapsible sidebars functional
- Timeline control in place (static)
- Right panel slide-in working

### Phase 1: Core Platform (4 weeks)

**Week 1: Data Layer**
- File upload (CSV, GeoJSON)
- Data source connector abstraction
- Auto-detect geometry fields
- Data preview component
- IndexedDB persistence

**Week 2: Visualization Engine**
- Layer factory pattern
- Style editor (color, size, opacity)
- 10+ deck.gl layer types
- Layer visibility toggles
- Layer reordering (drag-drop)

**Week 3: Real-Time Foundation**
- WebSocket connector
- Live data buffer
- Update animation (smooth transitions)
- Connection status indicator
- Performance monitoring

**Week 4: Filtering & Interaction**
- Filter panel (numeric, categorical)
- Spatial filters (draw on map)
- Feature click → Detail panel
- Hover tooltips
- Multi-select

**Deliverables:**
- Upload CSV → Visualize in < 30 seconds
- 10+ layer types working
- Style any layer attribute
- Filter by any attribute
- Click features for details
- 60 FPS with 10,000 points

### Phase 2: Operational Features (4 weeks)

**Week 5: Timeline & Playback**
- Timeline scrubber UI
- Historical data storage (IndexedDB)
- Playback controls (play/pause/speed)
- Event markers
- Animation recording

**Week 6: Alerts & Notifications**
- Alert rule builder
- Real-time alert evaluation
- Notification center
- Alert priority system
- Alert actions (email, webhook, etc.)

**Week 7: Collaboration (Basic)**
- User presence (WebSocket)
- Cursor tracking
- Comment pins on map
- @mentions
- Activity log

**Week 8: Dashboard Builder**
- Widget palette
- Grid layout (react-grid-layout)
- Map widget
- Chart widgets (4 types)
- Stats cards

**Deliverables:**
- Timeline playback working
- Alert system functional
- Real-time collaboration (2+ users)
- Basic dashboard creation
- Live data streams supported

### Phase 3: Intelligence & Analysis (4 weeks)

**Week 9: Spatial Analysis Tools**
- Buffer tool
- Intersection tool
- Spatial join
- Nearest neighbors
- Measurement tools

**Week 10: AI Integration**
- Natural language queries (Vultr LLM)
- AI chat for data questions
- Auto-suggestions
- Insight generation
- Pattern detection

**Week 11: Advanced Analytics**
- Heatmap aggregation
- Clustering (DBSCAN)
- Hotspot detection
- Predictive ETA
- Route optimization

**Week 12: Templates & Presets**
- Template system
- 5 industry templates:
  - Last-mile delivery
  - Maritime tracking
  - Field services
  - Emergency response
  - Fleet management
- Sample datasets

**Deliverables:**
- 5+ spatial analysis tools
- AI chat working
- Auto-insights panel
- Industry templates
- MVP demo-ready

### Phase 4: Production & Scale (4 weeks)

**Week 13: Backend (Optional)**
- Supabase setup (Postgres + PostGIS)
- Auth system
- API layer (tRPC)
- Data storage
- User management

**Week 14: Performance**
- Vector tiles for large data
- GPU aggregation
- LOD optimization
- Caching strategy
- Bundle optimization

**Week 15: Enterprise Features**
- SSO integration
- Team management
- Permission system
- Audit logging
- White-label branding

**Week 16: Polish & Launch**
- Mobile optimization
- Error handling
- Loading states
- User onboarding
- Documentation

**Deliverables:**
- Production-ready platform
- Self-hosted deployment guide
- SaaS offering live
- Documentation complete
- MVP launched

---

## Part 7: Success Metrics

### 7.1 Technical Metrics

**Performance:**
- ✅ Load time < 2s
- ✅ Time to first render < 3s
- ✅ Frame rate: 60 FPS
- ✅ Update latency < 100ms
- ✅ Support 10,000+ features
- ✅ Support 100+ updates/sec

**Reliability:**
- ✅ 99.9% uptime (SaaS)
- ✅ < 0.1% error rate
- ✅ Zero data loss
- ✅ Graceful degradation

### 7.2 Business Metrics

**Adoption:**
- 1,000 signups in first month
- 100 active projects
- 50% week-1 retention
- 30% month-1 retention

**Conversion:**
- 20% free → paid
- $50k MRR in 6 months
- 10 enterprise customers in year 1

**Cost Advantage:**
- 90%+ savings vs competitors
- $4/user/month infrastructure cost
- 10x margin on Pro tier

---

## Part 8: Next Steps

### Immediate Actions (This Week)

1. **Review & Approve Strategy**
   - Confirm operational intelligence focus
   - Approve Felt/Windward-inspired layout
   - Approve open source approach

2. **Technical Setup**
   ```bash
   # Install shadcn/ui
   npx shadcn-ui@latest init

   # Create new branch
   git checkout -b feature/opintel-mvp

   # Install additional dependencies
   npm install socket.io-client @turf/turf h3-js
   ```

3. **Design Assets**
   - Create Figma designs for new layout
   - Design vehicle/marker icons
   - Create demo screenshots

4. **Demo Preparation**
   - Generate sample fleet dataset (200 vehicles)
   - Create San Francisco base map config
   - Write WebSocket simulation script

### Week 1 Execution Plan

**Monday:**
- Install shadcn/ui components
- Create new layout structure
- Design component hierarchy

**Tuesday-Wednesday:**
- Implement collapsible sidebars
- Build data source panel
- Create layer management panel

**Thursday:**
- Implement right detail panel
- Add timeline control UI
- Set up state management (Zustand)

**Friday:**
- Connect layout to existing map
- Test responsive behavior
- Demo internally

### Decision Points

**Strategic:**
- Proceed with operational intelligence focus? ✓
- Target last-mile delivery as first vertical? ✓
- Price at $29-99/user/month? ✓
- Offer free self-hosted tier? ✓

**Technical:**
- Use shadcn/ui for components? ✓
- Stick with deck.gl for rendering? ✓
- Use Supabase for backend? ✓ (Phase 4)
- Support self-hosted deployment? ✓

---

## Appendix: Open Source Stack Details

### A. Frontend Dependencies

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "next": "^15.4.5",
    "typescript": "^5.3.0",

    "@radix-ui/react-dialog": "latest",
    "@radix-ui/react-tabs": "latest",
    "@radix-ui/react-select": "latest",
    "tailwindcss": "^3.4.0",

    "deck.gl": "^9.0.0",
    "maplibre-gl": "^4.0.0",
    "@deck.gl/layers": "^9.0.0",
    "@deck.gl/geo-layers": "^9.0.0",
    "@deck.gl/aggregation-layers": "^9.0.0",

    "zustand": "^4.5.0",
    "@tanstack/react-table": "^8.12.0",
    "@tanstack/react-query": "^5.0.0",

    "@turf/turf": "^6.5.0",
    "h3-js": "^4.1.0",

    "socket.io-client": "^4.7.0",
    "framer-motion": "^11.0.0",

    "recharts": "^2.12.0"
  }
}
```

**Total License Costs: $0**
**All MIT, Apache 2.0, or BSD licenses**

### B. Self-Hosted Deployment

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Frontend
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@db:5432/opintel

  # Database
  db:
    image: postgis/postgis:16-3.4
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_PASSWORD=password
    ports:
      - "5432:5432"

  # Cache (optional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

**Monthly Self-Hosting Cost:**
- VPS (8GB RAM, 4 CPU): $40-80/month
- Or AWS EC2 t3.large: ~$60/month
- **Total: $40-80/month for unlimited users**

---

## Summary

This strategy transforms the platform into an **Operational Intelligence Platform** inspired by Felt's collaboration-first UX and Windward's real-time monitoring, delivered at **1/10th the cost** through open source technology.

**Key Differentiators:**
1. ✅ **Map-first layout** (95% screen = map)
2. ✅ **Real-time by default** (live data streams)
3. ✅ **Alert-driven** (notifications & actions)
4. ✅ **Collaboration-native** (multi-user, comments)
5. ✅ **Open source** (no vendor lock-in)
6. ✅ **AI-powered** (NL queries, auto-insights)
7. ✅ **Industry templates** (5+ verticals)
8. ✅ **Affordable** ($29-99 vs $500-800)

**Next Step:** Approve strategy → Begin Phase 0 (2 weeks) → Launch MVP demo (12 weeks)

Ready to build the future of geospatial operational intelligence? 🚀

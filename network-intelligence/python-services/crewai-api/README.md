# CrewAI Intelligence API

Multi-agent orchestration service for intelligence analysis using CrewAI framework.

## Overview

This Python FastAPI service provides multi-agent orchestration capabilities using the real CrewAI framework from https://github.com/crewAIInc/crewAI. It coordinates specialized intelligence agents (GEOINT, SIGINT, OSINT, IMINT, Temporal) to perform comprehensive analysis workflows.

### Key Features

- **Real CrewAI Framework**: Uses actual CrewAI library (not inspired/custom implementation)
- **Multi-Agent Orchestration**: Specialized agents work together on complex intelligence tasks
- **Microservice Architecture**: Standalone Python service integrated with Next.js via HTTP
- **Tool Wrappers**: Agents call existing TypeScript services through HTTP tool wrappers
- **Sequential Workflows**: Tasks execute in order with context passing between agents

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Next.js App                          │
│                   (Port 3000)                            │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │  Investigation Agent                      │           │
│  │  (TypeScript)                             │           │
│  │                                           │           │
│  │  Detects Route Query →────────────┐      │           │
│  └──────────────────────────────────│───────┘           │
└────────────────────────────────────│─────────────────────┘
                                     │ HTTP
                                     ↓
┌─────────────────────────────────────────────────────────┐
│              CrewAI Intelligence API                     │
│                (Python FastAPI)                          │
│                  (Port 8000)                             │
│                                                          │
│  ┌──────────────────────────────────────────┐           │
│  │  Route Intelligence Crew                  │           │
│  │                                           │           │
│  │  1. Route Analyst Agent                   │           │
│  │     ├─ RouteAnalysisTool ────────┐        │           │
│  │     └─ GeocodingTool             │        │           │
│  │                                  │        │           │
│  │  2. GEOINT Specialist Agent      │        │           │
│  │  3. Temporal Analyst Agent       │        │           │
│  │  4. OSINT Specialist Agent       │        │           │
│  │  5. Route Analyst (Final Report) │        │           │
│  └──────────────────────────────────│────────┘           │
└───────────────────────────────────│──────────────────────┘
                                    │ HTTP
                                    ↓
┌─────────────────────────────────────────────────────────┐
│              Next.js Services                            │
│                                                          │
│  /api/intelligence/route                                 │
│  /api/intelligence/imagery                               │
│  /api/intelligence/isochrone                             │
│  /api/geocoding                                          │
└──────────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- Python 3.12+
- Node.js 18+ (for Next.js app)
- API keys for LLM providers (Anthropic, OpenAI, or Vultr)

### Setup Steps

1. **Create virtual environment**:
   ```bash
   python3.12 -m venv venv
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Required environment variables**:
   ```env
   # LLM API Keys
   ANTHROPIC_API_KEY=your_key_here
   VULTR_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here

   # Default LLM Model
   DEFAULT_LLM_MODEL=anthropic/claude-3-5-sonnet-20241022

   # Next.js Service URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Server Port
   PORT=8000
   ```

## Running the Service

### Development Mode

```bash
# Option 1: Using startup script
./start.sh

# Option 2: Manual start
source venv/bin/activate
export PYTHONPATH="$(pwd):$PYTHONPATH"
python -m app.main
```

The server will start on http://localhost:8000

### Production Mode

```bash
source venv/bin/activate
export PYTHONPATH="$(pwd):$PYTHONPATH"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
```

## API Endpoints

### Health Check

```bash
GET /health

Response:
{
  "status": "healthy",
  "version": "1.0.0",
  "crews_available": ["route", "site", "investigation", "auto"]
}
```

### Execute Crew

```bash
POST /api/crew

Request Body:
{
  "query": "Analyze route from Times Square to Central Park",
  "context": {
    "map_center": { "lat": 40.7580, "lng": -73.9855 },
    "map_zoom": 13,
    "selected_location": "Times Square, NYC"
  },
  "crew_type": "route",  // or "site", "investigation", "auto"
  "verbose": true
}

Response:
{
  "success": true,
  "output": "## ROUTE INTELLIGENCE REPORT\n...",
  "task_results": [...],
  "artifacts": [
    {
      "type": "route-analysis",
      "title": "Route: Times Square → Central Park",
      "data": { ... }
    }
  ],
  "actions": [
    {
      "type": "flyTo",
      "location": "Times Square, NYC"
    },
    {
      "type": "drawRoute",
      "from": "Times Square, NYC",
      "to": "Central Park, NYC"
    }
  ],
  "total_duration_ms": 15234,
  "total_tokens": 4521
}
```

## Available Crews

### 1. Route Intelligence Crew (`crew_type: "route"`)

**Purpose**: Comprehensive route analysis with multi-INT assessment

**Agents**:
1. **Route Analyst** - Coordinates analysis, geocodes locations, calls route API
2. **GEOINT Specialist** - Analyzes terrain, elevation, geographic features
3. **Temporal Analyst** - Analyzes timing, traffic patterns, optimal windows
4. **OSINT Specialist** - Identifies infrastructure and points of interest
5. **Route Analyst** - Synthesizes final intelligence report

**Use Cases**:
- "Analyze route from Times Square to Central Park"
- "Plan optimal route from LAX to downtown LA"
- "Assess movement corridor from location A to B"

### 2. Site Intelligence Crew (`crew_type: "site"`)

**Status**: Not yet implemented
**Planned**: Multi-INT site assessment with infrastructure analysis

### 3. Investigation Crew (`crew_type: "investigation"`)

**Status**: Not yet implemented
**Planned**: Comprehensive investigation workflows

### 4. Auto Crew (`crew_type: "auto"`)

**Auto-detection**: Service automatically selects appropriate crew based on query

## Agent Capabilities

### Route Analyst Agent

**Role**: Route Intelligence Analyst
**Tools**: RouteAnalysisTool, GeocodingTool
**Capabilities**:
- Coordinate route analysis workflow
- Convert location names to coordinates
- Execute comprehensive route intelligence via Next.js API
- Synthesize multi-agent intelligence reports

### GEOINT Specialist

**Role**: GEOINT (Geospatial Intelligence) Specialist
**Expertise**:
- Terrain analysis and elevation profiling
- Natural chokepoints and observation positions
- Trafficability and movement corridors
- Geographic feature significance

### Temporal Analyst

**Role**: Temporal Intelligence Analyst
**Expertise**:
- Traffic pattern analysis and prediction
- Timing optimization for movement
- Peak/off-peak window identification
- Temporal vulnerability assessment

### OSINT Specialist

**Role**: OSINT (Open-Source Intelligence) Analyst
**Expertise**:
- Points of interest identification
- Infrastructure assessment
- Activity pattern analysis
- Contextual factor evaluation

## Tools

### RouteAnalysisTool

Wrapper for Next.js `/api/intelligence/route` endpoint.

**Capabilities**:
- Multi-INT route analysis (GEOINT, SIGINT, OSINT, IMINT, Temporal)
- Waypoint-by-waypoint assessment
- Terrain and elevation analysis
- Traffic and timing predictions

### GeocodingTool

Wrapper for Next.js `/api/geocoding` endpoint.

**Capabilities**:
- Convert location names to coordinates
- Resolve ambiguous place names
- Get formatted addresses and place details

## Integration with Next.js

### TypeScript Client

Located at: `network-intelligence/lib/services/crewaiService.ts`

```typescript
import { crewaiService } from '@/lib/services/crewaiService'

// Execute route analysis
const result = await crewaiService.analyzeRoute({
  query: "Analyze route from Times Square to Central Park",
  from: "Times Square, NYC",
  to: "Central Park, NYC",
  mode: "walking"
})

// Auto-execute with query detection
const result = await crewaiService.autoExecute(
  "Plan route from LAX to downtown",
  { map_zoom: 12 }
)
```

### Investigation Agent Integration

Located at: `network-intelligence/lib/agents/investigationAgent.ts`

The Investigation Agent automatically detects route queries and delegates to CrewAI:

```typescript
const agent = new InvestigationAgent(llm, { useCrewAI: true })

// This will automatically use CrewAI for route analysis
const response = await agent.processQuery(
  "Analyze route from location A to location B"
)
```

## Development

### Project Structure

```
python-services/crewai-api/
├── app/
│   ├── main.py              # FastAPI application
│   ├── agents/
│   │   ├── __init__.py
│   │   └── route_agents.py  # Agent definitions
│   ├── crews/
│   │   ├── __init__.py
│   │   └── route_intelligence.py  # Crew workflows
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── route_analysis_tool.py
│   │   └── geocoding_tool.py
│   └── models/
│       ├── __init__.py
│       └── requests.py      # Pydantic models
├── requirements.txt
├── .env.example
├── .env
├── start.sh
└── README.md
```

### Adding New Agents

1. Define agent in `app/agents/`:
   ```python
   def create_my_agent() -> Agent:
       return Agent(
           role="My Specialist",
           goal="Perform specialized analysis",
           backstory="Expert with extensive experience...",
           tools=[...],
           llm=get_llm(),
           verbose=True,
           allow_delegation=False
       )
   ```

2. Add to crew workflow in `app/crews/`

### Adding New Tools

1. Create tool in `app/tools/`:
   ```python
   class MyTool(BaseTool):
       name: str = "My Tool"
       description: str = "Tool description..."

       def _run(self, params) -> Dict[str, Any]:
           # Tool implementation
           pass
   ```

2. Add to agent's tools list

### Adding New Crews

1. Create crew file in `app/crews/my_crew.py`
2. Define agents and tasks
3. Create Crew with sequential/parallel/hierarchical process
4. Add to `app/main.py` router

## Troubleshooting

### ModuleNotFoundError: No module named 'app'

**Solution**: Set PYTHONPATH before running:
```bash
export PYTHONPATH="$(pwd):$PYTHONPATH"
python -m app.main
```

### ModuleNotFoundError: No module named 'pkg_resources'

**Solution**: Install setuptools:
```bash
pip install setuptools
```

### CrewAI connection errors from Next.js

**Solution**: Ensure Python service is running and accessible:
```bash
# Test health endpoint
curl http://localhost:8000/health
```

### LLM API errors

**Solution**: Check API keys in `.env`:
- Anthropic: `ANTHROPIC_API_KEY`
- OpenAI: `OPENAI_API_KEY`
- Vultr: `VULTR_API_KEY`

## Testing

### Test Health Endpoint

```bash
curl http://localhost:8000/health
```

### Test Crew Execution

```bash
curl -X POST http://localhost:8000/api/crew \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Analyze route from Times Square to Central Park",
    "crew_type": "route",
    "verbose": true
  }'
```

### End-to-End Test

1. Start Next.js app (port 3000)
2. Start Python CrewAI service (port 8000)
3. Open http://localhost:3000
4. Navigate to investigation mode
5. Enter query: "Analyze route from Times Square to Central Park"
6. Watch multi-agent orchestration in action

## Performance

- **Route Analysis**: ~15-30 seconds (depends on route complexity)
- **Agent Count**: 4-5 agents per route workflow
- **Token Usage**: ~3000-5000 tokens per route analysis
- **LLM Calls**: 5-6 sequential calls (one per task)

## Future Enhancements

- [ ] Site Intelligence Crew implementation
- [ ] Full Investigation Crew implementation
- [ ] Parallel task execution where appropriate
- [ ] Agent memory and learning capabilities
- [ ] Streaming responses for long-running analyses
- [ ] Task result caching
- [ ] Integration with additional intelligence services

## Credits

Built with:
- [CrewAI](https://github.com/crewAIInc/crewAI) - Multi-agent orchestration framework
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [LangChain](https://www.langchain.com/) - LLM integration framework
- [Anthropic Claude](https://www.anthropic.com/) - Primary LLM provider

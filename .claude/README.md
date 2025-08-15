# Claude Code Enhancement Setup

This directory contains configuration and tools to enhance Claude Code's ability to understand and work with the nx1-space codebase.

## Architecture

The setup uses two complementary MCP (Model Context Protocol) servers:

1. **Claude-Context**: Semantic code search using vector embeddings
2. **Tree-Sitter**: Structural code analysis using AST parsing

Together, these give Claude Code deep understanding of both the meaning and structure of your code.

## Components

### 1. Qdrant Vector Database
- Running in Docker on port 6333
- Stores code embeddings for semantic search
- Enables finding conceptually similar code

### 2. Claude-Context MCP Server
- Indexes codebase into vector embeddings
- Enables semantic queries like "find code similar to X"
- Uses OpenAI embeddings (or local alternatives)

### 3. Tree-Sitter MCP Server
- Parses code into Abstract Syntax Trees
- Enables structural queries like "find all React components"
- Language-agnostic (supports TypeScript, JavaScript, Python, etc.)

## Setup Instructions

### Prerequisites
- Docker installed and running
- Node.js v20+ (for claude-context)
- Python 3.10+ (for tree-sitter)
- OpenAI API key (for embeddings) or local embedding model

### Installation Steps

1. **Start Qdrant Vector Database**:
   ```bash
   cd /mnt/blockstorage/nx1-space/infrastructure
   docker compose up -d
   ```

2. **Configure Environment**:
   - Copy `.env.mcp.example` to `.env.mcp`
   - Add your OpenAI API key

3. **Run Setup Script**:
   ```bash
   /mnt/blockstorage/nx1-space/scripts/start-mcp-servers.sh
   ```

## How Claude Code Uses These Tools

### Semantic Search (claude-context)
Claude Code can find code based on meaning:
- "Find all code related to ground station processing"
- "Show me similar implementations to this function"
- "Find code that handles geospatial calculations"

### Structural Analysis (tree-sitter)
Claude Code can analyze code structure:
- "List all React components using mapStore"
- "Find all TypeScript interfaces for stations"
- "Show function signatures in DataService"

## File Structure

```
.claude/
├── mcp-config.json       # MCP server configuration
├── cache/               # Cache directory for parsed trees
│   └── tree-sitter/    
└── logs/               # Log files
    └── mcp.log

infrastructure/
├── docker-compose.yml   # Qdrant container setup
└── qdrant_storage/     # Qdrant data persistence

scripts/
├── index-codebase.sh   # Index codebase for semantic search
└── start-mcp-servers.sh # Start and verify MCP servers
```

## Troubleshooting

### Qdrant Not Running
```bash
cd /mnt/blockstorage/nx1-space/infrastructure
docker compose up -d
docker compose logs qdrant
```

### Missing OpenAI API Key
Add to `/mnt/blockstorage/nx1-space/.env.mcp`:
```
OPENAI_API_KEY=your-key-here
```

### Alternative: Use Local Embeddings
Install Ollama and configure in `.env.mcp`:
```
OLLAMA_URL=http://localhost:11434
EMBEDDING_MODEL=nomic-embed-text
```

## Benefits

This setup provides Claude Code with:
- **Better Context**: Understands relationships across the entire codebase
- **Accurate Suggestions**: Finds relevant examples before making changes
- **Faster Development**: Quickly locates similar patterns and implementations
- **Reduced Errors**: Better understanding of dependencies and structure

## Security Note

- The `.env.mcp` file contains sensitive API keys - never commit it
- Qdrant runs locally and doesn't expose data externally
- MCP servers only activate when Claude Code requests them
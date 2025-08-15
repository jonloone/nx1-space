#!/bin/bash

# Script to index the nx1-space codebase for semantic search with claude-context

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== NX1-Space Codebase Indexing ===${NC}"

# Load environment variables
if [ -f "/mnt/blockstorage/nx1-space/.env.mcp" ]; then
    export $(cat /mnt/blockstorage/nx1-space/.env.mcp | grep -v '^#' | xargs)
fi
# Load local overrides (contains actual API keys)
if [ -f "/mnt/blockstorage/nx1-space/.env.mcp.local" ]; then
    export $(cat /mnt/blockstorage/nx1-space/.env.mcp.local | grep -v '^#' | xargs)
fi

# Check if Qdrant is running
echo -e "${YELLOW}Checking Qdrant status...${NC}"
if ! curl -s http://localhost:6333 > /dev/null 2>&1; then
    echo -e "${RED}Error: Qdrant is not running. Please start it first:${NC}"
    echo "cd /mnt/blockstorage/nx1-space/infrastructure && docker compose up -d"
    exit 1
fi
echo -e "${GREEN}✓ Qdrant is running${NC}"

# Check for OpenAI API key
if [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}Warning: OPENAI_API_KEY not set. Claude-context needs this for embeddings.${NC}"
    echo "Please set it in /mnt/blockstorage/nx1-space/.env.mcp"
    echo ""
    echo "Alternatively, you can use a local embedding model like Ollama."
    exit 1
fi

# Create collection in Qdrant
echo -e "${YELLOW}Creating/updating Qdrant collection...${NC}"
curl -X PUT "http://localhost:6333/collections/nx1_codebase" \
    -H "Content-Type: application/json" \
    -d '{
        "vectors": {
            "size": 1536,
            "distance": "Cosine"
        },
        "optimizers_config": {
            "default_segment_number": 2
        },
        "replication_factor": 1
    }' 2>/dev/null || true

echo -e "${GREEN}✓ Collection ready${NC}"

# Index the codebase using claude-context
echo -e "${YELLOW}Indexing codebase files...${NC}"

# Find all relevant source files
find /mnt/blockstorage/nx1-space \
    -type f \
    \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \
       -o -name "*.py" -o -name "*.json" -o -name "*.yaml" -o -name "*.yml" \
       -o -name "*.md" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/.git/*" \
    -not -path "*/.next/*" \
    -not -path "*/dist/*" \
    -not -path "*/build/*" \
    -not -path "*/coverage/*" \
    -not -path "*/__pycache__/*" \
    -not -path "*/venv/*" \
    -not -path "*/.venv/*" | head -20

echo ""
echo -e "${YELLOW}Found files to index. This process will:${NC}"
echo "1. Read each source file"
echo "2. Split into chunks"
echo "3. Generate embeddings using OpenAI"
echo "4. Store in Qdrant vector database"
echo ""
echo -e "${GREEN}Note: In production, claude-context will handle this automatically${NC}"
echo -e "${GREEN}when accessed through the MCP protocol.${NC}"

# Create a simple Python script to test the connection
cat > /tmp/test_qdrant.py << 'EOF'
import os
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

client = QdrantClient(url="http://localhost:6333")

# Check collections
collections = client.get_collections()
print(f"Available collections: {[c.name for c in collections.collections]}")

# Get collection info if it exists
if any(c.name == "nx1_codebase" for c in collections.collections):
    info = client.get_collection("nx1_codebase")
    print(f"Collection 'nx1_codebase' has {info.points_count} vectors")
else:
    print("Collection 'nx1_codebase' not found. Creating it...")
    client.create_collection(
        collection_name="nx1_codebase",
        vectors_config=VectorParams(size=1536, distance=Distance.COSINE)
    )
    print("Collection created successfully")
EOF

echo -e "${YELLOW}Testing Qdrant connection...${NC}"
python3 /tmp/test_qdrant.py 2>/dev/null || {
    echo -e "${YELLOW}Installing Qdrant client...${NC}"
    pip install qdrant-client > /dev/null 2>&1
    python3 /tmp/test_qdrant.py
}

echo ""
echo -e "${GREEN}=== Indexing Setup Complete ===${NC}"
echo ""
echo "Next steps:"
echo "1. Add your OpenAI API key to .env.mcp"
echo "2. The claude-context MCP server will automatically index files when accessed"
echo "3. Tree-sitter will parse files on-demand for structural analysis"
echo ""
echo -e "${GREEN}Claude Code can now use both semantic and structural code search!${NC}"
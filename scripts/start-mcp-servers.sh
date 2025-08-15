#!/bin/bash

# Script to start MCP servers for Claude Code enhancement

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Starting MCP Servers for Claude Code ===${NC}"
echo ""

# Load environment variables
if [ -f "/mnt/blockstorage/nx1-space/.env.mcp" ]; then
    export $(cat /mnt/blockstorage/nx1-space/.env.mcp | grep -v '^#' | xargs)
fi
# Load local overrides (contains actual API keys)
if [ -f "/mnt/blockstorage/nx1-space/.env.mcp.local" ]; then
    export $(cat /mnt/blockstorage/nx1-space/.env.mcp.local | grep -v '^#' | xargs)
fi

# Function to check if a process is running
is_running() {
    pgrep -f "$1" > /dev/null 2>&1
}

# 1. Ensure Qdrant is running
echo -e "${YELLOW}1. Checking Qdrant Vector Database...${NC}"
if ! curl -s http://localhost:6333 > /dev/null 2>&1; then
    echo -e "${YELLOW}   Starting Qdrant...${NC}"
    cd /mnt/blockstorage/nx1-space/infrastructure
    docker compose up -d
    sleep 3
fi

if curl -s http://localhost:6333 > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Qdrant is running on port 6333${NC}"
else
    echo -e "${RED}   ✗ Failed to start Qdrant${NC}"
    exit 1
fi

# 2. Check claude-context MCP server
echo ""
echo -e "${YELLOW}2. Claude-Context MCP Server${NC}"
echo -e "${GREEN}   ✓ Installed at: $(which claude-context-mcp 2>/dev/null || echo 'npx @zilliz/claude-context-mcp')${NC}"
echo "   Note: This server runs on-demand when Claude Code requests it"

# 3. Check tree-sitter MCP server
echo ""
echo -e "${YELLOW}3. Tree-Sitter MCP Server${NC}"
if python -m mcp_server_tree_sitter.server --version > /dev/null 2>&1; then
    echo -e "${GREEN}   ✓ Installed and ready${NC}"
else
    echo -e "${RED}   ✗ Not found. Installing...${NC}"
    pip install mcp-server-tree-sitter
fi

# 4. Test MCP configuration
echo ""
echo -e "${YELLOW}4. MCP Configuration${NC}"
if [ -f "/mnt/blockstorage/nx1-space/.claude/mcp-config.json" ]; then
    echo -e "${GREEN}   ✓ Configuration file exists${NC}"
    echo "   Location: /mnt/blockstorage/nx1-space/.claude/mcp-config.json"
else
    echo -e "${RED}   ✗ Configuration file not found${NC}"
    exit 1
fi

# 5. Show how Claude Code can use these servers
echo ""
echo -e "${BLUE}=== MCP Servers Ready ===${NC}"
echo ""
echo -e "${GREEN}How Claude Code uses these servers:${NC}"
echo ""
echo "1. ${YELLOW}Semantic Code Search (claude-context):${NC}"
echo "   - 'Find all code related to ground station processing'"
echo "   - 'Show me similar implementations to this function'"
echo "   - 'Find code that handles geospatial calculations'"
echo ""
echo "2. ${YELLOW}Structural Code Analysis (tree-sitter):${NC}"
echo "   - 'List all React components using mapStore'"
echo "   - 'Find all TypeScript interfaces for stations'"
echo "   - 'Show function signatures in DataService'"
echo ""
echo -e "${GREEN}Both servers work together to give Claude Code:${NC}"
echo "• Deep understanding of code semantics and structure"
echo "• Ability to find relevant code quickly"
echo "• Better context for making accurate modifications"
echo ""

# 6. Check for API keys
echo -e "${YELLOW}Configuration Status:${NC}"
if [ -n "$OPENAI_API_KEY" ]; then
    echo -e "${GREEN}   ✓ OpenAI API key configured${NC}"
else
    echo -e "${YELLOW}   ⚠ OpenAI API key not set (needed for embeddings)${NC}"
    echo "     Add it to /mnt/blockstorage/nx1-space/.env.mcp"
fi

echo ""
echo -e "${BLUE}=== Setup Complete ===${NC}"
echo ""
echo "MCP servers are configured and ready for Claude Code!"
echo "They will automatically activate when Claude Code needs them."
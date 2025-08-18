#!/bin/bash

# Playwright MCP Setup Script
echo "Setting up Playwright MCP..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to detect OS
detect_os() {
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

# Function to get config path
get_config_path() {
    local os=$(detect_os)
    case $os in
        macos)
            echo "$HOME/Library/Application Support/Claude/claude_desktop_config.json"
            ;;
        linux)
            echo "$HOME/.config/claude/claude_desktop_config.json"
            ;;
        windows)
            echo "$APPDATA/Claude/claude_desktop_config.json"
            ;;
        *)
            echo ""
            ;;
    esac
}

# Step 1: Clone Playwright MCP
MCP_DIR="$HOME/playwright-mcp"
if [ -d "$MCP_DIR" ]; then
    echo -e "${BLUE}Playwright MCP directory already exists at $MCP_DIR${NC}"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        cd "$MCP_DIR"
        git pull
    fi
else
    echo -e "${GREEN}Cloning Playwright MCP...${NC}"
    git clone https://github.com/microsoft/playwright-mcp.git "$MCP_DIR"
fi

# Step 2: Install and build
echo -e "${GREEN}Installing dependencies...${NC}"
cd "$MCP_DIR"
npm install

echo -e "${GREEN}Building Playwright MCP...${NC}"
npm run build

# Step 3: Update Claude config
CONFIG_PATH=$(get_config_path)
if [ -z "$CONFIG_PATH" ]; then
    echo -e "${RED}Could not determine Claude config path for your OS${NC}"
    exit 1
fi

# Create config directory if it doesn't exist
CONFIG_DIR=$(dirname "$CONFIG_PATH")
mkdir -p "$CONFIG_DIR"

# Backup existing config
if [ -f "$CONFIG_PATH" ]; then
    echo -e "${BLUE}Backing up existing config...${NC}"
    cp "$CONFIG_PATH" "${CONFIG_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Create or update config
echo -e "${GREEN}Updating Claude Desktop configuration...${NC}"

# Check if config exists and has content
if [ -f "$CONFIG_PATH" ] && [ -s "$CONFIG_PATH" ]; then
    # Use jq if available, otherwise use a simple approach
    if command -v jq &> /dev/null; then
        # Remove puppeteer and add playwright using jq
        jq --arg path "$MCP_DIR/dist/index.js" \
           'del(.mcpServers.puppeteer) | 
            .mcpServers.playwright = {
              "command": "node",
              "args": [$path],
              "env": {
                "PLAYWRIGHT_HEADLESS": "false"
              }
            }' "$CONFIG_PATH" > "${CONFIG_PATH}.tmp" && mv "${CONFIG_PATH}.tmp" "$CONFIG_PATH"
    else
        echo -e "${BLUE}jq not found. Please manually update $CONFIG_PATH${NC}"
        echo -e "${BLUE}Add this configuration:${NC}"
        cat << EOF
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["$MCP_DIR/dist/index.js"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false"
      }
    }
  }
}
EOF
    fi
else
    # Create new config
    cat > "$CONFIG_PATH" << EOF
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["$MCP_DIR/dist/index.js"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false"
      }
    }
  }
}
EOF
fi

echo -e "${GREEN}Setup complete!${NC}"
echo -e "${BLUE}Configuration file: $CONFIG_PATH${NC}"
echo -e "${BLUE}Playwright MCP installed at: $MCP_DIR${NC}"
echo
echo -e "${GREEN}Please restart Claude Desktop for the changes to take effect.${NC}"

# Optional: Install Playwright browsers
read -p "Do you want to install Playwright browsers now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Installing Playwright browsers...${NC}"
    cd "$MCP_DIR"
    npx playwright install
fi
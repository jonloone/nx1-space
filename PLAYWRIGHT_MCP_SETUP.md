# Playwright MCP Setup Guide

## Overview
This guide helps you switch from Puppeteer MCP to Playwright MCP for better browser automation capabilities.

## Installation Steps

### 1. Install Playwright MCP

```bash
# Clone the Playwright MCP repository
git clone https://github.com/microsoft/playwright-mcp.git
cd playwright-mcp

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Configure Claude Desktop

Create or update your Claude Desktop configuration file:

**Location**: 
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

**Configuration**:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "node",
      "args": ["/path/to/playwright-mcp/dist/index.js"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false"
      }
    }
  }
}
```

### 3. Remove Puppeteer MCP

Remove the puppeteer configuration from your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    // Remove this section:
    // "puppeteer": {
    //   "command": "npx",
    //   "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    // }
  }
}
```

### 4. Restart Claude Desktop

After updating the configuration, restart Claude Desktop for the changes to take effect.

## Features of Playwright MCP

Playwright MCP provides:
- Cross-browser testing (Chromium, Firefox, WebKit)
- Better performance and reliability
- Auto-wait for elements
- Network interception
- Mobile device emulation
- Better screenshot capabilities
- Parallel execution support

## Example Usage

Once configured, you can use Playwright MCP commands in Claude:

```javascript
// Navigate to a page
await playwright.navigate('https://example.com');

// Take a screenshot
await playwright.screenshot('example.png');

// Click an element
await playwright.click('button#submit');

// Fill a form
await playwright.fill('input[name="email"]', 'user@example.com');

// Wait for element
await playwright.waitForSelector('.results');
```

## Troubleshooting

1. **Permission Issues**: Make sure the Playwright MCP directory has proper permissions
2. **Path Issues**: Use absolute paths in the configuration
3. **Headless Mode**: Set `PLAYWRIGHT_HEADLESS` to `"false"` to see the browser
4. **Installation**: Make sure to run `npm install` and `npm run build` in the playwright-mcp directory

## Alternative: Using npx

If you prefer not to clone the repository, you can use npx (once the package is published):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"],
      "env": {
        "PLAYWRIGHT_HEADLESS": "false"
      }
    }
  }
}
```

Note: Check if the package is published to npm first.
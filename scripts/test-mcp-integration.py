#!/usr/bin/env python3
"""
Test script to verify MCP server integration is working
"""

import os
import sys
import json
from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PointStruct

def test_qdrant_connection():
    """Test Qdrant vector database connection"""
    print("Testing Qdrant connection...")
    try:
        client = QdrantClient(url="http://localhost:6333")
        collections = client.get_collections()
        print(f"✓ Connected to Qdrant")
        print(f"  Collections: {[c.name for c in collections.collections]}")
        return True
    except Exception as e:
        print(f"✗ Failed to connect to Qdrant: {e}")
        return False

def test_openai_key():
    """Test OpenAI API key is configured"""
    print("\nTesting OpenAI API key configuration...")
    
    # Load from .env.mcp
    env_file = "/mnt/blockstorage/nx1-space/.env.mcp"
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                if line.startswith("OPENAI_API_KEY="):
                    key = line.strip().split("=", 1)[1]
                    if key and not key.startswith("#"):
                        print(f"✓ OpenAI API key configured (length: {len(key)})")
                        return True
    
    print("✗ OpenAI API key not found in .env.mcp")
    return False

def test_mcp_config():
    """Test MCP configuration file"""
    print("\nTesting MCP configuration...")
    config_file = "/mnt/blockstorage/nx1-space/.claude/mcp-config.json"
    
    if not os.path.exists(config_file):
        print(f"✗ MCP config not found at {config_file}")
        return False
    
    try:
        with open(config_file) as f:
            config = json.load(f)
        
        servers = config.get("mcpServers", {})
        
        # Check claude-context
        if "claude-context" in servers:
            print("✓ claude-context MCP server configured")
            env = servers["claude-context"].get("env", {})
            if env.get("OPENAI_API_KEY"):
                print("  - OpenAI API key present")
            if env.get("QDRANT_URL"):
                print(f"  - Qdrant URL: {env['QDRANT_URL']}")
            if env.get("PROJECT_ROOT"):
                print(f"  - Project root: {env['PROJECT_ROOT']}")
        else:
            print("✗ claude-context not configured")
        
        # Check tree-sitter
        if "tree-sitter" in servers:
            print("✓ tree-sitter MCP server configured")
            env = servers["tree-sitter"].get("env", {})
            if env.get("PROJECT_ROOT"):
                print(f"  - Project root: {env['PROJECT_ROOT']}")
        else:
            print("✗ tree-sitter not configured")
        
        return True
    except Exception as e:
        print(f"✗ Failed to parse MCP config: {e}")
        return False

def test_tree_sitter():
    """Test tree-sitter installation"""
    print("\nTesting tree-sitter installation...")
    try:
        import mcp_server_tree_sitter
        print("✓ tree-sitter MCP server installed")
        
        # Try to import tree-sitter
        import tree_sitter
        print(f"  - tree-sitter module loaded")
        
        # Check for language pack
        import tree_sitter_language_pack
        print("  - Language pack installed")
        
        return True
    except ImportError as e:
        print(f"✗ tree-sitter not properly installed: {e}")
        return False

def main():
    print("=" * 60)
    print("MCP Integration Test Suite")
    print("=" * 60)
    
    results = []
    
    # Run tests
    results.append(("Qdrant", test_qdrant_connection()))
    results.append(("OpenAI Key", test_openai_key()))
    results.append(("MCP Config", test_mcp_config()))
    results.append(("Tree-sitter", test_tree_sitter()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary:")
    print("-" * 60)
    
    all_passed = True
    for name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"{name:20} {status}")
        if not passed:
            all_passed = False
    
    print("=" * 60)
    
    if all_passed:
        print("\n🎉 All tests passed! MCP integration is ready.")
        print("\nClaude Code can now use:")
        print("• Semantic code search via claude-context")
        print("• Structural code analysis via tree-sitter")
        print("• Vector embeddings stored in Qdrant")
        return 0
    else:
        print("\n⚠️ Some tests failed. Please check the configuration.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
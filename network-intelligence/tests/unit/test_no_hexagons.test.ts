/**
 * TDD Tests for Hexagon Removal
 * Verify NO hexagons remain in the codebase
 */

import { describe, test, expect } from '@jest/globals'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'

describe('No Hexagons Verification - Critical Requirement', () => {
  const projectRoot = join(__dirname, '../../')
  const componentsDir = join(projectRoot, 'components')
  const libDir = join(projectRoot, 'lib')
  const appDir = join(projectRoot, 'app')
  
  // Patterns that indicate hexagon usage
  const hexagonPatterns = [
    /hexagon/i,
    /h3-js/,
    /HexagonLayer/,
    /H3HexagonLayer/,
    /hexbin/i,
    /cellToChildren/,
    /cellToBoundary/,
    /geoToH3/,
    /h3ToGeo/,
    /hexagonRadius/i
  ]
  
  // Files/imports that are allowed (e.g., h3-js for other purposes)
  const allowedExceptions = [
    'node_modules',
    '.next',
    'test_no_hexagons.test.ts', // This test file itself
    'package-lock.json'
  ]
  
  function searchDirectory(dir: string, fileList: string[] = []): string[] {
    try {
      const files = readdirSync(dir, { withFileTypes: true })
      
      for (const file of files) {
        const fullPath = join(dir, file.name)
        
        // Skip exceptions
        if (allowedExceptions.some(exc => fullPath.includes(exc))) {
          continue
        }
        
        if (file.isDirectory()) {
          searchDirectory(fullPath, fileList)
        } else if (file.name.endsWith('.ts') || 
                   file.name.endsWith('.tsx') || 
                   file.name.endsWith('.js') ||
                   file.name.endsWith('.jsx')) {
          fileList.push(fullPath)
        }
      }
    } catch (e) {
      // Directory might not exist
    }
    
    return fileList
  }
  
  describe('Component Files', () => {
    test('no hexagon components should exist', () => {
      const componentFiles = searchDirectory(componentsDir)
      const hexagonComponents = componentFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        return hexagonPatterns.some(pattern => pattern.test(content))
      })
      
      expect(hexagonComponents).toHaveLength(0)
      if (hexagonComponents.length > 0) {
        console.log('Found hexagon references in:', hexagonComponents)
      }
    })
    
    test('should use reality-based visualizations instead', () => {
      const componentFiles = searchDirectory(componentsDir)
      const realityPatterns = [
        /heatmap/i,
        /contour/i,
        /ScatterplotLayer/,
        /HeatmapLayer/,
        /ContourLayer/,
        /interpolat/i,
        /density/i
      ]
      
      const realityBasedComponents = componentFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        return realityPatterns.some(pattern => pattern.test(content))
      })
      
      // Should have at least some reality-based visualization
      expect(realityBasedComponents.length).toBeGreaterThan(0)
    })
  })
  
  describe('Library Files', () => {
    test('no hexagon utilities should exist', () => {
      const libFiles = searchDirectory(libDir)
      const hexagonLibs = libFiles.filter(file => {
        const fileName = file.toLowerCase()
        const content = readFileSync(file, 'utf-8')
        
        // Check both filename and content
        const hasHexInName = fileName.includes('hexagon') || fileName.includes('h3')
        const hasHexInContent = hexagonPatterns.some(pattern => pattern.test(content))
        
        return hasHexInName || hasHexInContent
      })
      
      expect(hexagonLibs).toHaveLength(0)
      if (hexagonLibs.length > 0) {
        console.log('Found hexagon libraries:', hexagonLibs)
      }
    })
  })
  
  describe('Application Pages', () => {
    test('no pages should render hexagons', () => {
      const appFiles = searchDirectory(appDir)
      const hexagonPages = appFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        
        // Check for hexagon layer instantiation
        const hasHexagonLayer = /new\s+HexagonLayer|new\s+H3HexagonLayer/.test(content)
        const importsHexagon = /from.*hexagon/i.test(content)
        
        return hasHexagonLayer || importsHexagon
      })
      
      expect(hexagonPages).toHaveLength(0)
      if (hexagonPages.length > 0) {
        console.log('Found hexagon usage in pages:', hexagonPages)
      }
    })
  })
  
  describe('Import Statements', () => {
    test('h3-js should not be imported for hexagon visualization', () => {
      const allFiles = [
        ...searchDirectory(componentsDir),
        ...searchDirectory(libDir),
        ...searchDirectory(appDir)
      ]
      
      const h3Imports = allFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        // Look for h3-js imports used for hexagon viz
        const hasH3Import = /import.*from\s+['"]h3-js['"]/.test(content)
        if (!hasH3Import) return false
        
        // Check if it's being used for hexagon visualization
        const hexagonUsage = /cellToBoundary|hexagonLayer|h3ToGeo.*hexagon/i.test(content)
        return hexagonUsage
      })
      
      expect(h3Imports).toHaveLength(0)
      if (h3Imports.length > 0) {
        console.log('Found h3-js hexagon usage in:', h3Imports)
      }
    })
  })
  
  describe('Configuration and Types', () => {
    test('no hexagon-related configuration should exist', () => {
      const allFiles = searchDirectory(projectRoot)
        .filter(f => f.endsWith('.json') || f.endsWith('.config.ts') || f.endsWith('.config.js'))
      
      const hexagonConfigs = allFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        return /hexagon|h3Layer|hexbin/i.test(content)
      })
      
      expect(hexagonConfigs).toHaveLength(0)
    })
    
    test('no hexagon types or interfaces should be defined', () => {
      const typeFiles = searchDirectory(projectRoot)
        .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'))
      
      const hexagonTypes = typeFiles.filter(file => {
        const content = readFileSync(file, 'utf-8')
        return /interface.*Hexagon|type.*Hexagon|HexagonProps|HexagonLayer/i.test(content)
      })
      
      expect(hexagonTypes).toHaveLength(0)
    })
  })
})
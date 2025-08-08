/**
 * Basic test to verify Jest is working
 */

import { describe, test, expect } from '@jest/globals'

describe('Test Framework Verification', () => {
  test('Jest framework is properly configured', () => {
    expect(true).toBe(true)
  })
  
  test('Math operations work', () => {
    expect(2 + 2).toBe(4)
  })
  
  test('Test fixtures are accessible', () => {
    const fixtures = require('../fixtures/known_stations.json')
    expect(fixtures).toHaveProperty('profitable')
    expect(fixtures).toHaveProperty('unprofitable')
    expect(fixtures.profitable.length).toBeGreaterThan(0)
    expect(fixtures.unprofitable.length).toBeGreaterThan(0)
  })
  
  test('Environment variables are loaded', () => {
    expect(process.env.NODE_ENV).toBe('test')
  })
})
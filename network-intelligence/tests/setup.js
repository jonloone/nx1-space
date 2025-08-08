/**
 * Jest Test Setup
 * Load environment variables and configure test environment
 */

require('dotenv').config({ path: '.env.local' })

// Set test environment flag
process.env.NODE_ENV = 'test'

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Uncomment to suppress console output during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}
# G6 Graph Visualization Tests

Comprehensive test suite for G6 graph visualization data transformations and components.

## Test Coverage

### Data Transformation Tests

1. **timelineTransform.test.ts** - Timeline event transformation
   - Event to G6 node conversion
   - Causal relationship detection (temporal, causal, concurrent)
   - Graph data generation
   - Filtering by significance and event type
   - Statistics calculation

2. **locationTransform.test.ts** - Location network transformation
   - Location node transformation
   - Movement edge transformation
   - Location extraction from timeline events
   - Visit counting and hotspot detection
   - Co-location detection (multiple subjects at same place)

3. **financialFlowTransform.test.ts** - Financial transaction transformation
   - Account node transformation with risk scoring
   - Transaction edge transformation with amount-based styling
   - **Pattern Detection Algorithms:**
     - Circular flow detection (money laundering indicator)
     - Layering detection (rapid sequential transactions)
     - Structuring detection (breaking amounts below reporting thresholds)
   - Filtering by account type and transaction amount
   - Financial statistics calculation

## Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test timelineTransform.test.ts

# Run with coverage
npm test -- --coverage

# Watch mode for TDD
npm test -- --watch
```

## Test Structure

Each test file follows the same structure:

```typescript
describe('TransformationUtility', () => {
  describe('specificFunction', () => {
    it('should perform expected behavior', () => {
      // Arrange
      const input = createMockData()

      // Act
      const result = transformFunction(input)

      // Assert
      expect(result).toMatchExpectedStructure()
    })
  })
})
```

## Mock Data

All tests use realistic mock data that represents actual use cases:
- Timeline events with locations, participants, and significance levels
- Financial accounts with risk scores and types
- Transactions with amounts, timestamps, and flags

## Key Test Scenarios

### Timeline Tests
- ✅ Node transformation with correct styling
- ✅ Critical/anomaly event highlighting
- ✅ Causal relationship detection between events
- ✅ Concurrent event detection (within 1 hour)
- ✅ Same-location causal links
- ✅ Complete graph data structure
- ✅ Filtering by significance and type

### Location Tests
- ✅ Location node transformation
- ✅ Hotspot detection (4+ visits)
- ✅ Movement edge transformation
- ✅ Visit count tracking
- ✅ Movement frequency calculation
- ✅ Co-location detection across multiple subjects

### Financial Flow Tests
- ✅ Account transformation with risk-based styling
- ✅ Transaction transformation with amount-scaled edges
- ✅ Circular flow detection (laundering pattern)
- ✅ Layering detection (rapid transactions)
- ✅ Structuring detection (threshold avoidance)
- ✅ High-risk account identification
- ✅ Flagged transaction highlighting

## Pattern Detection Algorithms

### Circular Flows
Detects when money flows in a circle (A → B → C → A), a common money laundering pattern.

**Algorithm:**
- Build adjacency graph of transactions
- Use DFS to find cycles of 3+ accounts
- Classify severity based on cycle length

### Layering
Detects rapid sequential transactions that obscure money origin.

**Algorithm:**
- Group transactions by account and time window (24 hours)
- Identify 5+ transactions in short timespan
- Classify severity based on transaction count (10+ = high)

### Structuring (Smurfing)
Detects breaking large amounts into smaller transactions below reporting thresholds ($10,000).

**Algorithm:**
- Group transactions by account pair and time window (7 days)
- Identify 3+ transactions just below threshold (70-100% of threshold)
- Flag when total significantly exceeds threshold

## Assertion Patterns

### Node Structure
```typescript
expect(node).toHaveProperty('id')
expect(node).toHaveProperty('label')
expect(node).toHaveProperty('type')
expect(node).toHaveProperty('size')
expect(node).toHaveProperty('style')
expect(node).toHaveProperty('originalData')
```

### Edge Structure
```typescript
expect(edge).toHaveProperty('source')
expect(edge).toHaveProperty('target')
expect(edge).toHaveProperty('type', 'line')
expect(edge.style).toHaveProperty('stroke')
expect(edge.style).toHaveProperty('lineWidth')
```

### Graph Data
```typescript
expect(graphData).toHaveProperty('nodes')
expect(graphData).toHaveProperty('edges')
expect(graphData.nodes).toHaveLength(expectedCount)
```

## Adding New Tests

When adding new transformation utilities:

1. Create test file in `__tests__/` directory
2. Import the functions to test
3. Create realistic mock data
4. Write tests for:
   - Basic transformation
   - Edge cases (empty data, null values)
   - Styling logic
   - Filtering operations
   - Statistics calculations
5. Run tests to ensure they pass
6. Update this README

## Continuous Integration

Tests run automatically on:
- Pre-commit hooks
- Pull request creation
- Merge to main branch

All tests must pass before code can be merged.

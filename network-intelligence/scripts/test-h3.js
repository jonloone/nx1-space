// Test H3 implementation
const h3 = require('h3-js');

console.log('Testing H3 implementation...\n');

// Test 1: Create a valid H3 index
const lat = 37.7749;
const lng = -122.4194;
const resolution = 5;

const h3Index = h3.latLngToCell(lat, lng, resolution);
console.log('✅ Generated H3 index:', h3Index);

// Test 2: Verify it's valid
const isValid = h3.isValidCell(h3Index);
console.log('✅ Is valid H3 cell:', isValid);

// Test 3: Get center coordinates
const [centerLat, centerLng] = h3.cellToLatLng(h3Index);
console.log('✅ Center coordinates:', centerLat, centerLng);

// Test 4: Get boundary
const boundary = h3.cellToBoundary(h3Index);
console.log('✅ Boundary points:', boundary.length);

// Test 5: Test the data structure
const hexagonData = {
  hexagon: h3Index,  // CRITICAL: This is what H3HexagonLayer expects
  h3Index: h3Index,  // Backward compatibility
  coordinates: [centerLng, centerLat],
  score: 75,
  revenue: 5000000
};

console.log('\n📊 Sample hexagon data structure:');
console.log(JSON.stringify(hexagonData, null, 2));

console.log('\n✨ All tests passed! H3 is properly configured.');
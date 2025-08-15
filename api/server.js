const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for IP access
  credentials: true
}));
app.use(express.json());

// Mock data
const mockGroundStations = [
  { 
    station_id: 'GS001', 
    name: 'New York Ground Station',
    latitude: 40.7128, 
    longitude: -74.0060, 
    coverage_area_km2: 500, 
    utilization: 0.7, 
    score: 0.65,
    last_updated: new Date().toISOString()
  },
  { 
    station_id: 'GS002', 
    name: 'London Facility',
    latitude: 51.5074, 
    longitude: -0.1278, 
    coverage_area_km2: 800, 
    utilization: 0.9, 
    score: 0.45,
    last_updated: new Date().toISOString()
  },
  { 
    station_id: 'GS003', 
    name: 'Tokyo Operations',
    latitude: 35.6762, 
    longitude: 139.6503, 
    coverage_area_km2: 600, 
    utilization: 0.3, 
    score: 0.85,
    last_updated: new Date().toISOString()
  }
];

// API Routes
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Trino query mock
app.post('/api/query', (req, res) => {
  const { query } = req.body;
  
  // Mock response based on query
  if (query.includes('ground_stations')) {
    res.json({ rows: mockGroundStations });
  } else if (query.includes('maritime')) {
    res.json({ 
      rows: [
        {
          vessel_id: 'V001',
          vessel_name: 'Pacific Explorer',
          vessel_type: 'cargo',
          latitude: 1.3521,
          longitude: 103.8198,
          speed: 15,
          heading: 45,
          risk_score: 0.3,
          timestamp: new Date().toISOString()
        }
      ]
    });
  } else {
    res.json({ rows: [] });
  }
});

// ML predictions mock
app.post('/api/predict', (req, res) => {
  const { entities } = req.body;
  
  const predictions = entities.map(entity => ({
    entityId: entity.id,
    value: Math.random(),
    confidence: 0.75 + Math.random() * 0.2
  }));
  
  res.json({ predictions });
});

// GeoCore API endpoints
app.get('/api/ground-stations/data', (req, res) => {
  res.json({
    stations: mockGroundStations,
    footprints: [],
    coverage: [],
    timestamp: Date.now()
  });
});

app.get('/api/ground-stations/predictions', (req, res) => {
  res.json({
    scores: mockGroundStations.map(s => ({
      ...s,
      confidence: 0.75 + Math.random() * 0.2
    })),
    opportunities: mockGroundStations
      .filter(s => s.score > 0.7)
      .map(s => ({
        ...s,
        opportunity_score: s.score * (1 - s.utilization)
      }))
  });
});

// WebSocket for real-time updates
wss.on('connection', (ws) => {
  console.log('Client connected');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'connected',
    timestamp: new Date().toISOString()
  }));
  
  // Simulate real-time updates
  const interval = setInterval(() => {
    ws.send(JSON.stringify({
      type: 'update',
      domain: 'ground-stations',
      data: {
        station_id: mockGroundStations[Math.floor(Math.random() * mockGroundStations.length)].station_id,
        utilization: Math.random(),
        timestamp: new Date().toISOString()
      }
    }));
  }, 5000);
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  console.log(`API server running on http://${HOST}:${PORT}`);
});
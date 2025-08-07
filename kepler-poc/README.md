# Ground Station Intelligence - Kepler.gl POC

A modern visualization platform for satellite ground station investment analysis using Kepler.gl and React.

## 🚀 Quick Start

### Prerequisites
- Node.js 14+ and npm
- Python 3.7+ (for data transformation)
- Mapbox token (optional - Kepler has defaults)

### Installation

1. **Clone and navigate to the project**
```bash
cd kepler-poc
```

2. **Install dependencies**
```bash
npm install
```

3. **Transform the data**
```bash
python3 data_transformer.py
# This creates kepler_ground_stations.json from our existing data
```

4. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env and add your Mapbox token (optional)
```

5. **Start the development server**
```bash
npm start
```

The app will open at http://localhost:3000

## 🗺️ Features

### Phase 1: Basic Visualization ✅
- [x] Interactive map with 50 commercial ground stations
- [x] Color-coded by investment score (red to green)
- [x] Size represents investment opportunity
- [x] Detailed tooltips with station information
- [x] Stats panel with key metrics

### Phase 2: Enhanced Interactivity 🚧
- [ ] Dynamic filtering by score ranges
- [ ] Viewport-based statistics
- [ ] Multi-layer data views (weather, competition)
- [ ] Export filtered data (CSV, JSON, HTML report)

### Phase 3: AI Intelligence Layer 📅
- [ ] Vultr LLM integration
- [ ] Context-aware insights
- [ ] Pattern detection
- [ ] Investment recommendations

## 📊 Data Overview

The visualization includes:
- **50 commercial ground stations** from major operators
- **Investment scores** (0-100) based on:
  - Market opportunity (40%)
  - Strategic location (30%)
  - Infrastructure quality (15%)
  - Competition analysis (15%)
- **Technical specifications**: Antenna size, G/T, EIRP
- **Service capabilities**: C-band, Ku-band, Ka-band

## 🎨 Visualization Guide

### Map Controls
- **Pan**: Click and drag
- **Zoom**: Scroll or use +/- buttons
- **Rotate**: Right-click and drag
- **Select**: Click on stations for details

### Color Coding
- 🟢 **Green**: Excellent investment (80-100)
- 🟡 **Yellow**: Good investment (70-79)
- 🟠 **Orange**: Moderate investment (60-69)
- 🔴 **Red**: Poor investment (<60)

### Size Mapping
Larger circles indicate higher investment scores

## 🛠️ Development

### Project Structure
```
kepler-poc/
├── src/
│   ├── App.js              # Main application
│   ├── components/
│   │   └── StatsPanel.js   # Statistics panel
│   ├── utils/
│   │   └── exportData.js   # Export utilities
│   └── data/               # Transformed data
├── public/                 # Static assets
├── data_transformer.py     # Data preparation
└── package.json           # Dependencies
```

### Available Scripts
- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `python3 data_transformer.py` - Transform data

### Data Transformation
The `data_transformer.py` script:
1. Loads commercial ground station data
2. Adds Kepler-specific fields (color, radius)
3. Generates proper configuration
4. Exports as JSON for the app

## 🚀 Deployment

### Option 1: Static Hosting
```bash
npm run build
# Deploy the 'build' folder to any static host
```

### Option 2: Docker
```bash
docker build -t ground-station-intel .
docker run -p 3000:3000 ground-station-intel
```

### Option 3: Vultr Instance
Perfect for integrating with Vultr LLM services in Phase 3

## 📈 Phase 2 Implementation Guide

### Adding Filtering
```javascript
// In App.js, add filter state
const [scoreFilter, setScoreFilter] = useState([0, 100]);

// Filter data before display
const filteredData = data.filter(station => 
  station.overall_investment_score >= scoreFilter[0] &&
  station.overall_investment_score <= scoreFilter[1]
);
```

### Viewport Statistics
```javascript
// Listen to map state changes
const handleViewportChange = (viewState) => {
  const visibleStations = filterByViewport(data, viewState);
  updateStats(visibleStations);
};
```

## 🤖 Phase 3: Vultr LLM Integration

### Setup
1. Create Vultr serverless function
2. Deploy LLM model
3. Update `.env` with endpoint
4. Implement `VultrLLMService`

### Usage
```javascript
const insights = await vultrService.generateInsights({
  visibleStations: 10,
  avgScore: 72.5,
  topStation: 'Singapore'
});
```

## 🐛 Troubleshooting

### Common Issues

**Map not loading**
- Check Mapbox token in .env
- Verify internet connection
- Check browser console for errors

**Data not appearing**
- Ensure data_transformer.py ran successfully
- Check src/data/kepler_ground_stations.json exists
- Verify data format in browser console

**Performance issues**
- Reduce number of stations displayed
- Disable 3D buildings in map style
- Use production build

## 📚 Resources

- [Kepler.gl Documentation](https://docs.kepler.gl/)
- [React Documentation](https://reactjs.org/)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/)
- [Vultr API Documentation](https://www.vultr.com/api/)

## 📄 License

This POC uses real commercial ground station locations with illustrative investment analysis methodology.
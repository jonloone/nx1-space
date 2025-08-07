# Running the Ground Station Intelligence App

## Quick Start

1. **Navigate to the kepler-poc directory**:
   ```bash
   cd kepler-poc
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```

4. **Access the app**:
   - The app will automatically open in your browser at `http://localhost:3000`
   - If it doesn't open automatically, manually navigate to `http://localhost:3000`

## Features

- **No API Key Required**: Uses MapLibre with open tile sources (ESRI, CARTO, OSM)
- **Interactive Map**: Visualize 50 commercial ground stations with investment scores
- **Investment Analysis**: Color-coded stations based on investment potential
- **Statistics Panel**: View aggregate statistics and top performers

## Alternative: Build and Serve

If you want to build and serve the production version:

```bash
# Build the app
npm run build

# Install a static server
npm install -g serve

# Serve the build directory
serve -s build -l 3000
```

## Troubleshooting

1. **Port already in use**: If port 3000 is taken, you can specify a different port:
   ```bash
   PORT=3001 npm start
   ```

2. **Dependencies issues**: Clear cache and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Data not loading**: Ensure the data file exists:
   ```bash
   ls src/data/kepler_ground_stations.json
   ```

## Map Styles

The app includes 4 base map options (no API key needed):
- **Satellite**: ESRI World Imagery
- **Dark**: CARTO Dark Matter
- **Light**: CARTO Positron  
- **Street**: OpenStreetMap

You can switch between them using the map style selector in the Kepler.gl interface.
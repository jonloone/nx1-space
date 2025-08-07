// deck.gl Ground Station 3D Visualization
// Using existing commercial ground station data from the POC

// Global state
let groundStationData = [];
let deckgl = null;
let map = null;

// Layer visibility state
const layerVisibility = {
    columns: true,
    points: true,
    labels: true,
    heatmap: false,
    connections: false
};

// Color mapping for investment recommendations
const COLOR_MAPPING = {
    excellent: [0, 255, 0, 200],      // Green
    good: [255, 255, 0, 200],         // Yellow
    moderate: [255, 165, 0, 200],     // Orange
    poor: [255, 0, 0, 200]            // Red
};

// Initialize the MapLibre GL map with dark theme
function initializeMap() {
    map = new maplibregl.Map({
        container: 'map',
        style: {
            version: 8,
            sources: {
                'carto-dark': {
                    type: 'raster',
                    tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
                    tileSize: 256,
                    attribution: '&copy; OpenStreetMap &copy; CartoDB'
                }
            },
            layers: [{
                id: 'carto-dark-layer',
                type: 'raster',
                source: 'carto-dark',
                minzoom: 0,
                maxzoom: 22
            }]
        },
        center: [0, 20],
        zoom: 2.5,
        pitch: 45,
        bearing: 0,
        antialias: true
    });

    // Add navigation controls
    map.addControl(new maplibregl.NavigationControl(), 'top-left');
    
    return map;
}

// Load ground station data
async function loadGroundStationData() {
    try {
        const response = await fetch('/data/kepler_ground_stations.json');
        const rawData = await response.json();
        
        // Process the data for deck.gl
        groundStationData = rawData.data.allData.map(station => ({
            ...station,
            coordinates: [station.longitude, station.latitude],
            // Normalize investment score to 0-100 scale for elevation
            elevation: station.overall_investment_score || 50,
            // Get color based on recommendation
            color: COLOR_MAPPING[station.investment_recommendation] || COLOR_MAPPING.moderate
        }));
        
        console.log(`Loaded ${groundStationData.length} ground stations`);
        return groundStationData;
        
    } catch (error) {
        console.error('Error loading ground station data:', error);
        // Fallback to sample data if needed
        return [];
    }
}

// Create deck.gl layers
function createLayers() {
    const layers = [];
    
    // 3D Column Layer - Height represents investment score
    if (layerVisibility.columns) {
        layers.push(new deck.ColumnLayer({
            id: 'station-columns',
            data: groundStationData,
            diskResolution: 12,
            radius: 50000, // 50km radius
            elevationScale: 3000, // Scale elevation for visibility
            pickable: true,
            extruded: true,
            wireframe: true,
            getPosition: d => d.coordinates,
            getFillColor: d => d.color,
            getLineColor: [255, 255, 255, 255],
            getElevation: d => d.elevation,
            material: {
                ambient: 0.3,
                diffuse: 0.7,
                shininess: 100,
                specularColor: [255, 255, 255]
            },
            transitions: {
                getElevation: {
                    duration: 600,
                    type: 'spring'
                }
            }
        }));
    }
    
    // Scatter Plot Layer - Size represents antenna count
    if (layerVisibility.points) {
        layers.push(new deck.ScatterplotLayer({
            id: 'station-points',
            data: groundStationData,
            pickable: true,
            opacity: 0.8,
            stroked: true,
            filled: true,
            radiusScale: 3000,
            radiusMinPixels: 6,
            radiusMaxPixels: 30,
            lineWidthMinPixels: 2,
            getPosition: d => d.coordinates,
            getRadius: d => Math.sqrt(d.primary_antenna_size_m || 10),
            getFillColor: d => d.color,
            getLineColor: [255, 255, 255, 200],
            transitions: {
                getRadius: {
                    duration: 600,
                    type: 'spring'
                }
            }
        }));
    }
    
    // Text Layer - Station names
    if (layerVisibility.labels) {
        layers.push(new deck.TextLayer({
            id: 'station-labels',
            data: groundStationData,
            pickable: true,
            getPosition: d => [...d.coordinates, d.elevation * 3000],
            getText: d => d.name,
            getSize: 14,
            getAngle: 0,
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'bottom',
            getColor: [255, 255, 255, 255],
            fontFamily: 'Arial',
            fontWeight: 'bold',
            billboard: true,
            sizeScale: 1,
            sizeMinPixels: 10,
            sizeMaxPixels: 20,
            characterSet: 'auto',
            outlineWidth: 2,
            outlineColor: [0, 0, 0, 255]
        }));
    }
    
    // Heatmap Layer - Investment opportunity density
    if (layerVisibility.heatmap) {
        layers.push(new deck.HeatmapLayer({
            id: 'investment-heatmap',
            data: groundStationData,
            getPosition: d => d.coordinates,
            getWeight: d => d.overall_investment_score / 100,
            radiusPixels: 100,
            intensity: 1,
            colorRange: [
                [255, 255, 178],
                [254, 217, 118],
                [254, 178, 76],
                [253, 141, 60],
                [252, 78, 42],
                [227, 26, 28]
            ]
        }));
    }
    
    return layers;
}

// Initialize deck.gl
function initializeDeckGL() {
    deckgl = new deck.DeckOverlay({
        layers: createLayers(),
        getTooltip: ({object}) => object && {
            html: createTooltipHTML(object),
            style: {
                backgroundColor: 'transparent',
                border: 'none'
            }
        },
        onHover: ({object, x, y}) => {
            const tooltip = document.querySelector('.deck-tooltip');
            if (tooltip) {
                tooltip.style.display = object ? 'block' : 'none';
                if (object) {
                    tooltip.style.left = x + 'px';
                    tooltip.style.top = y + 'px';
                }
            }
        }
    });
    
    map.addControl(deckgl);
}

// Create tooltip HTML
function createTooltipHTML(station) {
    const scoreColor = COLOR_MAPPING[station.investment_recommendation] || COLOR_MAPPING.moderate;
    const scoreColorRGB = `rgb(${scoreColor[0]}, ${scoreColor[1]}, ${scoreColor[2]})`;
    
    return `
        <div class="deck-tooltip">
            <div class="tooltip-header">${station.name}</div>
            <div class="tooltip-row">
                <span class="tooltip-label">Operator:</span>
                <span class="tooltip-value">${station.operator}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Location:</span>
                <span class="tooltip-value">${station.country}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Region:</span>
                <span class="tooltip-value">${station.region || 'N/A'}</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Investment Score:</span>
                <span class="tooltip-value">${station.overall_investment_score.toFixed(1)}/100</span>
            </div>
            <div class="tooltip-row">
                <span class="tooltip-label">Recommendation:</span>
                <span class="score-badge" style="background: ${scoreColorRGB}; color: ${station.investment_recommendation === 'good' || station.investment_recommendation === 'moderate' ? '#000' : '#fff'}">
                    ${station.investment_recommendation.toUpperCase()}
                </span>
            </div>
            ${station.primary_antenna_size_m ? `
            <div class="tooltip-row">
                <span class="tooltip-label">Primary Antenna:</span>
                <span class="tooltip-value">${station.primary_antenna_size_m.toFixed(1)}m</span>
            </div>
            ` : ''}
            ${station.frequency_bands ? `
            <div style="margin-top: 12px;">
                <div class="tooltip-label" style="margin-bottom: 6px;">Frequency Bands:</div>
                <span style="color: #4fc3f7;">${station.frequency_bands}</span>
            </div>
            ` : ''}
        </div>
    `;
}

// Update statistics panel
function updateStats() {
    const totalStations = groundStationData.length;
    const recommendations = groundStationData.reduce((acc, station) => {
        acc[station.investment_recommendation] = (acc[station.investment_recommendation] || 0) + 1;
        return acc;
    }, {});
    
    const avgScore = groundStationData.reduce((sum, s) => sum + s.overall_investment_score, 0) / totalStations;
    const operators = [...new Set(groundStationData.map(s => s.operator))].length;
    
    document.getElementById('stats').innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <span class="stat-value">${totalStations}</span>
                <span class="stat-label">Total Stations</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${avgScore.toFixed(1)}</span>
                <span class="stat-label">Avg Score</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${operators}</span>
                <span class="stat-label">Operators</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">${recommendations.excellent || 0}</span>
                <span class="stat-label">Excellent</span>
            </div>
        </div>
    `;
}

// Create legend
function createLegend() {
    document.getElementById('legend').innerHTML = `
        <div class="legend">
            <div class="legend-title">Investment Recommendations</div>
            <div class="legend-item">
                <div class="legend-color score-excellent"></div>
                <span>Excellent (${groundStationData.filter(s => s.investment_recommendation === 'excellent').length})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color score-good"></div>
                <span>Good (${groundStationData.filter(s => s.investment_recommendation === 'good').length})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color score-moderate"></div>
                <span>Moderate (${groundStationData.filter(s => s.investment_recommendation === 'moderate').length})</span>
            </div>
            <div class="legend-item">
                <div class="legend-color score-poor"></div>
                <span>Poor (${groundStationData.filter(s => s.investment_recommendation === 'poor').length})</span>
            </div>
        </div>
    `;
}

// Create controls
function createControls() {
    document.getElementById('controls').innerHTML = `
        <div class="controls">
            <div class="toggle-switch">
                <label>3D Columns</label>
                <div class="switch ${layerVisibility.columns ? 'active' : ''}" 
                     onclick="toggleLayer('columns', this)"></div>
            </div>
            <div class="toggle-switch">
                <label>Station Points</label>
                <div class="switch ${layerVisibility.points ? 'active' : ''}" 
                     onclick="toggleLayer('points', this)"></div>
            </div>
            <div class="toggle-switch">
                <label>Labels</label>
                <div class="switch ${layerVisibility.labels ? 'active' : ''}" 
                     onclick="toggleLayer('labels', this)"></div>
            </div>
            <div class="toggle-switch">
                <label>Heat Map</label>
                <div class="switch ${layerVisibility.heatmap ? 'active' : ''}" 
                     onclick="toggleLayer('heatmap', this)"></div>
            </div>
        </div>
    `;
}

// Toggle layer visibility
window.toggleLayer = function(layerType, element) {
    layerVisibility[layerType] = !layerVisibility[layerType];
    element.classList.toggle('active');
    deckgl.setProps({ layers: createLayers() });
};

// Auto-rotate functionality
let isRotating = false;
function rotateCamera() {
    if (!isRotating) return;
    
    map.setBearing(map.getBearing() + 0.15);
    requestAnimationFrame(rotateCamera);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    switch(e.key.toLowerCase()) {
        case 'r':
            isRotating = !isRotating;
            if (isRotating) rotateCamera();
            break;
        case '1':
            toggleLayer('columns', document.querySelector('.switch'));
            break;
        case '2':
            toggleLayer('points', document.querySelectorAll('.switch')[1]);
            break;
        case '3':
            toggleLayer('labels', document.querySelectorAll('.switch')[2]);
            break;
        case 'h':
            toggleLayer('heatmap', document.querySelectorAll('.switch')[3]);
            break;
    }
});

// Initialize application
async function init() {
    // Show loading
    document.getElementById('map').innerHTML = '<div class="loading"><div class="loading-spinner"></div></div>';
    
    try {
        // Initialize map
        map = initializeMap();
        
        // Wait for map to load
        map.on('load', async () => {
            // Load ground station data
            await loadGroundStationData();
            
            // Initialize deck.gl
            initializeDeckGL();
            
            // Update UI
            updateStats();
            createLegend();
            createControls();
            
            console.log('3D Ground Station visualization loaded successfully');
        });
        
    } catch (error) {
        console.error('Error initializing application:', error);
        document.getElementById('map').innerHTML = '<div class="error">Error loading visualization</div>';
    }
}

// Start the application
init();
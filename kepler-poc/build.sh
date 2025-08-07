#!/bin/bash

echo "🚀 Building Kepler.gl Ground Station Intelligence App"
echo "================================================="

# Create production build directory
mkdir -p production

# Create index.html
cat > production/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Ground Station Intelligence - Kepler.gl</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { margin: 0; font-family: Arial, sans-serif; }
        #root { height: 100vh; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script>
        // Global config
        window.MAPBOX_TOKEN = '';
        window.GROUND_STATION_DATA_URL = '/data/ground_stations.json';
    </script>
    <script src="https://unpkg.com/react@16/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@16/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/redux@4.0.5/dist/redux.min.js"></script>
    <script src="https://unpkg.com/react-redux@7.1.3/dist/react-redux.min.js"></script>
    <script src="https://unpkg.com/styled-components@4.1.3/dist/styled-components.min.js"></script>
    <script src="https://unpkg.com/kepler.gl@2.5.5/umd/keplergl.min.js"></script>
    <script src="/app.js"></script>
</body>
</html>
EOF

# Create app.js
cat > production/app.js << 'EOF'
(function() {
    const { Provider, connect, useDispatch } = ReactRedux;
    const { createStore, combineReducers, applyMiddleware, compose } = Redux;
    const { keplerGlReducer, addDataToMap } = KeplerGl;
    const h = React.createElement;

    // Redux setup
    const initialState = {};
    const reducers = combineReducers({
        keplerGl: keplerGlReducer
    });
    
    const enhancers = [];
    const middlewares = [];
    const composedEnhancers = compose(
        applyMiddleware(...middlewares),
        ...enhancers
    );
    
    const store = createStore(
        reducers,
        initialState,
        composedEnhancers
    );

    // Map component
    class Map extends React.Component {
        componentDidMount() {
            // Load ground station data
            fetch(window.GROUND_STATION_DATA_URL)
                .then(res => res.json())
                .then(data => {
                    this.props.dispatch(
                        addDataToMap({
                            datasets: {
                                info: {
                                    label: 'Commercial Ground Stations',
                                    id: 'ground-stations'
                                },
                                data: data.data.allData
                            },
                            option: {
                                centerMap: true,
                                readOnly: false
                            },
                            config: data.config
                        })
                    );
                });
        }

        render() {
            return h(KeplerGl.default, {
                id: 'ground-stations',
                mapboxApiAccessToken: window.MAPBOX_TOKEN,
                width: window.innerWidth,
                height: window.innerHeight
            });
        }
    }

    const ConnectedMap = connect()(Map);

    // App
    function App() {
        return h(Provider, { store: store },
            h(ConnectedMap)
        );
    }

    // Mount
    ReactDOM.render(h(App), document.getElementById('root'));
})();
EOF

# Copy data
mkdir -p production/data
cp kepler_ground_stations.json production/data/ground_stations.json

echo "✅ Build complete!"
echo ""
echo "To run the app:"
echo "1. cd production"
echo "2. python3 -m http.server 8084"
echo "3. Access at http://YOUR_IP:8084"
EOF
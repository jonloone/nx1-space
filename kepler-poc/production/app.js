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

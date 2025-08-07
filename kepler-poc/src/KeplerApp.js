import React from 'react';
import keplerGlReducer from 'kepler.gl/reducers';
import {createStore, combineReducers, applyMiddleware} from 'redux';
import {taskMiddleware} from 'react-palm/tasks';
import {Provider} from 'react-redux';
import KeplerGl from 'kepler.gl';
import {addDataToMap} from 'kepler.gl/actions';
import groundStationData from './data/kepler_ground_stations.json';

// Create reducer
const reducers = combineReducers({
  keplerGl: keplerGlReducer
});

// Create store
const store = createStore(reducers, {}, applyMiddleware(taskMiddleware));

// Main component
class App extends React.Component {
  componentDidMount() {
    // Load ground station data
    this.props.dispatch(
      addDataToMap({
        datasets: {
          info: {
            label: 'Commercial Ground Stations',
            id: 'ground-stations'
          },
          data: groundStationData.data.allData
        },
        option: {
          centerMap: true,
          readOnly: false
        },
        config: {
          ...groundStationData.config,
          mapStyle: {
            styleType: 'satellite',
            mapStyles: [{
              id: 'satellite',
              label: 'Satellite',
              url: '',
              style: {
                version: 8,
                sources: {
                  'satellite': {
                    type: 'raster',
                    tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
                    tileSize: 256
                  }
                },
                layers: [{
                  id: 'satellite-layer',
                  type: 'raster',
                  source: 'satellite'
                }]
              }
            }]
          }
        }
      })
    );
  }

  render() {
    return (
      <KeplerGl
        id="ground-stations"
        mapboxApiAccessToken=""
        width={window.innerWidth}
        height={window.innerHeight}
      />
    );
  }
}

const ConnectedApp = connect()(App);

// Root component
export default function Root() {
  return (
    <Provider store={store}>
      <ConnectedApp />
    </Provider>
  );
}
import React, { useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import KeplerGl from 'kepler.gl';
import { addDataToMap } from 'kepler.gl/actions';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import keplerGlReducer from 'kepler.gl/reducers';
import { taskMiddleware } from 'react-palm/tasks';
import styled from 'styled-components';
import StatsPanel from './components/StatsPanel';
import groundStationsData from './data/kepler_ground_stations.json';
import { mapStyles } from './config/mapStyles';

// Redux store setup
const initialState = {};
const reducers = combineReducers({
  keplerGl: keplerGlReducer
});
const middlewares = [taskMiddleware];
const store = createStore(reducers, initialState, applyMiddleware(...middlewares));

// Styled components
const AppContainer = styled.div`
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
`;

const MapContainer = styled.div`
  flex: 1;
  position: relative;
`;

const SidePanel = styled.div`
  width: 350px;
  background: #ffffff;
  box-shadow: -2px 0 4px rgba(0,0,0,0.1);
  overflow-y: auto;
  padding: 20px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin: 0 0 20px 0;
  color: #333;
`;

// Map component
function Map() {
  const dispatch = useDispatch();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [selectedData, setSelectedData] = useState(null);

  useEffect(() => {
    // Load ground station data into Kepler
    if (!isDataLoaded && groundStationsData) {
      dispatch(addDataToMap({
        datasets: {
          info: {
            label: 'Commercial Ground Stations',
            id: 'ground-stations'
          },
          data: groundStationsData.data.allData
        },
        option: {
          centerMap: true,
          readOnly: false
        },
        config: groundStationsData.config
      }));
      
      setIsDataLoaded(true);
      
      // Calculate initial statistics
      calculateStats(groundStationsData.data.allData);
    }
  }, [dispatch, isDataLoaded]);

  const calculateStats = (data) => {
    const stats = {
      totalStations: data.length,
      avgScore: data.reduce((sum, d) => sum + d.overall_investment_score, 0) / data.length,
      excellentCount: data.filter(d => d.investment_recommendation === 'excellent').length,
      goodCount: data.filter(d => d.investment_recommendation === 'good').length,
      moderateCount: data.filter(d => d.investment_recommendation === 'moderate').length,
      poorCount: data.filter(d => d.investment_recommendation === 'poor').length,
      topStations: data
        .sort((a, b) => b.overall_investment_score - a.overall_investment_score)
        .slice(0, 5),
      operatorBreakdown: data.reduce((acc, d) => {
        acc[d.operator] = (acc[d.operator] || 0) + 1;
        return acc;
      }, {})
    };
    
    setSelectedData(stats);
  };

  return (
    <AppContainer>
      <MapContainer>
        <KeplerGl
          id="ground-stations"
          mapboxApiAccessToken=""
          mapStylesReplaceDefault={true}
          mapStyles={mapStyles}
          width={window.innerWidth - 350}
          height={window.innerHeight}
        />
      </MapContainer>
      
      <SidePanel>
        <Title>🛰️ Ground Station Intelligence</Title>
        <StatsPanel data={selectedData} />
      </SidePanel>
    </AppContainer>
  );
}

// Main App
function App() {
  return (
    <Provider store={store}>
      <Map />
    </Provider>
  );
}

export default App;
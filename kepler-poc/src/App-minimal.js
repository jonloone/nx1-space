import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import KeplerGl from 'kepler.gl';
import { addDataToMap } from 'kepler.gl/actions';

// Ground station data
import groundStationData from './data/kepler_ground_stations.json';

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Load ground station data into Kepler.gl
    dispatch(
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
        config: groundStationData.config
      })
    );
  }, [dispatch]);

  return (
    <KeplerGl
      id="ground-stations"
      width={window.innerWidth}
      height={window.innerHeight}
      mapStyles={[]}
      mapStylesReplaceDefault={true}
    />
  );
};

export default App;
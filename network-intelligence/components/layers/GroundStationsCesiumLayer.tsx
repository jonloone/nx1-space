'use client'

import React, { useEffect } from 'react';
import * as Cesium from 'cesium';
import { ScatterplotLayer } from '@deck.gl/layers';

interface GroundStation {
  id: string;
  name: string;
  position: [number, number];
  coverageRadiusKm: number;
  utilization: number;
  type: 'gateway' | 'standard';
}

export const useGroundStationLayers = (
  viewer: Cesium.Viewer | null,
  stations: GroundStation[]
) => {
  // Add Cesium entities for 3D visualization
  useEffect(() => {
    if (!viewer) return;

    const entities: Cesium.Entity[] = [];

    stations.forEach(station => {
      // Determine color based on utilization
      const colorString = 
        station.utilization > 70 ? '#22c55e' :
        station.utilization > 40 ? '#f59e0b' : '#ef4444';
      
      // Add coverage circle on globe
      const coverageEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          station.position[0],
          station.position[1],
          0
        ),
        ellipse: {
          semiMinorAxis: station.coverageRadiusKm * 1000,
          semiMajorAxis: station.coverageRadiusKm * 1000,
          height: 0,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND, // Fix: Clamp circles to ground
          material: Cesium.Color.fromCssColorString(colorString).withAlpha(0.2),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(colorString).withAlpha(0.8),
          outlineWidth: 2,
          classificationType: Cesium.ClassificationType.TERRAIN
        }
      });
      
      // Add station point
      const stationEntity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(
          station.position[0],
          station.position[1],
          100
        ),
        point: {
          pixelSize: 10,
          color: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.fromCssColorString(colorString),
          outlineWidth: 2,
          heightReference: Cesium.HeightReference.RELATIVE_TO_GROUND
        },
        label: {
          text: station.name,
          font: '14px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5000000)
        }
      });
      
      entities.push(coverageEntity, stationEntity);
    });

    // Cleanup
    return () => {
      entities.forEach(entity => viewer.entities.remove(entity));
    };
  }, [viewer, stations]);

  // Create Deck.gl layers for additional visualizations
  const createDeckLayers = () => {
    return [
      new ScatterplotLayer({
        id: 'ground-stations',
        data: stations,
        getPosition: (d: GroundStation) => [...d.position, 1000], // Slight elevation
        getRadius: (d: GroundStation) => d.coverageRadiusKm * 1000,
        getFillColor: (d: GroundStation) => {
          if (d.utilization > 70) return [34, 197, 94, 50];
          if (d.utilization > 40) return [245, 158, 11, 50];
          return [239, 68, 68, 50];
        },
        getLineColor: (d: GroundStation) => {
          if (d.utilization > 70) return [34, 197, 94, 200];
          if (d.utilization > 40) return [245, 158, 11, 200];
          return [239, 68, 68, 200];
        },
        stroked: true,
        filled: true,
        radiusMinPixels: 20,
        radiusMaxPixels: 100,
        lineWidthMinPixels: 2
      })
    ];
  };

  return { createDeckLayers };
};
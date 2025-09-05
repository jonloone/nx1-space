import { PathLayer, ScatterplotLayer } from '@deck.gl/layers';
import { CompositeLayer } from '@deck.gl/core';
import { TemporalVesselData, VesselTrip, VesselEncounter } from '@/types/maritime';

interface VesselPathLayerProps {
  id: string;
  vesselTrips: VesselTrip[];
  currentTime?: number;
  showHistoricalPaths?: boolean;
  showCurrentPositions?: boolean;
  showEncounterMarkers?: boolean;
  pathOpacity?: number;
  encounterRadius?: number;
  colorScheme?: 'risk' | 'type' | 'speed' | 'default';
  filterByTimeWindow?: number; // milliseconds
}

export class VesselPathLayer extends CompositeLayer<VesselPathLayerProps> {
  static defaultProps = {
    showHistoricalPaths: true,
    showCurrentPositions: true,
    showEncounterMarkers: true,
    pathOpacity: 0.7,
    encounterRadius: 50,
    colorScheme: 'default',
    filterByTimeWindow: 3600000 // 1 hour
  };

  renderLayers() {
    const {
      vesselTrips,
      currentTime = Date.now(),
      showHistoricalPaths,
      showCurrentPositions,
      showEncounterMarkers,
      pathOpacity,
      encounterRadius,
      colorScheme,
      filterByTimeWindow
    } = this.props;

    const layers = [];

    if (showHistoricalPaths) {
      // Historical paths with time-based filtering
      const pathData = vesselTrips.map(trip => ({
        ...trip,
        visiblePath: this.getVisiblePath(trip, currentTime, filterByTimeWindow!),
        color: this.getVesselColor(trip, colorScheme!)
      })).filter(trip => trip.visiblePath.length > 1);

      layers.push(
        new PathLayer({
          id: `${this.props.id}-historical-paths`,
          data: pathData,
          getPath: (d: any) => d.visiblePath,
          getColor: (d: any) => d.color,
          getWidth: (d: any) => this.getPathWidth(d),
          widthMinPixels: 1,
          widthMaxPixels: 4,
          opacity: pathOpacity,
          pickable: true,
          autoHighlight: true,
          highlightColor: [255, 255, 255, 100],
          updateTriggers: {
            getPath: [currentTime, filterByTimeWindow],
            getColor: [colorScheme],
            getWidth: [colorScheme]
          }
        })
      );
    }

    if (showCurrentPositions) {
      // Current vessel positions
      const currentPositions = vesselTrips.map(trip => {
        const currentPosition = this.getCurrentPosition(trip, currentTime);
        return currentPosition ? {
          ...trip,
          position: currentPosition.position,
          timestamp: currentPosition.timestamp,
          speed: currentPosition.speed,
          heading: currentPosition.heading,
          riskScore: currentPosition.riskScore,
          color: this.getVesselColor(trip, colorScheme!)
        } : null;
      }).filter(Boolean);

      layers.push(
        new ScatterplotLayer({
          id: `${this.props.id}-current-positions`,
          data: currentPositions,
          getPosition: (d: any) => d.position,
          getFillColor: (d: any) => d.color,
          getLineColor: [255, 255, 255, 200],
          getRadius: (d: any) => this.getVesselRadius(d),
          radiusMinPixels: 4,
          radiusMaxPixels: 12,
          lineWidthMinPixels: 1,
          stroked: true,
          filled: true,
          pickable: true,
          autoHighlight: true,
          updateTriggers: {
            getPosition: [currentTime],
            getFillColor: [colorScheme],
            getRadius: [colorScheme]
          }
        })
      );

      // Vessel heading indicators (small arrows)
      layers.push(
        new ScatterplotLayer({
          id: `${this.props.id}-heading-indicators`,
          data: currentPositions.filter(d => d.heading !== undefined),
          getPosition: (d: any) => d.position,
          getFillColor: [255, 255, 255, 150],
          getRadius: 2,
          radiusMinPixels: 2,
          radiusMaxPixels: 4,
          pickable: false,
          updateTriggers: {
            getPosition: [currentTime]
          }
        })
      );
    }

    if (showEncounterMarkers) {
      // Encounter event markers
      const encounterData = vesselTrips.flatMap(trip => 
        (trip.encounters || []).filter(encounter => 
          Math.abs(encounter.timestamp - currentTime) <= filterByTimeWindow!
        ).map(encounter => ({
          ...encounter,
          vesselTrip: trip,
          color: this.getEncounterColor(encounter)
        }))
      );

      if (encounterData.length > 0) {
        layers.push(
          new ScatterplotLayer({
            id: `${this.props.id}-encounter-markers`,
            data: encounterData,
            getPosition: (d: any) => d.location,
            getFillColor: (d: any) => d.color,
            getLineColor: [255, 255, 255, 200],
            getRadius: encounterRadius,
            radiusMinPixels: 6,
            radiusMaxPixels: 20,
            lineWidthMinPixels: 2,
            stroked: true,
            filled: true,
            pickable: true,
            autoHighlight: true,
            opacity: 0.8,
            updateTriggers: {
              getData: [currentTime, filterByTimeWindow],
              getFillColor: [colorScheme]
            }
          })
        );

        // Encounter pulse effect
        layers.push(
          new ScatterplotLayer({
            id: `${this.props.id}-encounter-pulses`,
            data: encounterData,
            getPosition: (d: any) => d.location,
            getFillColor: (d: any) => [...d.color.slice(0, 3), 50],
            getRadius: (d: any) => encounterRadius! * (1 + Math.sin(Date.now() / 500) * 0.5),
            radiusMinPixels: 8,
            radiusMaxPixels: 30,
            filled: true,
            pickable: false,
            opacity: 0.3,
            updateTriggers: {
              getData: [currentTime, filterByTimeWindow],
              getRadius: [Date.now()]
            }
          })
        );
      }
    }

    return layers;
  }

  private getVisiblePath(trip: VesselTrip, currentTime: number, timeWindow: number): [number, number][] {
    if (!trip.timestamps || trip.timestamps.length === 0) {
      return trip.path;
    }

    const startTime = currentTime - timeWindow;
    const endTime = currentTime + timeWindow;

    const visiblePoints: [number, number][] = [];
    
    for (let i = 0; i < trip.timestamps.length; i++) {
      const timestamp = trip.timestamps[i];
      
      if (timestamp >= startTime && timestamp <= endTime) {
        if (i < trip.path.length) {
          visiblePoints.push(trip.path[i]);
        }
      }
    }

    return visiblePoints;
  }

  private getCurrentPosition(trip: VesselTrip, currentTime: number): {
    position: [number, number];
    timestamp: number;
    speed?: number;
    heading?: number;
    riskScore?: number;
  } | null {
    if (!trip.timestamps || trip.timestamps.length === 0) {
      return trip.path.length > 0 ? {
        position: trip.path[trip.path.length - 1],
        timestamp: currentTime
      } : null;
    }

    // Find the closest timestamp
    let closestIndex = 0;
    let minDiff = Math.abs(trip.timestamps[0] - currentTime);

    for (let i = 1; i < trip.timestamps.length; i++) {
      const diff = Math.abs(trip.timestamps[i] - currentTime);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }

    // Interpolate position if between two points
    if (closestIndex < trip.timestamps.length - 1) {
      const currentTimestamp = trip.timestamps[closestIndex];
      const nextTimestamp = trip.timestamps[closestIndex + 1];
      
      if (currentTime > currentTimestamp && currentTime < nextTimestamp) {
        const t = (currentTime - currentTimestamp) / (nextTimestamp - currentTimestamp);
        const currentPos = trip.path[closestIndex];
        const nextPos = trip.path[closestIndex + 1];
        
        return {
          position: [
            currentPos[0] + t * (nextPos[0] - currentPos[0]),
            currentPos[1] + t * (nextPos[1] - currentPos[1])
          ],
          timestamp: currentTime,
          speed: trip.speeds?.[closestIndex],
          heading: trip.headings?.[closestIndex],
          riskScore: trip.riskScores?.[closestIndex]
        };
      }
    }

    return closestIndex < trip.path.length ? {
      position: trip.path[closestIndex],
      timestamp: trip.timestamps[closestIndex],
      speed: trip.speeds?.[closestIndex],
      heading: trip.headings?.[closestIndex],
      riskScore: trip.riskScores?.[closestIndex]
    } : null;
  }

  private getVesselColor(trip: VesselTrip, colorScheme: string): [number, number, number, number] {
    switch (colorScheme) {
      case 'risk':
        const avgRisk = trip.riskScores ? 
          trip.riskScores.reduce((sum, score) => sum + score, 0) / trip.riskScores.length : 50;
        return this.getRiskColor(avgRisk);
      
      case 'speed':
        const avgSpeed = trip.speeds ? 
          trip.speeds.reduce((sum, speed) => sum + speed, 0) / trip.speeds.length : 10;
        return this.getSpeedColor(avgSpeed);
      
      case 'type':
        // Hash vessel ID to get consistent color
        const hash = this.hashString(trip.vesselId);
        return [
          (hash % 200) + 55,
          ((hash >> 8) % 200) + 55,
          ((hash >> 16) % 200) + 55,
          200
        ];
      
      default:
        return [59, 130, 246, 200]; // Blue
    }
  }

  private getRiskColor(riskScore: number): [number, number, number, number] {
    if (riskScore >= 80) return [255, 59, 48, 220];   // Red - Critical
    if (riskScore >= 60) return [255, 149, 0, 200];   // Orange - High
    if (riskScore >= 40) return [255, 204, 0, 180];   // Yellow - Medium
    if (riskScore >= 20) return [52, 199, 89, 160];   // Green - Low
    return [150, 150, 150, 140];                       // Gray - Minimal
  }

  private getSpeedColor(speed: number): [number, number, number, number] {
    // Normalize speed (0-30 knots typical range)
    const normalizedSpeed = Math.max(0, Math.min(30, speed)) / 30;
    
    if (normalizedSpeed > 0.8) return [255, 0, 0, 200];     // Fast - Red
    if (normalizedSpeed > 0.6) return [255, 165, 0, 200];   // Medium-Fast - Orange
    if (normalizedSpeed > 0.4) return [255, 255, 0, 200];   // Medium - Yellow
    if (normalizedSpeed > 0.2) return [0, 255, 0, 200];     // Slow - Green
    return [0, 0, 255, 200];                                 // Very Slow/Stopped - Blue
  }

  private getEncounterColor(encounter: VesselEncounter): [number, number, number, number] {
    switch (encounter.type) {
      case 'sts_transfer':
        return [255, 0, 255, 220]; // Magenta - STS Transfer
      case 'rendezvous':
        return [255, 165, 0, 200]; // Orange - Rendezvous
      case 'close_approach':
        return [255, 255, 0, 180]; // Yellow - Close Approach
      case 'collision_risk':
        return [255, 0, 0, 240];   // Red - Collision Risk
      default:
        return [100, 100, 255, 160]; // Light Blue - Formation/Other
    }
  }

  private getPathWidth(trip: VesselTrip): number {
    // Base width on vessel importance or encounter count
    const baseWidth = 1;
    const encounterBonus = (trip.encounters?.length || 0) * 0.5;
    const avgRisk = trip.riskScores ? 
      trip.riskScores.reduce((sum, score) => sum + score, 0) / trip.riskScores.length : 50;
    const riskBonus = avgRisk / 50;
    
    return Math.max(1, Math.min(4, baseWidth + encounterBonus + riskBonus));
  }

  private getVesselRadius(vessel: any): number {
    const baseRadius = 5;
    const riskBonus = (vessel.riskScore || 50) / 25;
    const speedBonus = (vessel.speed || 10) / 10;
    
    return Math.max(4, Math.min(12, baseRadius + riskBonus + speedBonus));
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

// Factory function for easy integration
export const createVesselPathLayer = (
  id: string,
  vesselTrips: VesselTrip[],
  options: Partial<VesselPathLayerProps> = {}
) => {
  return new VesselPathLayer({
    id,
    vesselTrips,
    ...options
  });
};
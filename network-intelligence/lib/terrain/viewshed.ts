/**
 * Viewshed Analysis and Horizon Calculation
 * Implements line-of-sight and visibility analysis algorithms
 */

import {
  TerrainPoint,
  ViewshedAnalysis,
  HorizonPoint,
  TerrainObstruction,
  ElevationProfile,
  FresnelClearance
} from './types';
import { TerrainDataPipeline } from './data-pipeline';

export class ViewshedCalculator {
  private pipeline: TerrainDataPipeline;
  private readonly EARTH_RADIUS_KM = 6371;
  private readonly REFRACTION_COEFFICIENT = 0.13; // Standard atmospheric refraction

  constructor(pipeline: TerrainDataPipeline) {
    this.pipeline = pipeline;
  }

  /**
   * Calculate viewshed for a given observer point
   */
  async calculateViewshed(
    observer: TerrainPoint,
    maxRange: number,
    observerHeight: number = 30, // meters above ground
    targetHeight: number = 0, // meters above ground
    azimuthStep: number = 1 // degrees
  ): Promise<ViewshedAnalysis> {
    const horizonProfile: HorizonPoint[] = [];
    const obstructions: TerrainObstruction[] = [];
    let visibleArea = 0;

    // Calculate effective observer elevation
    const effectiveObserverElev = observer.elevation + observerHeight;

    // Analyze each azimuth direction
    for (let azimuth = 0; azimuth < 360; azimuth += azimuthStep) {
      // Cast ray in this direction
      const profile = await this.castRay(
        observer,
        azimuth,
        maxRange,
        effectiveObserverElev,
        targetHeight
      );

      // Find horizon point
      const horizonPt = this.findHorizon(profile, effectiveObserverElev);
      horizonProfile.push(horizonPt);

      // Identify obstructions
      const azimuthObstructions = this.identifyObstructions(
        profile,
        effectiveObserverElev,
        azimuth
      );
      obstructions.push(...azimuthObstructions);

      // Calculate visible area contribution
      const sectorArea = this.calculateSectorArea(
        horizonPt.distance_km,
        azimuthStep
      );
      visibleArea += sectorArea;
    }

    // Merge overlapping obstructions
    const mergedObstructions = this.mergeObstructions(obstructions);

    // Calculate coverage percentage
    const maxPossibleArea = Math.PI * maxRange * maxRange;
    const coveragePercentage = (visibleArea / maxPossibleArea) * 100;

    return {
      observer,
      visible_area_km2: visibleArea,
      horizon_profile: horizonProfile,
      max_range_km: maxRange,
      coverage_percentage: coveragePercentage,
      obstructions: mergedObstructions
    };
  }

  /**
   * Calculate elevation profile between two points
   */
  async calculateElevationProfile(
    start: TerrainPoint,
    end: TerrainPoint,
    numPoints: number = 100
  ): Promise<ElevationProfile> {
    const distance = this.haversineDistance(
      start.latitude, start.longitude,
      end.latitude, end.longitude
    );

    const points: TerrainPoint[] = [];
    let minElevation = Infinity;
    let maxElevation = -Infinity;
    let totalAscent = 0;
    let totalDescent = 0;

    // Sample points along the path
    for (let i = 0; i <= numPoints; i++) {
      const fraction = i / numPoints;
      const lat = start.latitude + (end.latitude - start.latitude) * fraction;
      const lon = start.longitude + (end.longitude - start.longitude) * fraction;
      
      const point = await this.pipeline.getElevation(lat, lon);
      points.push(point);

      minElevation = Math.min(minElevation, point.elevation);
      maxElevation = Math.max(maxElevation, point.elevation);

      if (i > 0) {
        const elevDiff = point.elevation - points[i - 1].elevation;
        if (elevDiff > 0) totalAscent += elevDiff;
        else totalDescent += Math.abs(elevDiff);
      }
    }

    // Check line of sight
    const lineOfSight = this.checkLineOfSight(points, start.elevation, end.elevation);

    // Calculate Fresnel zone clearances
    const fresnelClearances = this.calculateFresnelZones(
      points,
      start.elevation,
      end.elevation,
      5.8 // GHz - typical satellite frequency
    );

    return {
      start_point: start,
      end_point: end,
      distance_km: distance,
      points,
      min_elevation: minElevation,
      max_elevation: maxElevation,
      total_ascent: totalAscent,
      total_descent: totalDescent,
      line_of_sight: lineOfSight,
      fresnel_zone_clearance: fresnelClearances
    };
  }

  /**
   * Calculate horizon mask for a location
   */
  async calculateHorizonMask(
    location: TerrainPoint,
    maxRange: number = 50,
    azimuthStep: number = 5,
    antennaHeight: number = 30
  ): Promise<HorizonPoint[]> {
    const mask: HorizonPoint[] = [];
    const effectiveElev = location.elevation + antennaHeight;

    for (let azimuth = 0; azimuth < 360; azimuth += azimuthStep) {
      const profile = await this.castRay(
        location,
        azimuth,
        maxRange,
        effectiveElev,
        0
      );

      const horizon = this.findHorizon(profile, effectiveElev);
      mask.push(horizon);
    }

    return mask;
  }

  /**
   * Cast a ray in a specific direction and get elevation profile
   */
  private async castRay(
    origin: TerrainPoint,
    azimuth: number,
    maxRange: number,
    observerElev: number,
    targetHeight: number
  ): Promise<Array<{point: TerrainPoint, distance: number}>> {
    const profile: Array<{point: TerrainPoint, distance: number}> = [];
    const azimuthRad = azimuth * Math.PI / 180;
    
    // Sample points along the ray
    const sampleDistance = 0.1; // km
    const numSamples = Math.floor(maxRange / sampleDistance);

    for (let i = 1; i <= numSamples; i++) {
      const distance = i * sampleDistance;
      
      // Calculate position using great circle navigation
      const lat2 = Math.asin(
        Math.sin(origin.latitude * Math.PI / 180) * Math.cos(distance / this.EARTH_RADIUS_KM) +
        Math.cos(origin.latitude * Math.PI / 180) * Math.sin(distance / this.EARTH_RADIUS_KM) * 
        Math.cos(azimuthRad)
      );
      
      const lon2 = origin.longitude * Math.PI / 180 + Math.atan2(
        Math.sin(azimuthRad) * Math.sin(distance / this.EARTH_RADIUS_KM) * 
        Math.cos(origin.latitude * Math.PI / 180),
        Math.cos(distance / this.EARTH_RADIUS_KM) - 
        Math.sin(origin.latitude * Math.PI / 180) * Math.sin(lat2)
      );

      const point = await this.pipeline.getElevation(
        lat2 * 180 / Math.PI,
        lon2 * 180 / Math.PI
      );

      profile.push({ point, distance });
    }

    return profile;
  }

  /**
   * Find the horizon point along a ray profile
   */
  private findHorizon(
    profile: Array<{point: TerrainPoint, distance: number}>,
    observerElev: number
  ): HorizonPoint {
    let maxElevationAngle = -90;
    let horizonDistance = 0;
    let horizonObstruction = 0;

    for (const { point, distance } of profile) {
      // Calculate elevation angle considering Earth curvature and refraction
      const targetElev = point.elevation;
      const earthCurvature = this.calculateEarthCurvature(distance);
      const refraction = earthCurvature * this.REFRACTION_COEFFICIENT;
      
      const effectiveTargetElev = targetElev - earthCurvature + refraction;
      const heightDiff = effectiveTargetElev - observerElev;
      const elevationAngle = Math.atan(heightDiff / (distance * 1000)) * 180 / Math.PI;

      if (elevationAngle > maxElevationAngle) {
        maxElevationAngle = elevationAngle;
        horizonDistance = distance;
        horizonObstruction = targetElev;
      }
    }

    // Calculate azimuth from the profile
    const azimuth = this.calculateAzimuth(
      profile[0].point,
      profile[profile.length - 1].point
    );

    return {
      azimuth,
      elevation_angle: maxElevationAngle,
      distance_km: horizonDistance,
      obstruction_height: horizonObstruction
    };
  }

  /**
   * Identify terrain obstructions along a profile
   */
  private identifyObstructions(
    profile: Array<{point: TerrainPoint, distance: number}>,
    observerElev: number,
    azimuth: number
  ): TerrainObstruction[] {
    const obstructions: TerrainObstruction[] = [];
    let inObstruction = false;
    let obstructionStart = 0;
    let maxObstructionHeight = 0;
    let obstructionLocation: TerrainPoint | null = null;

    for (let i = 0; i < profile.length; i++) {
      const { point, distance } = profile[i];
      
      // Calculate line of sight elevation at this distance
      const losElev = this.calculateLineOfSightElevation(
        observerElev,
        distance,
        0 // target elevation
      );

      const isObstructed = point.elevation > losElev;

      if (isObstructed && !inObstruction) {
        // Start of obstruction
        inObstruction = true;
        obstructionStart = azimuth;
        maxObstructionHeight = point.elevation;
        obstructionLocation = point;
      } else if (isObstructed && inObstruction) {
        // Continue obstruction
        if (point.elevation > maxObstructionHeight) {
          maxObstructionHeight = point.elevation;
          obstructionLocation = point;
        }
      } else if (!isObstructed && inObstruction) {
        // End of obstruction
        inObstruction = false;
        
        if (obstructionLocation) {
          obstructions.push({
            location: obstructionLocation,
            type: this.classifyObstruction(maxObstructionHeight - observerElev),
            impact_severity: this.assessImpactSeverity(
              azimuth - obstructionStart,
              maxObstructionHeight - observerElev
            ),
            affected_azimuths: [obstructionStart, azimuth],
            signal_loss_db: this.estimateSignalLoss(maxObstructionHeight - observerElev)
          });
        }
      }
    }

    return obstructions;
  }

  /**
   * Calculate line of sight elevation accounting for Earth curvature
   */
  private calculateLineOfSightElevation(
    observerElev: number,
    distance: number,
    targetElev: number
  ): number {
    const earthCurvature = this.calculateEarthCurvature(distance);
    const refraction = earthCurvature * this.REFRACTION_COEFFICIENT;
    
    // Simple linear interpolation for LOS
    const fraction = distance / 100; // Assuming max 100km
    return observerElev + (targetElev - observerElev) * fraction + 
           earthCurvature - refraction;
  }

  /**
   * Calculate Earth curvature effect
   */
  private calculateEarthCurvature(distanceKm: number): number {
    // h = d² / (2 * R * k)
    // where k accounts for refraction (typically 1.13)
    const k = 1 + this.REFRACTION_COEFFICIENT;
    return (distanceKm * distanceKm) / (2 * this.EARTH_RADIUS_KM * k) * 1000; // meters
  }

  /**
   * Check line of sight between points
   */
  private checkLineOfSight(
    profile: TerrainPoint[],
    startElev: number,
    endElev: number
  ): boolean {
    const totalDistance = this.haversineDistance(
      profile[0].latitude, profile[0].longitude,
      profile[profile.length - 1].latitude, profile[profile.length - 1].longitude
    );

    for (let i = 1; i < profile.length - 1; i++) {
      const distance = this.haversineDistance(
        profile[0].latitude, profile[0].longitude,
        profile[i].latitude, profile[i].longitude
      );
      
      const fraction = distance / totalDistance;
      const losElev = startElev + (endElev - startElev) * fraction;
      
      // Account for Earth curvature
      const curvature = this.calculateEarthCurvature(distance);
      const adjustedLosElev = losElev - curvature * (1 - this.REFRACTION_COEFFICIENT);
      
      if (profile[i].elevation > adjustedLosElev) {
        return false;
      }
    }

    return true;
  }

  /**
   * Calculate Fresnel zone clearances
   */
  private calculateFresnelZones(
    profile: TerrainPoint[],
    startElev: number,
    endElev: number,
    frequencyGHz: number
  ): FresnelClearance[] {
    const clearances: FresnelClearance[] = [];
    const totalDistance = this.haversineDistance(
      profile[0].latitude, profile[0].longitude,
      profile[profile.length - 1].latitude, profile[profile.length - 1].longitude
    );

    const wavelength = 0.3 / frequencyGHz; // meters

    for (let i = 1; i < profile.length - 1; i++) {
      const d1 = this.haversineDistance(
        profile[0].latitude, profile[0].longitude,
        profile[i].latitude, profile[i].longitude
      );
      const d2 = totalDistance - d1;

      // First Fresnel zone radius
      const fresnelRadius = Math.sqrt(wavelength * d1 * d2 / totalDistance) * 1000;

      // Line of sight elevation at this point
      const fraction = d1 / totalDistance;
      const losElev = startElev + (endElev - startElev) * fraction;
      
      // Account for Earth curvature
      const curvature = this.calculateEarthCurvature(d1);
      const adjustedLosElev = losElev - curvature * (1 - this.REFRACTION_COEFFICIENT);

      // Required clearance (60% of first Fresnel zone)
      const requiredClearance = fresnelRadius * 0.6;
      const actualClearance = adjustedLosElev - profile[i].elevation;

      clearances.push({
        distance_km: d1,
        required_clearance_m: requiredClearance,
        actual_clearance_m: actualClearance,
        clearance_ratio: actualClearance / requiredClearance,
        obstructed: actualClearance < requiredClearance
      });
    }

    return clearances;
  }

  /**
   * Merge overlapping obstructions
   */
  private mergeObstructions(obstructions: TerrainObstruction[]): TerrainObstruction[] {
    if (obstructions.length === 0) return [];

    // Sort by starting azimuth
    const sorted = [...obstructions].sort((a, b) => 
      a.affected_azimuths[0] - b.affected_azimuths[0]
    );

    const merged: TerrainObstruction[] = [sorted[0]];

    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];

      // Check for overlap
      if (current.affected_azimuths[0] <= last.affected_azimuths[1]) {
        // Merge
        last.affected_azimuths[1] = Math.max(
          last.affected_azimuths[1],
          current.affected_azimuths[1]
        );
        last.impact_severity = this.maxSeverity(
          last.impact_severity,
          current.impact_severity
        );
        last.signal_loss_db = Math.max(last.signal_loss_db, current.signal_loss_db);
      } else {
        merged.push(current);
      }
    }

    return merged;
  }

  /**
   * Helper methods
   */
  private calculateSectorArea(radius: number, angleDegrees: number): number {
    const angleRad = angleDegrees * Math.PI / 180;
    return 0.5 * radius * radius * angleRad;
  }

  private calculateAzimuth(from: TerrainPoint, to: TerrainPoint): number {
    const dLon = (to.longitude - from.longitude) * Math.PI / 180;
    const lat1 = from.latitude * Math.PI / 180;
    const lat2 = to.latitude * Math.PI / 180;

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) -
              Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    const azimuth = Math.atan2(y, x) * 180 / Math.PI;
    return (azimuth + 360) % 360;
  }

  private classifyObstruction(heightDiff: number): 'mountain' | 'ridge' | 'building' | 'vegetation' {
    if (heightDiff > 500) return 'mountain';
    if (heightDiff > 100) return 'ridge';
    if (heightDiff > 30) return 'building';
    return 'vegetation';
  }

  private assessImpactSeverity(
    azimuthSpan: number,
    heightDiff: number
  ): 'low' | 'medium' | 'high' {
    const score = (azimuthSpan / 30) + (heightDiff / 100);
    if (score > 3) return 'high';
    if (score > 1.5) return 'medium';
    return 'low';
  }

  private estimateSignalLoss(obstructionHeight: number): number {
    // Simplified knife-edge diffraction loss
    // In practice, would use more sophisticated models
    return Math.min(40, obstructionHeight / 10);
  }

  private maxSeverity(a: string, b: string): 'low' | 'medium' | 'high' {
    const severityOrder = { 'low': 0, 'medium': 1, 'high': 2 };
    return (severityOrder[a as keyof typeof severityOrder] > 
            severityOrder[b as keyof typeof severityOrder]) ? 
            a as 'low' | 'medium' | 'high' : b as 'low' | 'medium' | 'high';
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}
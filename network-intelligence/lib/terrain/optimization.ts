/**
 * Terrain-based Optimization Algorithms
 * Multi-objective optimization for satellite ground station site selection
 */

import {
  TerrainPoint,
  TerrainOptimizationParams,
  SiteTerrainAssessment,
  ViewshedAnalysis,
  TerrainMetrics,
  H3TerrainCell
} from './types';
import { TerrainDataPipeline } from './data-pipeline';
import { ViewshedCalculator } from './viewshed';

export interface OptimizationResult {
  optimal_sites: SiteCandidate[];
  pareto_frontier: SiteCandidate[];
  convergence_history: ConvergenceMetric[];
  execution_time_ms: number;
}

export interface SiteCandidate {
  location: TerrainPoint;
  objectives: {
    elevation_score: number;
    visibility_score: number;
    accessibility_score: number;
    cost_score: number;
    risk_score: number;
  };
  overall_score: number;
  rank: number;
  dominates: number; // Number of solutions this candidate dominates
  dominated_by: number; // Number of solutions that dominate this candidate
}

export interface ConvergenceMetric {
  iteration: number;
  best_score: number;
  average_score: number;
  diversity_metric: number;
  improvement_rate: number;
}

export class TerrainOptimizer {
  private pipeline: TerrainDataPipeline;
  private viewshedCalculator: ViewshedCalculator;
  private params: TerrainOptimizationParams;

  constructor(
    pipeline: TerrainDataPipeline,
    viewshedCalculator: ViewshedCalculator,
    params: TerrainOptimizationParams
  ) {
    this.pipeline = pipeline;
    this.viewshedCalculator = viewshedCalculator;
    this.params = params;
  }

  /**
   * Multi-objective optimization using NSGA-II algorithm
   */
  async optimizeSiteSelection(
    searchRegion: {north: number, south: number, east: number, west: number},
    existingSites: TerrainPoint[],
    constraints: {
      min_distance_km?: number;
      max_sites?: number;
      excluded_areas?: Array<{center: TerrainPoint, radius_km: number}>;
    } = {}
  ): Promise<OptimizationResult> {
    const startTime = Date.now();
    const convergenceHistory: ConvergenceMetric[] = [];

    // Initialize population
    let population = await this.initializePopulation(searchRegion, 100);
    
    // Filter by constraints
    population = this.applyConstraints(population, existingSites, constraints);

    // Evolution parameters
    const maxGenerations = 50;
    const mutationRate = 0.1;
    const crossoverRate = 0.8;
    const eliteSize = 10;

    for (let generation = 0; generation < maxGenerations; generation++) {
      // Evaluate objectives for each candidate
      const evaluatedPop = await this.evaluatePopulation(population);
      
      // Non-dominated sorting
      const rankedPop = this.nonDominatedSort(evaluatedPop);
      
      // Calculate crowding distance
      this.calculateCrowdingDistance(rankedPop);
      
      // Track convergence
      convergenceHistory.push(this.calculateConvergenceMetrics(rankedPop, generation));
      
      // Check for convergence
      if (this.hasConverged(convergenceHistory)) {
        break;
      }
      
      // Selection, crossover, and mutation
      const nextGeneration: TerrainPoint[] = [];
      
      // Elitism - keep best solutions
      const elite = rankedPop
        .sort((a, b) => a.rank - b.rank || b.overall_score - a.overall_score)
        .slice(0, eliteSize)
        .map(c => c.location);
      nextGeneration.push(...elite);
      
      // Generate rest of population
      while (nextGeneration.length < population.length) {
        // Tournament selection
        const parent1 = this.tournamentSelection(rankedPop);
        const parent2 = this.tournamentSelection(rankedPop);
        
        // Crossover
        if (Math.random() < crossoverRate) {
          const offspring = this.crossover(parent1.location, parent2.location);
          nextGeneration.push(offspring);
        } else {
          nextGeneration.push(parent1.location);
        }
        
        // Mutation
        if (Math.random() < mutationRate) {
          const lastIdx = nextGeneration.length - 1;
          nextGeneration[lastIdx] = this.mutate(nextGeneration[lastIdx], searchRegion);
        }
      }
      
      population = nextGeneration.slice(0, population.length);
    }

    // Final evaluation and ranking
    const finalEvaluated = await this.evaluatePopulation(population);
    const finalRanked = this.nonDominatedSort(finalEvaluated);
    
    // Extract Pareto frontier (rank 1 solutions)
    const paretoFrontier = finalRanked.filter(s => s.rank === 1);
    
    // Sort all solutions by overall score
    const optimalSites = finalRanked.sort((a, b) => b.overall_score - a.overall_score);

    return {
      optimal_sites: optimalSites.slice(0, constraints.max_sites || 10),
      pareto_frontier: paretoFrontier,
      convergence_history: convergenceHistory,
      execution_time_ms: Date.now() - startTime
    };
  }

  /**
   * Spatial optimization using simulated annealing
   */
  async optimizeSpatialCoverage(
    region: {north: number, south: number, east: number, west: number},
    numSites: number,
    existingSites: TerrainPoint[] = []
  ): Promise<TerrainPoint[]> {
    // Initial solution - random placement
    let currentSolution = await this.generateRandomSites(region, numSites);
    let currentCost = await this.calculateCoverageCost(currentSolution, existingSites);
    
    let bestSolution = [...currentSolution];
    let bestCost = currentCost;
    
    // Simulated annealing parameters
    let temperature = 1000;
    const coolingRate = 0.995;
    const minTemperature = 1;
    
    while (temperature > minTemperature) {
      // Generate neighbor solution
      const neighbor = await this.generateNeighbor(currentSolution, region);
      const neighborCost = await this.calculateCoverageCost(neighbor, existingSites);
      
      // Accept or reject
      const delta = neighborCost - currentCost;
      if (delta < 0 || Math.random() < Math.exp(-delta / temperature)) {
        currentSolution = neighbor;
        currentCost = neighborCost;
        
        // Update best if improved
        if (currentCost < bestCost) {
          bestSolution = [...currentSolution];
          bestCost = currentCost;
        }
      }
      
      // Cool down
      temperature *= coolingRate;
    }
    
    return bestSolution;
  }

  /**
   * H3 hexagon-based optimization
   */
  async optimizeH3Grid(
    h3Indices: string[],
    resolution: number = 5
  ): Promise<H3TerrainCell[]> {
    const h3Cells: H3TerrainCell[] = [];
    
    // Process each H3 cell
    for (const h3Index of h3Indices) {
      // Get cell center (would need H3 library integration)
      const center = this.getH3Center(h3Index);
      
      // Calculate terrain metrics for cell
      const cellBounds = this.getH3Bounds(h3Index);
      const terrainMetrics = await this.pipeline.calculateTerrainMetrics(cellBounds);
      
      // Calculate viewshed for cell center
      const viewshed = await this.viewshedCalculator.calculateViewshed(center, 100);
      
      // Calculate suitability score
      const suitabilityScore = this.calculateH3Suitability(
        center,
        terrainMetrics,
        viewshed
      );
      
      // Get neighboring cells
      const neighbors = this.getH3Neighbors(h3Index);
      
      h3Cells.push({
        h3_index: h3Index,
        resolution,
        center,
        terrain_summary: terrainMetrics,
        site_suitability_score: suitabilityScore,
        neighboring_cells: neighbors,
        coverage_potential: viewshed.visible_area_km2
      });
    }
    
    // Sort by suitability
    return h3Cells.sort((a, b) => b.site_suitability_score - a.site_suitability_score);
  }

  /**
   * Viewshed-based optimization
   */
  async maximizeViewshedCoverage(
    region: {north: number, south: number, east: number, west: number},
    numSites: number,
    targetPoints: TerrainPoint[] = []
  ): Promise<TerrainPoint[]> {
    // Greedy algorithm for viewshed maximization
    const selectedSites: TerrainPoint[] = [];
    const candidateGrid = await this.generateCandidateGrid(region, 50);
    
    while (selectedSites.length < numSites) {
      let bestCandidate: TerrainPoint | null = null;
      let bestImprovement = 0;
      
      // Evaluate each candidate
      for (const candidate of candidateGrid) {
        // Skip if too close to existing sites
        if (this.isTooClose(candidate, selectedSites, 10)) continue;
        
        // Calculate viewshed
        const viewshed = await this.viewshedCalculator.calculateViewshed(candidate, 100);
        
        // Calculate coverage improvement
        const improvement = await this.calculateCoverageImprovement(
          viewshed,
          selectedSites,
          targetPoints
        );
        
        if (improvement > bestImprovement) {
          bestImprovement = improvement;
          bestCandidate = candidate;
        }
      }
      
      if (bestCandidate) {
        selectedSites.push(bestCandidate);
      } else {
        break; // No more viable candidates
      }
    }
    
    return selectedSites;
  }

  /**
   * Population initialization
   */
  private async initializePopulation(
    region: {north: number, south: number, east: number, west: number},
    size: number
  ): Promise<TerrainPoint[]> {
    const population: TerrainPoint[] = [];
    
    // Latin Hypercube Sampling for better initial diversity
    const latSamples = this.latinHypercubeSample(region.south, region.north, size);
    const lonSamples = this.latinHypercubeSample(region.west, region.east, size);
    
    for (let i = 0; i < size; i++) {
      const point = await this.pipeline.getElevation(latSamples[i], lonSamples[i]);
      population.push(point);
    }
    
    return population;
  }

  private latinHypercubeSample(min: number, max: number, n: number): number[] {
    const samples: number[] = [];
    const interval = (max - min) / n;
    
    for (let i = 0; i < n; i++) {
      samples.push(min + interval * (i + Math.random()));
    }
    
    // Shuffle for randomness
    for (let i = samples.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [samples[i], samples[j]] = [samples[j], samples[i]];
    }
    
    return samples;
  }

  /**
   * Objective evaluation
   */
  private async evaluatePopulation(population: TerrainPoint[]): Promise<SiteCandidate[]> {
    const candidates: SiteCandidate[] = [];
    
    for (const location of population) {
      // Get terrain metrics
      const bounds = {
        north: location.latitude + 0.1,
        south: location.latitude - 0.1,
        east: location.longitude + 0.1,
        west: location.longitude - 0.1
      };
      const metrics = await this.pipeline.calculateTerrainMetrics(bounds);
      
      // Calculate viewshed
      const viewshed = await this.viewshedCalculator.calculateViewshed(location, 50);
      
      // Evaluate objectives
      const objectives = this.evaluateObjectives(location, metrics, viewshed);
      
      // Calculate overall score using weighted sum
      const overallScore = this.calculateWeightedScore(objectives);
      
      candidates.push({
        location,
        objectives,
        overall_score: overallScore,
        rank: 0,
        dominates: 0,
        dominated_by: 0
      });
    }
    
    return candidates;
  }

  private evaluateObjectives(
    location: TerrainPoint,
    metrics: TerrainMetrics,
    viewshed: ViewshedAnalysis
  ) {
    // Elevation score (prefer moderate elevations)
    const elevationScore = location.elevation < 100 ? 0.5 :
      location.elevation > 3000 ? Math.max(0, 1 - (location.elevation - 3000) / 2000) :
      1.0;
    
    // Visibility score
    const visibilityScore = Math.min(viewshed.visible_area_km2 / 5000, 1);
    
    // Accessibility score
    const accessibilityScore = Math.max(0, 1 - metrics.slope_average / 30);
    
    // Cost score (inverse of construction difficulty)
    const costScore = 1 - (
      metrics.terrain_ruggedness_index / 500 * 0.5 +
      Math.min(location.elevation / 4000, 1) * 0.5
    );
    
    // Risk score (inverse of environmental risks)
    const riskScore = 1 - (
      Math.min(metrics.slope_average / 45, 1) * 0.3 +
      (location.elevation > 4000 ? 0.3 : 0) +
      (viewshed.obstructions.filter(o => o.impact_severity === 'high').length * 0.1)
    );
    
    return {
      elevation_score: elevationScore,
      visibility_score: visibilityScore,
      accessibility_score: accessibilityScore,
      cost_score: costScore,
      risk_score: riskScore
    };
  }

  private calculateWeightedScore(objectives: any): number {
    const weights = this.params.weight_factors;
    const total = Object.values(weights).reduce((a: any, b: any) => a + b, 0);
    
    return (
      objectives.elevation_score * weights.elevation +
      objectives.visibility_score * weights.visibility +
      objectives.accessibility_score * weights.accessibility +
      objectives.cost_score * weights.construction_cost +
      objectives.risk_score * weights.environmental_risk
    ) / total * 100;
  }

  /**
   * Non-dominated sorting (NSGA-II)
   */
  private nonDominatedSort(candidates: SiteCandidate[]): SiteCandidate[] {
    const n = candidates.length;
    
    // Initialize domination counts
    candidates.forEach(c => {
      c.dominates = 0;
      c.dominated_by = 0;
    });
    
    // Calculate domination relationships
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dominance = this.checkDominance(candidates[i], candidates[j]);
        if (dominance === 1) {
          candidates[i].dominates++;
          candidates[j].dominated_by++;
        } else if (dominance === -1) {
          candidates[j].dominates++;
          candidates[i].dominated_by++;
        }
      }
    }
    
    // Assign ranks
    let currentRank = 1;
    const ranked: SiteCandidate[] = [];
    const remaining = [...candidates];
    
    while (remaining.length > 0) {
      const currentFront = remaining.filter(c => c.dominated_by === 0);
      
      currentFront.forEach(c => {
        c.rank = currentRank;
        ranked.push(c);
      });
      
      // Remove current front and update domination counts
      remaining.splice(0, remaining.length, 
        ...remaining.filter(c => !currentFront.includes(c))
      );
      
      remaining.forEach(c => {
        c.dominated_by = remaining.filter(other => 
          this.checkDominance(other, c) === 1
        ).length;
      });
      
      currentRank++;
    }
    
    return ranked;
  }

  private checkDominance(a: SiteCandidate, b: SiteCandidate): number {
    const objA = Object.values(a.objectives);
    const objB = Object.values(b.objectives);
    
    let betterCount = 0;
    let worseCount = 0;
    
    for (let i = 0; i < objA.length; i++) {
      if (objA[i] > objB[i]) betterCount++;
      else if (objA[i] < objB[i]) worseCount++;
    }
    
    if (betterCount > 0 && worseCount === 0) return 1; // a dominates b
    if (worseCount > 0 && betterCount === 0) return -1; // b dominates a
    return 0; // non-dominated
  }

  /**
   * Crowding distance calculation
   */
  private calculateCrowdingDistance(candidates: SiteCandidate[]): void {
    const ranks = [...new Set(candidates.map(c => c.rank))];
    
    for (const rank of ranks) {
      const front = candidates.filter(c => c.rank === rank);
      if (front.length <= 2) continue;
      
      // For each objective
      const objectives = Object.keys(front[0].objectives);
      
      for (const obj of objectives) {
        // Sort by this objective
        front.sort((a, b) => (a.objectives as any)[obj] - (b.objectives as any)[obj]);
        
        // Boundary points get infinite distance
        const range = (front[front.length - 1].objectives as any)[obj] - 
                     (front[0].objectives as any)[obj];
        
        if (range === 0) continue;
        
        // Calculate distances
        for (let i = 1; i < front.length - 1; i++) {
          const distance = ((front[i + 1].objectives as any)[obj] - 
                          (front[i - 1].objectives as any)[obj]) / range;
          // Add to overall score as tiebreaker
          front[i].overall_score += distance * 0.1;
        }
      }
    }
  }

  /**
   * Genetic operators
   */
  private tournamentSelection(population: SiteCandidate[], tournamentSize: number = 3): SiteCandidate {
    const tournament: SiteCandidate[] = [];
    
    for (let i = 0; i < tournamentSize; i++) {
      const idx = Math.floor(Math.random() * population.length);
      tournament.push(population[idx]);
    }
    
    return tournament.reduce((best, current) => 
      current.rank < best.rank || 
      (current.rank === best.rank && current.overall_score > best.overall_score) 
        ? current : best
    );
  }

  private crossover(parent1: TerrainPoint, parent2: TerrainPoint): TerrainPoint {
    // Uniform crossover
    const alpha = Math.random();
    
    return {
      latitude: alpha * parent1.latitude + (1 - alpha) * parent2.latitude,
      longitude: alpha * parent1.longitude + (1 - alpha) * parent2.longitude,
      elevation: alpha * parent1.elevation + (1 - alpha) * parent2.elevation
    };
  }

  private mutate(
    point: TerrainPoint,
    region: {north: number, south: number, east: number, west: number}
  ): TerrainPoint {
    // Gaussian mutation
    const latRange = region.north - region.south;
    const lonRange = region.east - region.west;
    
    const mutatedLat = point.latitude + (Math.random() - 0.5) * latRange * 0.1;
    const mutatedLon = point.longitude + (Math.random() - 0.5) * lonRange * 0.1;
    
    // Ensure within bounds
    return {
      latitude: Math.max(region.south, Math.min(region.north, mutatedLat)),
      longitude: Math.max(region.west, Math.min(region.east, mutatedLon)),
      elevation: point.elevation // Will be updated when fetched
    };
  }

  /**
   * Convergence checking
   */
  private calculateConvergenceMetrics(
    population: SiteCandidate[],
    iteration: number
  ): ConvergenceMetric {
    const scores = population.map(c => c.overall_score);
    const bestScore = Math.max(...scores);
    const averageScore = scores.reduce((a, b) => a + b) / scores.length;
    
    // Diversity metric (standard deviation)
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - averageScore, 2), 0
    ) / scores.length;
    const diversity = Math.sqrt(variance);
    
    // Improvement rate (would need previous best)
    const improvementRate = iteration === 0 ? 1 : 0.01; // Simplified
    
    return {
      iteration,
      best_score: bestScore,
      average_score: averageScore,
      diversity_metric: diversity,
      improvement_rate: improvementRate
    };
  }

  private hasConverged(history: ConvergenceMetric[]): boolean {
    if (history.length < 10) return false;
    
    // Check if improvement rate is below threshold
    const recent = history.slice(-5);
    const avgImprovement = recent.reduce((sum, m) => sum + m.improvement_rate, 0) / recent.length;
    
    return avgImprovement < 0.001;
  }

  /**
   * Constraint handling
   */
  private applyConstraints(
    population: TerrainPoint[],
    existingSites: TerrainPoint[],
    constraints: any
  ): TerrainPoint[] {
    return population.filter(candidate => {
      // Minimum distance constraint
      if (constraints.min_distance_km) {
        for (const existing of existingSites) {
          const distance = this.haversineDistance(
            candidate.latitude, candidate.longitude,
            existing.latitude, existing.longitude
          );
          if (distance < constraints.min_distance_km) return false;
        }
      }
      
      // Excluded areas
      if (constraints.excluded_areas) {
        for (const area of constraints.excluded_areas) {
          const distance = this.haversineDistance(
            candidate.latitude, candidate.longitude,
            area.center.latitude, area.center.longitude
          );
          if (distance < area.radius_km) return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Helper methods
   */
  private async generateRandomSites(
    region: any,
    count: number
  ): Promise<TerrainPoint[]> {
    const sites: TerrainPoint[] = [];
    
    for (let i = 0; i < count; i++) {
      const lat = region.south + Math.random() * (region.north - region.south);
      const lon = region.west + Math.random() * (region.east - region.west);
      const point = await this.pipeline.getElevation(lat, lon);
      sites.push(point);
    }
    
    return sites;
  }

  private async generateNeighbor(
    solution: TerrainPoint[],
    region: any
  ): Promise<TerrainPoint[]> {
    const neighbor = [...solution];
    const idx = Math.floor(Math.random() * neighbor.length);
    
    // Perturb one site
    const perturbation = 0.01; // 1% of region size
    const latDelta = (Math.random() - 0.5) * (region.north - region.south) * perturbation;
    const lonDelta = (Math.random() - 0.5) * (region.east - region.west) * perturbation;
    
    const newLat = Math.max(region.south, Math.min(region.north, neighbor[idx].latitude + latDelta));
    const newLon = Math.max(region.west, Math.min(region.east, neighbor[idx].longitude + lonDelta));
    
    neighbor[idx] = await this.pipeline.getElevation(newLat, newLon);
    
    return neighbor;
  }

  private async calculateCoverageCost(
    sites: TerrainPoint[],
    existingSites: TerrainPoint[]
  ): Promise<number> {
    // Simplified coverage cost - in practice would calculate actual viewshed overlap
    let totalCoverage = 0;
    let overlapPenalty = 0;
    
    const allSites = [...sites, ...existingSites];
    
    for (let i = 0; i < allSites.length; i++) {
      // Estimate coverage (simplified)
      totalCoverage += 1000; // Base coverage per site
      
      // Calculate overlap penalty
      for (let j = i + 1; j < allSites.length; j++) {
        const distance = this.haversineDistance(
          allSites[i].latitude, allSites[i].longitude,
          allSites[j].latitude, allSites[j].longitude
        );
        
        if (distance < 100) { // Within 100km
          overlapPenalty += (100 - distance) / 100;
        }
      }
    }
    
    // Cost is negative coverage plus penalties
    return -totalCoverage + overlapPenalty * 500;
  }

  private async generateCandidateGrid(
    region: any,
    gridSize: number
  ): Promise<TerrainPoint[]> {
    const candidates: TerrainPoint[] = [];
    const latStep = (region.north - region.south) / gridSize;
    const lonStep = (region.east - region.west) / gridSize;
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = region.south + i * latStep;
        const lon = region.west + j * lonStep;
        const point = await this.pipeline.getElevation(lat, lon);
        candidates.push(point);
      }
    }
    
    return candidates;
  }

  private isTooClose(
    candidate: TerrainPoint,
    existing: TerrainPoint[],
    minDistance: number
  ): boolean {
    for (const site of existing) {
      const distance = this.haversineDistance(
        candidate.latitude, candidate.longitude,
        site.latitude, site.longitude
      );
      if (distance < minDistance) return true;
    }
    return false;
  }

  private async calculateCoverageImprovement(
    viewshed: ViewshedAnalysis,
    existingSites: TerrainPoint[],
    targetPoints: TerrainPoint[]
  ): Promise<number> {
    // Simplified - would calculate actual viewshed overlap
    let improvement = viewshed.visible_area_km2;
    
    // Reduce improvement based on overlap with existing sites
    for (const site of existingSites) {
      const distance = this.haversineDistance(
        viewshed.observer.latitude, viewshed.observer.longitude,
        site.latitude, site.longitude
      );
      
      if (distance < 200) {
        improvement *= (distance / 200); // Linear decay
      }
    }
    
    return improvement;
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

  // H3 placeholder methods - would need actual H3 library
  private getH3Center(h3Index: string): TerrainPoint {
    // Placeholder - would use H3 library
    return { latitude: 0, longitude: 0, elevation: 0 };
  }

  private getH3Bounds(h3Index: string): any {
    // Placeholder - would use H3 library
    return { north: 1, south: -1, east: 1, west: -1 };
  }

  private getH3Neighbors(h3Index: string): string[] {
    // Placeholder - would use H3 library
    return [];
  }

  private calculateH3Suitability(
    center: TerrainPoint,
    metrics: TerrainMetrics,
    viewshed: ViewshedAnalysis
  ): number {
    const objectives = this.evaluateObjectives(center, metrics, viewshed);
    return this.calculateWeightedScore(objectives);
  }
}
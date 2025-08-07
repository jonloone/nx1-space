/**
 * H3 Hexagon Grid Service for Ground Station Opportunity Analysis
 *
 * Generates land-only hexagons at multiple resolutions and calculates opportunity scores
 * based on competition, market potential, weather, satellite coverage, and terrain suitability.
 */
import { latLngToCell, cellToLatLng, cellToBoundary, cellArea } from 'h3-js';
import { getLandCoverageForBounds, isCoastalArea } from '../land-water-detection';
import { ALL_COMPETITOR_STATIONS } from '../data/competitorStations';
export class H3GridService {
    constructor() {
        this.competitorStations = ALL_COMPETITOR_STATIONS;
    }
    /**
     * Generate H3 hexagon opportunity grid for ground station analysis
     */
    generateOpportunityGrid(options) {
        const results = new Map();
        for (const resolution of options.resolutions) {
            const hexagons = this.generateHexagonsForResolution(resolution, options);
            results.set(resolution, hexagons);
        }
        return results;
    }
    /**
     * Generate hexagons for a specific resolution
     */
    generateHexagonsForResolution(resolution, options) {
        const hexagons = [];
        const bounds = options.bounds || {
            minLat: -60,
            maxLat: 75,
            minLon: -180,
            maxLon: 180
        };
        // Generate hex grid over the specified bounds
        const latStep = this.getLatStepForResolution(resolution);
        const lonStep = this.getLonStepForResolution(resolution);
        let processedCount = 0;
        const maxHexagons = options.maxHexagons || 10000;
        for (let lat = bounds.minLat; lat <= bounds.maxLat && processedCount < maxHexagons; lat += latStep) {
            for (let lon = bounds.minLon; lon <= bounds.maxLon && processedCount < maxHexagons; lon += lonStep) {
                // Get H3 index for this coordinate
                const h3Index = latLngToCell(lat, lon, resolution);
                // Skip if we've already processed this hex
                if (hexagons.find(h => h.h3Index === h3Index))
                    continue;
                // Get hex center and boundary
                const [centerLat, centerLon] = cellToLatLng(h3Index);
                const boundary = cellToBoundary(h3Index).map(([lat, lon]) => [lat, lon]);
                // Check land coverage
                const landCoverage = this.calculateHexLandCoverage(boundary);
                // Skip if insufficient land coverage
                if (landCoverage < options.minLandCoverage)
                    continue;
                // Skip coastal-only filter if needed
                if (options.includeCoastalOnly && !isCoastalArea(centerLat, centerLon))
                    continue;
                // Calculate hex area
                const areaKm2 = cellArea(h3Index, 'km2');
                // Create opportunity analysis
                const opportunity = this.analyzeHexagonOpportunity(h3Index, resolution, centerLat, centerLon, boundary, areaKm2, landCoverage);
                hexagons.push(opportunity);
                processedCount++;
            }
        }
        // Sort by overall score (best opportunities first)
        return hexagons.sort((a, b) => b.overallScore - a.overallScore);
    }
    /**
     * Analyze opportunity for a specific hexagon
     */
    analyzeHexagonOpportunity(h3Index, resolution, centerLat, centerLon, boundary, areaKm2, landCoverage) {
        // Geographic analysis
        const isCoastal = isCoastalArea(centerLat, centerLon);
        const country = this.determineCountry(centerLat, centerLon);
        const region = this.determineRegion(centerLat);
        const populationCategory = this.determinePopulationCategory(centerLat, centerLon, areaKm2);
        // Competition analysis
        const competitionAnalysis = this.analyzeCompetition(centerLat, centerLon);
        // Scoring
        const marketScore = this.calculateMarketScore(centerLat, centerLon, country, populationCategory);
        const competitionScore = this.calculateCompetitionScore(competitionAnalysis);
        const weatherScore = this.calculateWeatherScore(centerLat, centerLon, region);
        const coverageScore = this.calculateCoverageScore(centerLat, centerLon);
        const terrainSuitability = this.calculateTerrainSuitability(centerLat, centerLon, isCoastal);
        const accessibilityScore = this.calculateAccessibilityScore(centerLat, centerLon, isCoastal, populationCategory);
        // Overall score (weighted average)
        const overallScore = Math.round(marketScore * 0.25 +
            competitionScore * 0.20 +
            weatherScore * 0.15 +
            coverageScore * 0.15 +
            terrainSuitability * 0.15 +
            accessibilityScore * 0.10);
        // Investment and financial analysis
        const investmentAnalysis = this.calculateInvestmentMetrics(areaKm2, terrainSuitability, isCoastal, populationCategory, overallScore);
        // Risk assessment
        const riskAssessment = this.assessRisks(centerLat, centerLon, country, competitionAnalysis, weatherScore, terrainSuitability);
        return {
            h3Index,
            resolution,
            centerLat,
            centerLon,
            boundary,
            areaKm2,
            landCoverage,
            isCoastal,
            terrainSuitability,
            overallScore,
            marketScore,
            competitionScore,
            weatherScore,
            coverageScore,
            accessibilityScore,
            nearestCompetitor: competitionAnalysis.nearestCompetitor,
            competitorCount5km: competitionAnalysis.competitorCount5km,
            competitorCount25km: competitionAnalysis.competitorCount25km,
            competitorCount100km: competitionAnalysis.competitorCount100km,
            country,
            region,
            populationDensityCategory: populationCategory,
            estimatedInvestment: investmentAnalysis.investment,
            projectedAnnualRevenue: investmentAnalysis.revenue,
            estimatedROI: investmentAnalysis.roi,
            paybackYears: investmentAnalysis.payback,
            riskLevel: riskAssessment.level,
            riskFactors: riskAssessment.factors,
            specialFactors: this.identifySpecialFactors(centerLat, centerLon, isCoastal, country),
            buildingComplexity: this.determineBuildingComplexity(terrainSuitability, isCoastal),
            regulatoryComplexity: this.determineRegulatoryComplexity(country)
        };
    }
    /**
     * Calculate land coverage for hexagon boundary
     */
    calculateHexLandCoverage(boundary) {
        const minLat = Math.min(...boundary.map(([lat]) => lat));
        const maxLat = Math.max(...boundary.map(([lat]) => lat));
        const minLon = Math.min(...boundary.map(([, lon]) => lon));
        const maxLon = Math.max(...boundary.map(([, lon]) => lon));
        return getLandCoverageForBounds(minLat, maxLat, minLon, maxLon, 8);
    }
    /**
     * Analyze competition around a location
     */
    analyzeCompetition(lat, lon) {
        const distances = this.competitorStations.map(station => ({
            station,
            distance: this.calculateDistance(lat, lon, station.coordinates[0], station.coordinates[1])
        }));
        const sortedByDistance = distances.sort((a, b) => a.distance - b.distance);
        return {
            nearestCompetitor: {
                station: sortedByDistance[0]?.station || null,
                distanceKm: sortedByDistance[0]?.distance || Infinity
            },
            competitorCount5km: distances.filter(d => d.distance <= 5).length,
            competitorCount25km: distances.filter(d => d.distance <= 25).length,
            competitorCount100km: distances.filter(d => d.distance <= 100).length
        };
    }
    /**
     * Calculate market opportunity score
     */
    calculateMarketScore(lat, lon, country, populationCategory) {
        let score = 50; // Base score
        // Population density impact
        const populationBonus = {
            urban: 25,
            suburban: 15,
            rural: 5,
            remote: -10
        }[populationCategory] || 0;
        score += populationBonus;
        // Country market attractiveness
        if (country) {
            const marketAttractiveness = {
                'USA': 20,
                'Germany': 18,
                'UK': 17,
                'Japan': 16,
                'Australia': 15,
                'Canada': 15,
                'France': 14,
                'South Korea': 13,
                'Singapore': 12,
                'Brazil': 10,
                'India': 8,
                'Mexico': 6,
                'Turkey': 5,
                'South Africa': 4,
                'Indonesia': 3,
                'Nigeria': 2
            }[country] || 0;
            score += marketAttractiveness;
        }
        // Regional factors
        if (Math.abs(lat) < 30) { // Equatorial region
            score += 5; // Higher satellite visibility
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Calculate competition score (higher = less competition = better)
     */
    calculateCompetitionScore(competitionAnalysis) {
        let score = 100; // Start with maximum (no competition)
        // Distance to nearest competitor
        const nearestDistance = competitionAnalysis.nearestCompetitor.distanceKm;
        if (nearestDistance < 50) {
            score -= 40;
        }
        else if (nearestDistance < 100) {
            score -= 25;
        }
        else if (nearestDistance < 200) {
            score -= 10;
        }
        // Number of competitors in various radii
        score -= competitionAnalysis.competitorCount5km * 20; // Heavy penalty for very close competitors
        score -= competitionAnalysis.competitorCount25km * 10; // Medium penalty for close competitors
        score -= competitionAnalysis.competitorCount100km * 3; // Light penalty for nearby competitors
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Calculate weather suitability score
     */
    calculateWeatherScore(lat, lon, region) {
        let score = 80; // Base good weather score
        // Latitude-based weather patterns
        const absLat = Math.abs(lat);
        // Extreme latitudes have harsh weather
        if (absLat > 60) {
            score -= 30; // Arctic conditions
        }
        else if (absLat > 45) {
            score -= 10; // Cold climates
        }
        // Equatorial regions have more storms
        if (absLat < 15) {
            score -= 15; // Tropical storms, heavy rain
        }
        // Monsoon regions (simplified)
        if ((lat > 5 && lat < 35 && lon > 60 && lon < 140) || // South/Southeast Asia
            (lat > -25 && lat < 25 && lon > -60 && lon < -30)) { // South America
            score -= 10;
        }
        // Desert regions (better for ground stations)
        if ((lat > 15 && lat < 35 && lon > -15 && lon < 45) || // North Africa/Middle East
            (lat > 25 && lat < 40 && lon > -125 && lon < -100)) { // Southwest US
            score += 10;
        }
        return Math.max(20, Math.min(100, score));
    }
    /**
     * Calculate satellite coverage quality score
     */
    calculateCoverageScore(lat, lon) {
        let score = 70; // Base coverage score
        const absLat = Math.abs(lat);
        // Optimal coverage zones
        if (absLat >= 30 && absLat <= 50) {
            score += 20; // Excellent GEO coverage
        }
        else if (absLat >= 15 && absLat <= 60) {
            score += 10; // Good coverage
        }
        else if (absLat > 60) {
            score -= 20; // Poor GEO coverage, but good for polar LEO
        }
        // LEO constellation advantages at higher latitudes
        if (absLat > 50) {
            score += 15; // Starlink and other LEO constellations
        }
        return Math.max(0, Math.min(100, score));
    }
    /**
     * Calculate terrain suitability score
     */
    calculateTerrainSuitability(lat, lon, isCoastal) {
        let score = 75; // Base suitability
        // Coastal areas are generally good for ground stations
        if (isCoastal) {
            score += 10;
        }
        // Mountain regions (simplified detection)
        if (this.isMountainousRegion(lat, lon)) {
            score -= 15; // Challenging terrain but possible
        }
        // Desert regions are excellent
        if (this.isDesertRegion(lat, lon)) {
            score += 15;
        }
        // Flood-prone areas
        if (this.isFloodProneRegion(lat, lon)) {
            score -= 10;
        }
        return Math.max(30, Math.min(100, score));
    }
    /**
     * Calculate accessibility score
     */
    calculateAccessibilityScore(lat, lon, isCoastal, populationCategory) {
        let score = 60; // Base accessibility
        // Population category indicates infrastructure access
        const accessibilityBonus = {
            urban: 25,
            suburban: 15,
            rural: 5,
            remote: -15
        }[populationCategory] || 0;
        score += accessibilityBonus;
        // Coastal areas typically have better access
        if (isCoastal) {
            score += 10;
        }
        // Extreme latitudes are less accessible
        if (Math.abs(lat) > 60) {
            score -= 20;
        }
        return Math.max(10, Math.min(100, score));
    }
    /**
     * Calculate investment metrics
     */
    calculateInvestmentMetrics(areaKm2, terrainSuitability, isCoastal, populationCategory, overallScore) {
        // Base investment (varies by resolution/area)
        let baseInvestment = 5000000; // $5M base
        if (areaKm2 > 200)
            baseInvestment = 15000000; // Large teleport
        else if (areaKm2 > 40)
            baseInvestment = 8000000; // Regional facility
        else if (areaKm2 > 5)
            baseInvestment = 6000000; // Metro facility
        // Terrain impact on construction costs
        const terrainMultiplier = 1 + (100 - terrainSuitability) / 200;
        // Accessibility impact
        const accessibilityMultiplier = {
            urban: 1.0,
            suburban: 1.1,
            rural: 1.3,
            remote: 1.6
        }[populationCategory] || 1.2;
        const investment = Math.round(baseInvestment * terrainMultiplier * accessibilityMultiplier);
        // Revenue projection based on market opportunity
        const baseAnnualRevenue = 2000000; // $2M base
        const marketMultiplier = overallScore / 50; // Scale with opportunity score
        const revenue = Math.round(baseAnnualRevenue * marketMultiplier);
        // ROI calculation
        const roi = Math.round((revenue / investment) * 100);
        const payback = Math.round(investment / revenue);
        return {
            investment,
            revenue,
            roi,
            payback
        };
    }
    /**
     * Assess risks for location
     */
    assessRisks(lat, lon, country, competitionAnalysis, weatherScore, terrainSuitability) {
        const factors = [];
        let riskScore = 0;
        // Weather risks
        if (weatherScore < 60) {
            factors.push('Severe weather conditions');
            riskScore += 20;
        }
        // Terrain risks
        if (terrainSuitability < 60) {
            factors.push('Challenging terrain for construction');
            riskScore += 15;
        }
        // Competition risks
        if (competitionAnalysis.competitorCount25km > 2) {
            factors.push('High local competition');
            riskScore += 25;
        }
        // Geopolitical risks
        const highRiskCountries = ['Russia', 'China', 'Iran', 'North Korea', 'Venezuela'];
        const mediumRiskCountries = ['Turkey', 'Pakistan', 'Myanmar', 'Belarus', 'Sudan'];
        if (country && highRiskCountries.includes(country)) {
            factors.push('High geopolitical risk');
            riskScore += 30;
        }
        else if (country && mediumRiskCountries.includes(country)) {
            factors.push('Medium geopolitical risk');
            riskScore += 15;
        }
        // Remote location risks
        if (Math.abs(lat) > 60) {
            factors.push('Extreme latitude operational challenges');
            riskScore += 20;
        }
        // Determine risk level
        let level;
        if (riskScore < 20)
            level = 'low';
        else if (riskScore < 40)
            level = 'medium';
        else if (riskScore < 60)
            level = 'high';
        else
            level = 'very_high';
        return { level, factors };
    }
    // Helper methods
    getLatStepForResolution(resolution) {
        // Approximate degree steps for efficient sampling
        const steps = { 4: 4, 5: 2, 6: 1, 7: 0.5 };
        return steps[resolution] || 1;
    }
    getLonStepForResolution(resolution) {
        // Same as lat step for simplicity
        return this.getLatStepForResolution(resolution);
    }
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    determineCountry(lat, lon) {
        // Simplified country detection based on bounding boxes
        // This would ideally use a proper geolocation service
        if (lat >= 25 && lat <= 49 && lon >= -125 && lon <= -66)
            return 'USA';
        if (lat >= 50 && lat <= 71 && lon >= -10 && lon <= 2)
            return 'UK';
        if (lat >= 47 && lat <= 55 && lon >= 6 && lon <= 15)
            return 'Germany';
        if (lat >= 30 && lat <= 46 && lon >= 129 && lon <= 146)
            return 'Japan';
        if (lat >= -44 && lat <= -10 && lon >= 113 && lon <= 154)
            return 'Australia';
        if (lat >= 42 && lat <= 70 && lon >= -141 && lon <= -52)
            return 'Canada';
        if (lat >= 41 && lat <= 51 && lon >= -5 && lon <= 9)
            return 'France';
        if (lat >= 33 && lat <= 39 && lon >= 125 && lon <= 130)
            return 'South Korea';
        if (lat >= 1 && lat <= 2 && lon >= 103 && lon <= 104)
            return 'Singapore';
        if (lat >= -34 && lat <= 5 && lon >= -74 && lon <= -34)
            return 'Brazil';
        if (lat >= 8 && lat <= 37 && lon >= 68 && lon <= 97)
            return 'India';
        if (lat >= 14 && lat <= 33 && lon >= -118 && lon <= -86)
            return 'Mexico';
        if (lat >= 36 && lat <= 42 && lon >= 26 && lon <= 45)
            return 'Turkey';
        if (lat >= -35 && lat <= -22 && lon >= 16 && lon <= 33)
            return 'South Africa';
        if (lat >= -11 && lat <= 6 && lon >= 95 && lon <= 141)
            return 'Indonesia';
        if (lat >= 4 && lat <= 14 && lon >= 3 && lon <= 15)
            return 'Nigeria';
        return null;
    }
    determineRegion(lat) {
        if (lat > 23.5)
            return 'Northern';
        if (lat < -23.5)
            return 'Southern';
        return 'Equatorial';
    }
    determinePopulationCategory(lat, lon, areaKm2) {
        // Simplified population density estimation based on known urban centers and area size
        const majorCities = [
            { lat: 40.7128, lon: -74.0060, name: 'New York' },
            { lat: 51.5074, lon: -0.1278, name: 'London' },
            { lat: 35.6762, lon: 139.6503, name: 'Tokyo' },
            { lat: 37.7749, lon: -122.4194, name: 'San Francisco' },
            { lat: 52.5200, lon: 13.4050, name: 'Berlin' },
            { lat: -33.8688, lon: 151.2093, name: 'Sydney' },
            { lat: 1.3521, lon: 103.8198, name: 'Singapore' },
            { lat: 19.0760, lon: 72.8777, name: 'Mumbai' },
            { lat: -23.5505, lon: -46.6333, name: 'São Paulo' }
        ];
        // Find distance to nearest major city
        let minDistance = Infinity;
        for (const city of majorCities) {
            const distance = this.calculateDistance(lat, lon, city.lat, city.lon);
            minDistance = Math.min(minDistance, distance);
        }
        // Categorize based on distance to cities and hex size
        if (minDistance < 25 && areaKm2 < 10)
            return 'urban';
        if (minDistance < 100 && areaKm2 < 50)
            return 'suburban';
        if (minDistance < 500)
            return 'rural';
        return 'remote';
    }
    isMountainousRegion(lat, lon) {
        // Simplified mountain region detection
        const mountainRegions = [
            { minLat: 25, maxLat: 50, minLon: -125, maxLon: -100 }, // US Rockies
            { minLat: 40, maxLat: 50, minLon: -10, maxLon: 20 }, // European Alps
            { minLat: 25, maxLat: 40, minLon: 60, maxLon: 100 }, // Himalayas
            { minLat: -25, maxLat: -10, minLon: -80, maxLon: -60 } // Andes
        ];
        return mountainRegions.some(region => lat >= region.minLat && lat <= region.maxLat &&
            lon >= region.minLon && lon <= region.maxLon);
    }
    isDesertRegion(lat, lon) {
        // Simplified desert region detection
        const desertRegions = [
            { minLat: 15, maxLat: 35, minLon: -15, maxLon: 45 }, // Sahara/Arabian
            { minLat: 25, maxLat: 40, minLon: -125, maxLon: -100 }, // Southwest US
            { minLat: -30, maxLat: -20, minLon: 115, maxLon: 140 } // Australian outback
        ];
        return desertRegions.some(region => lat >= region.minLat && lat <= region.maxLat &&
            lon >= region.minLon && lon <= region.maxLon);
    }
    isFloodProneRegion(lat, lon) {
        // Simplified flood-prone area detection
        const floodRegions = [
            { minLat: 20, maxLat: 30, minLon: 85, maxLon: 95 }, // Bangladesh/Eastern India
            { minLat: 25, maxLat: 35, minLon: -95, maxLon: -85 }, // US Gulf Coast
            { minLat: -10, maxLat: 0, minLon: -70, maxLon: -50 } // Amazon Basin
        ];
        return floodRegions.some(region => lat >= region.minLat && lat <= region.maxLat &&
            lon >= region.minLon && lon <= region.maxLon);
    }
    identifySpecialFactors(lat, lon, isCoastal, country) {
        const factors = [];
        if (isCoastal)
            factors.push('Coastal location advantage');
        if (Math.abs(lat) > 60)
            factors.push('Polar satellite coverage specialist');
        if (Math.abs(lat) < 15)
            factors.push('Equatorial orbit access');
        if (this.isDesertRegion(lat, lon))
            factors.push('Excellent weather conditions');
        if (country === 'Singapore' || country === 'UAE')
            factors.push('Strategic regional hub location');
        if (Math.abs(lat) > 50 && (country === 'Canada' || country === 'Norway' || country === 'Finland')) {
            factors.push('Arctic research and monitoring opportunity');
        }
        return factors;
    }
    determineBuildingComplexity(terrainSuitability, isCoastal) {
        if (terrainSuitability > 80)
            return 'low';
        if (terrainSuitability > 60)
            return 'medium';
        return 'high';
    }
    determineRegulatoryComplexity(country) {
        if (!country)
            return 'medium';
        const lowComplexity = ['Singapore', 'UAE', 'Canada', 'Australia', 'UK', 'Germany', 'France'];
        const highComplexity = ['China', 'Russia', 'Iran', 'North Korea', 'Venezuela', 'Myanmar'];
        if (lowComplexity.includes(country))
            return 'low';
        if (highComplexity.includes(country))
            return 'high';
        return 'medium';
    }
    /**
     * Get top opportunities from generated grid
     */
    getTopOpportunities(opportunityGrid, count = 50) {
        const allOpportunities = [];
        // Collect all opportunities from all resolutions
        opportunityGrid.forEach((hexagons, resolution) => {
            allOpportunities.push(...hexagons);
        });
        // Sort by overall score and return top opportunities
        return allOpportunities
            .sort((a, b) => b.overallScore - a.overallScore)
            .slice(0, count);
    }
    /**
     * Filter opportunities by criteria
     */
    filterOpportunities(opportunities, criteria) {
        return opportunities.filter(opp => {
            if (criteria.minScore && opp.overallScore < criteria.minScore)
                return false;
            if (criteria.maxRiskLevel) {
                const riskLevels = ['low', 'medium', 'high', 'very_high'];
                if (riskLevels.indexOf(opp.riskLevel) > riskLevels.indexOf(criteria.maxRiskLevel))
                    return false;
            }
            if (criteria.regions && !criteria.regions.includes(opp.region))
                return false;
            if (criteria.countries && opp.country && !criteria.countries.includes(opp.country))
                return false;
            if (criteria.minROI && opp.estimatedROI < criteria.minROI)
                return false;
            if (criteria.maxInvestment && opp.estimatedInvestment > criteria.maxInvestment)
                return false;
            return true;
        });
    }
}
/**
 * Create H3 grid service instance
 */
export const h3GridService = new H3GridService();
/**
 * Convenience function to generate opportunity analysis for common use cases
 */
export function generateGroundStationOpportunities(options) {
    const service = h3GridService;
    const resolutions = options.resolutions || [4, 5, 6, 7];
    let opportunityGrid;
    if (options.globalAnalysis) {
        // Global analysis
        opportunityGrid = service.generateOpportunityGrid({
            resolutions,
            minLandCoverage: 75,
            maxHexagons: options.maxOpportunities || 1000
        });
    }
    else if (options.focusRegions) {
        // Region-specific analysis
        opportunityGrid = new Map();
        for (const resolution of resolutions) {
            const allHexagons = [];
            for (const region of options.focusRegions) {
                const regionGrid = service.generateOpportunityGrid({
                    resolutions: [resolution],
                    bounds: region.bounds,
                    minLandCoverage: 60,
                    maxHexagons: Math.floor((options.maxOpportunities || 1000) / options.focusRegions.length)
                });
                const regionHexagons = regionGrid.get(resolution) || [];
                allHexagons.push(...regionHexagons);
            }
            opportunityGrid.set(resolution, allHexagons);
        }
    }
    else {
        // Default focused analysis on high-opportunity regions
        const focusRegions = [
            { name: 'North America', bounds: { minLat: 25, maxLat: 60, minLon: -140, maxLon: -60 } },
            { name: 'Europe', bounds: { minLat: 35, maxLat: 70, minLon: -10, maxLon: 40 } },
            { name: 'Asia Pacific', bounds: { minLat: -10, maxLat: 50, minLon: 95, maxLon: 180 } },
            { name: 'South America', bounds: { minLat: -35, maxLat: 15, minLon: -85, maxLon: -35 } }
        ];
        return generateGroundStationOpportunities({
            ...options,
            focusRegions
        });
    }
    const topOpportunities = service.getTopOpportunities(opportunityGrid, options.maxOpportunities || 50);
    // Generate summary statistics
    const allHexagons = [];
    opportunityGrid.forEach((hexagons) => {
        allHexagons.push(...hexagons);
    });
    const summary = {
        totalHexagons: allHexagons.length,
        averageScore: Math.round(allHexagons.reduce((sum, h) => sum + h.overallScore, 0) / allHexagons.length),
        opportunitiesByRegion: allHexagons.reduce((acc, h) => {
            acc[h.region] = (acc[h.region] || 0) + 1;
            return acc;
        }, {}),
        totalInvestmentPotential: allHexagons.reduce((sum, h) => sum + h.estimatedInvestment, 0),
        totalRevenuePotential: allHexagons.reduce((sum, h) => sum + h.projectedAnnualRevenue, 0)
    };
    return {
        opportunityGrid,
        topOpportunities,
        summary
    };
}

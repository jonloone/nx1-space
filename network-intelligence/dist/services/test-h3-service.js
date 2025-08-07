/**
 * Test script for H3 Grid Service
 */
import { generateGroundStationOpportunities, h3GridService } from './h3GridService';
// Test the H3 Grid Service
console.log('Testing H3 Grid Service...');
try {
    // Test 1: Small regional analysis
    console.log('Test 1: Regional analysis around major cities');
    const regionalAnalysis = generateGroundStationOpportunities({
        resolutions: [5, 6], // Medium resolutions for testing
        focusRegions: [
            {
                name: 'Northeast US',
                bounds: { minLat: 35, maxLat: 45, minLon: -80, maxLon: -65 }
            },
            {
                name: 'Western Europe',
                bounds: { minLat: 45, maxLat: 55, minLon: -5, maxLon: 15 }
            }
        ],
        maxOpportunities: 50
    });
    console.log('Regional Analysis Results:');
    console.log('- Total hexagons analyzed:', regionalAnalysis.summary.totalHexagons);
    console.log('- Average opportunity score:', regionalAnalysis.summary.averageScore);
    console.log('- Top 5 opportunities:');
    regionalAnalysis.topOpportunities.slice(0, 5).forEach((opp, index) => {
        console.log(`  ${index + 1}. Score: ${opp.overallScore}, Location: [${opp.centerLat.toFixed(2)}, ${opp.centerLon.toFixed(2)}], Country: ${opp.country || 'Unknown'}`);
        console.log(`     Investment: $${(opp.estimatedInvestment / 1000000).toFixed(1)}M, ROI: ${opp.estimatedROI}%, Risk: ${opp.riskLevel}`);
    });
    console.log('\nTest 2: Filter high-quality opportunities');
    const filteredOpportunities = h3GridService.filterOpportunities(regionalAnalysis.topOpportunities, {
        minScore: 70,
        maxRiskLevel: 'medium',
        minROI: 15
    });
    console.log(`- Found ${filteredOpportunities.length} high-quality opportunities`);
    if (filteredOpportunities.length > 0) {
        const best = filteredOpportunities[0];
        console.log('Best filtered opportunity:');
        console.log(`- Location: [${best.centerLat.toFixed(4)}, ${best.centerLon.toFixed(4)}]`);
        console.log(`- Country: ${best.country || 'Unknown'}`);
        console.log(`- Overall Score: ${best.overallScore}`);
        console.log(`- Market Score: ${best.marketScore}`);
        console.log(`- Competition Score: ${best.competitionScore}`);
        console.log(`- Weather Score: ${best.weatherScore}`);
        console.log(`- Coverage Score: ${best.coverageScore}`);
        console.log(`- Terrain Suitability: ${best.terrainSuitability}`);
        console.log(`- Nearest Competitor: ${best.nearestCompetitor.distanceKm.toFixed(1)}km (${best.nearestCompetitor.station?.name || 'None'})`);
        console.log(`- Estimated Investment: $${(best.estimatedInvestment / 1000000).toFixed(2)}M`);
        console.log(`- Projected Annual Revenue: $${(best.projectedAnnualRevenue / 1000000).toFixed(2)}M`);
        console.log(`- ROI: ${best.estimatedROI}%`);
        console.log(`- Payback Period: ${best.paybackYears} years`);
        console.log(`- Risk Level: ${best.riskLevel}`);
        console.log(`- Special Factors: ${best.specialFactors.join(', ') || 'None'}`);
    }
    console.log('\nH3 Grid Service test completed successfully!');
}
catch (error) {
    console.error('Error testing H3 Grid Service:', error);
    if (error instanceof Error) {
        console.error(error.stack);
    }
}

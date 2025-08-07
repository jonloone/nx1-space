"use client";

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Globe, 
  Satellite,
  TrendingUp,
  Target,
  Users,
  ArrowRight,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { 
  ENHANCED_OPPORTUNITY_SUMMARY,
  analyzeGlobalCompetitiveLandscape 
} from '@/lib/data/precomputed-opportunity-scores';
import { COMPETITOR_INTELLIGENCE_SUMMARY } from '@/lib/data/competitorStations';

export default function HomePage() {
  const competitiveData = analyzeGlobalCompetitiveLandscape();
  
  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-900 via-purple-900 to-black">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold text-white">
                Network Intelligence Platform
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                AI-powered ground station analysis with competitive intelligence. 
                Analyze 32 real SES and Intelsat stations plus {COMPETITOR_INTELLIGENCE_SUMMARY.totalCompetitorStations} competitor facilities across AWS, Starlink, Telesat, and KSAT.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/enhanced-map">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg shadow-lg">
                  <Globe className="h-5 w-5 mr-2" />
                  Enhanced Intelligence Map
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/opportunity-analysis">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  <Target className="h-5 w-5 mr-2" />
                  Multi-Agent Opportunity Analysis
                </Button>
              </Link>
              <Link href="/simple">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Interactive BI Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Advanced Ground Station Intelligence
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Comprehensive analysis powered by domain experts, data scientists, and developer agents
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Users className="h-6 w-6 text-blue-500" />
                Multi-Agent System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                6 specialized AI agents: SATOPS experts, fleet analysts, market intelligence, 
                and data integration specialists working in coordination.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-blue-400">• Domain Expertise Agents</div>
                <div className="text-sm text-green-400">• Data Science Agents</div>
                <div className="text-sm text-purple-400">• Developer Support Agents</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Satellite className="h-6 w-6 text-green-500" />
                Real Infrastructure Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                Analysis of 32 real ground stations from SES (15) and Intelsat (17) 
                with operational metrics and financial data.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-blue-400">• Live utilization patterns</div>
                <div className="text-sm text-green-400">• Financial performance</div>
                <div className="text-sm text-purple-400">• Technical capabilities</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <TrendingUp className="h-6 w-6 text-orange-500" />
                Investment Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                Comprehensive opportunity scoring with market analysis, competitive positioning, 
                and actionable investment recommendations.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-blue-400">• Opportunity scoring (0-100)</div>
                <div className="text-sm text-green-400">• Portfolio optimization</div>
                <div className="text-sm text-purple-400">• Risk assessment</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Globe className="h-6 w-6 text-purple-500" />
                Enhanced Intelligence Map
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                Advanced MapLibre/deck.gl visualization with dual 2D/3D views, relationship flows, 
                opportunity heatmaps, and satellite orbit tracking.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-blue-400">• Three-panel professional layout</div>
                <div className="text-sm text-green-400">• Station relationship flows</div>
                <div className="text-sm text-purple-400">• 3D terrain analysis portal</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-red-500" />
                Business Intelligence
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                Advanced BI reporting with utilization analysis, profit optimization, 
                and market penetration insights.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-blue-400">• Revenue optimization</div>
                <div className="text-sm text-green-400">• Market gap analysis</div>
                <div className="text-sm text-purple-400">• Competitive intelligence</div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900/50 border-gray-700 hover:bg-gray-800/50 transition-colors">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-3">
                <Target className="h-6 w-6 text-cyan-500" />
                Actionable Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                Specific recommendations categorized by timeline: immediate actions, 
                short-term optimizations, and long-term strategic moves.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-red-400">• Immediate (&lt;3 months)</div>
                <div className="text-sm text-yellow-400">• Short-term (3-12 months)</div>
                <div className="text-sm text-green-400">• Long-term (1-3 years)</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Competitive Intelligence Section */}
      <div className="bg-gray-900/30 border-t border-gray-700">
        <div className="container mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-4">
              Competitive Intelligence Dashboard
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Real-time analysis of {COMPETITOR_INTELLIGENCE_SUMMARY.totalCompetitorStations} competitor ground stations across major operators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Competitors */}
            <Card className="bg-gray-900/70 border-gray-600">
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 text-blue-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">
                  {COMPETITOR_INTELLIGENCE_SUMMARY.totalCompetitorStations}
                </div>
                <div className="text-gray-400">Total Competitor Stations</div>
              </CardContent>
            </Card>

            {/* Critical Threats */}
            <Card className="bg-gray-900/70 border-gray-600">
              <CardContent className="p-6 text-center">
                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">
                  {ENHANCED_OPPORTUNITY_SUMMARY.competitiveIntelligence.criticalThreats}
                </div>
                <div className="text-gray-400">Critical Threat Stations</div>
              </CardContent>
            </Card>

            {/* AWS Stations */}
            <Card className="bg-gray-900/70 border-gray-600">
              <CardContent className="p-6 text-center">
                <Globe className="h-12 w-12 text-orange-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">
                  {COMPETITOR_INTELLIGENCE_SUMMARY.dominantOperators.aws}
                </div>
                <div className="text-gray-400">AWS Ground Stations</div>
              </CardContent>
            </Card>

            {/* Starlink Stations */}
            <Card className="bg-gray-900/70 border-gray-600">
              <CardContent className="p-6 text-center">
                <Satellite className="h-12 w-12 text-green-500 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white mb-2">
                  {COMPETITOR_INTELLIGENCE_SUMMARY.dominantOperators.starlink}
                </div>
                <div className="text-gray-400">Starlink Gateways</div>
              </CardContent>
            </Card>
          </div>

          {/* Threat Matrix */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <AlertTriangle className="h-6 w-6 text-red-500" />
                  Threat Assessment Matrix
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">AWS Ground Station</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-red-500 h-2 w-16 rounded"></div>
                      <span className="text-white font-medium">{competitiveData.threatMatrix.awsThreat}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">SpaceX Starlink</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-orange-500 h-2 w-14 rounded"></div>
                      <span className="text-white font-medium">{competitiveData.threatMatrix.starlinkThreat}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Telesat</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-yellow-500 h-2 w-10 rounded"></div>
                      <span className="text-white font-medium">{competitiveData.threatMatrix.telsatThreat}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">KSAT</span>
                    <div className="flex items-center gap-2">
                      <div className="bg-purple-500 h-2 w-8 rounded"></div>
                      <span className="text-white font-medium">{competitiveData.threatMatrix.ksatThreat}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <Target className="h-6 w-6 text-green-500" />
                  Market Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {competitiveData.marketOpportunities.slice(0, 3).map((opportunity, index) => (
                  <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                    <div className="font-semibold text-white">{opportunity.region}</div>
                    <div className="text-sm text-gray-400 mb-1">{opportunity.opportunity}</div>
                    <div className="text-xs text-green-400">
                      Market Size: ${(opportunity.marketSize / 1000000).toFixed(0)}M
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Key Trends */}
          <div className="mt-8">
            <Card className="bg-gray-900/50 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-blue-500" />
                  Key Market Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Competitive Trends</h4>
                    {COMPETITOR_INTELLIGENCE_SUMMARY.keyTrends.slice(0, 3).map((trend, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300 text-sm">{trend}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-white">Strategic Recommendations</h4>
                    {COMPETITOR_INTELLIGENCE_SUMMARY.strategicRecommendations.slice(0, 3).map((rec, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-300 text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gray-900 to-black border-t border-gray-700">
        <div className="container mx-auto px-6 py-16 text-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-white">
              Ready to Analyze Your Ground Station Portfolio?
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Get started with our comprehensive multi-agent analysis system and discover 
              untapped opportunities in your satellite infrastructure.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/opportunity-analysis">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg">
                  Start Opportunity Analysis
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Link href="/simple">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-8 py-4 text-lg">
                  Explore BI Dashboard
                  <Globe className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
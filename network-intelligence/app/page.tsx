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
  ArrowRight
} from 'lucide-react';

export default function HomePage() {
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
                AI-powered ground station analysis with multi-agent intelligence system. 
                Analyze 32 real SES and Intelsat stations for investment opportunities.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/opportunity-analysis">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                  <Target className="h-5 w-5 mr-2" />
                  Multi-Agent Opportunity Analysis
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/simple">
                <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg">
                  <Globe className="h-5 w-5 mr-2" />
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
                Interactive Visualization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-gray-400">
                Full-screen deck.gl visualization with terrain overlays, heatmaps, 
                and real-time ground station analytics.
              </p>
              <div className="space-y-2">
                <div className="text-sm text-blue-400">• Isometric terrain views</div>
                <div className="text-sm text-green-400">• Interactive heatmaps</div>
                <div className="text-sm text-purple-400">• Station deep-dive popups</div>
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
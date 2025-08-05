"use client";

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Eye, EyeOff } from 'lucide-react';
import dynamic from 'next/dynamic';

const IsometricMapView = dynamic(() => import("@/components/isometric-map-view").then(mod => mod.IsometricMapView), { ssr: false });
import { NetworkGraph } from "@/components/network-graph";
import { BIControls } from "@/components/bi-controls";
import { StationDetails } from "@/components/station-details";

interface LayerControls {
  showStations: boolean;
  showHeatmap: boolean;
  showCoverage: boolean;
  showSatellites: boolean;
  showConnections: boolean;
  showTerrain?: boolean;
}

export default function NetworkIntelligencePlatform() {
  const [viewMode, setViewMode] = useState<'map' | 'network'>('map');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [layers, setLayers] = useState<LayerControls>({
    showStations: true,
    showHeatmap: true,
    showCoverage: true,
    showSatellites: true,
    showConnections: false
  });

  return (
    <div className="h-screen w-screen bg-background relative">
      
      {/* Fullscreen Main View */}
      <div className="absolute inset-0 z-10">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'map' | 'network')} className="h-full">
          <TabsContent value="map" className="h-full m-0">
            <IsometricMapView 
              onSelectAsset={setSelectedAsset} 
              layers={layers}
            />
          </TabsContent>
          
          <TabsContent value="network" className="h-full m-0">
            <NetworkGraph onSelectNode={setSelectedAsset} />
          </TabsContent>
        </Tabs>
      </div>

      {/* View Mode Toggle - Top Left */}
      {showControls && (
        <div className="absolute top-4 left-4 z-30 transition-all duration-300 ease-in-out">
          <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'map' | 'network')}>
            <TabsList className="bg-black/80 backdrop-blur-md border border-white/10">
              <TabsTrigger value="map" className="data-[state=active]:bg-white/20">Map View</TabsTrigger>
              <TabsTrigger value="network" className="data-[state=active]:bg-white/20">Network Graph</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      )}

      {/* Controls Toggle Button - Top Left */}
      <Button
        onClick={() => setShowControls(!showControls)}
        variant="outline"
        size="icon"
        className={`absolute top-4 z-40 bg-black/80 backdrop-blur-md border-white/10 hover:bg-white/20 transition-all duration-300 ${
          showControls ? 'left-[216px]' : 'left-4'
        }`}
      >
        {showControls ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </Button>

      {/* Right Panel Toggle Button */}
      <Button
        onClick={() => setShowRightPanel(!showRightPanel)}
        variant="outline"
        size="icon"
        className={`absolute top-1/2 z-30 -translate-y-1/2 bg-black/80 backdrop-blur-md border-white/10 hover:bg-white/20 transition-all duration-300 ${
          showRightPanel ? 'right-[400px]' : 'right-4'
        }`}
      >
        {showRightPanel ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>

      {/* Right Panel - Overlaid */}
      <div className={`absolute top-0 right-0 w-96 h-full z-20 transition-transform duration-300 ease-in-out ${
        showRightPanel ? 'translate-x-0' : 'translate-x-full'
      }`}>
        <div className="h-full bg-black/90 backdrop-blur-md border-l border-white/10 overflow-y-auto">
          <Tabs defaultValue="controls" className="h-full">
            <TabsList className="grid w-full grid-cols-2 m-2 bg-white/10">
              <TabsTrigger value="controls" className="data-[state=active]:bg-white/20">Controls</TabsTrigger>
              <TabsTrigger value="details" className="data-[state=active]:bg-white/20">Details</TabsTrigger>
            </TabsList>
            
            <TabsContent value="controls" className="m-0 h-full">
              <BIControls onLayerChange={setLayers} />
            </TabsContent>
            
            <TabsContent value="details" className="m-0 h-full">
              <StationDetails station={selectedAsset} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
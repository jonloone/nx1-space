'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Satellite as SatelliteIcon,
  Radio,
  Globe,
  Activity,
  TrendingUp,
  Signal,
  Zap,
  AlertCircle,
  ChevronRight,
  Search,
  Filter
} from 'lucide-react';

// Satellite data structure
export interface Satellite {
  id: string;
  name: string;
  operator: string;
  noradId?: string;
  orbitType: 'GEO' | 'MEO' | 'LEO';
  orbitalPosition?: number; // For GEO satellites
  altitude: number; // km
  inclination: number; // degrees
  frequencyBands: string[];
  services: string[];
  coverage: string[];
  launchDate: string;
  endOfLife?: string;
  status: 'operational' | 'testing' | 'decommissioned' | 'planned';
  utilization: number; // percentage
  visibleStations: string[];
  currentPosition?: [number, number, number]; // [lat, lon, alt]
  groundTrack?: Array<[number, number]>;
  transmitPower?: number; // watts
  dataRate?: number; // Mbps
}

// Sample satellite data
const SATELLITES: Satellite[] = [
  // SES GEO Fleet
  {
    id: 'ses-1',
    name: 'SES-1',
    operator: 'SES',
    noradId: '36516',
    orbitType: 'GEO',
    orbitalPosition: 101,
    altitude: 35786,
    inclination: 0.06,
    frequencyBands: ['C', 'Ku'],
    services: ['broadcast', 'data', 'mobility'],
    coverage: ['North America'],
    launchDate: '2010-04-24',
    status: 'operational',
    utilization: 78,
    visibleStations: ['Bethesda', 'Manassas', 'Hawkeye'],
    currentPosition: [0, -101, 35786]
  },
  {
    id: 'ses-2',
    name: 'SES-2',
    operator: 'SES',
    noradId: '37809',
    orbitType: 'GEO',
    orbitalPosition: 87,
    altitude: 35786,
    inclination: 0.03,
    frequencyBands: ['C', 'Ku'],
    services: ['broadcast', 'data'],
    coverage: ['North America', 'Caribbean'],
    launchDate: '2011-09-21',
    status: 'operational',
    utilization: 82,
    visibleStations: ['Bethesda', 'Manassas'],
    currentPosition: [0, -87, 35786]
  },
  {
    id: 'astra-1kr',
    name: 'ASTRA 1KR',
    operator: 'SES',
    noradId: '29055',
    orbitType: 'GEO',
    orbitalPosition: 19.2,
    altitude: 35786,
    inclination: 0.08,
    frequencyBands: ['Ku'],
    services: ['broadcast'],
    coverage: ['Europe'],
    launchDate: '2006-04-20',
    status: 'operational',
    utilization: 91,
    visibleStations: ['Betzdorf', 'Gibraltar'],
    currentPosition: [0, 19.2, 35786]
  },
  // O3b MEO Fleet
  {
    id: 'o3b-mpower-1',
    name: 'O3b mPOWER 1',
    operator: 'SES',
    noradId: '50319',
    orbitType: 'MEO',
    altitude: 8062,
    inclination: 0,
    frequencyBands: ['Ka'],
    services: ['data', 'mobility', 'government'],
    coverage: ['Global ±50° latitude'],
    launchDate: '2021-12-16',
    status: 'operational',
    utilization: 65,
    visibleStations: ['Perth', 'Singapore', 'Dubai'],
    currentPosition: [0, 45, 8062]
  },
  {
    id: 'o3b-mpower-2',
    name: 'O3b mPOWER 2',
    operator: 'SES',
    noradId: '50320',
    orbitType: 'MEO',
    altitude: 8062,
    inclination: 0,
    frequencyBands: ['Ka'],
    services: ['data', 'mobility', 'government'],
    coverage: ['Global ±50° latitude'],
    launchDate: '2021-12-16',
    status: 'operational',
    utilization: 58,
    visibleStations: ['Perth', 'Singapore'],
    currentPosition: [0, 90, 8062]
  },
  // Competitor satellites
  {
    id: 'starlink-1007',
    name: 'Starlink-1007',
    operator: 'SpaceX',
    noradId: '45178',
    orbitType: 'LEO',
    altitude: 550,
    inclination: 53,
    frequencyBands: ['Ku', 'Ka'],
    services: ['data'],
    coverage: ['Global'],
    launchDate: '2020-01-29',
    status: 'operational',
    utilization: 72,
    visibleStations: ['Redmond', 'Fairbanks'],
    currentPosition: [45, -122, 550]
  },
  {
    id: 'telesat-leo-1',
    name: 'Telesat LEO Phase 1',
    operator: 'Telesat',
    noradId: '43058',
    orbitType: 'LEO',
    altitude: 1000,
    inclination: 37.4,
    frequencyBands: ['Ka'],
    services: ['data', 'government'],
    coverage: ['Global'],
    launchDate: '2018-01-12',
    status: 'testing',
    utilization: 45,
    visibleStations: ['Allan Park', 'Mount Jackson'],
    currentPosition: [30, -79, 1000]
  }
];

interface SatelliteExplorerProps {
  onSatelliteSelect?: (satellite: Satellite) => void;
  selectedSatelliteId?: string;
}

export function SatelliteExplorer({ onSatelliteSelect, selectedSatelliteId }: SatelliteExplorerProps) {
  const [filters, setFilters] = useState({
    operator: 'all',
    orbitType: 'all',
    frequencyBand: 'all',
    service: 'all',
    search: ''
  });
  
  const [selectedSatellite, setSelectedSatellite] = useState<Satellite | null>(null);

  // Filter satellites
  const filteredSatellites = useMemo(() => {
    return SATELLITES.filter(sat => {
      if (filters.operator !== 'all' && sat.operator !== filters.operator) return false;
      if (filters.orbitType !== 'all' && sat.orbitType !== filters.orbitType) return false;
      if (filters.frequencyBand !== 'all' && !sat.frequencyBands.includes(filters.frequencyBand)) return false;
      if (filters.service !== 'all' && !sat.services.includes(filters.service)) return false;
      if (filters.search && !sat.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      return true;
    });
  }, [filters]);

  // Group satellites by orbit type
  const satellitesByOrbit = useMemo(() => {
    const grouped = {
      GEO: [] as Satellite[],
      MEO: [] as Satellite[],
      LEO: [] as Satellite[]
    };
    
    filteredSatellites.forEach(sat => {
      grouped[sat.orbitType].push(sat);
    });
    
    return grouped;
  }, [filteredSatellites]);

  const handleSatelliteClick = (satellite: Satellite) => {
    setSelectedSatellite(satellite);
    if (onSatelliteSelect) {
      onSatelliteSelect(satellite);
    }
  };

  const getOrbitIcon = (orbitType: string) => {
    switch (orbitType) {
      case 'GEO': return <Globe className="w-4 h-4" />;
      case 'MEO': return <Radio className="w-4 h-4" />;
      case 'LEO': return <Zap className="w-4 h-4" />;
      default: return <SatelliteIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'bg-green-500';
      case 'testing': return 'bg-yellow-500';
      case 'decommissioned': return 'bg-gray-500';
      case 'planned': return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="satellite-explorer h-full flex flex-col">
      {/* Filter Section */}
      <Card className="p-4 mb-4 bg-gray-900 border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-semibold text-white">Filters</span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="col-span-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search satellites..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-8 bg-gray-800 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>
          
          <Select value={filters.operator} onValueChange={(v) => setFilters({...filters, operator: v})}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Operator" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Operators</SelectItem>
              <SelectItem value="SES">SES</SelectItem>
              <SelectItem value="SpaceX">SpaceX</SelectItem>
              <SelectItem value="Telesat">Telesat</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.orbitType} onValueChange={(v) => setFilters({...filters, orbitType: v})}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Orbit" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Orbits</SelectItem>
              <SelectItem value="GEO">GEO</SelectItem>
              <SelectItem value="MEO">MEO</SelectItem>
              <SelectItem value="LEO">LEO</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.frequencyBand} onValueChange={(v) => setFilters({...filters, frequencyBand: v})}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Band" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bands</SelectItem>
              <SelectItem value="C">C-band</SelectItem>
              <SelectItem value="Ku">Ku-band</SelectItem>
              <SelectItem value="Ka">Ka-band</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filters.service} onValueChange={(v) => setFilters({...filters, service: v})}>
            <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
              <SelectValue placeholder="Service" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              <SelectItem value="broadcast">Broadcast</SelectItem>
              <SelectItem value="data">Data</SelectItem>
              <SelectItem value="mobility">Mobility</SelectItem>
              <SelectItem value="government">Government</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Satellite List */}
      <div className="flex-1 overflow-y-auto space-y-4">
        {Object.entries(satellitesByOrbit).map(([orbitType, satellites]) => (
          satellites.length > 0 && (
            <div key={orbitType}>
              <div className="flex items-center gap-2 mb-2 px-1">
                {getOrbitIcon(orbitType)}
                <span className="text-sm font-semibold text-gray-400">
                  {orbitType} ({satellites.length})
                </span>
              </div>
              
              <div className="space-y-2">
                {satellites.map(satellite => (
                  <Card
                    key={satellite.id}
                    className={`p-3 bg-gray-900 border-gray-700 hover:bg-gray-800 cursor-pointer transition-colors ${
                      selectedSatellite?.id === satellite.id ? 'border-blue-500' : ''
                    }`}
                    onClick={() => handleSatelliteClick(satellite)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-white">{satellite.name}</span>
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(satellite.status)}`} />
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>{satellite.operator}</span>
                          {satellite.orbitalPosition && (
                            <span>{satellite.orbitalPosition}°{satellite.orbitalPosition > 0 ? 'E' : 'W'}</span>
                          )}
                          <span>{satellite.altitude} km</span>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-2">
                          {satellite.frequencyBands.map(band => (
                            <Badge key={band} variant="secondary" className="text-xs">
                              {band}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 mb-1">
                          <Activity className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-white">{satellite.utilization}%</span>
                        </div>
                        <div className="text-xs text-gray-400">
                          {satellite.visibleStations.length} stations
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )
        ))}
      </div>

      {/* Detail Panel */}
      {selectedSatellite && (
        <Card className="mt-4 p-4 bg-gray-900 border-gray-700">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-white">{selectedSatellite.name}</h3>
            <p className="text-sm text-gray-400">{selectedSatellite.operator} • {selectedSatellite.orbitType}</p>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Orbital Position:</span>
              <span className="text-white">
                {selectedSatellite.orbitalPosition 
                  ? `${selectedSatellite.orbitalPosition}°${selectedSatellite.orbitalPosition > 0 ? 'E' : 'W'}`
                  : `${selectedSatellite.altitude} km`}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Frequency Bands:</span>
              <span className="text-white">{selectedSatellite.frequencyBands.join(', ')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Coverage:</span>
              <span className="text-white">{selectedSatellite.coverage.join(', ')}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Visible Stations:</span>
              <span className="text-white">{selectedSatellite.visibleStations.length}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-400">Utilization:</span>
              <span className={`font-semibold ${
                selectedSatellite.utilization > 80 ? 'text-red-400' :
                selectedSatellite.utilization > 60 ? 'text-yellow-400' :
                'text-green-400'
              }`}>
                {selectedSatellite.utilization}%
              </span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button size="sm" className="flex-1">
              <Signal className="w-4 h-4 mr-1" />
              Show Coverage
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <ChevronRight className="w-4 h-4 mr-1" />
              Show Path
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
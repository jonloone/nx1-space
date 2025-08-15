'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Activity, Zap, Target } from 'lucide-react';
import { useMapStore } from '@/lib/store/mapStore';

export function AnalyticsPanel() {
  const { domain, dataCache } = useMapStore();
  const data = dataCache.get(domain);
  
  const getMetrics = () => {
    if (!data) return [];
    
    switch (domain) {
      case 'ground-stations':
        return [
          { 
            label: 'Stations', 
            value: data.stations?.length || 0,
            icon: Target,
            color: 'text-geo-blue'
          },
          { 
            label: 'Avg Score', 
            value: `${((data.stations?.reduce((a: number, s: any) => a + s.score, 0) / data.stations?.length || 0) * 100).toFixed(1)}%`,
            icon: TrendingUp,
            color: 'text-geo-green'
          },
          { 
            label: 'Coverage', 
            value: `${data.stations?.reduce((a: number, s: any) => a + s.coverage_area_km2, 0).toFixed(0)} km²`,
            icon: Activity,
            color: 'text-geo-cyan'
          },
          { 
            label: 'Opportunities', 
            value: data.predictions?.opportunities?.length || 0,
            icon: Zap,
            color: 'text-geo-yellow'
          }
        ];
        
      case 'maritime':
        return [
          { 
            label: 'Vessels', 
            value: data.vessels?.length || 0,
            icon: Target,
            color: 'text-geo-blue'
          },
          { 
            label: 'Avg Speed', 
            value: `${(data.vessels?.reduce((a: number, v: any) => a + v.speed, 0) / data.vessels?.length || 0).toFixed(1)} kn`,
            icon: TrendingUp,
            color: 'text-geo-green'
          },
          { 
            label: 'Ports', 
            value: data.ports?.length || 0,
            icon: Activity,
            color: 'text-geo-cyan'
          },
          { 
            label: 'Risk Alerts', 
            value: data.vessels?.filter((v: any) => v.risk_score > 0.7).length || 0,
            icon: Zap,
            color: 'text-geo-red'
          }
        ];
        
      default:
        return [];
    }
  };
  
  const metrics = getMetrics();
  
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="glass rounded-lg p-4"
    >
      <h3 className="text-sm font-semibold mb-3 text-white/70">Analytics</h3>
      
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.label}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 rounded-lg p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${metric.color}`} />
                <span className="text-xs text-white/50">{metric.label}</span>
              </div>
              <div className="text-xl font-bold">{metric.value}</div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Mini Chart Placeholder */}
      <div className="mt-4 h-24 bg-white/5 rounded-lg p-2">
        <div className="h-full flex items-end justify-around gap-1">
          {[40, 65, 45, 70, 55, 80, 60, 75, 50, 85].map((height, i) => (
            <motion.div
              key={i}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.05 }}
              className="flex-1 bg-gradient-to-t from-geo-blue to-geo-cyan rounded-t"
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
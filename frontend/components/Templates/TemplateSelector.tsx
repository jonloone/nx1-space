'use client';

import React, { useState, useEffect } from 'react';
import { useFoundryStore } from '@/lib/store/foundryStore';
import { templateEngine, Template, TemplateCompatibility } from '@/lib/templates/templateEngine';
import { 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  ChevronRight,
  Sparkles,
  Package,
  Users,
  BarChart3,
  Map,
  Network,
  Clock
} from 'lucide-react';

interface TemplateSelectorProps {
  onTemplateSelect?: (template: Template, lens: string) => void;
  availableData?: Record<string, any>;
  className?: string;
}

const templateIcons: Record<string, React.ReactNode> = {
  'customer-360': <Users className="w-6 h-6" />,
  'asset-tracker': <Map className="w-6 h-6" />,
  'operational-dashboard': <BarChart3 className="w-6 h-6" />,
  'bom-analyzer': <Package className="w-6 h-6" />,
  'risk-monitor': <AlertCircle className="w-6 h-6" />,
};

const lensIcons: Record<string, React.ReactNode> = {
  spatial: <Map className="w-4 h-4" />,
  network: <Network className="w-4 h-4" />,
  temporal: <Clock className="w-4 h-4" />,
  hybrid: <BarChart3 className="w-4 h-4" />,
};

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onTemplateSelect,
  availableData = {},
  className = ''
}) => {
  const { setLens, setActiveTemplate } = useFoundryStore();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [compatibility, setCompatibility] = useState<Record<string, TemplateCompatibility>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);
  
  useEffect(() => {
    // Load all templates
    const allTemplates = templateEngine.getAllTemplates();
    setTemplates(allTemplates);
    
    // Check compatibility for each template
    const compatMap: Record<string, TemplateCompatibility> = {};
    allTemplates.forEach(template => {
      const compat = templateEngine.checkCompatibility(template, availableData);
      compatMap[template.id] = compat;
    });
    setCompatibility(compatMap);
  }, [availableData]);
  
  const handleTemplateClick = async (template: Template) => {
    const compat = compatibility[template.id];
    if (!compat || compat.compatibility < 30) {
      console.warn('Insufficient data for template:', template.id);
      return;
    }
    
    // Set the active template
    setActiveTemplate({
      id: template.id,
      name: template.name,
      description: template.description,
      category: template.category,
      dataRequirements: template.dataRequirements.map(r => r.field),
      defaultLens: compat.recommendedLens,
    });
    
    // Switch to the recommended lens
    setLens(compat.recommendedLens);
    
    // Call optional callback
    onTemplateSelect?.(template, compat.recommendedLens);
    
    // Try to load the template
    try {
      const instance = await templateEngine.loadTemplate(
        template.id,
        availableData,
        compat.recommendedLens
      );
      console.log('Template loaded:', instance);
    } catch (error) {
      console.error('Failed to load template:', error);
    }
  };
  
  const getCompatibilityColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-400 border-green-400/30';
    if (percentage >= 50) return 'text-yellow-400 border-yellow-400/30';
    return 'text-red-400 border-red-400/30';
  };
  
  const getCompatibilityIcon = (percentage: number) => {
    if (percentage >= 80) return <CheckCircle className="w-4 h-4" />;
    if (percentage >= 50) return <AlertCircle className="w-4 h-4" />;
    return <XCircle className="w-4 h-4" />;
  };
  
  const filteredTemplates = selectedCategory === 'all'
    ? templates
    : templates.filter(t => t.category === selectedCategory);
  
  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    const compatA = compatibility[a.id]?.compatibility || 0;
    const compatB = compatibility[b.id]?.compatibility || 0;
    return compatB - compatA; // Sort by compatibility descending
  });
  
  return (
    <div className={`${className}`}>
      {/* Category Filter */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'all'
              ? 'bg-white/20 text-white'
              : 'bg-black/40 text-white/60 hover:bg-white/10'
          }`}
        >
          All Templates
        </button>
        <button
          onClick={() => setSelectedCategory('universal')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'universal'
              ? 'bg-white/20 text-white'
              : 'bg-black/40 text-white/60 hover:bg-white/10'
          }`}
        >
          Universal
        </button>
        <button
          onClick={() => setSelectedCategory('maritime')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'maritime'
              ? 'bg-white/20 text-white'
              : 'bg-black/40 text-white/60 hover:bg-white/10'
          }`}
        >
          Maritime
        </button>
        <button
          onClick={() => setSelectedCategory('manufacturing')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            selectedCategory === 'manufacturing'
              ? 'bg-white/20 text-white'
              : 'bg-black/40 text-white/60 hover:bg-white/10'
          }`}
        >
          Manufacturing
        </button>
      </div>
      
      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedTemplates.map(template => {
          const compat = compatibility[template.id];
          const isDisabled = !compat || compat.compatibility < 30;
          
          return (
            <button
              key={template.id}
              onClick={() => !isDisabled && handleTemplateClick(template)}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              disabled={isDisabled}
              className={`
                group relative overflow-hidden p-6 text-left
                bg-black/40 backdrop-blur-md
                border rounded-xl transition-all duration-300
                ${isDisabled 
                  ? 'border-white/5 opacity-50 cursor-not-allowed' 
                  : 'border-white/10 hover:border-white/30 hover:bg-black/60 cursor-pointer'
                }
              `}
            >
              {/* Background Gradient */}
              <div className={`
                absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity
                ${!isDisabled && 'bg-gradient-to-br from-purple-500/10 to-blue-500/10'}
              `} />
              
              <div className="relative">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg">
                    {templateIcons[template.id] || <FileText className="w-6 h-6" />}
                  </div>
                  
                  {/* Compatibility Badge */}
                  {compat && (
                    <div className={`
                      flex items-center gap-1 px-2 py-1 rounded-full
                      border text-xs font-medium
                      ${getCompatibilityColor(compat.compatibility)}
                    `}>
                      {getCompatibilityIcon(compat.compatibility)}
                      <span>{Math.round(compat.compatibility)}%</span>
                    </div>
                  )}
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-white mb-2">
                  {template.name}
                </h3>
                
                <p className="text-sm text-white/60 mb-4 line-clamp-2">
                  {template.description}
                </p>
                
                {/* Footer */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Supported Lenses */}
                    <div className="flex items-center gap-1">
                      {template.supportedLenses.slice(0, 3).map(lens => (
                        <div
                          key={lens}
                          className="p-1 bg-white/10 rounded"
                          title={lens}
                        >
                          {lensIcons[lens]}
                        </div>
                      ))}
                      {template.supportedLenses.length > 3 && (
                        <span className="text-white/40 text-xs">
                          +{template.supportedLenses.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {!isDisabled && (
                    <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                  )}
                </div>
                
                {/* Hover Details */}
                {hoveredTemplate === template.id && compat && !isDisabled && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-3 
                                  bg-black/90 backdrop-blur-xl border border-white/20 
                                  rounded-lg z-50 pointer-events-none">
                    <div className="text-xs space-y-1">
                      {compat.warnings.length > 0 && (
                        <div className="text-yellow-400">
                          {compat.warnings[0]}
                        </div>
                      )}
                      <div className="text-white/60">
                        Recommended lens: <span className="text-white capitalize">{compat.recommendedLens}</span>
                      </div>
                      {compat.missingOptional.length > 0 && (
                        <div className="text-white/40">
                          Optional data available: {compat.missingOptional.length} fields
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
      
      {/* AI Recommendation */}
      {sortedTemplates.length > 0 && compatibility[sortedTemplates[0].id]?.compatibility >= 80 && (
        <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 
                        backdrop-blur-md border border-white/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <div>
              <div className="text-white font-medium">AI Recommendation</div>
              <div className="text-white/60 text-sm">
                "{sortedTemplates[0].name}" has {Math.round(compatibility[sortedTemplates[0].id]?.compatibility || 0)}% compatibility with your data
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* No Templates Message */}
      {sortedTemplates.length === 0 && (
        <div className="text-center py-12">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">No templates available for the selected category</p>
        </div>
      )}
    </div>
  );
};
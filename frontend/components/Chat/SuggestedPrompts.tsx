'use client';

import React from 'react';
import { useThread } from '@assistant-ui/react';
import { Zap, TrendingUp, AlertCircle, Compass } from 'lucide-react';

interface SuggestedPromptsProps {
  context: any;
  onSelect?: () => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ context, onSelect }) => {
  const thread = useThread();

  const getPrompts = () => {
    if (context.type === 'station' && context.station) {
      const station = context.station;
      const prompts = [];

      // Add context-specific prompts based on metrics
      if (station.utilization < 0.5) {
        prompts.push({
          icon: <AlertCircle className="w-3 h-3" />,
          text: "Why is utilization low?",
          prompt: `Why is the utilization for ${station.name} only ${(station.utilization * 100).toFixed(1)}%? What factors could be contributing to this?`
        });
      }

      if (station.score < 0.7) {
        prompts.push({
          icon: <TrendingUp className="w-3 h-3" />,
          text: "How to improve score?",
          prompt: `What are the top 3 actions to improve the health score of ${station.name} from ${(station.score * 100).toFixed(1)}%?`
        });
      }

      // Always available prompts
      prompts.push({
        icon: <Compass className="w-3 h-3" />,
        text: "Compare to nearby",
        prompt: `Compare ${station.name} performance to other ground stations in the region. What stands out?`
      });

      prompts.push({
        icon: <Zap className="w-3 h-3" />,
        text: "Optimization tips",
        prompt: `What quick optimizations could improve ${station.name}'s performance without major infrastructure changes?`
      });

      return prompts.slice(0, 3); // Limit to 3 suggestions
    }

    if (context.type === 'opportunity' && context.hexagon) {
      return [
        {
          icon: <TrendingUp className="w-3 h-3" />,
          text: "ROI analysis",
          prompt: "What's the potential ROI for deploying a ground station in this hexagon?"
        },
        {
          icon: <Compass className="w-3 h-3" />,
          text: "Market factors",
          prompt: "What market factors make this location attractive for deployment?"
        },
        {
          icon: <AlertCircle className="w-3 h-3" />,
          text: "Risk assessment",
          prompt: "What are the main risks to consider for this deployment opportunity?"
        }
      ];
    }

    if (context.type === 'maritime' && context.vessel) {
      return [
        {
          icon: <Compass className="w-3 h-3" />,
          text: "Coverage analysis",
          prompt: `Analyze connectivity coverage for ${context.vessel.name} along its current route.`
        },
        {
          icon: <TrendingUp className="w-3 h-3" />,
          text: "Signal optimization",
          prompt: "How can we optimize signal strength for this vessel's typical routes?"
        },
        {
          icon: <Zap className="w-3 h-3" />,
          text: "Handoff prediction",
          prompt: "Predict upcoming ground station handoffs for this vessel."
        }
      ];
    }

    // Default prompts
    return [
      {
        icon: <Compass className="w-3 h-3" />,
        text: "Overview",
        prompt: "Give me an overview of what I'm looking at."
      },
      {
        icon: <TrendingUp className="w-3 h-3" />,
        text: "Key insights",
        prompt: "What are the key insights from this data?"
      }
    ];
  };

  const handlePromptClick = (prompt: string) => {
    thread.append({
      role: 'user',
      content: prompt
    });
    onSelect?.();
  };

  const prompts = getPrompts();

  return (
    <div className="suggested-prompts">
      <div className="prompts-header">
        <span className="text-xs text-gray-500">Suggested questions</span>
      </div>
      <div className="prompts-list">
        {prompts.map((prompt, index) => (
          <button
            key={index}
            className="prompt-chip"
            onClick={() => handlePromptClick(prompt.prompt)}
          >
            {prompt.icon}
            <span>{prompt.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
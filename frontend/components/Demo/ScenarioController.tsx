'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Square,
  Settings,
  FileText,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  Waves
} from 'lucide-react';
import { demoScenarioManager, DemoScenarioManager } from '@/lib/scenarios/demoScenarios';
import { DemoNarrative } from '@/types/maritime';

interface ScenarioControllerProps {
  isOpen: boolean;
  onClose: () => void;
  onScenarioChange?: (scenario: DemoNarrative | null) => void;
  onTimelineUpdate?: (timeRange: { start: Date; end: Date }, currentTime: number) => void;
}

export const ScenarioController: React.FC<ScenarioControllerProps> = ({
  isOpen,
  onClose,
  onScenarioChange,
  onTimelineUpdate
}) => {
  const [currentScenario, setCurrentScenario] = useState<DemoNarrative | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState({ step: 0, totalSteps: 0, stepProgress: 0 });
  const [showNarrative, setShowNarrative] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying && currentScenario) {
        const newProgress = demoScenarioManager.getProgress();
        setProgress(newProgress);

        // Auto-advance to next step when current step completes
        if (autoPlay && newProgress.stepProgress >= 1.0) {
          const hasNext = demoScenarioManager.nextStep();
          if (!hasNext) {
            setIsPlaying(false);
          }
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, currentScenario, autoPlay]);

  const loadScenario = (scenarioId: string) => {
    const success = demoScenarioManager.loadScenario(scenarioId);
    if (success) {
      const scenario = demoScenarioManager.getCurrentScenario();
      setCurrentScenario(scenario);
      setIsPlaying(false);
      setProgress({ step: 1, totalSteps: scenario?.steps.length || 0, stepProgress: 0 });
      
      if (scenario && onScenarioChange) {
        onScenarioChange(scenario);
      }

      if (scenario && onTimelineUpdate) {
        onTimelineUpdate(
          { start: scenario.timeRange.start, end: scenario.timeRange.end },
          scenario.timeRange.start.getTime()
        );
      }
    }
  };

  const playPause = () => {
    if (isPlaying) {
      demoScenarioManager.pause();
    } else {
      demoScenarioManager.play();
    }
    setIsPlaying(!isPlaying);
  };

  const nextStep = () => {
    const hasNext = demoScenarioManager.nextStep();
    if (hasNext) {
      const newProgress = demoScenarioManager.getProgress();
      setProgress(newProgress);
    }
  };

  const previousStep = () => {
    const hasPrev = demoScenarioManager.previousStep();
    if (hasPrev) {
      const newProgress = demoScenarioManager.getProgress();
      setProgress(newProgress);
    }
  };

  const stopScenario = () => {
    setIsPlaying(false);
    demoScenarioManager.pause();
    if (currentScenario) {
      demoScenarioManager.jumpToStep(0);
      setProgress({ step: 1, totalSteps: currentScenario.steps.length, stepProgress: 0 });
    }
  };

  const jumpToStep = (stepIndex: number) => {
    demoScenarioManager.jumpToStep(stepIndex);
    const newProgress = demoScenarioManager.getProgress();
    setProgress(newProgress);
  };

  const getCurrentStep = () => {
    return demoScenarioManager.getCurrentStep();
  };

  const getScenarioIcon = (scenarioId: string) => {
    switch (scenarioId) {
      case 'scs_sts_demo': return <Waves className="w-5 h-5" />;
      case 'baltic_dark_fleet': return <Shield className="w-5 h-5" />;
      case 'persian_gulf_surveillance': return <AlertTriangle className="w-5 h-5" />;
      case 'illegal_fishing_detection': return <MapPin className="w-5 h-5" />;
      default: return <FileText className="w-5 h-5" />;
    }
  };

  const currentStep = getCurrentStep();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed right-0 top-0 h-full w-96 bg-black/95 backdrop-blur-xl border-l border-white/20 z-[1100] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Demo Control
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <div className="flex flex-col h-full">
            {/* Scenario Selection */}
            <div className="p-4 border-b border-white/10">
              <h3 className="text-sm font-semibold text-white mb-3">Select Demo Scenario</h3>
              <div className="space-y-2">
                {demoScenarioManager.getScenarios().map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => loadScenario(scenario.id)}
                    className={`w-full p-3 rounded-lg border transition-all text-left ${
                      currentScenario?.id === scenario.id
                        ? 'bg-blue-500/20 border-blue-400 text-white'
                        : 'border-white/10 text-gray-300 hover:border-blue-400/50 hover:bg-blue-500/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getScenarioIcon(scenario.id)}
                      <div>
                        <div className="font-medium text-sm">{scenario.name}</div>
                        <div className="text-xs opacity-75">{scenario.duration} min demo</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Scenario Info */}
            {currentScenario && (
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Current Scenario</h3>
                <div className="bg-white/5 rounded-lg p-3 text-sm text-gray-300">
                  <div className="font-medium text-white mb-1">{currentScenario.name}</div>
                  <div className="mb-2">{currentScenario.description}</div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {currentScenario.duration} min
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {currentScenario.focusVessels.length} vessels
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Playback Controls */}
            {currentScenario && (
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white mb-3">Playback Controls</h3>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Step {progress.step} of {progress.totalSteps}</span>
                    <span>{Math.round(progress.stepProgress * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-400 h-2 rounded-full transition-all duration-200"
                      style={{ width: `${progress.stepProgress * 100}%` }}
                    />
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  <button
                    onClick={previousStep}
                    disabled={progress.step <= 1}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <SkipBack className="w-4 h-4 text-white" />
                  </button>
                  
                  <button
                    onClick={playPause}
                    className="p-3 rounded-lg bg-blue-500 hover:bg-blue-600 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 text-white" />
                    ) : (
                      <Play className="w-5 h-5 text-white ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={nextStep}
                    disabled={progress.step >= progress.totalSteps}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <SkipForward className="w-4 h-4 text-white" />
                  </button>

                  <button
                    onClick={stopScenario}
                    className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors"
                  >
                    <Square className="w-4 h-4 text-red-400" />
                  </button>
                </div>

                {/* Auto-play toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Auto-advance</span>
                  <button
                    onClick={() => setAutoPlay(!autoPlay)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      autoPlay ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        autoPlay ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Current Step Details */}
            {currentStep && (
              <div className="p-4 border-b border-white/10">
                <h3 className="text-sm font-semibold text-white mb-2">Current Step</h3>
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="font-medium text-white text-sm mb-1">
                    {currentStep.title}
                  </div>
                  <div className="text-xs text-gray-300 mb-2">
                    {currentStep.description}
                  </div>
                  {currentStep.narration && (
                    <div className="text-xs text-blue-300 italic border-l-2 border-blue-400 pl-2">
                      "{currentStep.narration}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step Navigator */}
            {currentScenario && (
              <div className="flex-1 overflow-y-auto p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Scenario Steps</h3>
                <div className="space-y-2">
                  {currentScenario.steps.map((step, index) => (
                    <button
                      key={step.id}
                      onClick={() => jumpToStep(index)}
                      className={`w-full p-2 rounded-lg text-left transition-all ${
                        progress.step === index + 1
                          ? 'bg-blue-500/20 border border-blue-400 text-white'
                          : 'bg-white/5 hover:bg-white/10 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{step.title}</div>
                          <div className="text-xs opacity-75">{step.duration}s</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Narrative Toggle */}
            {currentScenario && (
              <div className="p-4 border-t border-white/10">
                <button
                  onClick={() => setShowNarrative(!showNarrative)}
                  className="w-full p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  {showNarrative ? 'Hide' : 'Show'} Narrative Details
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
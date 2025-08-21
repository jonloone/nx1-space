import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type LensType = 'welcome' | 'spatial' | 'network' | 'temporal' | 'hybrid';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: 'universal' | 'maritime' | 'telecom' | 'manufacturing' | 'energy';
  thumbnail?: string;
  dataRequirements: string[];
  defaultLens: LensType;
}

export interface DataProduct {
  id: string;
  name: string;
  description: string;
  type: string;
  lastUpdated: Date;
  compatibility: LensType[];
}

export interface SavedView {
  id: string;
  name: string;
  description: string;
  lens: LensType;
  template?: string;
  timestamp: Date;
  configuration: any;
}

interface SharedState {
  selectedEntities: any[];
  activeFilters: Record<string, any>;
  timeRange: { start?: Date; end?: Date };
  currentDataProducts: DataProduct[];
  userQuery: string;
  activeTemplate: Template | null;
}

interface FoundryState {
  // Core application state
  currentLens: LensType;
  previousLens: LensType | null;
  isLoading: boolean;
  isTransitioning: boolean;
  
  // Shared state across all lenses
  shared: SharedState;
  
  // Lens-specific state
  lensStates: {
    spatial: any;
    network: any;
    temporal: any;
    hybrid: any;
  };
  
  // User workspace
  recentViews: SavedView[];
  savedTemplates: Template[];
  preferences: {
    defaultLens: LensType;
    animationsEnabled: boolean;
    aiSuggestionsEnabled: boolean;
  };
  
  // Actions
  setLens: (lens: LensType) => void;
  setLoading: (loading: boolean) => void;
  setTransitioning: (transitioning: boolean) => void;
  setUserQuery: (query: string) => void;
  setActiveTemplate: (template: Template | null) => void;
  updateSharedState: (updates: Partial<SharedState>) => void;
  updateLensState: (lens: keyof FoundryState['lensStates'], state: any) => void;
  addRecentView: (view: SavedView) => void;
  clearRecentViews: () => void;
  updatePreferences: (prefs: Partial<FoundryState['preferences']>) => void;
  resetToWelcome: () => void;
}

export const useFoundryStore = create<FoundryState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentLens: 'welcome',
      previousLens: null,
      isLoading: false,
      isTransitioning: false,
      
      shared: {
        selectedEntities: [],
        activeFilters: {},
        timeRange: {},
        currentDataProducts: [],
        userQuery: '',
        activeTemplate: null,
      },
      
      lensStates: {
        spatial: {},
        network: {},
        temporal: {},
        hybrid: {},
      },
      
      recentViews: [],
      savedTemplates: [],
      preferences: {
        defaultLens: 'welcome',
        animationsEnabled: true,
        aiSuggestionsEnabled: true,
      },
      
      // Actions
      setLens: (lens) => set((state) => ({
        previousLens: state.currentLens,
        currentLens: lens,
        isTransitioning: true,
      })),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setTransitioning: (transitioning) => set({ isTransitioning: transitioning }),
      
      setUserQuery: (query) => set((state) => ({
        shared: { ...state.shared, userQuery: query }
      })),
      
      setActiveTemplate: (template) => set((state) => ({
        shared: { ...state.shared, activeTemplate: template }
      })),
      
      updateSharedState: (updates) => set((state) => ({
        shared: { ...state.shared, ...updates }
      })),
      
      updateLensState: (lens, lensState) => set((state) => ({
        lensStates: {
          ...state.lensStates,
          [lens]: { ...state.lensStates[lens], ...lensState }
        }
      })),
      
      addRecentView: (view) => set((state) => ({
        recentViews: [view, ...state.recentViews.slice(0, 9)] // Keep last 10
      })),
      
      clearRecentViews: () => set({ recentViews: [] }),
      
      updatePreferences: (prefs) => set((state) => ({
        preferences: { ...state.preferences, ...prefs }
      })),
      
      resetToWelcome: () => set((state) => ({
        currentLens: 'welcome',
        previousLens: state.currentLens,
        shared: {
          ...state.shared,
          userQuery: '',
          activeTemplate: null,
          selectedEntities: [],
          activeFilters: {},
        }
      })),
    }),
    {
      name: 'nexusone-foundry-storage',
      partialize: (state) => ({
        recentViews: state.recentViews,
        savedTemplates: state.savedTemplates,
        preferences: state.preferences,
      }),
    }
  )
);
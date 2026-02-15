import { create } from 'zustand';
import {
  MissingPerson,
  FilterParams,
  Hotspot,
  MissingPersonStatus,
  Gender,
} from '@overwatch/shared';

interface MapState {
  missingPersons: MissingPerson[];
  hotspots: Hotspot[];
  loading: boolean;
  error: string | null;
  filters: Partial<FilterParams>;

  // Actions
  setMissingPersons: (persons: MissingPerson[]) => void;
  setHotspots: (hotspots: Hotspot[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateFilters: (filters: Partial<FilterParams>) => void;
  resetFilters: () => void;
}

const defaultFilters: Partial<FilterParams> = {
  limit: 20,
  offset: 0,
};

export const useMapStore = create<MapState>((set) => ({
  missingPersons: [],
  hotspots: [],
  loading: false,
  error: null,
  filters: defaultFilters,

  setMissingPersons: (missingPersons) => set({ missingPersons }),
  setHotspots: (hotspots) => set({ hotspots }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  updateFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  resetFilters: () => set({ filters: defaultFilters }),
}));

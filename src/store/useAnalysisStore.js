import { create } from 'zustand';

export const useAnalysisStore = create((set) => ({
  category: 'flexicap',
  fundKey: 'parag',
  period: 3,
  results: null,
  isLoading: false,
  activeTab: 't-ret',

  setCategory: (category) => set({ category }),
  setFundKey: (fundKey) => set({ fundKey }),
  setPeriod: (period) => set({ period }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setLoading: (isLoading) => set({ isLoading }),
  setResults: (results) => set({ results }),
  reset: () => set({ results: null, activeTab: 't-ret' }),
}));

import { create } from 'zustand';
import { AppState, PredictionsData } from '@/types';

interface AppStore extends AppState {
  setPredictions: (predictions: PredictionsData) => void;
  setSelectedSymbol: (symbol: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState: AppState = {
  predictions: {},
  selectedSymbol: null,
  loading: false,
  error: null,
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,
  
  setPredictions: (predictions) => set({ predictions }),
  
  setSelectedSymbol: (selectedSymbol) => set({ selectedSymbol }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set(initialState),
}));

import { create } from 'zustand';
import { getCaminoPoints } from '../firebase';

interface Point {
  id: string;
  title: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cover: string;
  timestamp: any; // Firestore Timestamp
}

interface CaminoStore {
  // State
  points: Point[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setPoints: (points: Point[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async actions
  subscribeToPoints: (caminoId: string) => () => void; // Returns unsubscribe function
}

export const useCaminoStore = create<CaminoStore>((set, get) => ({
  // Initial state
  points: [],
  loading: false,
  error: null,
  
  // Actions
  setPoints: (points) => set({ points }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  // Async actions
  subscribeToPoints: (caminoId) => {
    set({ loading: true, error: null });
    
    const unsubscribe = getCaminoPoints(caminoId, (points) => {
      set({ 
        points: points, 
        loading: false,
        error: null 
      });
    });
    
    // Return the unsubscribe function for cleanup
    return unsubscribe;
  },
}));

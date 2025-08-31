import { create } from 'zustand';
import { getCaminoPoints, addCaminoPoint, updateCaminoPoint } from '../firebase';
import { Point } from '../types';

// Shared constant for the camino ID
export const CAMINO_ID = '8FSx2nxzykqG4HjzFEZ8';

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
  addPoint: (pointData: Omit<Point, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updatePoint: (pointId: string, pointData: { title?: string; url?: string; timestamp: Date }) => Promise<{ success: boolean; error?: string }>;
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
  
  addPoint: async (pointData) => {
    try {
      set({ loading: true, error: null });
      
      const result = await addCaminoPoint(CAMINO_ID, pointData);
      
      if (result.error) {
        set({ loading: false, error: result.error });
        return { success: false, error: result.error };
      }
      
      // The point will be automatically added to the store via the subscription
      set({ loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to add point';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  updatePoint: async (pointId, pointData) => {
    try {
      set({ loading: true, error: null });
      
      const result = await updateCaminoPoint(CAMINO_ID, pointId, pointData);
      
      if (result.error) {
        set({ loading: false, error: result.error });
        return { success: false, error: result.error };
      }
      
      // The point will be automatically updated in the store via the subscription
      set({ loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to update point';
      set({ loading: false, error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },
}));

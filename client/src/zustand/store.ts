import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interface matching your bindings
export interface Player {
  player: string;          
  chamber_id: number;
  x: number;
  y: number;
  pulses_used: number;
  deaths: number;
}

// Application state
interface AppState {
  // Player data
  player: Player | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  gameStarted: boolean;
}

// Store actions
interface AppActions {
  // Player actions
  setPlayer: (player: Player | null) => void;
  movePlayer: (x: number, y: number) => void;
  emitPulse: () => void;

  
  // UI actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Game actions
  enterChamber: (chamber_id: number) => void;
  completeChamber: () => void;
  
  // Utility actions
  resetStore: () => void;
}

// Combine state and actions
type AppStore = AppState & AppActions;

// Initial state
const initialState: AppState = {
  player: null,
  isLoading: false,
  error: null,
  gameStarted: false,
};

// Create the store
const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // Initial state
      ...initialState,

      // Player actions
      setPlayer: (player) => set({ player }),

      movePlayer: (x, y) => set((state) => ({
        player: state.player ? { ...state.player, x, y } : null
      })),

      emitPulse: () => set((state) => ({
        player: state.player ? { ...state.player, pulses_used: state.player.pulses_used + 1 } : null
      })),
      

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Game actions
      enterChamber: (chamber_id) => set((state) => ({
        player: state.player ? { ...state.player, chamber_id } : null
      })),
      
      completeChamber: () => set((state) => ({
        player: state.player ? { ...state.player, chamber_id: state.player.chamber_id + 1 } : null
      })),

      // Utility actions
      resetStore: () => set(initialState),
    }),
    {
      name: 'echoes-of-the-void-store',
      partialize: (state) => ({
        player: state.player,
        gameStarted: state.gameStarted,
      }),
    }
  )
);

export default useAppStore;
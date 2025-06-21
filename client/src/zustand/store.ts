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

export interface Chamber {
  chamber_id: number;
  map: number[]; // Array of cell types (0=void, 1=path, 2=wall, 3=start, 4=exit)
  width: number;
  height: number;
  start_x: number;
  start_y: number;
  exit_x: number;
  exit_y: number;
  seed: number;
}

export interface GameRun {
  player: string;
  run_id: number;
  score: number;
  completed_chambers: number;
  timestamp: number;
}

// Application state
interface AppState {
  // Player data
  player: Player | null;

  // Chamber data
  chamber: Chamber | null;

  // Game run data
  gameRun: GameRun | null;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Game state
  gameStarted: boolean;
}

// Store actions
interface AppActions {
  // Player actions
  createPlayer: () => void;
  setPlayer: (player: Player | null) => void;
  movePlayer: (x: number, y: number) => void;
  emitPulse: () => void;

  // Chamber actions
  createChamber: (chamber_id: number, seed: number, width: number, height: number) => void;
  setChamber: (chamber: Chamber | null) => void;

  // Game run actions
  createGameRun: () => void;
  setGameRun: (gameRun: GameRun | null) => void;

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
  chamber: null,
  gameRun: null,
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
      createPlayer: () => set((state) => ({
        player: state.player ? { ...state.player, chamber_id: 0 } : null
      })),

      setPlayer: (player) => set({ player }),

      movePlayer: (x, y) => set((state) => ({
        player: state.player ? { ...state.player, x, y } : null
      })),

      emitPulse: () => set((state) => ({
        player: state.player ? { ...state.player, pulses_used: state.player.pulses_used + 1 } : null
      })),
      
      // Chamber actions
      createChamber: (chamber_id, seed, width, height) => set((state) => ({
        chamber: state.chamber ? { ...state.chamber, chamber_id, seed, width, height } : null
      })),

      setChamber: (chamber) => set({ chamber }),

      // Game run actions
      createGameRun: () => set((state) => ({
        gameRun: state.gameRun ? { ...state.gameRun, score: 0, completed_chambers: 0 } : null
      })),

      setGameRun: (gameRun) => set({ gameRun }),

      // UI actions
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      // Game actions
      enterChamber: (chamber_id) => set((state) => ({
        player: state.player ? { ...state.player, chamber_id } : null
      })),
      
      completeChamber: () => set((state) => ({
        player: state.player ? { ...state.player, chamber_id: 0 } : null,
        gameRun: state.gameRun ? { ...state.gameRun, score: state.gameRun.score + 100, completed_chambers: state.gameRun.completed_chambers + 1 } : null
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
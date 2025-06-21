import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"

interface GameState {
  connected: boolean
  chamberId: number
  pulsesUsed: number
  deaths: number
  playerPosition: {
    x: number
    y: number
  }
  revealedCells: Array<{
    x: number
    y: number
    type: number
  }>
  address: string | null
  isLoading: boolean
  txStatus: {
    message: string
    type: "pending" | "success" | "error" | null
  }
  notification: string | null
}

type GameAction =
  | { type: "CONNECT_WALLET_START" }
  | { type: "CONNECT_WALLET_SUCCESS"; address: string }
  | { type: "MOVE_PLAYER"; x: number; y: number }
  | { type: "EMIT_PULSE"; cells: Array<{x: number, y: number, type: number}> }
  | { type: "COMPLETE_CHAMBER"; nextChamberId: number }
  | { type: "PLAYER_DIED" }
  | { type: "SET_TX_STATUS"; message: string; txType: "pending" | "success" | "error" }
  | { type: "CLEAR_TX_STATUS" }
  | { type: "SHOW_NOTIFICATION"; message: string }
  | { type: "CLEAR_NOTIFICATION" }

const initialState: GameState = {
  connected: false,
  chamberId: 0,
  pulsesUsed: 0,
  deaths: 0,
  playerPosition: {
    x: 0,
    y: 0
  },
  revealedCells: [],
  address: null,
  isLoading: false,
  txStatus: { message: "", type: null },
  notification: null,
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "CONNECT_WALLET_START": {
      return { ...state, isLoading: true }
    }

    case "CONNECT_WALLET_SUCCESS": {
      return {
        ...state,
        connected: true,
        address: action.address,
        isLoading: false,
      }
    }

    case "MOVE_PLAYER": {
      return {
        ...state,
        playerPosition: {
          x: action.x,
          y: action.y
        }
      }
    }

    case "EMIT_PULSE": {
      return {
        ...state,
        pulsesUsed: state.pulsesUsed + 1,
        revealedCells: [...state.revealedCells, ...action.cells]
      }
    }

    case "COMPLETE_CHAMBER": {
      return {
        ...state,
        chamberId: action.nextChamberId,
        revealedCells: [],
        notification: `Chamber ${state.chamberId} Completed!`
      }
    }

    case "PLAYER_DIED": {
      return {
        ...state,
        deaths: state.deaths + 1,
        notification: "You fell into the void!"
      }
    }

    case "SET_TX_STATUS": {
      return {
        ...state,
        txStatus: { message: action.message, type: action.txType },
      }
    }

    case "CLEAR_TX_STATUS": {
      return {
        ...state,
        txStatus: { message: "", type: null },
      }
    }

    case "SHOW_NOTIFICATION": {
      return {
        ...state,
        notification: action.message,
      }
    }

    case "CLEAR_NOTIFICATION": {
      return {
        ...state,
        notification: null,
      }
    }

    default:
      return state
  }
}

const GameContext = createContext<{
  state: GameState
  dispatch: React.Dispatch<GameAction>
} | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error("useGame must be used within a GameProvider")
  }
  return context
}

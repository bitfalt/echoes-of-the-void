import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface StartGameState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
  gameStarted: boolean;
}

interface UseStartGameReturn {
  gameState: StartGameState;
  startGame: () => Promise<void>;
  canStartGame: boolean;
  resetGameState: () => void;
}

export const useStartGame = (): UseStartGameReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, createGameRun, resetStore } = useAppStore();

  const [gameState, setGameState] = useState<StartGameState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
    gameStarted: false
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const canStartGame = isConnected && hasPlayer && !gameState.isLoading;

  const startGame = useCallback(async () => {
    if (!canStartGame || !account) {
      setGameState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : "Cannot start game right now"
      }));
      return;
    }

    try {
      setGameState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING',
        gameStarted: false
      });

      console.log("📤 Executing start game transaction...");

      // First reset any existing game data in the store
      resetStore();

      const tx = await client.game.create_game_run(account as Account);
      console.log("📥 Start game transaction response:", tx);

      if (tx?.transaction_hash) {
        setGameState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Start game transaction successful!");
        
        // Update game run in the store
        createGameRun();
        
        setGameState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false,
          gameStarted: true
        }));

        // Don't auto-clear since this is a significant state change
        // The UI should handle this state change appropriately

      } else {
        throw new Error(`Start game transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error starting game:", error);

      setGameState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED',
        gameStarted: false
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          error: null,
          txHash: null,
          txStatus: null
        }));
      }, 5000);
    }
  }, [canStartGame, account, client.game, resetStore, createGameRun]);

  const resetGameState = useCallback(() => {
    setGameState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
      gameStarted: false
    });
  }, []);

  return {
    gameState,
    startGame,
    canStartGame,
    resetGameState
  };
}; 
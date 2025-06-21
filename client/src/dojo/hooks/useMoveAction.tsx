import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

// Define the possible move directions
export type MoveDirection = 'left' | 'right' | 'up' | 'down';

interface MoveActionState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
  direction: MoveDirection | null;
}

interface UseMoveActionReturn {
  moveState: MoveActionState;
  executeMove: (direction: MoveDirection) => Promise<void>;
  canMove: boolean;
  resetMoveState: () => void;
}

export const useMoveAction = (): UseMoveActionReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, movePlayer } = useAppStore();

  const [moveState, setMoveState] = useState<MoveActionState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
    direction: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const canMove = isConnected && hasPlayer && !moveState.isLoading;

  const executeMove = useCallback(async (direction: MoveDirection) => {
    if (!canMove || !account) {
      setMoveState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : "Cannot move right now"
      }));
      return;
    }

    try {
      setMoveState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING',
        direction
      });

      console.log(`📤 Executing ${direction} move transaction...`);

      // Calculate dx and dy based on direction
      let dx = 0;
      let dy = 0;
      switch (direction) {
        case 'left':
          dx = -1;
          break;
        case 'right':
          dx = 1;
          break;
        case 'up':
          dy = 1;
          break;
        case 'down':
          dy = -1;
          break;
      }

      // Call the move_player function with dx/dy
      const tx = await client.game.movePlayer(account as Account, dx, dy);

      console.log(`📥 ${direction} move transaction response:`, tx);

      if (tx?.transaction_hash) {
        setMoveState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log(`✅ ${direction} move transaction successful!`);

        // Optimistic update of player position based on direction
        if (player) {
          const { x, y } = player;
          let newX = x;
          let newY = y;
          
          switch (direction) {
            case 'left':
              newX = x - 1;
              break;
            case 'right':
              newX = x + 1;
              break;
            case 'up':
              newY = y + 1;
              break;
            case 'down':
              newY = y - 1;
              break;
          }
          
          movePlayer(newX, newY);
        }

        setMoveState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 2 seconds
        setTimeout(() => {
          setMoveState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null,
            direction: null
          });
        }, 2000);

      } else {
        throw new Error(`Move transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error(`❌ Error executing ${direction} move:`, error);

      setMoveState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED',
        direction: null
      });

      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setMoveState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null,
          direction: null
        });
      }, 3000);
    }
  }, [canMove, account, client.game, player, movePlayer]);

  const resetMoveState = useCallback(() => {
    setMoveState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
      direction: null
    });
  }, []);

  return {
    moveState,
    executeMove,
    canMove,
    resetMoveState
  };
}; 
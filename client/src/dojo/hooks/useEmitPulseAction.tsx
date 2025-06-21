import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface EmitPulseState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
}

interface UseEmitPulseReturn {
  pulseState: EmitPulseState;
  emitPulse: () => Promise<void>;
  canEmitPulse: boolean;
  resetPulseState: () => void;
}

export const useEmitPulseAction = (): UseEmitPulseReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, emitPulse: updatePulseCount } = useAppStore();

  const [pulseState, setPulseState] = useState<EmitPulseState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const canEmitPulse = isConnected && hasPlayer && !pulseState.isLoading;

  const emitPulse = useCallback(async () => {
    if (!canEmitPulse || !account) {
      setPulseState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : "Cannot emit pulse right now"
      }));
      return;
    }

    try {
      setPulseState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING'
      });

      console.log("📤 Executing emit pulse transaction...");

      // Default pulse radius - adjust as needed for your game
      const radius = 5;
      const tx = await client.game.emit_pulse(account as Account, radius);
      console.log("📥 Emit pulse transaction response:", tx);

      if (tx?.transaction_hash) {
        setPulseState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Emit pulse transaction successful!");

        // Update pulse count in the store
        updatePulseCount();

        setPulseState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false
        }));

        // Auto-clear after 2 seconds
        setTimeout(() => {
          setPulseState({
            isLoading: false,
            error: null,
            txHash: null,
            txStatus: null
          });
        }, 2000);

      } else {
        throw new Error(`Emit pulse transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error emitting pulse:", error);

      setPulseState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED'
      });

      // Auto-clear error after 3 seconds
      setTimeout(() => {
        setPulseState({
          isLoading: false,
          error: null,
          txHash: null,
          txStatus: null
        });
      }, 3000);
    }
  }, [canEmitPulse, account, client.game, updatePulseCount]);

  const resetPulseState = useCallback(() => {
    setPulseState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null
    });
  }, []);

  return {
    pulseState,
    emitPulse,
    canEmitPulse,
    resetPulseState
  };
}; 
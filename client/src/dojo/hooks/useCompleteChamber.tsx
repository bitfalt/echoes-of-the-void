import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface CompleteChamberState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
  chamberCompleted: boolean;
}

interface UseCompleteChamberReturn {
  chamberState: CompleteChamberState;
  completeChamber: () => Promise<void>;
  canCompleteChamber: boolean;
  resetChamberState: () => void;
}

export const useCompleteChamber = (): UseCompleteChamberReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, completeChamber: updateCompleteChamber } = useAppStore();

  const [chamberState, setChamberState] = useState<CompleteChamberState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
    chamberCompleted: false
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const canCompleteChamber = isConnected && hasPlayer && !chamberState.isLoading;

  const completeChamber = useCallback(async () => {
    if (!canCompleteChamber || !account) {
      setChamberState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : "Cannot complete chamber right now"
      }));
      return;
    }

    try {
      setChamberState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING',
        chamberCompleted: false
      });

      console.log("📤 Executing complete chamber transaction...");

      const tx = await client.game.complete_chamber(account as Account);
      console.log("📥 Complete chamber transaction response:", tx);

      if (tx?.transaction_hash) {
        setChamberState(prev => ({ ...prev, txHash: tx.transaction_hash }));
      }

      if (tx && tx.code === "SUCCESS") {
        console.log("✅ Complete chamber transaction successful!");
        
        // Update player progress in the store
        updateCompleteChamber();

        setChamberState(prev => ({
          ...prev,
          txStatus: 'SUCCESS',
          isLoading: false,
          chamberCompleted: true
        }));

        // Don't auto-clear since this is a significant state change
        // The UI should handle this state change appropriately

      } else {
        throw new Error(`Complete chamber transaction failed with code: ${tx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error completing chamber:", error);

      setChamberState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED',
        chamberCompleted: false
      });

      // Auto-clear error after 5 seconds
      setTimeout(() => {
        setChamberState(prev => ({
          ...prev,
          error: null,
          txHash: null,
          txStatus: null
        }));
      }, 5000);
    }
  }, [canCompleteChamber, account, client.game, updateCompleteChamber]);

  const resetChamberState = useCallback(() => {
    setChamberState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
      chamberCompleted: false
    });
  }, []);

  return {
    chamberState,
    completeChamber,
    canCompleteChamber,
    resetChamberState
  };
}; 
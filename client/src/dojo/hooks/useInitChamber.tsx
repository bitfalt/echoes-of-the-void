import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { Account } from "starknet";
import useAppStore from "../../zustand/store";

interface InitChamberState {
  isLoading: boolean;
  error: string | null;
  txHash: string | null;
  txStatus: 'PENDING' | 'SUCCESS' | 'REJECTED' | null;
  chamberId: number | null;
}

interface UseInitChamberReturn {
  chamberState: InitChamberState;
  initChamber: (chamberId?: number) => Promise<void>;
  canInitChamber: boolean;
  resetChamberState: () => void;
}

export const useInitChamber = (): UseInitChamberReturn => {
  const { account, status } = useAccount();
  const { client } = useDojoSDK();
  const { player, createChamber, enterChamber, setChamber } = useAppStore();

  const [chamberState, setChamberState] = useState<InitChamberState>({
    isLoading: false,
    error: null,
    txHash: null,
    txStatus: null,
    chamberId: null
  });

  const isConnected = status === "connected";
  const hasPlayer = player !== null;
  const canInitChamber = isConnected && hasPlayer && !chamberState.isLoading;

  const initChamber = useCallback(async (chamberId?: number) => {
    if (!canInitChamber || !account) {
      setChamberState(prev => ({
        ...prev,
        error: !account ? "Please connect your controller" : "Cannot initialize chamber right now"
      }));
      return;
    }

    // Use provided chamber ID or default to 1 if not specified
    const targetChamberId = chamberId !== undefined ? chamberId : 1;

    try {
      setChamberState({
        isLoading: true,
        error: null,
        txHash: null,
        txStatus: 'PENDING',
        chamberId: targetChamberId
      });

      console.log(`📤 Executing initialize chamber ${targetChamberId} transaction...`);

      // Generate a random seed for the chamber
      const seed = Math.floor(Math.random() * 1000000);
      const width = 16;
      const height = 16;

      // First create the chamber
      const createTx = await client.game.createChamber(
        account as Account, 
        targetChamberId,
        seed,
        width,
        height
      );
      
      console.log("📥 Create chamber transaction response:", createTx);

      if (createTx?.transaction_hash) {
        setChamberState(prev => ({ ...prev, txHash: createTx.transaction_hash }));
      }

      if (createTx && createTx.code === "SUCCESS") {
        console.log(`✅ Create chamber ${targetChamberId} transaction successful!`);
        
        // Update chamber in the store
        createChamber(targetChamberId, seed, width, height);

        // Now enter the chamber
        console.log(`📤 Executing enter chamber ${targetChamberId} transaction...`);
        
        const enterTx = await client.game.enterChamber(account as Account, targetChamberId);
        console.log("📥 Enter chamber transaction response:", enterTx);

        if (enterTx && enterTx.code === "SUCCESS") {
          console.log(`✅ Enter chamber ${targetChamberId} transaction successful!`);
          
          // Update player's chamber in the store
          enterChamber(targetChamberId);
          
          // Create chamber object to update in the store
          const chamberData = {
            chamber_id: targetChamberId,
            seed,
            width,
            height,
            start_x: 0, // These will be updated from the contract
            start_y: 0,
            exit_x: width - 1, // Placeholder
            exit_y: height - 1,
            map: new Array(width * height).fill(1) // Initialize with all PATH cells
          };
          
          // Update current chamber in the store
          setChamber(chamberData);

          setChamberState(prev => ({
            ...prev,
            txStatus: 'SUCCESS',
            isLoading: false
          }));

          // Auto-clear after 3 seconds
          setTimeout(() => {
            setChamberState(prev => ({
              ...prev,
              error: null,
              txHash: null,
              txStatus: null
            }));
          }, 3000);
        } else {
          throw new Error(`Enter chamber transaction failed with code: ${enterTx?.code || 'unknown'}`);
        }
      } else {
        throw new Error(`Create chamber transaction failed with code: ${createTx?.code || 'unknown'}`);
      }

    } catch (error) {
      console.error("❌ Error initializing chamber:", error);

      setChamberState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        txHash: null,
        txStatus: 'REJECTED',
        chamberId: targetChamberId
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
  }, [canInitChamber, account, client.game, createChamber, enterChamber, setChamber]);

  const resetChamberState = useCallback(() => {
    setChamberState({
      isLoading: false,
      error: null,
      txHash: null,
      txStatus: null,
      chamberId: null
    });
  }, []);

  return {
    chamberState,
    initChamber,
    canInitChamber,
    resetChamberState
  };
}; 
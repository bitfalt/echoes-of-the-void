import { useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { useDojoSDK } from "@dojoengine/sdk/react";
import { dojoConfig } from "../dojoConfig";
import { Account } from "starknet";
import useAppStore, { Player } from "../../zustand/store";
import { Chamber } from "../../zustand/store";

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

// Constants
const TORII_URL = dojoConfig.toriiUrl + "/graphql";
const CHAMBER_QUERY = `
    query GetChamber($chamberId: u32!) {
      echoesOfTheVoidChamberModels(where: { chamber_id: $chamberId }) {
        edges {
          node {
            chamber_id
            map
            width
            height
            start_x
            start_y
            exit_x
            exit_y
            seed
          }
        }
        totalCount
      }
    }
`

// Helper to convert hex values to numbers
const hexToNumber = (hexValue: string | number): number => {
  if (typeof hexValue === 'number') return hexValue;

  if (typeof hexValue === 'string' && hexValue.startsWith('0x')) {
    return parseInt(hexValue, 16);
  }

  if (typeof hexValue === 'string') {
    return parseInt(hexValue, 10);
  }

  return 0;
};

const fetchChamberData = async (chamberId: number): Promise<Chamber | null> => {
  try {
    console.log("🔍 Fetching chamber with id:", chamberId);

    const response = await fetch(TORII_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: CHAMBER_QUERY,
        variables: { chamberId }
      }),
    });

    const result = await response.json();
    console.log("📡 GraphQL response:", result);

    if (!result.data?.echoesOfTheVoidChamberModels?.edges?.length) {
      console.log("❌ No chamber found in response");
      return null;
    }

    // Extract player data
    const rawChamberData = result.data.echoesOfTheVoidChamberModels.edges[0].node;
    console.log("📄 Raw chamber data:", rawChamberData);

    // Convert hex values to numbers - using your structure
    const chamberData: Chamber = {
      chamber_id: hexToNumber(rawChamberData.chamber_id),
      map: rawChamberData.map,
      width: hexToNumber(rawChamberData.width),
      height: hexToNumber(rawChamberData.height),
      start_x: hexToNumber(rawChamberData.start_x),
      start_y: hexToNumber(rawChamberData.start_y),
      exit_x: hexToNumber(rawChamberData.exit_x),
      exit_y: hexToNumber(rawChamberData.exit_y),
      seed: hexToNumber(rawChamberData.seed)
    };

    console.log("✅ Chamber data after conversion:", chamberData);
    return chamberData;

  } catch (error) {
    console.error("❌ Error fetching chamber:", error);
    throw error;
  }
};


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
          const chamberData = await fetchChamberData(targetChamberId);
          
          // Update current chamber in the store
          setChamber(chamberData);
          console.log("🔄 Chamber data after enter:", chamberData);

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
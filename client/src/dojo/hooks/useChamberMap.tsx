import { useState, useEffect, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import useAppStore from "../../zustand/store";

// Define cell types
export enum CellType {
  WALL = 0,      // Wall - cannot walk through
  PLAYER = 1,    // Player
  PATH = 2,      // Walkable path
  VOID = 3,      // Void - causes death
  EXIT = 4,       // Level exit
  START = 5       // Starting position
}

// Define a cell in the map
export interface MapCell {
  x: number;
  y: number;
  type: CellType;
  revealed: boolean;
}

// Define the chamber map
export interface ChamberMap {
  id: number;
  width: number;
  height: number;
  cells: MapCell[][];
  playerStart: { x: number, y: number };
  exit?: { x: number, y: number };
}

interface UseChamberMapReturn {
  map: ChamberMap | null;
  isLoading: boolean;
  error: string | null;
  revealedCells: MapCell[];
  fetchMap: () => Promise<void>;
  isMapRevealed: (x: number, y: number) => boolean;
  revealArea: (centerX: number, centerY: number, radius: number) => void;
  setMap: (map: ChamberMap | null) => void;
}

export const useChamberMap = (): UseChamberMapReturn => {
  const { account } = useAccount();
  const { player, chamber } = useAppStore();
  
  const [map, setMap] = useState<ChamberMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedCells, setRevealedCells] = useState<MapCell[]>([]);

  // Reveal area around a point (used for pulse) - temporary reveal
  const revealArea = useCallback((centerX: number, centerY: number, radius: number) => {
    if (!map) return;

    const newMap = { ...map };
    const newRevealed: MapCell[] = [];

    for (let y = Math.max(0, centerY - radius); y <= Math.min(map.height - 1, centerY + radius); y++) {
      for (let x = Math.max(0, centerX - radius); x <= Math.min(map.width - 1, centerX + radius); x++) {
        const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
        if (distance <= radius) {
          newMap.cells[y][x].revealed = true;
          newRevealed.push(newMap.cells[y][x]);
        }
      }
    }

    setMap(newMap);
    setRevealedCells(prev => [...prev, ...newRevealed]);
  }, [map]);

  // Fetch the map data
  const fetchMap = useCallback(async () => {
    if (!account || !player) {
      setError("Cannot fetch map: missing account or player");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // If no chamber data exists, try to fetch it from the blockchain
      if (!chamber) {
        console.log("⚠️ No chamber data found, attempting to fetch from blockchain...");
        
        // Try to fetch chamber data using the same logic as useInitChamber
        const TORII_URL = "http://localhost:8080/graphql";
        const CHAMBER_QUERY = `
          query GetChamber($chamberId: Int!) {
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
            }
          }
        `;

        const hexToNumber = (hexValue: string | number): number => {
          if (typeof hexValue === 'number') return hexValue;
          if (typeof hexValue === 'string') {
            if (hexValue.startsWith('0x')) {
              return parseInt(hexValue.slice(2), 16);
            }
            return parseInt(hexValue, 16);
          }
          return 0;
        };

        const response = await fetch(TORII_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: CHAMBER_QUERY,
            variables: { chamberId: player.chamber_id || 1 }
          }),
        });

        const result = await response.json();
        console.log("📡 Chamber GraphQL response:", result);

        if (!result.data?.echoesOfTheVoidChamberModels?.edges?.length) {
          setError("No chamber data found on blockchain");
          setIsLoading(false);
          return;
        }

        // Extract chamber data
        const rawChamberData = result.data.echoesOfTheVoidChamberModels.edges[0].node;
        console.log("📄 Raw chamber data:", rawChamberData);

        // Convert hex values to numbers
        const chamberData = {
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

        // Now process the map with the fetched chamber data
        const processedMap: ChamberMap = {
          id: chamberData.chamber_id,
          width: chamberData.width,
          height: chamberData.height,
          cells: [],
          playerStart: { x: chamberData.start_x, y: chamberData.start_y }
        };

        if (chamberData.exit_x !== undefined && chamberData.exit_y !== undefined) {
          processedMap.exit = { x: chamberData.exit_x, y: chamberData.exit_y };
        }

        // Initialize the cells array
        for (let y = 0; y < processedMap.height; y++) {
          processedMap.cells[y] = [];
          for (let x = 0; x < processedMap.width; x++) {
            // Calculate the index in the flattened map array
            const index = y * processedMap.width + x;
            
            // Get the cell type from the map array if available
            let cellType = CellType.VOID;
            if (chamberData.map && index < chamberData.map.length) {
              cellType = chamberData.map[index] as CellType;
            }
            
            // All cells start unrevealed
            processedMap.cells[y][x] = {
              x,
              y,
              type: cellType,
              revealed: false
            };
          }
        }

        // Set the exit position if available
        if (processedMap.exit) {
          const { x: exitX, y: exitY } = processedMap.exit;
          if (exitX >= 0 && exitX < processedMap.width && exitY >= 0 && exitY < processedMap.height) {
            processedMap.cells[exitY][exitX].type = CellType.EXIT;
          }
        }

        // Set the original start position (don't change based on player position)
        const startX = chamberData.start_x;
        const startY = chamberData.start_y;
        if (startX >= 0 && startX < processedMap.width && startY >= 0 && startY < processedMap.height) {
          processedMap.cells[startY][startX].type = CellType.START;
        }

        // Reveal only the player's current position and entrance
        const revealed: MapCell[] = [];
        const playerX = player.x;
        const playerY = player.y;
        
        // Only reveal the player's current position
        if (playerX >= 0 && playerX < processedMap.width && playerY >= 0 && playerY < processedMap.height) {
          processedMap.cells[playerY][playerX].revealed = true;
          revealed.push(processedMap.cells[playerY][playerX]);
        }

        setMap(processedMap);
        setRevealedCells(revealed);
        setIsLoading(false);
        return;
      }

      console.log(`🗺️ Fetching map for chamber ${chamber.chamber_id}...`);
      
      // Process the map data
      const processedMap: ChamberMap = {
        id: chamber.chamber_id,
        width: chamber.width,
        height: chamber.height,
        cells: [],
        playerStart: { x: chamber.start_x, y: chamber.start_y }
      };

      if (chamber.exit_x !== undefined && chamber.exit_y !== undefined) {
        processedMap.exit = { x: chamber.exit_x, y: chamber.exit_y };
      }

      // Initialize the cells array
      for (let y = 0; y < processedMap.height; y++) {
        processedMap.cells[y] = [];
        for (let x = 0; x < processedMap.width; x++) {
          // Calculate the index in the flattened map array
          const index = y * processedMap.width + x;
          
          // Get the cell type from the map array if available
          let cellType = CellType.VOID;
          if (chamber.map && index < chamber.map.length) {
            cellType = chamber.map[index] as CellType;
          }
          
          // All cells start unrevealed
          processedMap.cells[y][x] = {
            x,
            y,
            type: cellType,
            revealed: false
          };
        }
      }

      // Set the exit position if available
      if (processedMap.exit) {
        const { x: exitX, y: exitY } = processedMap.exit;
        if (exitX >= 0 && exitX < processedMap.width && exitY >= 0 && exitY < processedMap.height) {
          processedMap.cells[exitY][exitX].type = CellType.EXIT;
        }
      }

      // Set the original start position (don't change based on player position)
      const startX = chamber.start_x;
      const startY = chamber.start_y;
      if (startX >= 0 && startX < processedMap.width && startY >= 0 && startY < processedMap.height) {
        processedMap.cells[startY][startX].type = CellType.START;
      }

      // Reveal only the player's current position and entrance
      const revealed: MapCell[] = [];
      const playerX = player.x;
      const playerY = player.y;
      
      // Only reveal the player's current position
      if (playerX >= 0 && playerX < processedMap.width && playerY >= 0 && playerY < processedMap.height) {
        processedMap.cells[playerY][playerX].revealed = true;
        revealed.push(processedMap.cells[playerY][playerX]);
      }

      setMap(processedMap);
      setRevealedCells(revealed);
      setIsLoading(false);

    } catch (error) {
      console.error("❌ Error fetching map:", error);
      setError(error instanceof Error ? error.message : "Failed to fetch map");
      setIsLoading(false);
    }
  }, [account, player, chamber]);

  // Check if a cell is revealed
  const isMapRevealed = useCallback((x: number, y: number): boolean => {
    if (!map || !map.cells || y < 0 || y >= map.cells.length || x < 0 || x >= map.cells[y].length) {
      return false;
    }
    return map.cells[y][x].revealed;
  }, [map]);

  // Set map function for external updates
  const setMapState = useCallback((newMap: ChamberMap | null) => {
    setMap(newMap);
  }, []);

  // Fetch map when chamber changes
  useEffect(() => {
    if (chamber) {
      fetchMap();
    }
  }, [chamber, fetchMap]);

  return {
    map,
    isLoading,
    error,
    revealedCells,
    fetchMap,
    isMapRevealed,
    revealArea,
    setMap: setMapState
  };
}; 
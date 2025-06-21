import { useState, useEffect, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import useAppStore from "../../zustand/store";

// Define cell types
export enum CellType {
  WALL = 0,      // Not yet revealed
  PLAYER = 1,    // Player
  PATH = 2,      // Walkable path
  VOID = 3,      // Void
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
}

export const useChamberMap = (): UseChamberMapReturn => {
  const { account } = useAccount();
  const { player, chamber } = useAppStore();
  
  const [map, setMap] = useState<ChamberMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedCells, setRevealedCells] = useState<MapCell[]>([]);

  // Fetch the map data
  const fetchMap = useCallback(async () => {
    if (!account || !player || !chamber) {
      setError("Cannot fetch map: missing account, player, or current chamber");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

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
          
          // Default to VOID (unrevealed) for most cells
          processedMap.cells[y][x] = {
            x,
            y,
            type: cellType,
            revealed: false // Initially all cells are unrevealed
          };
        }
      }

      // Set the player start position
      const { x: startX, y: startY } = processedMap.playerStart;
      if (startX >= 0 && startX < processedMap.width && startY >= 0 && startY < processedMap.height) {
        processedMap.cells[startY][startX].type = CellType.START;
        processedMap.cells[startY][startX].revealed = true;
      }

      // Set the exit position if available
      if (processedMap.exit) {
        const { x: exitX, y: exitY } = processedMap.exit;
        if (exitX >= 0 && exitX < processedMap.width && exitY >= 0 && exitY < processedMap.height) {
          processedMap.cells[exitY][exitX].type = CellType.EXIT;
        }
      }

      // Process revealed cells - this would come from the contract
      // For now, we'll just reveal cells around the player
      const revealed: MapCell[] = [];
      const playerX = player.x;
      const playerY = player.y;
      const revealRadius = 3;
      
      for (let y = Math.max(0, playerY - revealRadius); y <= Math.min(processedMap.height - 1, playerY + revealRadius); y++) {
        for (let x = Math.max(0, playerX - revealRadius); x <= Math.min(processedMap.width - 1, playerX + revealRadius); x++) {
          const distance = Math.sqrt(Math.pow(x - playerX, 2) + Math.pow(y - playerY, 2));
          if (distance <= revealRadius) {
            // Get the cell type from the map array
            const index = y * processedMap.width + x;
            if (chamber.map && index < chamber.map.length) {
              processedMap.cells[y][x].type = chamber.map[index] as CellType;
            } else {
              // Fallback to random cell types if map data is not available
              processedMap.cells[y][x].type = Math.random() > 0.3 ? CellType.PATH : CellType.WALL;
            }
            
            processedMap.cells[y][x].revealed = true;
            revealed.push(processedMap.cells[y][x]);
          }
        }
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
    isMapRevealed
  };
}; 
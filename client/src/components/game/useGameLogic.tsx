import { useState, useEffect, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { 
  useMoveAction, 
  useEmitPulseAction, 
  useCompleteChamber,
  useChamberMap,
  useInitChamber
} from "../../dojo/hooks";
import { MoveDirection } from "../../dojo/hooks/useMoveAction";
import { CellType } from "../../dojo/hooks/useChamberMap";
import useAppStore from "../../zustand/store";
import { useGame } from "../../context/game-context";

export const useGameLogic = () => {
  const { isConnected } = useAccount();
  const { player } = useAppStore();
  const { moveState, executeMove } = useMoveAction();
  const { pulseState, emitPulse } = useEmitPulseAction();
  const { chamberState, completeChamber } = useCompleteChamber();
  const { map, fetchMap, revealArea, isLoading, setMap } = useChamberMap();
  const { initChamber, chamberState: initChamberState } = useInitChamber();
  const { dispatch } = useGame();
  
  const [currentChamberId, setCurrentChamberId] = useState(1);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [entrancePosition, setEntrancePosition] = useState<{x: number, y: number} | null>(null);
  const [pulseCooldown, setPulseCooldown] = useState(false);
  const [deathAnimation, setDeathAnimation] = useState(false);
  const [deathCounted, setDeathCounted] = useState(false);
  const [completionCounted, setCompletionCounted] = useState(false);

  // Initialize the first chamber when the game starts
  useEffect(() => {
    if (isConnected && player && !initChamberState.isLoading) {
      // If player has a chamber_id but no chamber data in store, fetch it
      if (player.chamber_id > 0) {
        // Try to fetch existing chamber data first
        fetchMap();
      } else {
        // Initialize new chamber if player doesn't have one
        initChamber(currentChamberId);
      }
    }
  }, [isConnected, player, currentChamberId, initChamber, initChamberState.isLoading, fetchMap]);

  // Set entrance position when map is first loaded (use original start position)
  useEffect(() => {
    if (map && !entrancePosition) {
      setEntrancePosition({ x: map.playerStart.x, y: map.playerStart.y });
    }
  }, [map, entrancePosition]);

  // Refresh map when needed
  useEffect(() => {
    if (player && player.chamber_id > 0) {
      fetchMap();
    }
  }, [player, fetchMap]);

  // Also fetch map when player exists but no map is loaded
  useEffect(() => {
    if (player && !map && !isLoading) {
      console.log("🔄 Player exists but no map loaded, fetching map...");
      fetchMap();
    }
  }, [player, map, isLoading, fetchMap]);

  // Check if a move is valid (not into a wall)
  const isValidMove = useCallback((newX: number, newY: number): boolean => {
    if (!map || newX < 0 || newX >= map.width || newY < 0 || newY >= map.height) {
      return false;
    }
    
    const cell = map.cells[newY][newX];
    // Allow movement into void (will trigger death), but block walls
    return cell.type !== CellType.WALL;
  }, [map]);

  // Handle player death (stepping in void)
  const handlePlayerDeath = useCallback(() => {
    if (!map || !entrancePosition || deathCounted) return;
    
    console.log("💀 Player stepped in void! Starting death animation...");
    
    // Mark death as counted
    setDeathCounted(true);
    
    // Start death animation
    setDeathAnimation(true);
    
    // Show death notification
    dispatch({
      type: "SHOW_NOTIFICATION",
      message: "You fell into the void... The darkness consumes you..."
    });
    
    // After death animation, reset player
    setTimeout(() => {
      console.log("💀 Death animation complete, restarting at entrance...");
      
      // Reset player to entrance position
      const { x: startX, y: startY } = entrancePosition;
      
      // Update player position in store and increment death counter
      dispatch({ 
        type: "MOVE_PLAYER", 
        x: startX, 
        y: startY 
      });
      
      // Increment death counter in store
      const { player } = useAppStore.getState();
      if (player) {
        useAppStore.setState({
          player: {
            ...player,
            deaths: player.deaths + 1,
            x: startX,
            y: startY
          }
        });
      }
      
      // End death animation
      setDeathAnimation(false);
      
      // Reset death counter so player can die again
      setDeathCounted(false);
      
      // Show respawn notification
      dispatch({
        type: "SHOW_NOTIFICATION",
        message: "You have been reborn at the entrance..."
      });
      
      // Refresh map to show only entrance area
      fetchMap();
    }, 3000); // 3 second death animation
  }, [map, entrancePosition, dispatch, fetchMap, deathCounted]);

  // Handle chamber completion
  const handleCompleteLevel = useCallback(() => {
    if (!chamberState.isLoading && player && !completionCounted) {
      // Mark completion as counted
      setCompletionCounted(true);
      
      completeChamber();
      
      // Set transaction status
      dispatch({
        type: "SET_TX_STATUS",
        message: "Completing chamber...",
        txType: "pending"
      });
      
      // After completing, go to next chamber
      const nextChamberId = currentChamberId + 1;
      setCurrentChamberId(nextChamberId);
      
      // Update game context
      dispatch({
        type: "COMPLETE_CHAMBER",
        nextChamberId
      });
      
      // Show notification
      dispatch({
        type: "SHOW_NOTIFICATION",
        message: `Chamber ${currentChamberId} completed!`
      });
    }
  }, [chamberState.isLoading, player, completeChamber, dispatch, currentChamberId, completionCounted]);

  // Update game context when player moves
  useEffect(() => {
    if (player && map) {
      const previousPosition = useAppStore.getState().player;
      const hasActuallyMoved = !previousPosition || 
        previousPosition.x !== player.x || 
        previousPosition.y !== player.y;
      
      dispatch({ 
        type: "MOVE_PLAYER", 
        x: player.x, 
        y: player.y 
      });
      
      // Only reset counters when player actually moves to a different position
      if (hasActuallyMoved) {
        setDeathCounted(false);
        setCompletionCounted(false);
      }
      
      // Check if player stepped in void
      const currentCell = map.cells[player.y][player.x];
      if (currentCell.type === CellType.VOID) {
        handlePlayerDeath();
        return;
      }
      
      // Check if player is at the exit cell
      if (map.exit && player.x === map.exit.x && player.y === map.exit.y) {
        handleCompleteLevel();
      }
    }
  }, [player, dispatch, map, handlePlayerDeath, handleCompleteLevel]);

  // Handle player movement
  const handleMove = useCallback((direction: MoveDirection) => {
    if (!moveState.isLoading && player && map) {
      // Calculate new position
      let newX = player.x;
      let newY = player.y;
      
      switch (direction) {
        case 'left':
          newX = player.x - 1;
          break;
        case 'right':
          newX = player.x + 1;
          break;
        case 'up':
          newY = player.y - 1;
          break;
        case 'down':
          newY = player.y + 1;
          break;
      }
      
      // Check if move is valid
      if (!isValidMove(newX, newY)) {
        console.log("🚫 Cannot move into wall");
        dispatch({
          type: "SET_TX_STATUS",
          message: "Cannot move into wall",
          txType: "error"
        });
        return;
      }
      
      executeMove(direction);

      // Set transaction status
      dispatch({
        type: "SET_TX_STATUS",
        message: `Moving ${direction}...`,
        txType: "pending"
      });
    }
  }, [moveState.isLoading, player, map, isValidMove, dispatch, executeMove]);

  // Handle pulse emission
  const handlePulse = useCallback(() => {
    if (!pulseState.isLoading && player && map && !pulseCooldown) {
      emitPulse();

      // Set cooldown
      setPulseCooldown(true);
      setTimeout(() => setPulseCooldown(false), 3000); // 3 second cooldown

      // Set transaction status
      dispatch({
        type: "SET_TX_STATUS",
        message: "Emitting pulse...",
        txType: "pending"
      });
      
      // Trigger pulse animation with new key
      setPulseKey(prev => prev + 1);
      setPulseAnimation(true);
      
      // Reveal area around player (reduced pulse radius of 2)
      setTimeout(() => {
        revealArea(player.x, player.y, 2);
      }, 200);
      
      // Reset animation after completion
      setTimeout(() => setPulseAnimation(false), 1500);
      
      // Hide revealed area after duration
      setTimeout(() => {
        // Re-hide all cells except entrance and player position
        if (map) {
          const updatedMap = { ...map };
          updatedMap.cells = updatedMap.cells.map(row => 
            row.map(cell => ({
              ...cell,
              revealed: (entrancePosition && cell.x === entrancePosition.x && cell.y === entrancePosition.y) ||
                       (player && cell.x === player.x && cell.y === player.y)
            }))
          );
          // Force a re-render by updating the map state
          setMap(updatedMap);
        }
      }, 3000);
    } else if (pulseCooldown) {
      // Show cooldown message if player tries to use pulse during cooldown
      dispatch({
        type: "SHOW_NOTIFICATION",
        message: "Pulse is on cooldown! Wait a moment..."
      });
    }
  }, [pulseState.isLoading, player, map, pulseCooldown, emitPulse, dispatch, setPulseKey, setPulseAnimation, revealArea, entrancePosition, setMap]);

  // Update transaction status when operations complete
  useEffect(() => {
    if (moveState.txStatus === "SUCCESS") {
      dispatch({
        type: "SET_TX_STATUS",
        message: "Move successful!",
        txType: "success"
      });
      
      setTimeout(() => {
        dispatch({ type: "CLEAR_TX_STATUS" });
      }, 2000);
    } else if (moveState.txStatus === "REJECTED") {
      dispatch({
        type: "SET_TX_STATUS",
        message: moveState.error || "Move failed!",
        txType: "error"
      });
    }
  }, [moveState.txStatus, moveState.error, dispatch]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      // Don't handle if any operation is in progress
      if (moveState.isLoading || pulseState.isLoading) return;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          handleMove('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          handleMove('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          handleMove('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          handleMove('right');
          break;
        case ' ':
          if (!pulseCooldown) {
            handlePulse();
          } else {
            // Show cooldown message if player tries to spam
            dispatch({
              type: "SHOW_NOTIFICATION",
              message: "Pulse is on cooldown! Wait a moment..."
            });
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveState.isLoading, pulseState.isLoading, pulseCooldown, handleMove, handlePulse, dispatch]);

  // Handle game restart
  const handleRestart = useCallback(() => {
    // Reset to chamber 1
    setCurrentChamberId(1);
    
    // Reset player state
    const { player } = useAppStore.getState();
    if (player) {
      useAppStore.setState({
        player: {
          ...player,
          chamber_id: 1,
          deaths: 0,
          pulses_used: 0,
          x: 0,
          y: 0
        }
      });
    }
    
    // Clear notifications and status
    dispatch({ type: "CLEAR_TX_STATUS" });
    dispatch({ type: "CLEAR_NOTIFICATION" });
    
    // Refresh map for chamber 1
    fetchMap();
    
    // Show restart notification
    dispatch({
      type: "SHOW_NOTIFICATION",
      message: "Game restarted! Welcome to Chamber 1."
    });
  }, [dispatch, fetchMap]);

  return {
    // State
    player,
    map,
    isLoading,
    currentChamberId,
    entrancePosition,
    pulseAnimation,
    pulseKey,
    pulseCooldown,
    deathAnimation,
    moveState,
    pulseState,

    // Actions
    handleMove,
    handlePulse,
    handleRestart
  };
}; 
import { useEffect, useState, useCallback } from "react";
import { useAccount } from "@starknet-react/core";
import { 
  useMoveAction, 
  useEmitPulseAction, 
  useCompleteChamber,
  useChamberMap,
  useInitChamber
} from "../../dojo/hooks";
import { MoveDirection } from "../../dojo/hooks/useMoveAction";
import { CellType, MapCell } from "../../dojo/hooks/useChamberMap";
import useAppStore from "../../zustand/store";
import { useGame } from "../../context/game-context";

// Import game assets
import characterImg from "../../assets/character1.png";
import character2Img from "../../assets/character2.png";
import entranceImg from "../../assets/entrance.png";
import exitImg from "../../assets/exit.png";
import voidImg from "../../assets/void1.png";

export default function GameScreen() {
  const { isConnected } = useAccount();
  const { player } = useAppStore();
  const { moveState, executeMove } = useMoveAction();
  const { pulseState, emitPulse } = useEmitPulseAction();
  const { chamberState, completeChamber } = useCompleteChamber();
  const { map, fetchMap, revealArea, isLoading, setMap } = useChamberMap();
  const { initChamber, chamberState: initChamberState } = useInitChamber();
  const { state: gameState, dispatch } = useGame();
  
  const [currentChamberId, setCurrentChamberId] = useState(1);
  const [pulseAnimation, setPulseAnimation] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [entrancePosition, setEntrancePosition] = useState<{x: number, y: number} | null>(null);
  const [pulseCooldown, setPulseCooldown] = useState(false);
  const [deathAnimation, setDeathAnimation] = useState(false);
  const [characterFrame, setCharacterFrame] = useState(0);
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

  // Character animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCharacterFrame(prev => (prev + 1) % 2); // Switch between 0 and 1
    }, 500); // Change frame every 500ms

    return () => clearInterval(interval);
  }, []);

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

  // Render a cell based on its type
  const renderCell = (cell: MapCell, x: number, y: number) => {
    // Check if this is the entrance position (static)
    const isEntrance = entrancePosition && x === entrancePosition.x && y === entrancePosition.y;
    const isPlayer = player && x === player.x && y === player.y;
    
    // Only show revealed cells, entrance, or player position (no adjacent cells)
    if (!cell.revealed && !isEntrance && !isPlayer) {
      return <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black border border-black" />;
    }

    switch (cell.type) {
      case CellType.PATH:
        return (
          <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 border border-gray-700 flex items-center justify-center relative overflow-hidden ${
            isPlayer ? 'ring-2 ring-white/30 shadow-lg' : ''
          }`}>
            {isEntrance && (
              <>
                {/* Entrance glow effect */}
                <div className="absolute inset-0 bg-blue-400 opacity-10 rounded-full blur-sm" style={{ 
                  filter: 'blur(24px)',
                  transform: 'scale(0.6)',
                  background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)'
                }}></div>
                <img src={entranceImg} alt="Start" className="w-20 h-20 sm:w-28 sm:h-28 relative z-10" />
              </>
            )}
          </div>
        );
      case CellType.WALL:
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 border-2 border-gray-500 shadow-inner relative overflow-hidden">
            {/* Wall texture effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-gray-600/50 to-gray-800/50 opacity-60"></div>
            {/* Wall highlights */}
            <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gray-400/30 rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gray-900/40 rounded-tl-full"></div>
          </div>
        );
      case CellType.START:
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 border border-gray-700 flex items-center justify-center relative overflow-hidden">
            {/* Entrance glow effect */}
            <div className="absolute inset-0 bg-blue-400 opacity-10 rounded-full blur-sm" style={{ 
              filter: 'blur(24px)',
              transform: 'scale(0.6)',
              background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)'
            }}></div>
            <img src={entranceImg} alt="Start" className="w-20 h-20 sm:w-28 sm:h-28 relative z-10" />
          </div>
        );
      case CellType.EXIT:
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-900 border border-green-700 flex items-center justify-center">
            <img src={exitImg} alt="Exit" className="w-12 h-12 sm:w-16 sm:h-16" />
          </div>
        );
      case CellType.VOID:
      default:
        return (
          <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black flex items-center justify-center overflow-hidden">
            <img src={voidImg} alt="Void" className="w-28 h-28 sm:w-36 sm:h-36" />
          </div>
        );
    }
  };

  // Render the player at their current position
  const renderPlayer = () => {
    if (!player || !map) return null;

    // Use player position or fall back to start position
    const playerX = player.x !== undefined ? player.x : map.playerStart.x;
    const playerY = player.y !== undefined ? player.y : map.playerStart.y;
    const cellSize = window.innerWidth < 640 ? 96 : 128; // 96px on mobile, 128px on desktop
    
    // Choose character image based on animation frame
    const characterImage = characterFrame === 0 ? characterImg : character2Img;
    
    return (
      <div 
        className={`absolute w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transition-all duration-300 ${pulseAnimation ? 'z-20' : 'z-10'} ${
          deathAnimation ? 'animate-pulse opacity-50' : 'animate-bounce-slow'
        }`}
        style={{ 
          left: `${playerX * cellSize}px`, 
          top: `${playerY * cellSize}px`,
          transform: 'translate(0, 0)'
        }}
      >
        {/* Character glow effect */}
        <div className={`absolute inset-0 rounded-full blur-sm ${
          deathAnimation 
            ? 'bg-red-500 opacity-2 animate-ping' 
            : 'bg-white opacity-0.5'
        }`} style={{ 
          zIndex: -1,
          filter: 'blur(24px)',
          transform: 'scale(0.6)'
        }}></div>
        
        {/* Character image */}
        <img 
          src={characterImage} 
          alt="Player" 
          className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 ${
            deathAnimation ? 'animate-spin opacity-75' : ''
          }`}
        />
        
        {/* Pulse animation */}
        {pulseAnimation && (
          <>
            {/* First ring */}
            <div 
              key={`${pulseKey}-1`}
              className="absolute w-48 h-48 sm:w-64 sm:h-64 animate-ping-slow pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-white opacity-80 shadow-lg shadow-white/40 bg-transparent"></div>
            </div>
            
            {/* Second ring */}
            <div 
              key={`${pulseKey}-2`}
              className="absolute w-48 h-48 sm:w-64 sm:h-64 animate-ping-slow pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animationDelay: '0.3s'
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-white opacity-60 shadow-lg shadow-white/30 bg-transparent"></div>
            </div>
            
            {/* Third ring */}
            <div 
              key={`${pulseKey}-3`}
              className="absolute w-48 h-48 sm:w-64 sm:h-64 animate-ping-slow pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                animationDelay: '0.6s'
              }}
            >
              <div className="w-full h-full rounded-full border-2 border-white opacity-40 shadow-lg shadow-white/20 bg-transparent"></div>
            </div>
          </>
        )}
      </div>
    );
  };

  if (!player) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono text-lg">Loading player data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Game header */}
      <div className="bg-black border-b border-gray-800 p-3 sm:p-4 text-white">
        <div className="flex justify-between items-center">
          <h1 className="text-lg sm:text-xl font-bold font-mono">ECHOES OF THE VOID</h1>
          <div className="flex items-center space-x-4">
            <div className="flex space-x-2 sm:space-x-4 text-sm sm:text-base font-mono">
              <div>CHAMBER: {player.chamber_id || currentChamberId}</div>
              <div>PULSES: {player.pulses_used}</div>
              <div>DEATHS: {player.deaths}</div>
            </div>
            <button
              onClick={() => {
                if (confirm("Are you sure you want to restart the game? This will reset all progress and return to Chamber 1.")) {
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
                }
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-mono text-xs border border-red-500 transition-colors duration-200"
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              RESTART
            </button>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Game map with camera following player */}
        {map && player && (
          <div 
            className="absolute transition-transform duration-300"
            style={{ 
              display: 'grid',
              gridTemplateColumns: `repeat(${map.width}, ${window.innerWidth < 640 ? '96px' : '128px'})`,
              gridTemplateRows: `repeat(${map.height}, ${window.innerWidth < 640 ? '96px' : '128px'})`,
              left: '50%',
              top: '50%',
              transform: `translate(${window.innerWidth < 640 ? -player.x * 96 - 48 : -player.x * 128 - 64}px, ${window.innerWidth < 640 ? -player.y * 96 - 48 : -player.y * 128 - 64}px)`
            }}
          >
            {map.cells.map((row, y) =>
              row.map((cell, x) => (
                <div key={`${x}-${y}`} className="relative">
                  {renderCell(cell, x, y)}
                </div>
              ))
            )}
            {renderPlayer()}
          </div>
        )}

        {/* Loading state - only show when map is not loaded */}
        {!map && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30">
            <div className="text-white font-mono text-lg">Loading...</div>
          </div>
        )}
      </div>

      {/* Game controls */}
      <div className="bg-black border-t border-gray-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
          {/* Movement controls */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleMove('up')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200 mb-2"
              disabled={moveState.isLoading}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              ↑
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => handleMove('left')}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200"
                disabled={moveState.isLoading}
                style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
              >
                ←
              </button>
              <button
                onClick={() => handleMove('down')}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200"
                disabled={moveState.isLoading}
                style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
              >
                ↓
              </button>
              <button
                onClick={() => handleMove('right')}
                className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200"
                disabled={moveState.isLoading}
                style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
              >
                →
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handlePulse}
              className={`px-4 py-2 sm:px-6 sm:py-3 font-bold font-mono rounded-none border-2 transition-all duration-200 text-sm sm:text-base ${
                pulseCooldown 
                  ? 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed' 
                  : 'bg-white hover:bg-gray-200 text-black border-white hover:border-gray-400'
              }`}
              disabled={pulseState.isLoading}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              {pulseCooldown ? 'PULSE COOLDOWN' : 'EMIT PULSE'}
            </button>
          </div>
        </div>
      </div>

      {/* Game instructions */}
      <div className="bg-black border-t border-gray-800 p-2 text-center text-xs text-gray-400 font-mono">
        <p>ARROW KEYS / WASD TO MOVE | SPACE TO EMIT PULSE | REACH THE EXIT TO COMPLETE</p>
      </div>

      {/* Status messages */}
      <div className="bg-black p-3 sm:p-4 text-center">
        {gameState.txStatus.type && (
          <div className={`mb-2 font-mono text-sm sm:text-base ${
            gameState.txStatus.type === "success" ? "text-green-400" :
            gameState.txStatus.type === "error" ? "text-red-400" :
            "text-yellow-400"
          }`}>
            {gameState.txStatus.message}
          </div>
        )}
        
        {gameState.notification && (
          <div className="text-blue-400 mb-2 font-bold font-mono text-sm sm:text-base">
            {gameState.notification}
          </div>
        )}
      </div>
    </div>
  );
}
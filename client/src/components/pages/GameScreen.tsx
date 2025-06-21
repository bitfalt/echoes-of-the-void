import { useEffect, useState } from "react";
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
import entranceImg from "../../assets/entrance.png";
import exitImg from "../../assets/exit.png";
import voidImg from "../../assets/void1.png";

export default function GameScreen() {
  const { isConnected } = useAccount();
  const { player } = useAppStore();
  const { moveState, executeMove } = useMoveAction();
  const { pulseState, emitPulse } = useEmitPulseAction();
  const { chamberState, completeChamber } = useCompleteChamber();
  const { map, fetchMap } = useChamberMap();
  const { initChamber } = useInitChamber();
  const { state: gameState, dispatch } = useGame();
  
  const [currentChamberId, setCurrentChamberId] = useState(1);

  // Initialize the first chamber when the game starts
  useEffect(() => {
    if (isConnected && player && !player.chamber_id) {
      initChamber(currentChamberId);
    }
  }, [isConnected, player, currentChamberId, initChamber]);

  // Refresh map when needed
  useEffect(() => {
    if (player && player.chamber_id > 0) {
      fetchMap();
    }
  }, [player, fetchMap]);

  // Update game context when player moves
  useEffect(() => {
    if (player) {
      dispatch({ 
        type: "MOVE_PLAYER", 
        x: player.x, 
        y: player.y 
      });
    }
  }, [player, dispatch]);

  // Handle player movement
  const handleMove = (direction: MoveDirection) => {
    if (!moveState.isLoading) {
      executeMove(direction);

      // Set transaction status
      dispatch({
        type: "SET_TX_STATUS",
        message: `Moving ${direction}...`,
        txType: "pending"
      });
    }
  };

  // Handle pulse emission
  const handlePulse = () => {
    if (!pulseState.isLoading) {
      emitPulse();

      // Set transaction status
      dispatch({
        type: "SET_TX_STATUS",
        message: "Emitting pulse...",
        txType: "pending"
      });
    }
  };

  // Handle chamber completion
  const handleCompleteLevel = () => {
    if (!chamberState.isLoading && player) {
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
    }
  };

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

  // Render a cell based on its type
  const renderCell = (cell: MapCell) => {
    if (!cell.revealed) {
      return <div className="w-8 h-8 bg-slate-900" />;
    }

    switch (cell.type) {
      case CellType.PATH:
        return <div className="w-8 h-8 bg-slate-700" />;
      case CellType.WALL:
        return <div className="w-8 h-8 bg-slate-500" />;
      case CellType.START:
        return (
          <div className="w-8 h-8 bg-slate-700 flex items-center justify-center">
            <img src={entranceImg} alt="Start" className="w-6 h-6" />
          </div>
        );
      case CellType.EXIT:
        return (
          <div className="w-8 h-8 bg-green-800 flex items-center justify-center">
            <img src={exitImg} alt="Exit" className="w-6 h-6" />
          </div>
        );
      case CellType.VOID:
      default:
        return (
          <div className="w-8 h-8 bg-black flex items-center justify-center">
            <img src={voidImg} alt="Void" className="w-6 h-6" />
          </div>
        );
    }
  };

  // Render the player at their current position
  const renderPlayer = () => {
    if (!player || !map) return null;

    const { x, y } = player;
    
    return (
      <div 
        className="absolute w-8 h-8 flex items-center justify-center transition-all duration-300"
        style={{ 
          left: `${x * 32}px`, 
          top: `${y * 32}px`,
          transform: 'translate(0, 0)'
        }}
      >
        <img src={characterImg} alt="Player" className="w-6 h-6" />
      </div>
    );
  };

  if (!isConnected || !player) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p className="text-white">Please connect your controller first</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Game header */}
      <div className="bg-slate-800 p-4 text-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Echoes of the Void</h1>
          <div className="flex space-x-4">
            <div>Chamber: {player.chamber_id || currentChamberId}</div>
            <div>Pulses: {player.pulses_used}</div>
            <div>Deaths: {player.deaths}</div>
          </div>
        </div>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          {/* Game map */}
          {map && (
            <div 
              className="grid gap-0 relative"
              style={{ 
                gridTemplateColumns: `repeat(${map.width}, 32px)`,
                gridTemplateRows: `repeat(${map.height}, 32px)`
              }}
            >
              {map.cells.map((row, y) =>
                row.map((cell, x) => (
                  <div key={`${x}-${y}`} className="relative">
                    {renderCell(cell)}
                  </div>
                ))
              )}
              {renderPlayer()}
            </div>
          )}

          {/* Loading state */}
          {(!map || moveState.isLoading || pulseState.isLoading) && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="text-white">Loading...</div>
            </div>
          )}
        </div>
      </div>

      {/* Game controls */}
      <div className="bg-slate-800 p-4">
        <div className="container mx-auto flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
          {/* Movement controls */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => handleMove('jump')}
              className="w-12 h-12 bg-blue-700 hover:bg-blue-600 text-white rounded-lg mb-2"
              disabled={moveState.isLoading}
            >
              ↑
            </button>
            <div className="flex space-x-2">
              <button
                onClick={() => handleMove('left')}
                className="w-12 h-12 bg-blue-700 hover:bg-blue-600 text-white rounded-lg"
                disabled={moveState.isLoading}
              >
                ←
              </button>
              <button
                onClick={() => handleMove('right')}
                className="w-12 h-12 bg-blue-700 hover:bg-blue-600 text-white rounded-lg"
                disabled={moveState.isLoading}
              >
                →
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handlePulse}
              className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
              disabled={pulseState.isLoading}
            >
              Emit Pulse
            </button>
            <button
              onClick={handleCompleteLevel}
              className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg"
              disabled={chamberState.isLoading}
            >
              Complete Level
            </button>
          </div>
        </div>
      </div>

      {/* Status messages */}
      <div className="bg-slate-900 p-4 text-center">
        {gameState.txStatus.type && (
          <div className={`mb-2 ${
            gameState.txStatus.type === "success" ? "text-green-400" :
            gameState.txStatus.type === "error" ? "text-red-400" :
            "text-yellow-400"
          }`}>
            {gameState.txStatus.message}
          </div>
        )}
        
        {gameState.notification && (
          <div className="text-blue-400 mb-2 font-bold">
            {gameState.notification}
          </div>
        )}
      </div>
    </div>
  );
} 
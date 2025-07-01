import { useAccount } from "@starknet-react/core";
import { GameHeader } from "../game/GameHeader";
import { GameMap } from "../game/GameMap";
import { GameControls } from "../game/GameControls";
import { GameInstructions } from "../game/GameInstructions";
import { GameStatusMessages } from "../game/GameStatusMessages";
import { LoadingScreen } from "../game/LoadingScreen";
import { useGameLogic } from "../game/useGameLogic";

export default function GameScreen() {
  const { isConnected } = useAccount();
  const {
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
    handleMove,
    handlePulse,
    handleRestart
  } = useGameLogic();

  // Show loading screen if player data is not available
  if (!player) {
    return <LoadingScreen message="Loading player data..." />;
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col overflow-hidden">
      {/* Game header with stats and restart button */}
      <GameHeader 
        currentChamberId={currentChamberId} 
        onRestart={handleRestart} 
      />

      {/* Game area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Game map with camera following player */}
        {map && player && (
          <GameMap 
            map={map}
            player={player}
            entrancePosition={entrancePosition}
            deathAnimation={deathAnimation}
            pulseAnimation={pulseAnimation}
            pulseKey={pulseKey}
          />
        )}

        {/* Loading state - only show when map is not loaded */}
        {(!map || isLoading) && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30">
            <div className="text-white font-mono text-lg">Loading...</div>
          </div>
        )}
      </div>

      {/* Game controls */}
      <GameControls 
        onMove={handleMove}
        onPulse={handlePulse}
        moveLoading={moveState.isLoading}
        pulseLoading={pulseState.isLoading}
        pulseCooldown={pulseCooldown}
      />

      {/* Game instructions */}
      <GameInstructions />

      {/* Status messages */}
      <GameStatusMessages />
    </div>
  );
}
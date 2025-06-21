import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import WelcomeScreen from "../components/pages/WelcomeScreen";
import GameScreen from "../components/pages/GameScreen";
import useAppStore from "../zustand/store";
import { GameProvider } from "../context/game-context";
import { useGame } from "../context/game-context";

// Main App wrapper with GameProvider
function App() {
  return (
    <GameProvider>
      <AppContent />
    </GameProvider>
  );
}

// Inner component that can use the GameProvider context
function AppContent() {
  const { isConnected } = useAccount();
  const { player, gameRun } = useAppStore();
  const { state: gameState, dispatch } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  
  // Check if the game is started based on player and gameRun existence
  useEffect(() => {
    // Game is considered started if:
    // 1. User is connected
    // 2. Player exists
    // 3. GameRun exists with a valid score
    // 4. OR the gameState indicates the game has been started
    if (
      (isConnected && player && gameRun && gameRun.score >= 0) ||
      (gameState.notification === "Welcome to Echoes of the Void!")
    ) {
      console.log("🎮 Game detected as started");
      setGameStarted(true);
      
      // Update the chamber ID in game context if needed
      if (player && player.chamber_id > 0 && player.chamber_id !== gameState.chamberId) {
        dispatch({ 
          type: "COMPLETE_CHAMBER", 
          nextChamberId: player.chamber_id 
        });
      }
    } else {
      console.log("🎮 Game not started yet");
      setGameStarted(false);
    }
  }, [isConnected, player, gameRun, gameState.notification, gameState.chamberId, dispatch]);

  // Log state changes for debugging
  useEffect(() => {
    console.log("Game state updated:", { 
      isConnected, 
      playerExists: !!player, 
      gameRunExists: !!gameRun,
      gameStarted 
    });
  }, [isConnected, player, gameRun, gameStarted]);

  return gameStarted ? <GameScreen /> : <WelcomeScreen />;
}

export default App;
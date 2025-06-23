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
  const { player } = useAppStore();
  const { state: gameState, dispatch } = useGame();
  const [gameStarted, setGameStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initial loading state
  useEffect(() => {
    // Give time for data to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Check if the game is started based on player and gameRun existence
  useEffect(() => {
    // Skip checks during initial loading
    if (isLoading) return;
    
    // Game is considered started if:
    // 1. User is connected AND player exists
    // 2. OR the gameState indicates the game has been started via notification
    if (
      (isConnected && player) ||
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
  }, [isConnected, player, gameState.notification, gameState.chamberId, dispatch, isLoading]);

  // Log state changes for debugging
  useEffect(() => {
    if (!isLoading) {
      console.log("Game state updated:", { 
        isConnected, 
        playerExists: !!player, 
        gameStarted,
        notification: gameState.notification
      });
    }
  }, [isConnected, player, gameStarted, gameState.notification, isLoading]);

  // Show loading screen during initial load
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono text-lg">Loading Echoes of the Void...</p>
        </div>
      </div>
    );
  }

  return gameStarted ? <GameScreen /> : <WelcomeScreen />;
}

export default App;
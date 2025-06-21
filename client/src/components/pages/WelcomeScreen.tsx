import { useAccount } from "@starknet-react/core";
import { useSpawnPlayer, useStartGame } from "../../dojo/hooks";
import { useEffect, useState } from "react";
import useAppStore from "../../zustand/store";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useGame } from "../../context/game-context";
import logoImage from "../../assets/logo.png";

export default function WelcomeScreen() {
  const { status, handleConnect } = useStarknetConnect();
  const { address } = useAccount();
  const { initializePlayer, isInitializing, error: playerError, playerExists } = useSpawnPlayer();
  const { startGame, gameState: startGameState } = useStartGame();
  const { player } = useAppStore();
  const { state: gameState, dispatch } = useGame();
  const [startingGame, setStartingGame] = useState(false);
  const [transitionToGame, setTransitionToGame] = useState(false);

  // Handle sign in and player creation
  const handleSignIn = async () => {
    if (status !== "connected") {
      dispatch({ type: "CONNECT_WALLET_START" });
      await handleConnect();
      if (address) {
        dispatch({ type: "CONNECT_WALLET_SUCCESS", address });
      }
    } else if (!playerExists) {
      await initializePlayer();
    }
  };

  // Handle starting a new game
  const handleStartGame = async () => {
    if (status === "connected" && player && !startGameState.isLoading && !startingGame) {
      setStartingGame(true);
      
      dispatch({
        type: "SET_TX_STATUS",
        message: "Starting game...",
        txType: "pending"
      });
      
      try {
        await startGame();
        
        if (!startGameState.error) {
          dispatch({
            type: "SET_TX_STATUS",
            message: "Game started!",
            txType: "success"
          });
          
          // This notification is used as a trigger for the game screen transition
          dispatch({
            type: "SHOW_NOTIFICATION",
            message: "Welcome to Echoes of the Void!"
          });
          
          console.log("🎮 Game start successful!");
          
          // Trigger transition to game screen
          setTransitionToGame(true);
        } else {
          throw new Error(startGameState.error);
        }
      } catch (error) {
        console.error("❌ Game start error:", error);
        dispatch({
          type: "SET_TX_STATUS",
          message: error instanceof Error ? error.message : "Failed to start game",
          txType: "error"
        });
        setStartingGame(false);
      }
    }
  };

  // Auto-initialize player when connected
  useEffect(() => {
    if (status === "connected" && !playerExists && !isInitializing) {
      initializePlayer();
    }
  }, [status, playerExists, isInitializing, initializePlayer]);
  
  // Force app refresh if transition is triggered
  useEffect(() => {
    if (transitionToGame) {
      // Force a small delay to ensure the notification is processed
      const timer = setTimeout(() => {
        // Force app state refresh by updating localStorage
        localStorage.setItem('echoes-of-the-void-game-started', 'true');
        // Reload the app to ensure clean state transition
        window.location.reload();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [transitionToGame]);

  // Show transition screen if we're moving to the game
  if (transitionToGame) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-blue-300">Entering the Void...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      <div className="text-center p-8 max-w-md">
        <div className="mb-8 flex justify-center">
          <img src={logoImage} alt="Echoes of the Void" className="w-64 h-auto" />
        </div>
        
        <h1 className="text-4xl font-bold text-blue-300 mb-6">Echoes of the Void</h1>
        
        <p className="text-blue-100 mb-8">
          A minimalist, turn-based puzzle-platformer set in a completely dark environment.
          Navigate by emitting sound pulses that momentarily reveal the hidden map.
        </p>

        {status !== "connected" ? (
          <button
            onClick={handleSignIn}
            className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
          >
            Connect Controller
          </button>
        ) : !playerExists ? (
          <button
            onClick={handleSignIn}
            disabled={isInitializing}
            className={`w-full py-3 px-6 ${
              !isInitializing
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-blue-800 opacity-70"
            } text-white font-bold rounded-lg transition-colors`}
          >
            {isInitializing ? "Creating Player..." : "Create Player"}
          </button>
        ) : (
          <button
            onClick={handleStartGame}
            disabled={startGameState.isLoading || startingGame}
            className={`w-full py-3 px-6 ${
              !startGameState.isLoading && !startingGame
                ? "bg-green-600 hover:bg-green-700"
                : "bg-green-800 opacity-70"
            } text-white font-bold rounded-lg transition-colors`}
          >
            {startGameState.isLoading || startingGame ? "Starting Game..." : "Start Game"}
          </button>
        )}

        {playerError && (
          <p className="mt-4 text-red-400">{playerError}</p>
        )}
        
        {startGameState.error && (
          <p className="mt-4 text-red-400">{startGameState.error}</p>
        )}
        
        {gameState.txStatus.type === "error" && (
          <p className="mt-4 text-red-400">{gameState.txStatus.message}</p>
        )}
        
        {status === "connected" && address && (
          <div className="mt-6 text-blue-300 text-sm">
            Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
} 
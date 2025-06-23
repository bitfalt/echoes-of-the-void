import { useAccount } from "@starknet-react/core";
import { useSpawnPlayer, useStartGame } from "../../dojo/hooks";
import { useEffect, useState } from "react";
import useAppStore from "../../zustand/store";
import { useStarknetConnect } from "../../dojo/hooks/useStarknetConnect";
import { useGame } from "../../context/game-context";
import Logo from "../ui/Logo";
import ParticleBackground from "../ui/particle-background";

export default function WelcomeScreen() {
  const { status, handleConnect } = useStarknetConnect();
  const { address } = useAccount();
  const { initializePlayer, isInitializing, error: playerError, playerExists } = useSpawnPlayer();
  const { startGame, gameState: startGameState } = useStartGame();
  const { player } = useAppStore();
  const { state: gameState, dispatch } = useGame();
  const [startingGame, setStartingGame] = useState(false);
  const [transitionToGame, setTransitionToGame] = useState(false);

  // Ensure black background
  useEffect(() => {
    document.body.style.backgroundColor = 'black';
    document.documentElement.style.backgroundColor = 'black';

    return () => {
      // Cleanup when component unmounts
      document.body.style.backgroundColor = '';
      document.documentElement.style.backgroundColor = '';
    };
  }, []);

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
      <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-mono text-lg">Entering the Void...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start bg-black min-h-screen py-20 px-4">
      {/* Particle background */}
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
      </div>
      
      {/* Static noise background effect */}
      <div className="absolute inset-0 opacity-10" style={{ 
        backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 400 400\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        backgroundSize: '200px',
        zIndex: 2
      }}></div>
      
      <div className="text-center px-4 sm:px-8 max-w-6xl w-full z-10 relative">
        {/* Logo - now the main focal point */}
        <div>
          <Logo />
        </div>
        
        <p className="text-gray-300 mb-8 sm:mb-12 font-mono text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto px-4">
          A minimalist, turn-based puzzle-platformer set in a completely dark environment.
          Navigate by emitting sound pulses that momentarily reveal the hidden map.
        </p>

        <div className="max-w-sm sm:max-w-md mx-auto px-4 pb-12">
          {status !== "connected" ? (
            <button
              onClick={handleSignIn}
              className="w-full py-3 sm:py-4 px-4 sm:px-6 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200 relative overflow-hidden group text-sm sm:text-base"
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              <span className="relative z-10">CONNECT CONTROLLER</span>
              <span className="absolute inset-0 bg-gray-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100"></span>
            </button>
          ) : !playerExists ? (
            <button
              onClick={handleSignIn}
              disabled={isInitializing}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 ${
                !isInitializing
                  ? "bg-white hover:bg-gray-200 text-black"
                  : "bg-gray-600 text-white opacity-70"
              } font-bold font-mono rounded-none border-2 border-white transition-all duration-200 relative overflow-hidden group text-sm sm:text-base`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              <span className="relative z-10">{isInitializing ? "CREATING PLAYER..." : "CREATE PLAYER"}</span>
              <span className="absolute inset-0 bg-gray-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100"></span>
            </button>
          ) : (
            <button
              onClick={handleStartGame}
              disabled={startGameState.isLoading || startingGame}
              className={`w-full py-3 sm:py-4 px-4 sm:px-6 ${
                !startGameState.isLoading && !startingGame
                  ? "bg-white hover:bg-gray-200 text-black"
                  : "bg-gray-600 text-white opacity-70"
              } font-bold font-mono rounded-none border-2 border-white transition-all duration-200 relative overflow-hidden group text-sm sm:text-base`}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              <span className="relative z-10">{startGameState.isLoading || startingGame ? "STARTING GAME..." : "START GAME"}</span>
              <span className="absolute inset-0 bg-gray-200 transform scale-x-0 origin-left transition-transform duration-200 group-hover:scale-x-100"></span>
            </button>
          )}

          {playerError && (
            <p className="mt-4 text-red-400 font-mono text-sm">{playerError}</p>
          )}
          
          {startGameState.error && (
            <p className="mt-4 text-red-400 font-mono text-sm">{startGameState.error}</p>
          )}
          
          {gameState.txStatus.type === "error" && (
            <p className="mt-4 text-red-400 font-mono text-sm">{gameState.txStatus.message}</p>
          )}
          
          {status === "connected" && address && (
            <div className="mt-6 text-gray-400 text-xs sm:text-sm font-mono tracking-wider">
              CONNECTED: {address.slice(0, 6)}...{address.slice(-4)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
import { useState, useEffect } from "react";
import { useAccount } from "@starknet-react/core";
import WelcomeScreen from "../components/pages/WelcomeScreen";
import GameScreen from "../components/pages/GameScreen";
import useAppStore from "../zustand/store";
import { GameProvider } from "../context/game-context";

function App() {
  const { isConnected } = useAccount();
  const { player, gameRun } = useAppStore();
  const [gameStarted, setGameStarted] = useState(false);
  
  // Check if the game is started based on player and gameRun existence
  useEffect(() => {
    if (isConnected && player && gameRun && gameRun.score >= 0) {
      setGameStarted(true);
    } else {
      setGameStarted(false);
    }
  }, [isConnected, player, gameRun]);

  return (
    <GameProvider>
      {gameStarted ? <GameScreen /> : <WelcomeScreen />}
    </GameProvider>
  );
}

export default App;
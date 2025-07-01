import { useGame } from "../../context/game-context";

export const GameStatusMessages = () => {
  const { state: gameState } = useGame();
  
  return (
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
  );
}; 
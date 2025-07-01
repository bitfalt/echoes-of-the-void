import useAppStore from "../../zustand/store";

interface GameHeaderProps {
  currentChamberId: number;
  onRestart: () => void;
}

export const GameHeader = ({ currentChamberId, onRestart }: GameHeaderProps) => {
  const { player } = useAppStore();

  const handleRestart = () => {
    if (confirm("Are you sure you want to restart the game? This will reset all progress and return to Chamber 1.")) {
      onRestart();
    }
  };

  return (
    <div className="bg-black border-b border-gray-800 p-3 sm:p-4 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold font-mono">ECHOES OF THE VOID</h1>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2 sm:space-x-4 text-sm sm:text-base font-mono">
            <div>CHAMBER: {player?.chamber_id || currentChamberId}</div>
            <div>PULSES: {player?.pulses_used || 0}</div>
            <div>DEATHS: {player?.deaths || 0}</div>
          </div>
          <button
            onClick={handleRestart}
            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-mono text-xs border border-red-500 transition-colors duration-200"
            style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
          >
            RESTART
          </button>
        </div>
      </div>
    </div>
  );
}; 
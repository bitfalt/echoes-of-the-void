import { MoveDirection } from "../../dojo/hooks/useMoveAction";

interface GameControlsProps {
  onMove: (direction: MoveDirection) => void;
  onPulse: () => void;
  moveLoading: boolean;
  pulseLoading: boolean;
  pulseCooldown: boolean;
}

export const GameControls = ({ 
  onMove, 
  onPulse, 
  moveLoading, 
  pulseLoading,
  pulseCooldown 
}: GameControlsProps) => {
  return (
    <div className="bg-black border-t border-gray-800 p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
        {/* Movement controls */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => onMove('up')}
            className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200 mb-2"
            disabled={moveLoading}
            style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
          >
            ↑
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => onMove('left')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200"
              disabled={moveLoading}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              ←
            </button>
            <button
              onClick={() => onMove('down')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200"
              disabled={moveLoading}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              ↓
            </button>
            <button
              onClick={() => onMove('right')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-white hover:bg-gray-200 text-black font-bold font-mono rounded-none border-2 border-white hover:border-gray-400 transition-all duration-200"
              disabled={moveLoading}
              style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
            >
              →
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex space-x-4">
          <button
            onClick={onPulse}
            className={`px-4 py-2 sm:px-6 sm:py-3 font-bold font-mono rounded-none border-2 transition-all duration-200 text-sm sm:text-base ${
              pulseCooldown 
                ? 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed' 
                : 'bg-white hover:bg-gray-200 text-black border-white hover:border-gray-400'
            }`}
            disabled={pulseLoading || pulseCooldown}
            style={{ clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)' }}
          >
            {pulseCooldown ? 'PULSE COOLDOWN' : 'EMIT PULSE'}
          </button>
        </div>
      </div>
    </div>
  );
}; 
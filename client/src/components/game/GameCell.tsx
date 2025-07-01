import { CellType, MapCell } from "../../dojo/hooks/useChamberMap";
import entranceImg from "../../assets/entrance.png";
import exitImg from "../../assets/exit.png";
import voidImg from "../../assets/void1.png";

interface GameCellProps {
  cell: MapCell;
  isEntrance: boolean;
  isPlayer: boolean;
}

export const GameCell = ({ cell, isEntrance, isPlayer }: GameCellProps) => {
  // Only show revealed cells, entrance, or player position
  if (!cell.revealed && !isEntrance && !isPlayer) {
    return <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black border border-black" />;
  }

  switch (cell.type) {
    case CellType.PATH:
      return (
        <div className={`w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 border border-gray-700 flex items-center justify-center relative overflow-hidden ${
          isPlayer ? 'ring-2 ring-white/30 shadow-lg' : ''
        }`}>
          {isEntrance && (
            <>
              {/* Entrance glow effect */}
              <div className="absolute inset-0 bg-blue-400 opacity-10 rounded-full blur-sm" style={{ 
                filter: 'blur(24px)',
                transform: 'scale(0.6)',
                background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)'
              }}></div>
              <img src={entranceImg} alt="Start" className="w-20 h-20 sm:w-28 sm:h-28 relative z-10" />
            </>
          )}
        </div>
      );
    case CellType.WALL:
      return (
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-gray-700 via-gray-600 to-gray-800 border-2 border-gray-500 shadow-inner relative overflow-hidden">
          {/* Wall texture effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-gray-600/50 to-gray-800/50 opacity-60"></div>
          {/* Wall highlights */}
          <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gray-400/30 rounded-br-full"></div>
          <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gray-900/40 rounded-tl-full"></div>
        </div>
      );
    case CellType.START:
      return (
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 border border-gray-700 flex items-center justify-center relative overflow-hidden">
          {/* Entrance glow effect */}
          <div className="absolute inset-0 bg-blue-400 opacity-10 rounded-full blur-sm" style={{ 
            filter: 'blur(24px)',
            transform: 'scale(0.6)',
            background: 'radial-gradient(circle, rgba(96, 165, 250, 0.3) 0%, rgba(59, 130, 246, 0.1) 70%, transparent 100%)'
          }}></div>
          <img src={entranceImg} alt="Start" className="w-20 h-20 sm:w-28 sm:h-28 relative z-10" />
        </div>
      );
    case CellType.EXIT:
      return (
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-green-900 border border-green-700 flex items-center justify-center">
          <img src={exitImg} alt="Exit" className="w-12 h-12 sm:w-16 sm:h-16" />
        </div>
      );
    case CellType.VOID:
    default:
      return (
        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-black flex items-center justify-center overflow-hidden">
          <img src={voidImg} alt="Void" className="w-28 h-28 sm:w-36 sm:h-36" />
        </div>
      );
  }
}; 
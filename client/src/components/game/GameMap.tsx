import { ChamberMap } from "../../dojo/hooks/useChamberMap";
import { GameCell } from "./GameCell";
import { PlayerCharacter } from "./PlayerCharacter";

interface GameMapProps {
  map: ChamberMap;
  player: { x: number; y: number };
  entrancePosition: { x: number; y: number } | null;
  deathAnimation: boolean;
  pulseAnimation: boolean;
  pulseKey: number;
}

export const GameMap = ({
  map,
  player,
  entrancePosition,
  deathAnimation,
  pulseAnimation,
  pulseKey
}: GameMapProps) => {
  if (!map || !player) return null;

  return (
    <div 
      className="absolute transition-transform duration-300"
      style={{ 
        display: 'grid',
        gridTemplateColumns: `repeat(${map.width}, ${window.innerWidth < 640 ? '96px' : '128px'})`,
        gridTemplateRows: `repeat(${map.height}, ${window.innerWidth < 640 ? '96px' : '128px'})`,
        left: '50%',
        top: '50%',
        transform: `translate(${window.innerWidth < 640 ? -player.x * 96 - 48 : -player.x * 128 - 64}px, ${window.innerWidth < 640 ? -player.y * 96 - 48 : -player.y * 128 - 64}px)`
      }}
    >
      {map.cells.map((row, y) =>
        row.map((cell, x) => (
          <div key={`${x}-${y}`} className="relative">
            <GameCell 
              cell={cell} 
              isEntrance={entrancePosition !== null && x === entrancePosition.x && y === entrancePosition.y}
              isPlayer={player && x === player.x && y === player.y}
            />
          </div>
        ))
      )}
      <PlayerCharacter 
        x={player.x} 
        y={player.y} 
        deathAnimation={deathAnimation}
        pulseAnimation={pulseAnimation}
        pulseKey={pulseKey}
      />
    </div>
  );
}; 
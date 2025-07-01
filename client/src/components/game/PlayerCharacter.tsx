import { useEffect, useState } from "react";
import characterImg from "../../assets/character1.png";
import character2Img from "../../assets/character2.png";

interface PlayerCharacterProps {
  x: number;
  y: number;
  deathAnimation: boolean;
  pulseAnimation: boolean;
  pulseKey: number;
}

export const PlayerCharacter = ({ 
  x, 
  y, 
  deathAnimation, 
  pulseAnimation,
  pulseKey
}: PlayerCharacterProps) => {
  const [characterFrame, setCharacterFrame] = useState(0);
  const cellSize = window.innerWidth < 640 ? 96 : 128; // 96px on mobile, 128px on desktop
  
  // Character animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCharacterFrame(prev => (prev + 1) % 2); // Switch between 0 and 1
    }, 500); // Change frame every 500ms

    return () => clearInterval(interval);
  }, []);
  
  // Choose character image based on animation frame
  const characterImage = characterFrame === 0 ? characterImg : character2Img;
  
  return (
    <div 
      className={`absolute w-24 h-24 sm:w-32 sm:h-32 flex items-center justify-center transition-all duration-300 ${pulseAnimation ? 'z-20' : 'z-10'} ${
        deathAnimation ? 'animate-pulse opacity-50' : 'animate-bounce-slow'
      }`}
      style={{ 
        left: `${x * cellSize}px`, 
        top: `${y * cellSize}px`,
        transform: 'translate(0, 0)'
      }}
    >
      {/* Character glow effect */}
      <div className={`absolute inset-0 rounded-full blur-sm ${
        deathAnimation 
          ? 'bg-red-500 opacity-2 animate-ping' 
          : 'bg-white opacity-0.5'
      }`} style={{ 
        zIndex: -1,
        filter: 'blur(24px)',
        transform: 'scale(0.6)'
      }}></div>
      
      {/* Character image */}
      <img 
        src={characterImage} 
        alt="Player" 
        className={`w-16 h-16 sm:w-20 sm:h-20 transition-all duration-300 ${
          deathAnimation ? 'animate-spin opacity-75' : ''
        }`}
      />
      
      {/* Pulse animation */}
      {pulseAnimation && (
        <>
          {/* First ring */}
          <div 
            key={`${pulseKey}-1`}
            className="absolute w-48 h-48 sm:w-64 sm:h-64 animate-ping-slow pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-white opacity-80 shadow-lg shadow-white/40 bg-transparent"></div>
          </div>
          
          {/* Second ring */}
          <div 
            key={`${pulseKey}-2`}
            className="absolute w-48 h-48 sm:w-64 sm:h-64 animate-ping-slow pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animationDelay: '0.3s'
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-white opacity-60 shadow-lg shadow-white/30 bg-transparent"></div>
          </div>
          
          {/* Third ring */}
          <div 
            key={`${pulseKey}-3`}
            className="absolute w-48 h-48 sm:w-64 sm:h-64 animate-ping-slow pointer-events-none"
            style={{
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animationDelay: '0.6s'
            }}
          >
            <div className="w-full h-full rounded-full border-2 border-white opacity-40 shadow-lg shadow-white/20 bg-transparent"></div>
          </div>
        </>
      )}
    </div>
  );
}; 
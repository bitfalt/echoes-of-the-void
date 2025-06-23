import { useEffect, useState } from 'react';
import logoImage from '../../assets/logo.png';

export default function Logo() {
  const [glitchEffect, setGlitchEffect] = useState(false);
  const [glitchOffset, setGlitchOffset] = useState({ x: 0, y: 0 });

  // Enhanced glitch effect for the logo
  useEffect(() => {
    const glitchInterval = setInterval(() => {
      // Random glitch offset
      setGlitchOffset({
        x: Math.floor(Math.random() * 10) - 5,
        y: Math.floor(Math.random() * 10) - 5
      });
      
      setGlitchEffect(true);
      
      // Reset after short duration
      setTimeout(() => {
        setGlitchEffect(false);
        setGlitchOffset({ x: 0, y: 0 });
      }, 150);
    }, 2000);
    
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <div className="relative flex justify-center items-center">
      {/* Glitch layers */}
      {glitchEffect && (
        <>
          {/* Red offset layer */}
          <img 
            src={logoImage} 
            alt="" 
            className="absolute w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] h-auto opacity-70"
            style={{ 
              filter: 'brightness(1.2) contrast(1.3) hue-rotate(-45deg)',
              transform: `translate(${glitchOffset.x - 3}px, ${glitchOffset.y + 2}px)`,
              clipPath: 'polygon(0 25%, 100% 25%, 100% 90%, 0 90%)'
            }} 
          />
          {/* Blue offset layer */}
          <img 
            src={logoImage} 
            alt="" 
            className="absolute w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] h-auto opacity-70"
            style={{ 
              filter: 'brightness(1.2) contrast(1.3) hue-rotate(45deg)',
              transform: `translate(${glitchOffset.x + 3}px, ${glitchOffset.y - 2}px)`,
              clipPath: 'polygon(0 10%, 100% 10%, 100% 75%, 0 75%)'
            }} 
          />
        </>
      )}
      
      {/* Main logo - perfectly centered and responsive */}
      <img 
        src={logoImage} 
        alt="Echoes of the Void" 
        className="w-full max-w-[400px] sm:max-w-[500px] md:max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] h-auto filter drop-shadow-[0_0_25px_rgba(255,255,255,0.8)]" 
        style={{ 
          position: 'relative',
          zIndex: 2
        }}
      />
    </div>
  );
} 
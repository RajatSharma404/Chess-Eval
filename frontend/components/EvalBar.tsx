import React from 'react';

interface EvalBarProps {
  evalScore: number;
  isBlunder?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evalScore, isBlunder }) => {
  // Cap at +/- 8 for a better visual scale
  const score = Math.max(-8, Math.min(8, evalScore / 100));
  
  // Calculate percentage: -8 is 0%, +8 is 100%, 0 is 50%
  const whitePercent = ((score + 8) / 16) * 100;

  const isMate = Math.abs(evalScore) > 1000;
  const displayScore = isMate ? 
    `M${Math.abs(Math.round((10000 - Math.abs(evalScore)) / 100))}` : 
    Math.abs(evalScore / 100).toFixed(1);

  const whiteWinning = evalScore > 0;

  return (
    <div className={`relative h-full w-8 bg-gray-900 overflow-hidden rounded-l-md border-y border-l border-white/10 shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] flex flex-col ${isBlunder ? 'ring-2 ring-red-500' : ''}`}>
      {/* Black's section (Top) */}
      <div className="absolute top-0 w-full bg-gradient-to-b from-gray-900 to-gray-800 transition-all duration-700 ease-in-out" style={{ height: `${100 - whitePercent}%` }} />
      
      {/* White's section (Bottom) */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-gray-100 to-[#F5F5DC] transition-all duration-700 ease-in-out shadow-[0_-2px_10px_rgba(255,255,255,0.2)]" style={{ height: `${whitePercent}%` }} />

      {/* The Following Label */}
      <div 
        className="absolute w-full flex items-center justify-center transition-all duration-700 ease-in-out z-10 pointer-events-none"
        style={{ bottom: `${whitePercent}%`, transform: 'translateY(50%)' }}
      >
        <div className={`px-1.5 py-0.5 rounded text-[10px] font-black shadow-md border ${whiteWinning ? 'bg-white text-black border-gray-300' : 'bg-gray-800 text-white border-gray-600'}`}>
          {displayScore}
        </div>
      </div>
      
      {isBlunder && <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />}
    </div>
  );
};

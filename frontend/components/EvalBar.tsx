import React from 'react';

interface EvalBarProps {
  evalScore: number;
  isBlunder?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evalScore, isBlunder }) => {
  // Cap at +/- 8 for a better visual scale
  const score = Math.max(-8, Math.min(8, evalScore / 100));
  
  // Calculate percentage: -8 is 0%, +8 is 100%, 0 is 50%
  // 50% means equal. 100% means white is completely winning.
  const whitePercent = ((score + 8) / 16) * 100;

  const isMate = Math.abs(evalScore) > 1000;
  
  let displayScore = '';
  if (isMate) {
    displayScore = evalScore > 0 ? `M${Math.abs(Math.round((10000 - Math.abs(evalScore)) / 100))}` : `-M${Math.abs(Math.round((10000 - Math.abs(evalScore)) / 100))}`;
  } else {
    const rawScore = evalScore / 100;
    displayScore = rawScore > 0 ? `+${rawScore.toFixed(2)}` : rawScore.toFixed(2);
  }

  const whiteWinning = evalScore >= 0;

  return (
    <div className={`relative h-full w-full bg-[#1e1e1e] overflow-hidden ${isBlunder ? 'ring-2 ring-red-500' : ''}`}>
      {/* Black's section (Top) - handled by the background of the parent */}
      
      {/* White's section (Bottom) */}
      <div 
        className="absolute bottom-0 w-full bg-[#e8e8e8]" 
        style={{ 
          height: `${whitePercent}%`, 
          transition: 'height 0.4s ease' 
        }} 
      />

      {/* The Following Label */}
      <div 
        className="absolute w-full flex items-center justify-center pointer-events-none z-10"
        style={{ 
          bottom: `${whitePercent}%`, 
          transform: whiteWinning ? 'translateY(100%)' : 'translateY(-100%)',
          transition: 'bottom 0.4s ease, transform 0.4s ease'
        }}
      >
        <div className={`px-1 rounded-[2px] text-[10px] font-bold tracking-tighter shadow-sm mb-1 mt-1 ${whiteWinning ? 'bg-[#e8e8e8] text-[#1e1e1e]' : 'bg-[#1e1e1e] text-[#e8e8e8]'}`}>
          {displayScore}
        </div>
      </div>
      
      {isBlunder && <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none z-20" />}
    </div>
  );
};

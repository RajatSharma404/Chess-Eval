import React from 'react';

interface EvalBarProps {
  evalScore: number;
  isBlunder?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evalScore = 0, isBlunder }) => {
  // Use sigmoid win-probability calculation for natural evaluation bar curve
  const clampedCp = Math.max(-10000, Math.min(10000, evalScore));
  const whitePercent = 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * clampedCp)) - 1);

  const isCheckmate = Math.abs(evalScore) >= 10000;
  const isForcedMate = Math.abs(evalScore) >= 8000 && !isCheckmate;
  
  let displayScore = '0.0';
  if (isCheckmate) {
    displayScore = evalScore > 0 ? '+#' : '-#';
  } else if (isForcedMate) {
    const mateMoves = Math.max(1, Math.round((10000 - Math.abs(evalScore)) / 100));
    displayScore = evalScore > 0 ? `M${mateMoves}` : `-M${mateMoves}`;
  } else {
    const rawScore = evalScore / 100;
    displayScore = rawScore > 0 ? `+${rawScore.toFixed(1)}` : rawScore.toFixed(1);
    if (displayScore === '-0.0') displayScore = '0.0';
  }

  const whiteWinning = evalScore >= 0;

  return (
    <div className={`relative h-full w-full bg-[#1e1e1e] overflow-hidden ${isBlunder ? 'ring-2 ring-red-500' : ''}`}>
      {/* White's section (Bottom) */}
      <div 
        className="absolute bottom-0 w-full bg-[#f1f5f9] shadow-inner" 
        style={{ 
          height: `${Math.max(0, Math.min(100, whitePercent))}%`, 
          transition: 'height 0.35s cubic-bezier(0.4, 0, 0.2, 1)' 
        }} 
      />

      {/* Numerical Label */}
      <div 
        className="absolute w-full flex items-center justify-center pointer-events-none z-10"
        style={{ 
          bottom: `${Math.max(8, Math.min(92, whitePercent))}%`, 
          transform: whiteWinning ? 'translateY(100%)' : 'translateY(-100%)',
          transition: 'bottom 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s ease'
        }}
      >
        <div className={`px-1 py-0.5 rounded-[3px] text-[9px] font-black tracking-tighter shadow-md ${
          whiteWinning ? 'bg-[#0f172a] text-white border border-white/10' : 'bg-white text-zinc-900 border border-black/10'
        }`}>
          {displayScore}
        </div>
      </div>
      
      {isBlunder && <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none z-20" />}
    </div>
  );
};


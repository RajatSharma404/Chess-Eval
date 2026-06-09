import React from 'react';

interface EvalBarProps {
  evalScore: number;
  isBlunder?: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ evalScore, isBlunder }) => {
  const score = Math.max(-10, Math.min(10, evalScore / 100));
  const whitePercent = ((score + 10) / 20) * 100;

  const displayScore = Math.abs(evalScore) > 1000 ? 
    `M${Math.abs(Math.round((10000 - Math.abs(evalScore)) / 100))}` : 
    (evalScore / 100).toFixed(1);

  return (
    <div className={`flex flex-col items-center h-full w-6 bg-gray-800 rounded-full relative shadow-inner overflow-hidden transition-colors duration-300 ${isBlunder ? 'shadow-[0_0_20px_rgba(239,68,68,0.8)] ring-2 ring-red-500' : ''}`}>
      <div 
        className={`absolute bottom-0 w-full transition-all duration-700 ease-out flex items-start justify-center pt-2 ${isBlunder ? 'bg-red-500' : 'bg-white'}`}
        style={{ height: `${whitePercent}%` }}
      >
        {score >= 0 && (
          <span className="text-[10px] font-bold text-gray-800 -rotate-90 origin-center translate-y-4">
            {displayScore}
          </span>
        )}
      </div>
      <div className="absolute top-0 w-full flex items-end justify-center pb-2" style={{ height: `${100 - whitePercent}%` }}>
        {score < 0 && (
          <span className="text-[10px] font-bold text-gray-400 -rotate-90 origin-center -translate-y-4">
            {displayScore}
          </span>
        )}
      </div>
    </div>
  );
};

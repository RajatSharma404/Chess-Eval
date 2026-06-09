import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { clsx } from 'clsx';

export const MoveList: React.FC = () => {
  const { analysisResult, originalAnalysisResult, currentMoveIndex, setCurrentMoveIndex, restoreMainline } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeElement = scrollRef.current.querySelector('.active-move') as HTMLElement;
      if (activeElement) {
        const container = scrollRef.current;
        const elementRect = activeElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          container.scrollTo({
            top: activeElement.offsetTop - container.offsetHeight / 2 + activeElement.offsetHeight / 2,
            behavior: 'smooth'
          });
        }
      }
    }
  }, [currentMoveIndex]);

  if (!analysisResult) return null;

  const moves = analysisResult.moves;
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null
    });
  }

  const getDotColor = (cls: string) => {
    switch (cls) {
      case 'brilliant': return 'bg-cyan-500 text-cyan-50';
      case 'great': return 'bg-blue-500 text-blue-50';
      case 'best': return 'bg-emerald-500 text-emerald-50';
      case 'good': return 'bg-green-500 text-green-50';
      case 'inaccuracy': return 'bg-yellow-500 text-yellow-900';
      case 'mistake': return 'bg-orange-500 text-orange-900';
      case 'blunder': return 'bg-red-600 text-red-50';
      default: return 'bg-gray-500 text-gray-50';
    }
  };

  const getClassificationSymbol = (cls: string) => {
    switch (cls) {
      case 'brilliant': return '!!';
      case 'great': return '!';
      case 'best': return '★';
      case 'good': return '✓';
      case 'inaccuracy': return '?!';
      case 'mistake': return '?';
      case 'blunder': return '??';
      default: return '';
    }
  };

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto bg-gray-900/50 backdrop-blur-md rounded-2xl p-4 custom-scrollbar border border-gray-800">
      <table className="w-full text-sm text-gray-300">
        <thead className="sticky top-0 bg-gray-900/80 backdrop-blur-md z-10">
          <tr className="text-left text-gray-500 uppercase text-[10px] font-black tracking-widest">
            <th className="py-4 px-4 w-12">#</th>
            <th className="py-4 px-4">White</th>
            <th className="py-4 px-4">Black</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {pairs.map((pair, idx) => (
            <tr key={idx} className="group">
              <td className="py-3 px-4 text-gray-600 font-mono text-xs">{pair.num}.</td>
              <td 
                onClick={() => setCurrentMoveIndex(idx * 2)}
                className={clsx(
                  "py-3 px-4 cursor-pointer hover:bg-white/5 rounded-lg transition-all",
                  currentMoveIndex === idx * 2 && "bg-emerald-600/20 text-emerald-400 active-move ring-1 ring-emerald-500/50"
                )}
              >
                <div className="flex items-center gap-3">
                  {getClassificationSymbol(pair.white.classification) ? (
                    <span className={clsx("w-5 h-5 flex items-center justify-center flex-shrink-0 rounded shadow-[0_0_8px_rgba(0,0,0,0.5)] font-black text-[10px]", getDotColor(pair.white.classification))}>
                      {getClassificationSymbol(pair.white.classification)}
                    </span>
                  ) : (
                    <span className="w-5 h-5 flex-shrink-0" />
                  )}
                  <span className="font-bold flex-1">{pair.white.move_san}</span>
                  <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
                    {(pair.white.eval_after_cp > 0 ? '+' : '')}{(pair.white.eval_after_cp / 100).toFixed(1)}
                  </span>
                </div>
              </td>
              <td 
                onClick={() => pair.black && setCurrentMoveIndex(idx * 2 + 1)}
                className={clsx(
                  "py-3 px-4 cursor-pointer hover:bg-white/5 rounded-lg transition-all",
                  pair.black && currentMoveIndex === idx * 2 + 1 && "bg-emerald-600/20 text-emerald-400 active-move ring-1 ring-emerald-500/50",
                  !pair.black && "cursor-default"
                )}
              >
                {pair.black && (
                  <div className="flex items-center gap-3">
                    {getClassificationSymbol(pair.black.classification) ? (
                      <span className={clsx("w-5 h-5 flex items-center justify-center flex-shrink-0 rounded shadow-[0_0_8px_rgba(0,0,0,0.5)] font-black text-[10px]", getDotColor(pair.black.classification))}>
                        {getClassificationSymbol(pair.black.classification)}
                      </span>
                    ) : (
                      <span className="w-5 h-5 flex-shrink-0" />
                    )}
                    <span className="font-bold flex-1">{pair.black.move_san}</span>
                    <span className="text-[10px] text-gray-500 font-mono w-8 text-right">
                        {(pair.black.eval_after_cp > 0 ? '+' : '')}{(pair.black.eval_after_cp / 100).toFixed(1)}
                    </span>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {originalAnalysisResult && analysisResult !== originalAnalysisResult && (
        <div className="sticky bottom-0 p-4 mt-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent flex justify-center">
          <button 
            onClick={restoreMainline}
            className="w-full max-w-xs bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Restore Mainline Game
          </button>
        </div>
      )}
    </div>
  );
};

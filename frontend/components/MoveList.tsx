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

  const renderSparkline = () => {
    if (!moves || moves.length === 0) return null;
    const width = 300; 
    const height = 40; 
    const points = moves.map((m, i) => {
      const x = (i / (moves.length - 1 || 1)) * width;
      const evalCp = Math.max(-800, Math.min(800, m.eval_after_cp || 0));
      const y = 20 - (evalCp / 800) * 20;
      return `${x},${y}`;
    }).join(' ');

    const currentX = currentMoveIndex >= 0 && currentMoveIndex < moves.length ? (currentMoveIndex / (moves.length - 1 || 1)) * width : 0;
    const currentY = currentMoveIndex >= 0 && currentMoveIndex < moves.length ? 20 - (Math.max(-800, Math.min(800, moves[currentMoveIndex].eval_after_cp || 0)) / 800) * 20 : 20;
    const areaPoints = `0,20 ${points} ${width},20`;

    return (
      <div className="w-full h-10 mb-6 px-4 group relative cursor-crosshair" title="Game Evaluation Swing">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <clipPath id="above">
              <rect x="0" y="0" width={width} height="20" />
            </clipPath>
            <clipPath id="below">
              <rect x="0" y="20" width={width} height="20" />
            </clipPath>
          </defs>
          
          <polygon points={areaPoints} fill="rgba(240,240,240,0.9)" clipPath="url(#above)" />
          <polygon points={areaPoints} fill="rgba(30,41,59,0.9)" clipPath="url(#below)" />
          
          <line x1="0" y1="20" x2={width} y2="20" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeDasharray="4 4" />
          
          <polyline
            points={points}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {currentMoveIndex >= 0 && currentMoveIndex < moves.length && (
             <g className="transition-all duration-300">
               <line x1={currentX} y1="0" x2={currentX} y2={height} stroke="rgba(251,191,36,0.6)" strokeWidth="1" />
               <circle 
                 cx={currentX} 
                 cy={currentY} 
                 r="3.5" 
                 fill="#fbbf24" 
                 stroke="#fff"
                 strokeWidth="1.5"
                 className="drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]"
               />
             </g>
          )}
        </svg>
      </div>
    );
  };



  return (
    <div ref={scrollRef} className="h-full flex flex-col bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      
      <div className="p-4 border-b border-white/10 bg-black/20">
        <div className="flex flex-wrap gap-3 justify-center mb-4">
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-cyan-500 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Brilliant</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-emerald-500 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Best</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-blue-500 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Excellent</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-green-500 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Good</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-yellow-500 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Inaccuracy</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-orange-500 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Mistake</span></div>
          <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-red-600 rounded"></span><span className="text-[10px] font-bold text-gray-300 uppercase">Blunder</span></div>
        </div>
        {renderSparkline()}
      </div>

      <div className="flex-1 overflow-y-auto p-2 scrollbar-hide">
        <div className="w-full text-sm text-gray-300 flex flex-col">
          <div className="sticky top-0 bg-[#111] z-10 shadow-[0_4px_10px_#111] flex px-2 py-2 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-800/50">
            <div className="w-[32px]">#</div>
            <div className="flex-1">White</div>
            <div className="flex-1">Black</div>
          </div>
          <div className="flex flex-col divide-y divide-gray-800/50 pb-4">
            {pairs.map((pair, idx) => {
              const formatEval = (cp: number) => {
                if (Math.abs(cp) > 9000) {
                  const mate = 10000 - Math.abs(cp);
                  return cp > 0 ? `M${mate}` : `-M${mate}`;
                }
                return (cp > 0 ? '+' : '') + (cp / 100).toFixed(1);
              };

              return (
                <div key={idx} className="flex px-2 group">
                  <div className="w-[32px] py-1.5 text-gray-600 font-mono text-xs flex items-center">{pair.num}.</div>
                  <div 
                    onClick={() => setCurrentMoveIndex(idx * 2)}
                    className={clsx(
                      "flex-1 grid grid-cols-[24px_1fr_56px] items-center gap-1 py-1.5 px-2 cursor-pointer transition-all border-l-2",
                      currentMoveIndex === idx * 2 
                        ? "bg-zinc-800 border-amber-400 active-move shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]" 
                        : "border-transparent hover:bg-zinc-800/50"
                    )}
                  >
                    {getClassificationSymbol(pair.white.classification) ? (
                      <span className={clsx("w-[18px] h-[18px] flex items-center justify-center rounded shadow-sm font-black text-[10px]", getDotColor(pair.white.classification))}>
                        {getClassificationSymbol(pair.white.classification)}
                      </span>
                    ) : (
                      <span className="w-[18px] h-[18px]" />
                    )}
                    <span className="font-bold truncate text-gray-200">{pair.white.move_san}</span>
                    <span className="text-[10px] text-gray-500 font-mono text-right truncate">
                      {formatEval(pair.white.eval_after_cp)}
                    </span>
                  </div>
                  
                  <div 
                    onClick={() => pair.black && setCurrentMoveIndex(idx * 2 + 1)}
                    className={clsx(
                      "flex-1 grid grid-cols-[24px_1fr_56px] items-center gap-1 py-1.5 px-2 transition-all border-l-2",
                      pair.black ? "cursor-pointer" : "cursor-default",
                      pair.black && currentMoveIndex === idx * 2 + 1 
                        ? "bg-zinc-800 border-amber-400 active-move shadow-[inset_0_0_10px_rgba(251,191,36,0.1)]" 
                        : "border-transparent hover:bg-zinc-800/50"
                    )}
                  >
                    {pair.black && (
                      <>
                        {getClassificationSymbol(pair.black.classification) ? (
                          <span className={clsx("w-[18px] h-[18px] flex items-center justify-center rounded shadow-sm font-black text-[10px]", getDotColor(pair.black.classification))}>
                            {getClassificationSymbol(pair.black.classification)}
                          </span>
                        ) : (
                          <span className="w-[18px] h-[18px]" />
                        )}
                        <span className="font-bold truncate text-gray-200">{pair.black.move_san}</span>
                        <span className="text-[10px] text-gray-500 font-mono text-right truncate">
                          {formatEval(pair.black.eval_after_cp)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      {originalAnalysisResult && analysisResult !== originalAnalysisResult && (
        <div className="sticky bottom-0 p-4 mt-4 bg-gradient-to-t from-gray-900 via-gray-900/90 to-transparent flex justify-center z-20">
          <button 
            onClick={restoreMainline}
            className="w-full max-w-xs bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-400 border border-cyan-500/30 font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Restore Mainline Game
          </button>
        </div>
      )}
      </div>
    </div>
  );
};

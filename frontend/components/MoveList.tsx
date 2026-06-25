import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { clsx } from 'clsx';

export const MoveList: React.FC = () => {
  const { analysisResult, originalAnalysisResult, currentMoveIndex, setPreviewMoveIndex, setCurrentMoveIndex, restoreMainline, branchGame, addVariation } = useGameStore();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  useEffect(() => {
    const scrollContainer = document.getElementById('move-list-scroll-container');
    if (scrollContainer) {
      const activeElement = scrollContainer.querySelector('.active-move') as HTMLElement;
      if (activeElement) {
        const elementRect = activeElement.getBoundingClientRect();
        const containerRect = scrollContainer.getBoundingClientRect();
        
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          activeElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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
    
    const getEvalY = (cp: number) => {
      const evalCp = cp || 0;
      return 20 - 20 * (2 / Math.PI) * Math.atan(evalCp / 200);
    };

    const pointData = moves.map((m, i) => {
      const x = (i / (moves.length - 1 || 1)) * width;
      const y = getEvalY(m.eval_after_cp);
      return { x, y, cp: m.eval_after_cp, delta: Math.abs(m.eval_after_cp - (i > 0 ? moves[i-1].eval_after_cp : 0)) };
    });

    const pointsStr = pointData.map(p => `${p.x},${p.y}`).join(' ');
    const areaPoints = `0,20 ${pointsStr} ${width},20`;
    
    const displayIndex = hoverIndex !== null ? hoverIndex : currentMoveIndex;
    const activeX = displayIndex >= 0 && displayIndex < moves.length ? pointData[displayIndex].x : 0;
    const activeY = displayIndex >= 0 && displayIndex < moves.length ? pointData[displayIndex].y : 20;

    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPos = e.clientX - rect.left;
      const pct = xPos / rect.width;
      const idx = Math.round(pct * (moves.length - 1));
      const safeIdx = Math.max(0, Math.min(moves.length - 1, idx));
      setHoverIndex(safeIdx);
      setPreviewMoveIndex(safeIdx);
    };

    const handleMouseLeave = () => {
      setHoverIndex(null);
      setPreviewMoveIndex(null);
    };

    return (
      <div className="w-full h-10 mb-6 px-4 group relative cursor-crosshair">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible" 
          preserveAspectRatio="none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <defs>
            <clipPath id="above">
              <rect x="0" y="0" width={width} height="20" />
            </clipPath>
            <clipPath id="below">
              <rect x="0" y="20" width={width} height="20" />
            </clipPath>
          </defs>
          
          <polygon points={areaPoints} fill="rgba(255,255,255,0.06)" clipPath="url(#above)" />
          <polygon points={areaPoints} fill="rgba(0,0,0,0.4)" clipPath="url(#below)" />
          
          <line x1="0" y1="20" x2={width} y2="20" stroke="#3f3f46" strokeWidth="1" strokeDasharray="4 3" />
          
          {pointData.map((p, i) => {
            if (i === 0) return null;
            const prev = pointData[i - 1];
            const isBlunder = p.delta > 150; // >1.5 pawns swing
            return (
              <line 
                key={i}
                x1={prev.x} y1={prev.y} 
                x2={p.x} y2={p.y} 
                stroke={isBlunder ? "#ef4444" : "#0ea5e9"} 
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}
          
          {displayIndex >= 0 && displayIndex < moves.length && (
             <g className="transition-all duration-75">
               {hoverIndex !== null && (
                 <line x1={activeX} y1="0" x2={activeX} y2={height} stroke="#52525b" strokeWidth="1" />
               )}
               {hoverIndex === null && (
                 <line x1={activeX} y1={activeY} x2={activeX} y2="20" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
               )}
               <circle 
                 cx={activeX} 
                 cy={activeY} 
                 r="3.5" 
                 fill={hoverIndex !== null ? "#fff" : "#fbbf24"} 
                 stroke="#fff"
                 strokeWidth="1.5"
                 className={hoverIndex === null ? "drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" : ""}
               />
             </g>
          )}
        </svg>

        {/* Hover Tooltip */}
        {hoverIndex !== null && (
          <div 
            className="absolute top-[-30px] bg-zinc-800 text-zinc-200 text-[10px] font-bold px-2 py-1 rounded shadow-xl border border-white/10 pointer-events-none whitespace-nowrap z-50 transform -translate-x-1/2"
            style={{ left: `calc(1rem + ${pointData[hoverIndex].x / width * 100}%)` }}
          >
            Move {Math.floor(hoverIndex / 2) + 1} · {moves[hoverIndex].move_san} · eval: {(moves[hoverIndex].eval_after_cp / 100).toFixed(1)}
          </div>
        )}
      </div>
    );
  };



  return (
    <div ref={scrollRef} className="h-full flex flex-col bg-gray-900/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
      
      <div className="p-4 border-b border-white/10 bg-black/20 shrink-0">
        <div 
          className="flex flex-nowrap overflow-x-auto gap-2.5 justify-start mb-4 text-[10px] w-full px-1 py-1 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#06b6d4] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Brilliant</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#22c55e] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Best</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#86efac] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Excellent</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#4ade80] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Good</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#fbbf24] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Inaccuracy</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#f97316] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Mistake</span></div>
          <div className="flex items-center gap-1 shrink-0"><span className="w-[9px] h-[9px] bg-[#ef4444] rounded-[2px]"></span><span className="font-bold text-gray-300 uppercase">Blunder</span></div>
        </div>
        {renderSparkline()}

        {/* Critical Moments Jump Bar */}
        <div className="flex justify-between items-center px-4 w-full h-6 mt-2 relative">
          <div className="absolute top-1/2 left-4 right-4 h-px bg-white/10 -translate-y-1/2"></div>
          {pairs.map((pair, idx) => {
            const classRank = { 'blunder': 7, 'mistake': 6, 'inaccuracy': 5, 'brilliant': 4, 'best': 3, 'great': 2, 'good': 1 };
            const wRank = classRank[pair.white.classification as keyof typeof classRank] || 0;
            const bRank = pair.black ? (classRank[pair.black.classification as keyof typeof classRank] || 0) : 0;
            const maxRank = Math.max(wRank, bRank);
            
            let colorCls = 'bg-gray-500';
            if (maxRank === 7) colorCls = 'bg-[#ef4444]';
            else if (maxRank === 6) colorCls = 'bg-[#f97316]';
            else if (maxRank === 5) colorCls = 'bg-[#fbbf24]';
            else if (maxRank === 4) colorCls = 'bg-[#06b6d4]';
            else if (maxRank === 3) colorCls = 'bg-[#22c55e]';
            else if (maxRank === 2) colorCls = 'bg-[#86efac]';
            else if (maxRank === 1) colorCls = 'bg-[#4ade80]';

            const isCurrent = Math.floor(currentMoveIndex / 2) === idx;
            const dotSize = 'w-[8px] h-[8px]';

            return (
              <div 
                key={idx} 
                className="relative group cursor-pointer z-10 p-1"
                onClick={() => setCurrentMoveIndex(idx * 2)}
                title={`Move ${idx + 1}`}
              >
                <div className={clsx(
                  "rounded-full transition-all", 
                  dotSize, 
                  colorCls,
                  isCurrent ? "outline outline-[1.5px] outline-white outline-offset-[1px]" : "hover:scale-150"
                )} />
              </div>
            );
          })}
        </div>
      </div>

      <div id="move-list-scroll-container" className="flex-1 overflow-y-auto min-h-0 p-2 custom-scrollbar relative">
        <div className="w-full text-sm text-gray-300 flex flex-col">
          <div className="sticky top-0 bg-[#111] z-30 shadow-[0_4px_10px_#111] flex px-2 py-2 text-gray-500 uppercase text-[10px] font-black tracking-widest border-b border-gray-800/50">
            <div className="w-[32px]">#</div>
            <div className="flex-1">White</div>
            <div className="flex-1">Black</div>
          </div>
          <div className="flex flex-col pb-4">
            {pairs.map((pair, idx) => {
              const formatDelta = (delta: number) => {
                if (Math.abs(delta) > 50) return '—';
                if (Math.abs(delta) < 0.05) return '—';
                return (delta > 0 ? '+' : '') + delta.toFixed(1);
              };

              const renderMovePopover = (move: any) => {
                const clsName = move.classification.toUpperCase();
                let msg = "A solid, principled move.";
                if (move.classification === 'blunder') msg = "This loses significant material or the game.";
                else if (move.classification === 'mistake') msg = "This severely damages your position.";
                else if (move.classification === 'inaccuracy') msg = "A sub-optimal plan, allowing counterplay.";
                else if (move.classification === 'brilliant') msg = "An incredible sacrifice or profound maneuver!";
                
                return (
                  <div className="absolute left-[100%] ml-2 top-0 z-50 hidden group-hover:block w-52 bg-zinc-900 border border-white/10 shadow-2xl rounded-xl p-3 animate-in fade-in zoom-in-95 duration-100 cursor-default">
                    {/* Invisible bridge to keep hover state active */}
                    <div className="absolute -left-3 top-0 w-3 h-full bg-transparent"></div>
                    <div className={clsx("text-[10px] font-black tracking-widest mb-2 flex items-center gap-2", getDotColor(move.classification))}>
                      <span className="w-1.5 h-1.5 bg-current rounded-full"></span>
                      ★ {clsName}
                    </div>
                    <div className="font-bold text-white text-sm mb-3">
                      {move.move_san} <span className="text-zinc-500 font-mono text-xs ml-1">eval {move.eval_after_cp > 0 ? '+' : ''}{(move.eval_after_cp/100).toFixed(1)}</span>
                    </div>
                    {move.best_move_san && move.best_move_san !== move.move_san && (
                      <>
                        <div className="h-px bg-white/5 w-full my-2"></div>
                        <div className="text-xs text-zinc-400 mb-1">
                          Best was: <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newMove = {...move, move_san: move.best_move_san, move_uci: move.best_move_uci};
                              const idx = moves.findIndex(m => m === move);
                              addVariation(idx, [newMove]);
                            }}
                            className="text-amber-400 font-bold hover:underline"
                          >{move.best_move_san}</button>
                        </div>
                      </>
                    )}
                    <div className="text-xs text-zinc-300 italic mb-2 mt-2 leading-tight">
                      "{msg}"
                    </div>
                    <div className="text-[10px] text-zinc-500 font-mono">
                      Δ eval: {move.cp_loss ? (Math.abs(move.cp_loss) > 5000 ? '—' : (move.cp_loss/100).toFixed(1)) : '0.0'}
                    </div>
                  </div>
                );
              };

              return (
                <React.Fragment key={idx}>
                  <div className={clsx("flex px-2 relative", idx % 2 === 0 ? 'bg-transparent' : 'bg-white/5')}>
                    <div className="w-[32px] py-1.5 text-gray-600 font-mono text-xs flex items-center">{pair.num}.</div>
                  
                  {/* White Move */}
                  <div 
                    onClick={() => setCurrentMoveIndex(idx * 2)}
                    className={clsx(
                      "flex-1 grid grid-cols-[22px_58px_40px] items-center gap-1 py-1.5 px-2 cursor-pointer transition-all border-l-[2px] relative group",
                      currentMoveIndex === idx * 2 
                        ? "bg-[rgba(251,191,36,0.06)] border-[#fbbf24] active-move" 
                        : "border-transparent hover:bg-zinc-800/30"
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
                    <span className="text-[10px] text-zinc-500 font-mono text-right truncate">
                      {formatDelta((pair.white.cp_loss || 0) / -100)}
                    </span>
                    {renderMovePopover(pair.white)}
                  </div>
                  
                  {/* Black Move */}
                  <div 
                    onClick={() => pair.black && setCurrentMoveIndex(idx * 2 + 1)}
                    className={clsx(
                      "flex-1 grid grid-cols-[22px_58px_40px] items-center gap-1 py-1.5 px-2 transition-all border-l-[2px] relative group",
                      pair.black ? "cursor-pointer" : "cursor-default",
                      pair.black && currentMoveIndex === idx * 2 + 1 
                        ? "bg-[rgba(251,191,36,0.06)] border-[#fbbf24] active-move" 
                        : "border-transparent hover:bg-zinc-800/30"
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
                        <span className="text-[10px] text-zinc-500 font-mono text-right truncate">
                          {formatDelta((pair.black.cp_loss || 0) / -100)}
                        </span>
                        {renderMovePopover(pair.black)}
                      </>
                    )}
                  </div>
                </div>
                {(pair.white.variations || (pair.black && pair.black.variations)) && (
                  <div className="w-full flex flex-col pl-[32px] pr-2 pb-1">
                    {pair.white.variations?.map((variation, vIdx) => (
                      <div key={`w-var-${vIdx}`} className="bg-zinc-800/40 border-l-2 border-amber-500/50 pl-2 py-1 mt-0.5 rounded-r flex items-center text-xs">
                        <span className="text-zinc-500 font-mono mr-2">{pair.num}.</span>
                        <span className="text-amber-400/90 font-bold">{variation[0].move_san}</span>
                      </div>
                    ))}
                    {pair.black?.variations?.map((variation, vIdx) => (
                      <div key={`b-var-${vIdx}`} className="bg-zinc-800/40 border-l-2 border-amber-500/50 pl-2 py-1 mt-0.5 rounded-r flex items-center text-xs">
                        <span className="text-zinc-500 font-mono mr-2">{pair.num}...</span>
                        <span className="text-amber-400/90 font-bold">{variation[0].move_san}</span>
                      </div>
                    ))}
                  </div>
                )}
              </React.Fragment>
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

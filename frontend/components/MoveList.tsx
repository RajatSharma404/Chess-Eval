import React, { useEffect, useRef, useState } from 'react';
import { useGameStore, Move } from '../store/useGameStore';
import { Chess } from 'chess.js';
import { clsx } from 'clsx';

export const MoveList: React.FC = () => {
  const { 
    analysisResult, 
    currentMoveIndex, 
    activeVariation,
    setActiveVariation,
    setCurrentMoveIndex, 
    setPreviewMoveIndex,
    addVariation, 
    deleteVariation 
  } = useGameStore();

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

    return (
      <div className="relative w-full h-[50px] bg-[#1a1a1a] rounded-lg p-1.5 flex flex-col justify-between overflow-hidden group border border-white/5 shrink-0">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Zero line */}
          <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="#333" strokeWidth="1" strokeDasharray="2,2" />
          
          {/* Shaded Area */}
          <polygon 
            points={`0,${height/2} ${pointsStr} ${width},${height/2}`} 
            fill="rgba(251, 191, 36, 0.08)" 
          />
          
          {/* The Advantage Line */}
          <polyline 
            fill="none" 
            stroke="#fbbf24" 
            strokeWidth="1.5" 
            points={pointsStr} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Current move indicator point */}
          {currentMoveIndex >= 0 && currentMoveIndex < pointData.length && (
            <circle 
              cx={pointData[currentMoveIndex].x} 
              cy={pointData[currentMoveIndex].y} 
              r="3" 
              fill="#fff" 
              stroke="#fbbf24" 
              strokeWidth="1.5" 
            />
          )}

          {/* Hover indicator point */}
          {hoverIndex !== null && hoverIndex >= 0 && hoverIndex < pointData.length && (
            <circle 
              cx={pointData[hoverIndex].x} 
              cy={pointData[hoverIndex].y} 
              r="2.5" 
              fill="#38bdf8" 
            />
          )}
        </svg>

        {/* Hover tooltips */}
        <div 
          className="absolute inset-0 z-10 flex cursor-crosshair"
          onMouseLeave={() => { setHoverIndex(null); setPreviewMoveIndex(null); }}
        >
          {moves.map((_, i) => (
            <div 
              key={i} 
              className="flex-1 h-full"
              onMouseEnter={() => {
                setHoverIndex(i);
                setPreviewMoveIndex(i);
              }}
              onClick={() => setCurrentMoveIndex(i)}
            />
          ))}
        </div>

        {/* Tooltip Overlay */}
        {hoverIndex !== null && moves[hoverIndex] && (
          <div className="absolute top-1 right-2 bg-zinc-900/90 border border-white/10 text-[10px] text-zinc-300 font-mono px-1.5 py-0.5 rounded shadow pointer-events-none flex gap-1.5 items-center z-20">
            <span className="font-bold text-amber-400">
              {Math.floor(hoverIndex/2)+1}{hoverIndex%2===0?'.':'...'} {moves[hoverIndex].move_san}
            </span>
            <span className="text-zinc-500">|</span>
            <span>
              {moves[hoverIndex].eval_after_cp > 0 ? '+' : ''}
              {(moves[hoverIndex].eval_after_cp / 100).toFixed(1)}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#111] overflow-hidden font-sans">
      {/* Top Header - Fixed and Non-Scrolling */}
      <div className="p-3 border-b border-gray-800/80 bg-[#141414] flex flex-col gap-2 shrink-0">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-zinc-300 uppercase tracking-wider text-[11px]">Move Log</span>
          <span className="text-gray-500 font-mono text-[10px]">{moves.length} plies</span>
        </div>

        {/* Advantage Line Graph */}
        {renderSparkline()}

        {/* Mini Badges Line */}
        <div className="flex gap-1 justify-between items-center py-1 overflow-x-auto custom-scrollbar">
          {pairs.map((pair, idx) => {
            const classRank = { blunder: 7, mistake: 6, inaccuracy: 5, brilliant: 4, great: 3, best: 2, good: 1, book: 0 };
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
                className="relative group cursor-pointer z-10 p-0.5"
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

      {/* Moves Scroll Container - ONLY MOVES SCROLL */}
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
                        <div className="text-xs text-zinc-400 mb-1 flex items-center justify-between">
                          <span>Best was:</span>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const testChess = new Chess(move.fen_before);
                              try {
                                const from = move.best_move_uci.slice(0, 2);
                                const to = move.best_move_uci.slice(2, 4);
                                const promotion = move.best_move_uci.length > 4 ? move.best_move_uci[4] : undefined;
                                const moveObj = testChess.move({ from, to, promotion });
                                if (moveObj) {
                                  const newMove: Move = {
                                    ...move,
                                    move_san: moveObj.san,
                                    move_uci: move.best_move_uci,
                                    fen_after: testChess.fen(),
                                    classification: 'best'
                                  };
                                  const moveIdx = moves.findIndex(m => m === move);
                                  addVariation(moveIdx, [newMove]);
                                }
                              } catch (err) {}
                            }}
                            className="text-amber-400 font-bold hover:underline px-2 py-0.5 rounded bg-amber-400/10 border border-amber-400/20"
                          >
                            {move.best_move_san} →
                          </button>
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
                        currentMoveIndex === idx * 2 && !activeVariation
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
                        pair.black && currentMoveIndex === idx * 2 + 1 && !activeVariation
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

                  {/* Inline Variation Branches under Move */}
                  {(pair.white.variations || (pair.black && pair.black.variations)) && (
                    <div className="w-full flex flex-col pl-[32px] pr-2 pb-1 space-y-1">
                      {pair.white.variations?.map((variation, vIdx) => (
                        <div 
                          key={`w-var-${vIdx}`} 
                          className={clsx(
                            "border-l-2 pl-2 py-1.5 rounded-r flex items-center justify-between text-xs transition-all",
                            activeVariation && activeVariation.parentMoveIndex === idx * 2 && activeVariation.variationIndex === vIdx
                              ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm"
                              : "bg-zinc-800/40 hover:bg-zinc-800/70 border-amber-500/50 text-zinc-300"
                          )}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-zinc-500 font-mono">{pair.num}.</span>
                            {variation.map((varM, mIdx) => {
                              const isVarActive = activeVariation && 
                                activeVariation.parentMoveIndex === idx * 2 && 
                                activeVariation.variationIndex === vIdx && 
                                activeVariation.moveIndex === mIdx;

                              return (
                                <button
                                  key={mIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveVariation({
                                      parentMoveIndex: idx * 2,
                                      variationIndex: vIdx,
                                      moveIndex: mIdx
                                    });
                                  }}
                                  className={clsx(
                                    "font-bold px-1.5 py-0.5 rounded transition-colors",
                                    isVarActive ? "bg-amber-400 text-black shadow-sm" : "text-amber-400/90 hover:bg-white/10"
                                  )}
                                >
                                  {mIdx > 0 && (mIdx % 2 === 1 ? `${Math.floor((idx * 2 + mIdx) / 2) + 1}... ` : `${Math.floor((idx * 2 + mIdx) / 2) + 1}. `)}
                                  {varM.move_san}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            {activeVariation && activeVariation.parentMoveIndex === idx * 2 && activeVariation.variationIndex === vIdx && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentMoveIndex(idx * 2);
                                }}
                                className="text-[10px] bg-white/10 hover:bg-white/20 text-zinc-300 px-1.5 py-0.5 rounded"
                                title="Return to Mainline Move"
                              >
                                Mainline
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVariation(idx * 2, vIdx);
                              }}
                              className="text-zinc-500 hover:text-red-400 p-0.5 rounded font-bold text-xs"
                              title="Delete Variation"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}

                      {pair.black?.variations?.map((variation, vIdx) => (
                        <div 
                          key={`b-var-${vIdx}`} 
                          className={clsx(
                            "border-l-2 pl-2 py-1.5 rounded-r flex items-center justify-between text-xs transition-all",
                            activeVariation && activeVariation.parentMoveIndex === idx * 2 + 1 && activeVariation.variationIndex === vIdx
                              ? "bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm"
                              : "bg-zinc-800/40 hover:bg-zinc-800/70 border-amber-500/50 text-zinc-300"
                          )}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-zinc-500 font-mono">{pair.num}...</span>
                            {variation.map((varM, mIdx) => {
                              const isVarActive = activeVariation && 
                                activeVariation.parentMoveIndex === idx * 2 + 1 && 
                                activeVariation.variationIndex === vIdx && 
                                activeVariation.moveIndex === mIdx;

                              return (
                                <button
                                  key={mIdx}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveVariation({
                                      parentMoveIndex: idx * 2 + 1,
                                      variationIndex: vIdx,
                                      moveIndex: mIdx
                                    });
                                  }}
                                  className={clsx(
                                    "font-bold px-1.5 py-0.5 rounded transition-colors",
                                    isVarActive ? "bg-amber-400 text-black shadow-sm" : "text-amber-400/90 hover:bg-white/10"
                                  )}
                                >
                                  {mIdx > 0 && (mIdx % 2 === 1 ? `${Math.floor((idx * 2 + 1 + mIdx) / 2) + 1}. ` : `${Math.floor((idx * 2 + 1 + mIdx) / 2) + 1}... `)}
                                  {varM.move_san}
                                </button>
                              );
                            })}
                          </div>

                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            {activeVariation && activeVariation.parentMoveIndex === idx * 2 + 1 && activeVariation.variationIndex === vIdx && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCurrentMoveIndex(idx * 2 + 1);
                                }}
                                className="text-[10px] bg-white/10 hover:bg-white/20 text-zinc-300 px-1.5 py-0.5 rounded"
                                title="Return to Mainline Move"
                              >
                                Mainline
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteVariation(idx * 2 + 1, vIdx);
                              }}
                              className="text-zinc-500 hover:text-red-400 p-0.5 rounded font-bold text-xs"
                              title="Delete Variation"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

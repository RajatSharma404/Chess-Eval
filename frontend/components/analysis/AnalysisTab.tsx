import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AnalysisGraph } from './AnalysisGraph';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export const AnalysisTab: React.FC = () => {
  const { analysisResult, currentMoveIndex, setCurrentMoveIndex } = useGameStore();

  if (!analysisResult) return null;

  const currentMove = currentMoveIndex >= 0 ? analysisResult.moves[currentMoveIndex] : null;
  const evalScore = currentMove?.eval_after_cp || 0;
  const displayScore = evalScore > 0 ? `+${(evalScore / 100).toFixed(1)}` : (evalScore / 100).toFixed(1);

  // Get a slice of moves around the current move to display
  const startIndex = Math.max(0, currentMoveIndex - 3);
  const visibleMoves = analysisResult.moves.slice(startIndex, startIndex + 8);

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#262421] p-4">
      {/* Top Coach Section */}
      <div className="bg-white text-[#262421] rounded-2xl p-4 flex gap-4 items-center mb-6 relative shadow-md">
        <img 
          src="https://api.dicebear.com/7.x/bottts/svg?seed=coach&backgroundColor=10b981" 
          alt="Coach" 
          className="absolute -left-2 -top-2 w-14 h-14 rounded-full bg-emerald-500/20 border-4 border-[#262421] shrink-0 z-10" 
        />
        <div className="absolute -left-3 top-4 w-0 h-0 border-r-8 border-r-white border-y-8 border-y-transparent"></div>
        <div className="pl-12 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl grayscale opacity-80">♟</span>
            <span className="font-bold text-sm">Game review</span>
          </div>
          <div className="text-sm font-medium">Let me show you the key moments.</div>
        </div>
      </div>

      {/* Let's go button */}
      <button className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mb-8 shadow-md">
        <span className="bg-emerald-500 text-white rounded px-1.5 text-xs font-black tracking-tighter">!!</span>
        Let&apos;s go <span className="font-black">→</span>
      </button>

      {/* Eval line */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1 h-[1px] bg-amber-400/50"></div>
        <div className="text-amber-400 text-xs font-bold font-mono">
          {displayScore} <span className="text-zinc-500 text-lg leading-none">+</span>
        </div>
        <div className="flex-1 h-[1px] bg-amber-400/50"></div>
        <button className="w-8 h-8 rounded-md border border-amber-400/50 text-amber-400 flex items-center justify-center hover:bg-amber-400/10">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line></svg>
        </button>
      </div>

      {/* Move text scrubber */}
      <div className="flex items-center gap-1 mb-8 overflow-hidden whitespace-nowrap">
        <div className="bg-white text-black font-bold text-xs px-2 py-1 rounded shadow-sm mr-2">{displayScore}</div>
        {visibleMoves.map((m, idx) => {
           const actualIdx = startIndex + idx;
           const isCurrent = actualIdx === currentMoveIndex;
           const isWhite = actualIdx % 2 === 0;
           return (
             <React.Fragment key={actualIdx}>
               {isWhite && <span className="text-zinc-500 text-sm ml-1">{Math.floor(actualIdx/2)+1}.</span>}
               <span 
                 onClick={() => setCurrentMoveIndex(actualIdx)}
                 className={`text-sm cursor-pointer hover:underline ${isCurrent ? 'font-bold text-white' : 'font-medium text-zinc-400'}`}
               >
                 {m.move_san}
               </span>
             </React.Fragment>
           )
        })}
      </div>

      <button className="w-full bg-amber-400 hover:bg-amber-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mb-6 shadow-md">
        <span className="bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-black">★</span>
        See best move
      </button>

      {/* Big Graph */}
      <div className="mt-auto bg-[#1b1a19] rounded-xl overflow-hidden p-2 shadow-inner border border-black/20">
        <AnalysisGraph height={100} showBadges={true} />
        
        {/* Navigation Controls inside graph box */}
        <div className="flex justify-center items-center gap-2 mt-4 px-2 pb-2">
          <button 
            disabled={currentMoveIndex <= -1}
            onClick={() => setCurrentMoveIndex(-1)}
            className="flex-1 py-2.5 bg-[#3c3a38] hover:bg-[#4a4745] disabled:opacity-30 rounded-lg flex justify-center text-zinc-400 transition-colors"
          >
            <ChevronsLeft size={20} />
          </button>
          <button 
            disabled={currentMoveIndex <= -1}
            onClick={() => setCurrentMoveIndex(currentMoveIndex - 1)}
            className="flex-1 py-2.5 bg-[#3c3a38] hover:bg-[#4a4745] disabled:opacity-30 rounded-lg flex justify-center text-zinc-400 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button 
            disabled={currentMoveIndex >= analysisResult.moves.length - 1}
            onClick={() => setCurrentMoveIndex(currentMoveIndex + 1)}
            className="flex-[2] py-2.5 bg-amber-400 hover:bg-amber-500 disabled:opacity-30 rounded-lg flex justify-center text-black transition-colors"
          >
            <ChevronRight size={20} />
          </button>
          <button 
            disabled={currentMoveIndex >= analysisResult.moves.length - 1}
            onClick={() => setCurrentMoveIndex(analysisResult.moves.length - 1)}
            className="flex-1 py-2.5 bg-[#3c3a38] hover:bg-[#4a4745] disabled:opacity-30 rounded-lg flex justify-center text-zinc-400 transition-colors"
          >
            <ChevronsRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

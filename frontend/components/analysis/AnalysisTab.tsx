import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AnalysisGraph } from './AnalysisGraph';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Play, 
  Pause, 
  Target, 
  AlertTriangle, 
  Sparkles,
  RotateCcw
} from 'lucide-react';

export const AnalysisTab: React.FC = () => {
  const { 
    analysisResult, 
    currentMoveIndex, 
    setCurrentMoveIndex,
    isPlaying,
    setIsPlaying,
    playbackSpeed,
    setPlaybackSpeed,
    restoreMainline
  } = useGameStore();

  useEffect(() => {
    if (!isPlaying || !analysisResult) return;

    const interval = setInterval(() => {
      useGameStore.setState((state) => {
        if (!state.analysisResult) return state;
        if (state.currentMoveIndex < state.analysisResult.moves.length - 1) {
          return { currentMoveIndex: state.currentMoveIndex + 1 };
        } else {
          return { isPlaying: false };
        }
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, analysisResult]);

  if (!analysisResult) return null;

  const currentMove = currentMoveIndex >= 0 ? analysisResult.moves[currentMoveIndex] : null;
  const evalScore = currentMove?.eval_after_cp || 0;
  const displayScore = evalScore > 0 ? `+${(evalScore / 100).toFixed(1)}` : (evalScore / 100).toFixed(1);

  // Get key moments counts
  const blunders = analysisResult.moves.filter(m => m.classification === 'blunder');
  const mistakes = analysisResult.moves.filter(m => m.classification === 'mistake');
  const brilliants = analysisResult.moves.filter(m => m.classification === 'brilliant');

  const startIndex = Math.max(0, currentMoveIndex - 3);
  const visibleMoves = analysisResult.moves.slice(startIndex, startIndex + 8);

  const jumpToNextKeyMoment = () => {
    const nextIdx = analysisResult.moves.findIndex((m, i) => i > currentMoveIndex && ['blunder', 'mistake', 'brilliant'].includes(m.classification));
    if (nextIdx !== -1) {
      setCurrentMoveIndex(nextIdx);
    } else {
      const firstIdx = analysisResult.moves.findIndex(m => ['blunder', 'mistake', 'brilliant'].includes(m.classification));
      if (firstIdx !== -1) setCurrentMoveIndex(firstIdx);
    }
  };

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#18181b] p-4 font-sans overflow-y-auto">
      {/* Top Coach Banner */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4 flex gap-4 items-center mb-4 relative shadow-lg">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xl shrink-0">
          ♟
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-extrabold text-sm text-white">{analysisResult.opening || 'Chess Match Analysis'}</span>
          </div>
          <p className="text-xs text-zinc-400">
            {analysisResult.white_player} ({analysisResult.white_elo || '1500'}) vs {analysisResult.black_player} ({analysisResult.black_elo || '1500'})
          </p>
        </div>
        <button
          onClick={restoreMainline}
          title="Restore Mainline Game"
          className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors border border-white/10"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Key Moments Bar */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => {
            const idx = analysisResult.moves.findIndex(m => m.classification === 'blunder');
            if (idx !== -1) setCurrentMoveIndex(idx);
          }}
          className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 transition-all flex flex-col items-center justify-center gap-0.5 group"
        >
          <div className="flex items-center gap-1 text-red-400 font-bold text-xs">
            <AlertTriangle size={14} />
            <span>Blunders</span>
          </div>
          <span className="text-base font-black text-white group-hover:scale-110 transition-transform">{blunders.length}</span>
        </button>

        <button
          onClick={() => {
            const idx = analysisResult.moves.findIndex(m => m.classification === 'mistake');
            if (idx !== -1) setCurrentMoveIndex(idx);
          }}
          className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 transition-all flex flex-col items-center justify-center gap-0.5 group"
        >
          <div className="flex items-center gap-1 text-orange-400 font-bold text-xs">
            <Target size={14} />
            <span>Mistakes</span>
          </div>
          <span className="text-base font-black text-white group-hover:scale-110 transition-transform">{mistakes.length}</span>
        </button>

        <button
          onClick={() => {
            const idx = analysisResult.moves.findIndex(m => m.classification === 'brilliant');
            if (idx !== -1) setCurrentMoveIndex(idx);
          }}
          className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all flex flex-col items-center justify-center gap-0.5 group"
        >
          <div className="flex items-center gap-1 text-cyan-400 font-bold text-xs">
            <Sparkles size={14} />
            <span>Brilliant</span>
          </div>
          <span className="text-base font-black text-white group-hover:scale-110 transition-transform">{brilliants.length}</span>
        </button>
      </div>

      {/* Next Key Moment CTA */}
      <button 
        onClick={jumpToNextKeyMoment}
        className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mb-4 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
      >
        <span>Next Key Moment</span>
        <span className="text-lg">→</span>
      </button>

      {/* Eval line header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-[1px] bg-zinc-800"></div>
        <div className="text-amber-400 text-xs font-mono font-bold px-2 py-0.5 bg-amber-400/10 border border-amber-400/30 rounded-md">
          Eval {displayScore}
        </div>
        <div className="flex-1 h-[1px] bg-zinc-800"></div>
      </div>

      {/* Move text scrubber */}
      <div className="flex items-center gap-1 mb-4 overflow-x-auto whitespace-nowrap py-2 px-1 bg-zinc-900/80 rounded-xl border border-white/5">
        {visibleMoves.map((m, idx) => {
          const actualIdx = startIndex + idx;
          const isCurrent = actualIdx === currentMoveIndex;
          const isWhite = actualIdx % 2 === 0;
          return (
            <React.Fragment key={actualIdx}>
              {isWhite && <span className="text-zinc-500 text-xs ml-1 font-mono">{Math.floor(actualIdx/2)+1}.</span>}
              <button 
                onClick={() => setCurrentMoveIndex(actualIdx)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  isCurrent 
                    ? 'font-bold bg-emerald-500 text-black shadow-md' 
                    : 'font-medium text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {m.move_san}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Evaluation Graph Box */}
      <div className="mt-auto bg-[#121214] rounded-2xl p-3 border border-white/10 shadow-xl space-y-3">
        <AnalysisGraph height={90} showBadges={true} />
        
        {/* Playback & Navigation Toolbar */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/5">
          {/* Auto-Play Toggle */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-2 rounded-lg transition-all ${
                isPlaying ? 'bg-emerald-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
              }`}
              title={isPlaying ? 'Pause Auto-play' : 'Start Auto-play'}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>

            {/* Speed Selector */}
            <select
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              className="bg-transparent text-xs text-zinc-300 font-bold px-1.5 focus:outline-none cursor-pointer"
            >
              <option value={0.5} className="bg-zinc-900">0.5x</option>
              <option value={1} className="bg-zinc-900">1.0x</option>
              <option value={2} className="bg-zinc-900">2.0x</option>
              <option value={4} className="bg-zinc-900">4.0x</option>
            </select>
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-1 flex-1 justify-end">
            <button 
              disabled={currentMoveIndex <= -1}
              onClick={() => setCurrentMoveIndex(-1)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 transition-colors"
              title="Start"
            >
              <ChevronsLeft size={16} />
            </button>
            <button 
              disabled={currentMoveIndex <= -1}
              onClick={() => setCurrentMoveIndex(currentMoveIndex - 1)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 transition-colors"
              title="Previous"
            >
              <ChevronLeft size={16} />
            </button>
            <button 
              disabled={currentMoveIndex >= analysisResult.moves.length - 1}
              onClick={() => setCurrentMoveIndex(currentMoveIndex + 1)}
              className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 disabled:opacity-30 rounded-lg transition-colors border border-emerald-500/30"
              title="Next"
            >
              <ChevronRight size={16} />
            </button>
            <button 
              disabled={currentMoveIndex >= analysisResult.moves.length - 1}
              onClick={() => setCurrentMoveIndex(analysisResult.moves.length - 1)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 rounded-lg text-zinc-300 transition-colors"
              title="End"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

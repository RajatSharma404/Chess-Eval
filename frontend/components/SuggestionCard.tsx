import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { CheckCircle, Info, Sparkles, Target } from 'lucide-react';
import { clsx } from 'clsx';

export const SuggestionCard: React.FC = () => {
  const { analysisResult, currentMoveIndex } = useGameStore();

  if (!analysisResult) return null;

  const currentMove = currentMoveIndex >= 0 ? analysisResult.moves[currentMoveIndex] : null;
  const suggestion = analysisResult.suggestions.find(s => s.move_index === currentMoveIndex);

  const getBadge = (cls: string) => {
    const base = "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm";
    switch (cls) {
      case 'brilliant': return <span className={clsx(base, "bg-blue-500 text-white")}>Brilliant</span>;
      case 'best': return <span className={clsx(base, "bg-green-500 text-white")}>Best</span>;
      case 'good': return <span className={clsx(base, "bg-lime-500 text-white")}>Good</span>;
      case 'inaccuracy': return <span className={clsx(base, "bg-yellow-500 text-white")}>Inaccuracy</span>;
      case 'mistake': return <span className={clsx(base, "bg-orange-500 text-white")}>Mistake</span>;
      case 'blunder': return <span className={clsx(base, "bg-red-500 text-white")}>Blunder</span>;
      default: return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 shadow-xl group hover:border-purple-500/30 transition-all">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">White Accuracy</p>
          <p className="text-3xl font-black text-white">{analysisResult.white_accuracy.toFixed(1)}%</p>
        </div>
        <div className="bg-gray-900/80 p-5 rounded-2xl border border-gray-800 shadow-xl group hover:border-purple-500/30 transition-all">
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-2">Black Accuracy</p>
          <p className="text-3xl font-black text-white">{analysisResult.black_accuracy.toFixed(1)}%</p>
        </div>
      </div>
      
      <div className="bg-gray-900/80 p-4 rounded-2xl border border-gray-800 flex items-center gap-4">
        <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-400">
          <Target size={20} />
        </div>
        <div>
          <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">Opening</p>
          <p className="text-xs font-bold text-gray-200">{analysisResult.opening}</p>
        </div>
      </div>

      <div className={clsx(
        "p-8 rounded-3xl border-2 transition-all duration-500 shadow-2xl relative overflow-hidden",
        currentMove ? (
          currentMove.classification === 'blunder' ? "bg-red-900/5 border-red-500/20" :
          currentMove.classification === 'mistake' ? "bg-orange-900/5 border-orange-500/20" :
          "bg-gray-900/80 border-gray-800"
        ) : "bg-gray-900/80 border-gray-800"
      )}>
        {currentMove ? (
          <div className="space-y-6 relative z-10">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h4 className="text-2xl font-black text-white">{currentMove.move_san}</h4>
                <div>{getBadge(currentMove.classification)}</div>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest mb-1">CPL</p>
                <p className="text-lg font-mono font-bold text-red-400">-{currentMove.cp_loss}</p>
              </div>
            </div>

            {suggestion ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2 text-purple-400">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Mastermind Insight</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed font-medium italic">
                  "{suggestion.suggestion_text}"
                </p>
                <div className="pt-4 border-t border-gray-800 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Better Move</span>
                    <span className="text-xs font-black text-green-400 bg-green-400/10 px-3 py-1 rounded-lg border border-green-400/20">
                      {currentMove.best_move_san}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4 py-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                <div className="flex items-center gap-2">
                  <Info className="text-gray-500" size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Engine Top Alternatives</span>
                </div>
                {currentMove.top_3_moves && currentMove.top_3_moves.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {currentMove.top_3_moves.map((alt, i) => (
                      <div key={i} className="flex items-center justify-between bg-gray-800/30 px-3 py-2 rounded-lg border border-gray-800">
                         <span className="text-sm font-bold text-gray-300">{i+1}. {alt.move_san}</span>
                         <span className="text-xs font-mono text-gray-500">{(alt.cp > 0 ? '+' : '')}{(alt.cp / 100).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic">No alternatives available.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center opacity-20">
            <CheckCircle className="text-gray-500 mb-4" size={40} />
            <p className="text-xs font-black uppercase tracking-widest text-gray-500">Select a move</p>
          </div>
        )}
      </div>
    </div>
  );
};

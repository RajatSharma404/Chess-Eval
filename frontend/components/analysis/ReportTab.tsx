import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AnalysisGraph } from './AnalysisGraph';

export const ReportTab: React.FC = () => {
  const { analysisResult } = useGameStore();

  if (!analysisResult) return null;

  const wCounts = { brilliant: 0, great: 0, best: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  const bCounts = { brilliant: 0, great: 0, best: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

  analysisResult.moves.forEach(m => {
    if (m.color === 'white') {
      if (wCounts[m.classification as keyof typeof wCounts] !== undefined) wCounts[m.classification as keyof typeof wCounts]++;
    } else {
      if (bCounts[m.classification as keyof typeof bCounts] !== undefined) bCounts[m.classification as keyof typeof bCounts]++;
    }
  });

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#262421]">
      {/* Top Coach Section */}
      <div className="p-4 flex gap-4 items-start border-b border-white/5">
        <img 
          src="https://api.dicebear.com/7.x/bottts/svg?seed=coach&backgroundColor=10b981" 
          alt="Coach" 
          className="w-16 h-16 rounded-xl bg-emerald-500/20 shrink-0" 
        />
        <div className="bg-white text-[#262421] p-3 rounded-xl rounded-tl-sm relative shadow-md font-medium text-sm flex-1">
          <div className="absolute -left-2 top-0 w-0 h-0 border-t-8 border-t-white border-l-8 border-l-transparent"></div>
          Nice, your opening looks sharp. You played well but there is room for improvement in the endgame.
        </div>
      </div>

      {/* Graph Snippet */}
      <div className="w-full py-4 bg-[#1b1a19] border-b border-white/5">
        <AnalysisGraph height={60} showBadges={true} />
      </div>

      {/* Players Section */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {/* Header row: Avatars */}
        <div className="flex justify-between items-center mb-6 px-4">
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold mb-2 truncate max-w-[100px]">{analysisResult.white_player}</span>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.white_player}`} className="w-12 h-12 rounded-lg bg-zinc-800" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs font-bold mb-2 truncate max-w-[100px]">{analysisResult.black_player}</span>
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.black_player}`} className="w-12 h-12 border-2 border-amber-400 rounded-lg bg-zinc-800 shadow-[0_0_10px_rgba(251,191,36,0.3)]" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-1 text-sm font-bold">
          {/* Accuracy */}
          <div className="flex justify-between items-center py-2">
            <div className="w-16 text-center bg-white text-black py-1 rounded shadow-sm">{analysisResult.white_accuracy.toFixed(1)}</div>
            <div className="text-zinc-500 font-medium">Accuracy</div>
            <div className="w-16 text-center bg-[#3c3a38] text-zinc-300 py-1 rounded shadow-sm">{analysisResult.black_accuracy.toFixed(1)}</div>
          </div>

          <div className="h-4"></div>

          {/* Badges */}
          <StatRow label="!! Brilliant" iconColor="text-[#06b6d4]" w={wCounts.brilliant} b={bCounts.brilliant} />
          <StatRow label="! Great" iconColor="text-[#3b82f6]" w={wCounts.great} b={bCounts.great} />
          <StatRow label="★ Best" iconColor="text-[#22c55e]" w={wCounts.best} b={bCounts.best} />
          <StatRow label="?! Inaccuracy" iconColor="text-[#fbbf24]" w={wCounts.inaccuracy} b={bCounts.inaccuracy} />
          <StatRow label="? Mistake" iconColor="text-[#f97316]" w={wCounts.mistake} b={bCounts.mistake} />
          <StatRow label="?? Blunder" iconColor="text-[#ef4444]" w={wCounts.blunder} b={bCounts.blunder} />

          <div className="h-4"></div>

          {/* Game Rating */}
          <div className="flex justify-between items-center py-2">
            <div className="w-16 text-center bg-white text-black py-1 rounded shadow-sm">{analysisResult.white_elo}</div>
            <div className="text-zinc-500 font-medium text-xs">Game rating</div>
            <div className="w-16 text-center bg-[#3c3a38] text-zinc-300 py-1 rounded shadow-sm">{analysisResult.black_elo}</div>
          </div>

          {/* Coach Review */}
          <div className="flex justify-between items-center py-4">
            <div className="flex flex-col items-center text-[#22c55e] text-[10px]">
              <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] flex items-center justify-center mb-1">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=coach" className="w-5 h-5 opacity-80" />
              </div>
              GOOD
            </div>
            <div className="text-zinc-500 font-medium text-xs">Coach Review</div>
            <div className="flex flex-col items-center text-[#22c55e] text-[10px]">
              <div className="w-8 h-8 rounded-full border-2 border-[#22c55e] flex items-center justify-center mb-1">
                <img src="https://api.dicebear.com/7.x/bottts/svg?seed=coach" className="w-5 h-5 opacity-80" />
              </div>
              GOOD
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

function StatRow({ label, iconColor, w, b }: { label: string, iconColor: string, w: number, b: number }) {
  const [icon, ...text] = label.split(' ');
  const textStr = text.join(' ');
  return (
    <div className="flex justify-between items-center py-1">
      <div className={`w-8 text-center ${w > 0 ? iconColor : 'text-zinc-600'}`}>{w}</div>
      <div className="flex items-center gap-2 text-zinc-300">
        <span className={`font-black w-4 text-center ${iconColor}`}>{icon}</span>
        <span className="text-xs font-medium w-20">{textStr}</span>
      </div>
      <div className={`w-8 text-center ${b > 0 ? iconColor : 'text-zinc-600'}`}>{b}</div>
    </div>
  );
}

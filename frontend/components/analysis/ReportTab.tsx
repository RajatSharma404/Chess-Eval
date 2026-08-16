import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { AnalysisGraph } from './AnalysisGraph';
import { BlunderTrainerModal } from './BlunderTrainerModal';
import { Target, Trophy, Sparkles, ChevronRight, Award, Zap } from 'lucide-react';

export const ReportTab: React.FC = () => {
  const { analysisResult } = useGameStore();
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);

  if (!analysisResult) return null;

  const moves = analysisResult.moves || [];

  const wCounts = { brilliant: 0, great: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };
  const bCounts = { brilliant: 0, great: 0, best: 0, good: 0, inaccuracy: 0, mistake: 0, blunder: 0 };

  // Phase-by-phase CPL accumulation
  let wOpeningLoss = 0, wOpeningCount = 0;
  let bOpeningLoss = 0, bOpeningCount = 0;
  let wMiddleLoss = 0, wMiddleCount = 0;
  let bMiddleLoss = 0, bMiddleCount = 0;
  let wEndLoss = 0, wEndCount = 0;
  let bEndLoss = 0, bEndCount = 0;

  moves.forEach((m, idx) => {
    const isWhite = m.color === 'white';
    const counts = isWhite ? wCounts : bCounts;
    if (counts[m.classification as keyof typeof counts] !== undefined) {
      counts[m.classification as keyof typeof counts]++;
    }

    const moveNum = Math.floor(idx / 2) + 1;
    const loss = m.cp_loss || 0;

    if (moveNum <= 10) {
      if (isWhite) { wOpeningLoss += loss; wOpeningCount++; }
      else { bOpeningLoss += loss; bOpeningCount++; }
    } else if (moveNum <= 30) {
      if (isWhite) { wMiddleLoss += loss; wMiddleCount++; }
      else { bMiddleLoss += loss; bMiddleCount++; }
    } else {
      if (isWhite) { wEndLoss += loss; wEndCount++; }
      else { bEndLoss += loss; bEndCount++; }
    }
  });

  // Calculate phase accuracy percentages
  const calcPhaseAcc = (totalLoss: number, count: number) => {
    if (count === 0) return 100;
    const avgLoss = totalLoss / count;
    const acc = 100 - (avgLoss / 10);
    return Math.max(0, Math.min(100, Math.round(acc)));
  };

  const wOpeningAcc = calcPhaseAcc(wOpeningLoss, wOpeningCount);
  const bOpeningAcc = calcPhaseAcc(bOpeningLoss, bOpeningCount);
  const wMiddleAcc = calcPhaseAcc(wMiddleLoss, wMiddleCount);
  const bMiddleAcc = calcPhaseAcc(bMiddleLoss, bMiddleCount);
  const wEndAcc = calcPhaseAcc(wEndLoss, wEndCount);
  const bEndAcc = calcPhaseAcc(bEndLoss, bEndCount);

  // Performance Rating estimation based on accuracy & input Elo
  const calcPerformanceElo = (acc: number, baseEloStr: string) => {
    const baseElo = parseInt(baseEloStr, 10) || 1500;
    if (acc >= 95) return Math.min(3000, baseElo + 350);
    if (acc >= 88) return baseElo + 180;
    if (acc >= 80) return baseElo + 60;
    if (acc >= 70) return Math.max(800, baseElo - 80);
    return Math.max(600, baseElo - 220);
  };

  const wPerfElo = calcPerformanceElo(analysisResult.white_accuracy, analysisResult.white_elo);
  const bPerfElo = calcPerformanceElo(analysisResult.black_accuracy, analysisResult.black_elo);

  // Contextual coach summary
  const getCoachSummary = () => {
    const totalBlunders = wCounts.blunder + bCounts.blunder;
    if (totalBlunders === 0 && analysisResult.white_accuracy > 90 && analysisResult.black_accuracy > 90) {
      return "A grandmaster-level duel! Both sides demonstrated high positional discipline with almost zero tactical concessions.";
    }
    if (wCounts.blunder > bCounts.blunder) {
      return "White allowed critical tactical counterplay in the middlegame. Review the key moments to practice finding the best defensive resources.";
    }
    if (bCounts.blunder > wCounts.blunder) {
      return "White capitalized effectively on Black's tactical errors to maintain an overwhelming advantage.";
    }
    return "A volatile encounter with momentum shifts. Both sides found great attacks while navigating complex positions.";
  };

  const blunderMovesCount = moves.filter(m => m.classification === 'blunder' || m.classification === 'mistake').length;

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#121214] overflow-y-auto custom-scrollbar p-4 space-y-6 font-sans">
      {/* Blunder Trainer Modal */}
      <BlunderTrainerModal
        isOpen={isTrainerOpen}
        onClose={() => setIsTrainerOpen(false)}
        analysisResult={analysisResult}
      />

      {/* Top Coach Section */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4 flex gap-3.5 items-start shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
          <Sparkles size={22} />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Game Summary</span>
          <p className="text-xs text-zinc-300 leading-relaxed font-medium">
            "{getCoachSummary()}"
          </p>
        </div>
      </div>

      {/* Practice Blunders CTA */}
      {blunderMovesCount > 0 && (
        <button
          onClick={() => setIsTrainerOpen(true)}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black rounded-2xl transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-between text-xs uppercase tracking-wider group"
        >
          <div className="flex items-center gap-2">
            <Target size={18} className="text-black" />
            <span>Practice Your Mistakes ({blunderMovesCount} positions)</span>
          </div>
          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {/* Graph Snippet */}
      <div className="w-full bg-zinc-950/60 p-3 rounded-2xl border border-white/5 shadow-inner">
        <div className="text-[10px] uppercase font-bold text-zinc-500 mb-2">Advantage Flow (Arctan Scale)</div>
        <AnalysisGraph height={65} showBadges={true} />
      </div>

      {/* Players Section & Performance Elo */}
      <div className="space-y-4">
        {/* Avatars and Names */}
        <div className="grid grid-cols-2 gap-3">
          {/* White Card */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-3 flex flex-col items-center text-center space-y-2">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.white_player}`} className="w-12 h-12 rounded-xl bg-zinc-950 border border-white/10" alt="White" />
            <div>
              <span className="font-bold text-xs text-white block truncate max-w-[140px]">{analysisResult.white_player}</span>
              <span className="text-[10px] text-zinc-500 font-mono">Rating: {analysisResult.white_elo || '1500'}</span>
            </div>
            <div className="w-full bg-emerald-500/10 border border-emerald-500/20 py-1 rounded-lg text-emerald-400 font-black text-xs">
              {analysisResult.white_accuracy}% Accuracy
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Perf. Elo: <strong className="text-white">{wPerfElo}</strong>
            </div>
          </div>

          {/* Black Card */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-3 flex flex-col items-center text-center space-y-2">
            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.black_player}`} className="w-12 h-12 rounded-xl bg-zinc-950 border border-white/10" alt="Black" />
            <div>
              <span className="font-bold text-xs text-white block truncate max-w-[140px]">{analysisResult.black_player}</span>
              <span className="text-[10px] text-zinc-500 font-mono">Rating: {analysisResult.black_elo || '1500'}</span>
            </div>
            <div className="w-full bg-zinc-800 border border-white/10 py-1 rounded-lg text-zinc-200 font-black text-xs">
              {analysisResult.black_accuracy}% Accuracy
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              Perf. Elo: <strong className="text-white">{bPerfElo}</strong>
            </div>
          </div>
        </div>

        {/* Phase Accuracy Breakdown */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 space-y-3">
          <span className="text-xs font-black text-zinc-300 uppercase tracking-wide block">Phase Performance</span>
          <PhaseRow label="Opening (Moves 1-10)" wAcc={wOpeningAcc} bAcc={bOpeningAcc} />
          <PhaseRow label="Middlegame (Moves 11-30)" wAcc={wMiddleAcc} bAcc={bMiddleAcc} />
          {moves.length > 60 && <PhaseRow label="Endgame (Moves 31+)" wAcc={wEndAcc} bAcc={bEndAcc} />}
        </div>

        {/* Move Classifications Table */}
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 space-y-1.5 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-white/5 font-bold text-zinc-500 text-[10px] uppercase">
            <span className="w-12 text-center">White</span>
            <span className="flex-1 text-center">Classification</span>
            <span className="w-12 text-center">Black</span>
          </div>

          <StatRow label="!! Brilliant" iconColor="text-[#06b6d4]" w={wCounts.brilliant} b={bCounts.brilliant} />
          <StatRow label="! Great" iconColor="text-[#3b82f6]" w={wCounts.great} b={bCounts.great} />
          <StatRow label="★ Best" iconColor="text-[#22c55e]" w={wCounts.best} b={bCounts.best} />
          <StatRow label="✓ Good" iconColor="text-[#86efac]" w={wCounts.good} b={bCounts.good} />
          <StatRow label="?! Inaccuracy" iconColor="text-[#fbbf24]" w={wCounts.inaccuracy} b={bCounts.inaccuracy} />
          <StatRow label="? Mistake" iconColor="text-[#f97316]" w={wCounts.mistake} b={bCounts.mistake} />
          <StatRow label="?? Blunder" iconColor="text-[#ef4444]" w={wCounts.blunder} b={bCounts.blunder} />
        </div>
      </div>
    </div>
  );
};

function PhaseRow({ label, wAcc, bAcc }: { label: string; wAcc: number; bAcc: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] font-semibold text-zinc-400">
        <span className="text-emerald-400 font-mono">{wAcc}%</span>
        <span>{label}</span>
        <span className="text-zinc-300 font-mono">{bAcc}%</span>
      </div>
      <div className="h-1.5 bg-zinc-950 rounded-full flex overflow-hidden">
        <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${wAcc / 2}%` }} />
        <div className="flex-1 bg-zinc-800" />
        <div className="bg-zinc-400 transition-all duration-500" style={{ width: `${bAcc / 2}%` }} />
      </div>
    </div>
  );
}

function StatRow({ label, iconColor, w, b }: { label: string; iconColor: string; w: number; b: number }) {
  const [icon, ...text] = label.split(' ');
  const textStr = text.join(' ');
  return (
    <div className="flex justify-between items-center py-1">
      <div className={`w-12 text-center font-bold font-mono ${w > 0 ? iconColor : 'text-zinc-600'}`}>{w}</div>
      <div className="flex items-center justify-center gap-1.5 text-zinc-300 flex-1">
        <span className={`font-black ${iconColor}`}>{icon}</span>
        <span className="font-medium text-[11px]">{textStr}</span>
      </div>
      <div className={`w-12 text-center font-bold font-mono ${b > 0 ? iconColor : 'text-zinc-600'}`}>{b}</div>
    </div>
  );
}


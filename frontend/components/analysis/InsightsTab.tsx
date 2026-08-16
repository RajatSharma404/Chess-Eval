import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Sparkles, Target, Zap, ShieldAlert, Award } from 'lucide-react';

export const InsightsTab: React.FC = () => {
  const { analysisResult } = useGameStore();

  if (!analysisResult) return null;

  const moves = analysisResult.moves || [];

  // Phase metrics calculation
  let wOpeningLoss = 0, wOpeningCount = 0;
  let wMiddleLoss = 0, wMiddleCount = 0;
  let wEndLoss = 0, wEndCount = 0;
  let wBlunders = 0;

  moves.forEach((m, idx) => {
    if (m.color === 'white') {
      const moveNum = Math.floor(idx / 2) + 1;
      const loss = m.cp_loss || 0;
      if (m.classification === 'blunder') wBlunders++;

      if (moveNum <= 10) { wOpeningLoss += loss; wOpeningCount++; }
      else if (moveNum <= 30) { wMiddleLoss += loss; wMiddleCount++; }
      else { wEndLoss += loss; wEndCount++; }
    }
  });

  const getPhaseAccuracy = (totalLoss: number, count: number) => {
    if (count === 0) return 95;
    const avgLoss = totalLoss / count;
    return Math.max(0, Math.min(100, Math.round(100 - (avgLoss / 10))));
  };

  const openingAcc = getPhaseAccuracy(wOpeningLoss, wOpeningCount);
  const middleAcc = getPhaseAccuracy(wMiddleLoss, wMiddleCount);
  const endAcc = getPhaseAccuracy(wEndLoss, wEndCount);

  const getSliderType = (acc: number): 'positive' | 'neutral' | 'negative' => {
    if (acc >= 90) return 'positive';
    if (acc >= 75) return 'neutral';
    return 'negative';
  };

  // Generate move-by-move accuracy SVG curve points
  const points = moves.map((m, idx) => {
    const x = (idx / Math.max(1, moves.length - 1)) * 100;
    // Map eval from -500..+500 to 35..5
    const clampedEval = Math.max(-500, Math.min(500, m.eval_after_cp));
    const y = 20 - (clampedEval / 500) * 15;
    return { x, y, classification: m.classification, isWhite: m.color === 'white' };
  });

  const pathStr = points.length > 0 
    ? `M ${points[0].x},${points[0].y} ` + points.map(p => `L ${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    : '';

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#121214] p-4 custom-scrollbar overflow-y-auto space-y-6 font-sans">
      {/* Top Coach Section */}
      <div className="flex gap-4 items-center bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/20 rounded-2xl p-4 shadow-xl">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <Sparkles size={22} />
        </div>
        <div className="flex-1">
          <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-0.5">Tactical Insight</span>
          <p className="text-xs text-zinc-300 font-medium leading-relaxed">
            {openingAcc >= 90 
              ? "Your opening was solid and principled. Keep sharpening your endgame conversions!" 
              : "Focus on early piece coordination to avoid giving up initiative in the opening."}
          </p>
        </div>
      </div>

      {/* Where you stand */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <h3 className="font-extrabold text-sm flex items-center gap-2 text-white">
            <Target size={16} className="text-amber-400" />
            <span>Phase Mastery & Accuracy</span>
          </h3>
          <span className="text-xs text-zinc-400 font-mono">Opponent: {analysisResult.black_elo || '1500'}</span>
        </div>

        <div className="space-y-4 pt-1">
          <InsightSlider label="Overall Accuracy" icon="🎯" type={getSliderType(analysisResult.white_accuracy)} value={`${analysisResult.white_accuracy}%`} />
          <InsightSlider label="Opening Phase" icon="📖" type={getSliderType(openingAcc)} value={`${openingAcc}%`} />
          <InsightSlider label="Middlegame" icon="⚔" type={getSliderType(middleAcc)} value={`${middleAcc}%`} />
          {moves.length > 60 && (
            <InsightSlider label="Endgame" icon="♔" type={getSliderType(endAcc)} value={`${endAcc}%`} />
          )}
          <InsightSlider label="Blunder Resistance" icon="⚠" type={wBlunders === 0 ? 'positive' : wBlunders <= 2 ? 'neutral' : 'negative'} value={wBlunders === 0 ? "0 Blunders" : `${wBlunders} Blunders`} />
        </div>
      </div>

      {/* Accuracy & Advantage per move */}
      <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-5 space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-white/5 text-xs font-bold">
          <div className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 bg-emerald-400 rounded-sm"></span>
            {analysisResult.white_player} ({analysisResult.white_accuracy}%)
          </div>
          <div className="flex items-center gap-1.5 text-zinc-400">
            {analysisResult.black_player} ({analysisResult.black_accuracy}%)
            <span className="w-2 h-2 bg-zinc-500 rounded-sm"></span>
          </div>
        </div>

        {/* Dynamic SVG chart */}
        <div className="w-full h-28 relative bg-zinc-950/60 rounded-xl p-2 border border-white/5 overflow-hidden">
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
            {/* Center line */}
            <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 2" />

            {/* Eval curve */}
            <path d={pathStr} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinejoin="round" />

            {/* Blunder dots */}
            {points.filter(p => p.classification === 'blunder').map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2" fill="#ef4444" stroke="#fff" strokeWidth="0.5" />
            ))}
          </svg>
        </div>

        <div className="flex justify-between items-center text-[10px] font-bold text-zinc-500">
          <span>Move 1</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#ef4444]"></div>
            <span>Critical Blunders</span>
          </div>
          <span>Move {Math.floor(moves.length / 2) + 1}</span>
        </div>
      </div>
    </div>
  );
};

function InsightSlider({ label, icon, type, value }: { label: string; icon: string; type: 'neutral' | 'positive' | 'negative'; value: string }) {
  let barContent;
  let textClass = "text-zinc-400";

  if (type === 'neutral') {
    barContent = (
      <>
        <div className="absolute inset-y-0 left-0 right-1/2 bg-zinc-800 rounded-l-full"></div>
        <div className="absolute inset-y-0 left-1/2 right-0 bg-zinc-800 rounded-r-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-md"></div>
      </>
    );
  } else if (type === 'positive') {
    textClass = "text-emerald-400";
    barContent = (
      <>
        <div className="absolute inset-y-0 left-0 right-1/2 bg-zinc-800 rounded-l-full"></div>
        <div className="absolute inset-y-0 left-1/2 right-[10%] bg-emerald-500 rounded-r-full"></div>
        <div className="absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
      </>
    );
  } else {
    textClass = "text-orange-400";
    barContent = (
      <>
        <div className="absolute inset-y-0 left-0 right-[60%] bg-zinc-800 rounded-l-full"></div>
        <div className="absolute inset-y-0 left-[40%] right-1/2 bg-orange-500 rounded-l-full"></div>
        <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></div>
      </>
    );
  }

  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2.5 w-36">
        <span className="text-zinc-400 w-4 text-center">{icon}</span>
        <span className="font-bold text-zinc-200 truncate">{label}</span>
      </div>
      
      <div className="flex-1 px-4">
        <div className="h-1.5 relative w-full rounded-full bg-zinc-950 border border-white/5">
           {barContent}
        </div>
      </div>

      <div className={`w-24 text-right text-xs font-black font-mono ${textClass}`}>
        {value}
      </div>
    </div>
  );
}


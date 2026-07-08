import React from 'react';
import { useGameStore } from '../../store/useGameStore';

export const InsightsTab: React.FC = () => {
  const { analysisResult } = useGameStore();

  if (!analysisResult) return null;

  return (
    <div className="flex flex-col w-full h-full text-white bg-[#262421] p-4 custom-scrollbar overflow-y-auto">
      {/* Top Coach Section */}
      <div className="flex gap-4 items-center mb-8 relative">
        <img 
          src="https://api.dicebear.com/7.x/bottts/svg?seed=coach&backgroundColor=10b981" 
          alt="Coach" 
          className="w-16 h-16 rounded-xl bg-emerald-500/20 shrink-0 shadow-lg" 
        />
        <div className="bg-white text-[#262421] p-3 rounded-2xl rounded-tl-sm relative shadow-md font-medium text-sm flex-1">
          <div className="absolute -left-2 top-0 w-0 h-0 border-t-8 border-t-white border-l-8 border-l-transparent"></div>
          Your opening held up well. The endgame is where this one slipped.
        </div>
      </div>

      {/* Where you stand */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-base flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
            Where you stand this game
          </h3>
          <span className="text-xs text-zinc-500 font-medium">vs {analysisResult.white_elo}</span>
        </div>

        <div className="space-y-4">
          <InsightSlider label="Accuracy" icon="🎯" type="neutral" />
          <InsightSlider label="Opening" icon="📖" type="positive" value="top 9%" />
          <InsightSlider label="Middlegame" icon="⚔" type="neutral" />
          <InsightSlider label="Endgame" icon="♔" type="negative" value="bottom 34%" />
          <InsightSlider label="Blunders" icon="⚠" type="neutral" />
        </div>
      </div>

      {/* Accuracy per move */}
      <div>
        <h3 className="font-bold text-base flex items-center gap-2 mb-4">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          Accuracy per move
        </h3>

        <div className="bg-[#1b1a19] p-4 rounded-xl border border-black/20 shadow-inner">
          <div className="flex justify-between items-center mb-4 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-amber-400">
              <div className="w-2 h-2 bg-amber-400 rounded-sm"></div>
              {analysisResult.white_player}
            </div>
            <div className="flex items-center gap-2 text-white">
              <span className="text-amber-400">{analysisResult.white_accuracy.toFixed(1)}</span>
              <span className="text-zinc-500">{analysisResult.black_accuracy.toFixed(1)}</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-500">
              {analysisResult.black_player}
              <div className="w-2 h-2 bg-zinc-500 rounded-sm"></div>
            </div>
          </div>

          {/* Dummy chart for Accuracy per move */}
          <div className="w-full h-24 relative mt-6 border-b border-zinc-800 border-dashed">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              {/* Black player line (gray) */}
              <path d="M0,10 Q10,12 20,8 T40,20 T50,30 T60,10 T80,35 T100,10" fill="none" stroke="#52525b" strokeWidth="1" strokeLinejoin="round" />
              
              {/* White player line (amber) */}
              <path d="M0,8 Q15,5 25,15 T45,35 T55,10 T70,30 T85,38 T100,20" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinejoin="round" />
              
              {/* Blunder dot on amber line */}
              <circle cx="85" cy="38" r="1.5" fill="#262421" stroke="#ef4444" strokeWidth="1" />
            </svg>
          </div>
          
          <div className="flex justify-end mt-2">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500">
              <div className="w-1.5 h-1.5 rounded-full bg-[#ef4444]"></div>
              blunders
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function InsightSlider({ label, icon, type, value }: { label: string, icon: string, type: 'neutral' | 'positive' | 'negative', value?: string }) {
  let barContent;
  let textClass = "text-zinc-500";
  let displayValue = value || "≈ your level";

  if (type === 'neutral') {
    barContent = (
      <>
        <div className="absolute inset-y-0 left-0 right-1/2 bg-[#3c3a38] rounded-l-full"></div>
        <div className="absolute inset-y-0 left-1/2 right-0 bg-[#3c3a38] rounded-r-full"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#262421]"></div>
      </>
    );
  } else if (type === 'positive') {
    textClass = "text-emerald-400";
    barContent = (
      <>
        <div className="absolute inset-y-0 left-0 right-1/2 bg-[#3c3a38] rounded-l-full"></div>
        <div className="absolute inset-y-0 left-1/2 right-[10%] bg-emerald-500"></div>
        <div className="absolute inset-y-0 left-[90%] right-0 bg-[#3c3a38] rounded-r-full"></div>
        <div className="absolute top-1/2 left-[90%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#262421]"></div>
      </>
    );
  } else if (type === 'negative') {
    textClass = "text-orange-500";
    barContent = (
      <>
        <div className="absolute inset-y-0 left-0 right-[60%] bg-[#3c3a38] rounded-l-full"></div>
        <div className="absolute inset-y-0 left-[40%] right-1/2 bg-orange-500"></div>
        <div className="absolute inset-y-0 left-1/2 right-0 bg-[#3c3a38] rounded-r-full"></div>
        <div className="absolute top-1/2 left-[40%] -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-amber-400 border border-[#262421]"></div>
      </>
    );
  }

  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-3 w-32">
        <span className="text-zinc-400 w-4 text-center">{icon}</span>
        <span className="font-bold text-zinc-200">{label}</span>
      </div>
      
      <div className="flex-1 px-4">
        <div className="h-1.5 relative w-full rounded-full bg-[#1b1a19]">
           {barContent}
        </div>
      </div>

      <div className={`w-24 text-right text-xs font-bold ${textClass}`}>
        {displayValue}
      </div>
    </div>
  );
}

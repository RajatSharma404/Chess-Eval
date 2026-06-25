import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import { Check } from 'lucide-react';

export function AnalysisLoadingScreen() {
  const router = useRouter();
  const { progressStatus, reset, setLoading } = useGameStore();
  const [cancelPrompt, setCancelPrompt] = useState(false);
  
  // Timer for ETA calculation
  const [startTime] = useState<number>(Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedMs(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const pObj = progressStatus && typeof progressStatus === 'object' ? progressStatus : null;
  const isComplete = pObj?.isComplete || false;
  
  const currentMove = pObj?.currentMove || 0;
  const totalMoves = pObj?.totalMoves || 1;
  const progressPercent = Math.min(100, Math.max(0, (currentMove / totalMoves) * 100));
  
  // ETA Calculation
  let etaText = "Calculating...";
  if (currentMove > 1) {
    const timePerMove = elapsedMs / currentMove;
    const movesRemaining = totalMoves - currentMove;
    const msRemaining = movesRemaining * timePerMove;
    
    if (msRemaining > 0) {
      if (msRemaining < 60000) {
        etaText = `~${Math.ceil(msRemaining / 1000)} seconds remaining`;
      } else {
        etaText = `~${Math.ceil(msRemaining / 60000)} minutes remaining`;
      }
    } else {
      etaText = "Almost done...";
    }
  }

  const handleCancel = () => {
    setLoading(false);
    reset();
    router.back();
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 transition-opacity duration-200 animate-in fade-in">
      {/* Background with blur and darken */}
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[8px] backdrop-brightness-50" />
      
      {/* Optional Side Decorations (Desktop only) */}
      <div className="absolute inset-y-0 left-[10%] hidden lg:flex flex-col justify-around text-4xl text-white opacity-10 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <div className="animate-[slideDown_20s_linear_infinite]">♙</div>
        <div className="animate-[slideDown_20s_linear_infinite_2s]">♗</div>
        <div className="animate-[slideDown_20s_linear_infinite_4s]">♘</div>
        <div className="animate-[slideDown_20s_linear_infinite_6s]">♖</div>
        <div className="animate-[slideDown_20s_linear_infinite_8s]">♕</div>
        <div className="animate-[slideDown_20s_linear_infinite_10s]">♔</div>
      </div>
      <div className="absolute inset-y-0 right-[10%] hidden lg:flex flex-col justify-around text-4xl text-white opacity-10 pointer-events-none select-none overflow-hidden" aria-hidden="true">
        <div className="animate-[slideDown_20s_linear_infinite_1s]">♔</div>
        <div className="animate-[slideDown_20s_linear_infinite_3s]">♕</div>
        <div className="animate-[slideDown_20s_linear_infinite_5s]">♖</div>
        <div className="animate-[slideDown_20s_linear_infinite_7s]">♘</div>
        <div className="animate-[slideDown_20s_linear_infinite_9s]">♗</div>
        <div className="animate-[slideDown_20s_linear_infinite_11s]">♙</div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideDown {
          0% { transform: translateY(-100vh); }
          100% { transform: translateY(100vh); }
        }
        @media (prefers-reduced-motion) {
          .animate-\\[slideDown_20s_linear_infinite\\] { animation: none !important; }
        }
      `}} />

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-zinc-900/90 border border-zinc-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center">
        
        {/* Icon Area */}
        <div className="h-16 w-16 mb-6 flex items-center justify-center relative">
          {isComplete ? (
            <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)] animate-in zoom-in spin-in-12 duration-500 text-white">
              <Check size={32} strokeWidth={4} />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-teal-500/20 blur-xl rounded-full animate-pulse" style={{ animationDuration: '2s' }} />
              <svg viewBox="0 0 100 100" className="w-12 h-12 fill-teal-500 drop-shadow-[0_0_15px_rgba(20,184,166,0.5)] relative z-10">
                <path d="M50 10 C 60 10, 65 15, 65 25 C 65 30, 60 35, 75 55 C 80 60, 80 75, 80 75 L 75 80 L 25 80 L 20 75 C 20 75, 20 60, 25 55 C 40 35, 35 30, 35 25 C 35 15, 40 10, 50 10 Z M 45 25 C 45 28, 48 30, 50 30 C 52 30, 55 28, 55 25 C 55 22, 52 20, 50 20 C 48 20, 45 22, 45 25 Z" />
                <path d="M25 82 L75 82 L75 90 L25 90 Z" />
              </svg>
            </>
          )}
        </div>

        {/* Text Headers */}
        <h2 className="text-[20px] font-bold text-white mb-1">
          {isComplete ? "Analysis complete!" : "Analyzing your game"}
        </h2>
        <p className="text-[13px] text-zinc-400 font-medium mb-8">
          Stockfish 17 AVX2 · Depth 35
        </p>

        {/* Progress Bar */}
        <div className="w-full mb-3" aria-label="Analysis progress">
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-400 rounded-full transition-all duration-300 ease-out" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Progress Info */}
        <div className="w-full flex justify-between items-center text-[13px] text-zinc-400 font-medium mb-6">
          <div role="status" aria-live="polite">
            {currentMove > 0 ? `Move ${currentMove} of ${totalMoves}` : "Initializing..."}
          </div>
          <div>
            {Math.round(progressPercent)}% complete
          </div>
        </div>

        {/* Currently Evaluating Line */}
        <div className="w-full bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/50 mb-4">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold mb-1">Currently evaluating</div>
          <div className="font-mono text-[11px] text-zinc-500 truncate">
            {pObj?.currentLine || "..."}
          </div>
        </div>

        {/* ETA */}
        <div className="text-[13px] text-zinc-400 font-medium h-5">
          {!isComplete && etaText}
        </div>
      </div>

      {/* Cancel Button */}
      <div className="mt-8 z-10 h-8 flex items-center justify-center">
        {!isComplete && (
          cancelPrompt ? (
            <div className="flex items-center gap-3 text-sm text-zinc-300 bg-zinc-900/80 px-4 py-2 rounded-full border border-zinc-700">
              <span>Cancel? Progress will be lost.</span>
              <button onClick={handleCancel} className="text-red-400 font-bold hover:text-red-300 px-2 py-1 bg-red-500/10 rounded">Yes</button>
              <button onClick={() => setCancelPrompt(false)} className="text-zinc-400 font-bold hover:text-white px-2 py-1">No</button>
            </div>
          ) : (
            <button 
              onClick={() => setCancelPrompt(true)} 
              className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors border-b border-transparent hover:border-zinc-500"
            >
              Cancel analysis
            </button>
          )
        )}
      </div>
    </div>
  );
}

'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
import { ChessBoard } from '../../components/ChessBoard';
import { EvalBar } from '../../components/EvalBar';
import { MoveList } from '../../components/MoveList';
import { AccuracyChart } from '../../components/AccuracyChart';
import { SuggestionCard } from '../../components/SuggestionCard';
import { ChevronLeft, ChevronRight, Home, LayoutDashboard } from 'lucide-react';

export default function AnalyzePage() {
  const { analysisResult, currentMoveIndex, setCurrentMoveIndex, reset } = useGameStore();
  const router = useRouter();

  useEffect(() => {
    if (!analysisResult) {
      router.push('/');
    }
  }, [analysisResult, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!analysisResult) return;
      if (e.key === 'ArrowRight' && currentMoveIndex < analysisResult.moves.length - 1) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentMoveIndex > -1) {
        setCurrentMoveIndex(currentMoveIndex - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, analysisResult, setCurrentMoveIndex]);

  useEffect(() => {
    if (currentMoveIndex >= -1) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) {}
    }
  }, [currentMoveIndex]);

  if (!analysisResult) return null;

  const currentMove = currentMoveIndex >= 0 ? analysisResult.moves[currentMoveIndex] : null;

  return (
    <div className="min-h-screen bg-[#050505] text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Premium Navbar */}
      <header className="border-b border-white/5 px-8 py-5 flex justify-between items-center bg-gray-900/30 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { reset(); router.push('/'); }} 
            className="p-3 hover:bg-white/5 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-white/10"
          >
            <Home size={20} className="text-gray-400 group-hover:text-white" />
          </button>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xs font-black text-white uppercase tracking-[0.3em]">Analysis Laboratory</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Stockfish 17 Engine Online</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-800/50 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-white rounded-sm"></div>
              <span className="text-xl font-black text-white">{analysisResult.white_accuracy.toFixed(1)}<span className="text-xs text-gray-400">%</span></span>
            </div>
            <div className="h-6 w-[1px] bg-white/10 mx-2" />
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-gray-300">{analysisResult.black_accuracy.toFixed(1)}<span className="text-xs text-gray-500">%</span></span>
              <div className="w-3 h-3 bg-black border border-gray-600 rounded-sm"></div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row p-8 gap-10 overflow-hidden max-w-[1800px] mx-auto w-full">
        {/* Left Section: Board & Controls */}
        <section className="flex flex-col gap-10 w-full lg:w-[40%] xl:w-[35%] items-center">
          <div className="flex gap-10 w-full justify-center items-stretch">
            <div className="h-[400px] lg:h-[500px] py-4">
              <EvalBar 
                evalScore={currentMove ? currentMove.eval_after_cp : 0} 
                isBlunder={currentMove ? currentMove.classification === 'blunder' : false}
              />
            </div>
            <div className="flex-1 w-full max-w-[700px]">
              <ChessBoard />
            </div>
          </div>

          <div className="flex items-center gap-6 bg-gray-900/80 backdrop-blur-xl rounded-[2rem] p-3 border border-white/10 shadow-3xl">
            <button 
              disabled={currentMoveIndex <= -1}
              onClick={() => setCurrentMoveIndex(currentMoveIndex - 1)}
              className="p-5 hover:bg-white/5 disabled:opacity-20 rounded-2xl transition-all active:scale-90"
            >
              <ChevronLeft size={28} />
            </button>
            <div className="px-10 text-center min-w-[150px]">
               <p className="text-[10px] text-gray-500 uppercase font-black tracking-[0.2em] mb-1">Position</p>
               <p className="text-2xl font-mono font-black text-white">
                 {currentMoveIndex === -1 ? 'Start' : currentMove?.move_san}
               </p>
            </div>
            <button 
              disabled={currentMoveIndex >= analysisResult.moves.length - 1}
              onClick={() => setCurrentMoveIndex(currentMoveIndex + 1)}
              className="p-5 hover:bg-white/5 disabled:opacity-20 rounded-2xl transition-all active:scale-90"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </section>

        {/* Middle Section: Insights & Trajectory */}
        <section className="flex-1 flex flex-col gap-8 min-w-0">
          <SuggestionCard />
          <AccuracyChart />
        </section>

        {/* Right Section: Move Archive */}
        <section className="w-full lg:w-[30%] xl:w-[25%] flex flex-col h-[700px] lg:h-auto">
          <MoveList />
        </section>
      </main>
    </div>
  );
}

'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
import { ChessBoard } from '../../components/ChessBoard';
import { EvalBar } from '../../components/EvalBar';
import { BrilliantGem } from '../../components/BrilliantGem';
import { Home, Zap, Star, Wrench, Info, LogIn, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { ReportTab } from '../../components/analysis/ReportTab';
import { AnalysisTab } from '../../components/analysis/AnalysisTab';
import { InsightsTab } from '../../components/analysis/InsightsTab';

export default function AnalyzePage() {
  const { 
    analysisResult, 
    currentMoveIndex, 
    previewMoveIndex,
    setCurrentMoveIndex, 
    reset 
  } = useGameStore();
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [activeTab, setActiveTab] = useState<'report' | 'analysis' | 'insights'>('analysis');
  const [brilliantIndex, setBrilliantIndex] = useState<number | null>(null);
  
  const router = useRouter();

  useEffect(() => {
    if (!analysisResult) {
      router.push('/');
    } else {
      const idx = analysisResult.moves.findIndex(m => m.classification === 'brilliant');
      if (idx !== -1) {
        setBrilliantIndex(idx);
      } else {
        setBrilliantIndex(null);
      }
    }
  }, [analysisResult, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        setBoardOrientation(o => o === 'white' ? 'black' : 'white');
      }
      if (!analysisResult) return;
      if (e.key === 'ArrowRight' && currentMoveIndex < analysisResult.moves.length - 1) {
        setCurrentMoveIndex(currentMoveIndex + 1);
      } else if (e.key === 'ArrowLeft' && currentMoveIndex > -1) {
        setCurrentMoveIndex(currentMoveIndex - 1);
      } else if (e.key === 'Home') {
        setCurrentMoveIndex(-1);
      } else if (e.key === 'End') {
        setCurrentMoveIndex(analysisResult.moves.length - 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentMoveIndex, analysisResult, setCurrentMoveIndex]);

  if (!analysisResult) return null;

  const activeMoveIndex = previewMoveIndex !== null ? previewMoveIndex : currentMoveIndex;
  const currentMove = activeMoveIndex >= 0 && analysisResult ? analysisResult.moves[activeMoveIndex] : null;

  const handleGoToBrilliant = () => {
    if (brilliantIndex !== null) {
      setCurrentMoveIndex(brilliantIndex);
      setBrilliantIndex(null);
    }
  };

  const streakDays = [1, 2, 3]; 

  return (
    <div className="min-h-screen bg-[#1b1a19] text-gray-100 flex font-sans selection:bg-amber-500/30 overflow-hidden">
      {/* LEFT SIDEBAR (Copied from History Page) */}
      <div className="w-[260px] bg-[#161514] border-r border-white/5 flex flex-col shrink-0 z-10 shadow-2xl">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl grayscale opacity-80 text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">♟</span>
            <span className="text-sm font-black tracking-widest text-white mt-1">CHESSIGMA</span>
          </div>
          <ChevronLeft size={18} className="text-zinc-500 hover:text-white cursor-pointer transition-colors" />
        </div>

        <nav className="flex flex-col gap-1 px-3 mt-4 flex-1">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <Home size={18} /> Home
          </a>
          <a href="/train" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <div className="flex items-center gap-3">
              <Zap size={18} /> Train
            </div>
            <span className="text-[10px] bg-amber-400/20 text-amber-400 font-bold px-1.5 py-0.5 rounded">NEW</span>
          </a>
          <a href="/supercoach" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <div className="flex items-center gap-3">
              <Star size={18} /> Supercoach
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
          </a>
          <a href="/history" className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#262421] text-amber-400 text-sm font-medium border border-white/5 shadow-md">
            <div className="flex items-center gap-3">
              <Wrench size={18} /> Tools
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/about" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <div className="flex items-center gap-3">
              <Info size={18} /> About
            </div>
            <ChevronRight size={16} />
          </a>
        </nav>

        <div className="p-4 border-t border-white/5 space-y-6 bg-[#161514]">
          <div className="flex items-center justify-between text-sm text-zinc-400 font-medium px-2">
             What&apos;s new
             <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
          </div>
          <div className="px-2">
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-1.5 text-amber-400 font-black">
                 <span className="text-lg">🔥</span> 0
               </div>
               <div className="text-[10px] text-zinc-500 font-bold tracking-widest">DAY STREAK</div>
            </div>
            <div className="flex gap-1.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${streakDays.includes(idx) ? 'bg-amber-400 text-zinc-950 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'border border-zinc-800 text-zinc-600'}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>
          <button className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">
            <LogIn size={18} /> Sign in
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex h-full">
        
        {/* CENTER COLUMN: Chessboard */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#1b1a19] min-w-[500px]">
          <div className="w-full max-w-[700px] flex flex-col items-center">
            
            {/* Top Player (Black) */}
            <div className="w-full flex items-center justify-between mb-2">
              <div className="flex items-center gap-3 bg-[#262421] px-3 py-1.5 rounded-md border border-white/5 shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.black_player}`} alt="Black player" className="w-6 h-6 rounded bg-zinc-800" />
                <span className="font-bold text-sm text-zinc-200">{analysisResult.black_player}</span>
                <span className="text-xs text-zinc-500 font-mono">{analysisResult.black_elo}</span>
              </div>
              <div className="text-zinc-500 font-mono text-sm bg-black/20 px-3 py-1 rounded-md">10:00</div>
            </div>

            {/* Board Container */}
            <div className="w-full aspect-square flex relative shadow-2xl rounded overflow-hidden">
               <div className="w-6 shrink-0 border-r border-black/20 z-10 bg-[#262421]">
                 <EvalBar evalScore={currentMove?.eval_after_cp || 0} isBlunder={currentMove?.classification === 'blunder'} />
               </div>
               <div className="flex-1 relative h-full">
                 <ChessBoard boardOrientation={boardOrientation} />
               </div>
            </div>

            {/* Bottom Player (White) */}
            <div className="w-full flex items-center justify-between mt-2 mb-4">
              <div className="flex items-center gap-3 bg-[#262421] px-3 py-1.5 rounded-md border border-amber-500/50 shadow-[0_0_10px_rgba(251,191,36,0.1)]">
                <div className="text-[10px] bg-amber-400 text-black font-black px-1 rounded uppercase tracking-wider">You</div>
                <span className="font-bold text-sm text-amber-500">{analysisResult.white_player}</span>
                <span className="text-xs text-zinc-500 font-mono">★ {analysisResult.white_elo}</span>
              </div>
              <div className="text-amber-500 font-mono text-sm bg-amber-500/10 px-3 py-1 rounded-md">10:00</div>
            </div>

            {/* Scrubber */}
            <div className="w-full flex items-center bg-[#262421] rounded-lg border border-white/5 overflow-hidden h-12 shadow-md">
              <button 
                onClick={() => setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1))}
                className="w-12 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              <div className="flex-1 flex items-center overflow-x-auto custom-scrollbar px-2 gap-2 h-full whitespace-nowrap">
                {analysisResult.moves.map((move, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentMoveIndex(idx)}
                    className={`px-3 py-1 text-sm font-bold rounded-md transition-colors ${idx === currentMoveIndex ? 'bg-amber-400 text-black' : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'}`}
                  >
                     {idx % 2 === 0 ? `${Math.floor(idx/2)+1}. ` : ''}{move.move_san}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentMoveIndex(Math.min(analysisResult.moves.length - 1, currentMoveIndex + 1))}
                className="w-12 h-full flex items-center justify-center bg-amber-400 hover:bg-amber-500 text-black transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: TABS */}
        <div className="w-[420px] bg-[#262421] border-l border-white/5 flex flex-col shadow-2xl shrink-0 z-10 m-4 rounded-xl overflow-hidden">
          {/* Tab Header */}
          <div className="flex items-center text-sm font-bold text-zinc-500 border-b border-white/5 bg-black/20">
             <button 
               onClick={() => setActiveTab('report')}
               className={`flex-1 py-4 flex justify-center items-center gap-2 transition-colors ${activeTab === 'report' ? 'text-amber-400 bg-white/5' : 'hover:text-zinc-300'}`}
             >
               <span className="text-lg">📄</span> Report
             </button>
             <button 
               onClick={() => setActiveTab('analysis')}
               className={`flex-1 py-4 flex justify-center items-center gap-2 transition-colors ${activeTab === 'analysis' ? 'text-amber-400 bg-white/5 border border-white/5 rounded-t-lg' : 'hover:text-zinc-300'}`}
               style={activeTab === 'analysis' ? {boxShadow: 'inset 0 2px 0 0 #fbbf24'} : {}}
             >
               <span className="text-lg">🔍</span> Analysis
             </button>
             <button 
               onClick={() => setActiveTab('insights')}
               className={`flex-1 py-4 flex justify-center items-center gap-2 transition-colors ${activeTab === 'insights' ? 'text-amber-400 bg-white/5' : 'hover:text-zinc-300'}`}
             >
               <span className="text-lg">📊</span> Insights
             </button>
             <button className="w-12 py-4 flex justify-center hover:text-zinc-300 transition-colors">
               <Settings size={18} />
             </button>
          </div>
          
          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#262421]">
            {activeTab === 'report' && <ReportTab />}
            {activeTab === 'analysis' && <AnalysisTab />}
            {activeTab === 'insights' && <InsightsTab />}
          </div>
        </div>
      </div>
      
      {brilliantIndex !== null && brilliantIndex !== currentMoveIndex && (
        <div className="fixed bottom-6 right-[440px] bg-emerald-900/90 border border-emerald-400/50 p-4 pr-6 rounded-2xl shadow-[0_0_30px_rgba(52,211,153,0.3)] z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 backdrop-blur-md">
          <BrilliantGem />
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">Brilliant Move Found!</h3>
          </div>
          <button onClick={handleGoToBrilliant} className="ml-2 px-4 py-2 bg-cyan-400 text-black font-bold text-xs rounded-xl transition-colors shadow-lg">
            Show Me
          </button>
        </div>
      )}
    </div>
  );
}

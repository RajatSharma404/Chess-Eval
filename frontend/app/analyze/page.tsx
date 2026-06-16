'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
import { ChessBoard } from '../../components/ChessBoard';
import { EvalBar } from '../../components/EvalBar';
import { MoveList } from '../../components/MoveList';
import { LiveEngine } from '../../components/LiveEngine';
import { CoachChat } from '../../components/CoachChat';
import { BrilliantGem } from '../../components/BrilliantGem';
import { ChevronLeft, ChevronRight, Home, LayoutDashboard, X } from 'lucide-react';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="p-10 text-red-500 font-mono"><h1>Runtime Error</h1><pre>{this.state.error?.stack}</pre></div>;
    return this.props.children;
  }
}

export default function AnalyzePage() {
  const { analysisResult, currentMoveIndex, setCurrentMoveIndex, reset } = useGameStore();
  const [boardOrientation, setBoardOrientation] = React.useState<'white' | 'black'>('white');
  const [activeTab, setActiveTab] = React.useState<'analysis' | 'coach'>('analysis');
  const [brilliantIndex, setBrilliantIndex] = React.useState<number | null>(null);
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

  const handleGoToBrilliant = () => {
    if (brilliantIndex !== null) {
      setCurrentMoveIndex(brilliantIndex);
      setBrilliantIndex(null); // dismiss toast after clicking
    }
  };

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
    <ErrorBoundary>
    <div className="h-screen bg-[#050505] text-gray-100 flex flex-col font-sans selection:bg-cyan-500/30 overflow-hidden">
      {/* Premium Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex justify-between items-center bg-gray-900/40 backdrop-blur-2xl sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { reset(); router.push('/'); }} 
            className="p-2.5 hover:bg-white/5 rounded-xl transition-all group active:scale-95 border border-transparent hover:border-white/10"
          >
            <Home size={20} className="text-gray-400 group-hover:text-cyan-400" />
          </button>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xs font-black text-white uppercase tracking-[0.3em]">Analysis Laboratory</h1>
              <div className="flex items-center gap-2 mt-1 group relative cursor-help">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Stockfish 17 AVX2 Online</p>
                
                {/* Hover Tooltip for Engine Stats */}
                <div className="absolute top-full left-0 mt-2 p-3 bg-gray-900 border border-white/10 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity w-48 z-50">
                   <div className="text-[10px] text-gray-400 font-black tracking-widest uppercase mb-1">Engine Stats</div>
                   <div className="flex justify-between text-xs font-mono"><span className="text-gray-500">Nodes/sec:</span> <span className="text-white">Max</span></div>
                   <div className="flex justify-between text-xs font-mono"><span className="text-gray-500">Hash:</span> <span className="text-white">1024 MB</span></div>
                   <div className="flex justify-between text-xs font-mono"><span className="text-gray-500">Threads:</span> <span className="text-white">4</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-6">
          {/* Accuracy Badges with Avatars */}
          <div className="flex items-center bg-gray-900/60 rounded-full border border-white/10 p-1 shadow-inner">
            <div className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-help" title="White Accuracy">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center font-bold text-black text-[10px] shadow-sm">W</div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white leading-none">{analysisResult.white_accuracy.toFixed(1)}%</span>
                <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest mt-0.5">White</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            <div className="flex items-center gap-3 pr-2 pl-4 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-help" title="Black Accuracy">
              <div className="flex flex-col text-right">
                <span className="text-xs font-black text-gray-300 leading-none">{analysisResult.black_accuracy.toFixed(1)}%</span>
                <span className="text-[8px] text-gray-500 uppercase font-black tracking-widest mt-0.5">Black</span>
              </div>
              <div className="w-6 h-6 bg-gray-800 border border-gray-600 rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm">B</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(600px,1fr)_1fr] xl:grid-cols-[280px_minmax(500px,700px)_1fr] p-6 gap-6 overflow-y-auto max-w-[1800px] mx-auto w-full">
        {/* Left Column: Sidebar (Hidden on smaller screens) */}
        <section className="hidden xl:flex flex-col gap-4 h-full overflow-y-auto pr-2 custom-scrollbar">
           <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl shrink-0">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <LayoutDashboard size={14} /> Match Info
              </h2>
              <div className="flex flex-col gap-3">
                 <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-bold text-black text-sm shadow-md">W</div>
                     <div>
                       <div className="font-bold text-sm text-white">White Player</div>
                       <div className="text-[10px] font-mono text-gray-400">1500 ELO</div>
                     </div>
                   </div>
                 </div>
                 <div className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 bg-gray-800 border border-gray-600 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md">B</div>
                     <div>
                       <div className="font-bold text-sm text-gray-300">Black Player</div>
                       <div className="text-[10px] font-mono text-gray-500">1500 ELO</div>
                     </div>
                   </div>
                 </div>
              </div>
           </div>
           
           <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl shrink-0">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Opening Setup</h2>
              <p className="text-sm font-bold text-cyan-50 leading-relaxed bg-cyan-900/20 p-3 rounded-xl border border-cyan-500/20">{analysisResult.opening}</p>
           </div>

           <div className="flex-1 overflow-hidden flex flex-col">
              <LiveEngine />
           </div>
        </section>

        {/* Center Column: Board & Controls */}
        <section className="flex flex-col gap-4 w-full items-center justify-start max-w-[800px] mx-auto xl:max-w-none xl:mx-0 xl:items-start">
          <div className="w-full max-w-[750px] relative">
             <ChessBoard boardOrientation={boardOrientation} />
          </div>

          <div className="flex items-center justify-between bg-gray-900/60 backdrop-blur-xl rounded-2xl p-3 border border-white/10 shadow-2xl w-full max-w-[750px]">
            <div className="flex items-center gap-2">
              <button 
                disabled={currentMoveIndex <= -1}
                onClick={() => setCurrentMoveIndex(-1)}
                className="p-3 hover:bg-white/5 disabled:opacity-20 rounded-xl transition-all active:scale-90"
                title="Go to Start"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                disabled={currentMoveIndex <= -1}
                onClick={() => setCurrentMoveIndex(currentMoveIndex - 1)}
                className="p-3 hover:bg-white/5 disabled:opacity-20 rounded-xl transition-all active:scale-90 bg-white/5"
                title="Previous Move (Left Arrow)"
              >
                <ChevronLeft size={24} />
              </button>
            </div>
            
            <div className="px-6 text-center min-w-[120px]">
               <p className="text-[9px] text-gray-500 uppercase font-black tracking-[0.2em] mb-0.5">Position</p>
               <p className="text-xl font-mono font-black text-white">
                 {currentMoveIndex === -1 ? 'Start' : currentMove?.move_san}
               </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                disabled={currentMoveIndex >= analysisResult.moves.length - 1}
                onClick={() => setCurrentMoveIndex(currentMoveIndex + 1)}
                className="p-3 hover:bg-cyan-500/20 disabled:opacity-20 rounded-xl transition-all active:scale-90 bg-cyan-500/10 text-cyan-400"
                title="Next Move (Right Arrow)"
              >
                <ChevronRight size={24} />
              </button>
              <button 
                disabled={currentMoveIndex >= analysisResult.moves.length - 1}
                onClick={() => setCurrentMoveIndex(analysisResult.moves.length - 1)}
                className="p-3 hover:bg-white/5 disabled:opacity-20 rounded-xl transition-all active:scale-90"
                title="Go to End"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="w-[1px] h-8 bg-white/10 mx-2 hidden sm:block"></div>
            
            <button 
              onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
              className="px-4 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all border border-gray-600 shadow-md text-[10px] uppercase tracking-widest hidden sm:flex items-center gap-2 active:scale-95"
              title="Flip Board (Shortcut: F)"
            >
              Flip Board
            </button>
          </div>
        </section>

        {/* Right Column: Engine & Move Archive */}
        <section className="w-full flex flex-col lg:h-[calc(100vh-120px)] overflow-hidden gap-4 bg-gray-900/20 rounded-2xl border border-white/5 p-2">
          {/* Tabs */}
          <div className="flex bg-black/40 rounded-xl p-1 mb-2 shadow-inner shrink-0">
             <button onClick={() => setActiveTab('analysis')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'analysis' ? 'bg-cyan-500 text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>Analysis & Engine</button>
             <button onClick={() => setActiveTab('coach')} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'coach' ? 'bg-emerald-500 text-black shadow-md' : 'text-gray-500 hover:text-white'}`}>Supercoach Q&A</button>
          </div>
          
          {activeTab === 'analysis' ? (
            <div className="flex-1 overflow-hidden">
              <MoveList />
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
               <CoachChat />
            </div>
          )}
        </section>
      </main>

      {/* Brilliant Move Toast */}
      {brilliantIndex !== null && brilliantIndex !== currentMoveIndex && (
        <div className="fixed bottom-6 right-6 bg-cyan-900/90 border border-cyan-400/50 p-4 pr-6 rounded-2xl shadow-[0_0_30px_rgba(34,211,238,0.3)] z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 backdrop-blur-md">
          <BrilliantGem />
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">Brilliant Move Found!</h3>
            <p className="text-cyan-200 text-xs mt-0.5">You played a masterpiece on move {Math.floor(brilliantIndex / 2) + 1}.</p>
          </div>
          <button onClick={handleGoToBrilliant} className="ml-2 px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-xs rounded-xl transition-colors shadow-lg">
            Show Me
          </button>
          <button onClick={() => setBrilliantIndex(null)} className="absolute top-2 right-2 text-cyan-200/50 hover:text-cyan-200">
            <X size={14} />
          </button>
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

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
import { ChevronLeft, ChevronRight, Home, LayoutDashboard, X, Menu, ExternalLink, Link2, Volume2, VolumeX } from 'lucide-react';
import { getCurrentOpening } from '../../lib/openings';

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) return <div className="p-10 text-red-500 font-mono"><h1>Runtime Error</h1><pre>{this.state.error?.stack}</pre></div>;
    return this.props.children;
  }
}

export default function AnalyzePage() {
  const { 
    analysisResult, 
    currentMoveIndex, 
    previewMoveIndex,
    setCurrentMoveIndex, 
    reset 
  } = useGameStore();
  const [boardOrientation, setBoardOrientation] = React.useState<'white' | 'black'>('white');
  const [activeTab, setActiveTab] = React.useState<'analysis' | 'coach'>('analysis');
  const [brilliantIndex, setBrilliantIndex] = React.useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const [isOpeningOpen, setIsOpeningOpen] = React.useState(false);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const [showBrilliantFlash, setShowBrilliantFlash] = React.useState(false);
  const [toastMessage, setToastMessage] = React.useState('');
  const prevMoveRef = React.useRef(-1);
  const router = useRouter();

  useEffect(() => {
    const pref = localStorage.getItem('mastermind_sound');
    if (pref) setSoundEnabled(pref === '1');
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('mastermind_sound', next ? '1' : '0');
  };

  useEffect(() => {
    if (Math.abs(currentMoveIndex - prevMoveRef.current) === 1) { // single step
      if (currentMoveIndex >= 0) {
        const move = analysisResult?.moves[currentMoveIndex];
        if (move?.classification === 'brilliant') {
          setShowBrilliantFlash(true);
          setTimeout(() => setShowBrilliantFlash(false), 1500);
        }
      }
    }
    
    if (soundEnabled && currentMoveIndex >= 0 && currentMoveIndex !== prevMoveRef.current) {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const ctx = new AudioContext();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
          gain.gain.setValueAtTime(1, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.05);
        }
      } catch (e) {}
    }
    
    prevMoveRef.current = currentMoveIndex;
  }, [currentMoveIndex, analysisResult, soundEnabled]);

  const handleShare = () => {
    if (analysisResult) {
      const fen = currentMoveIndex === -1 ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : analysisResult.moves[currentMoveIndex].fen_after;
      const url = new URL(window.location.href);
      url.searchParams.set('fen', fen || '');
      url.searchParams.set('move', (currentMoveIndex + 1).toString());
      navigator.clipboard.writeText(url.toString());
      setToastMessage('Position link copied!');
      setTimeout(() => setToastMessage(''), 2000);
    }
  };

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
      if (e.key === ' ') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('followBestLine'));
      }
      if (e.key === 'Escape') {
        window.dispatchEvent(new CustomEvent('exitVariation'));
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

  const activeMoveIndex = previewMoveIndex !== null ? previewMoveIndex : currentMoveIndex;
  const currentMove = activeMoveIndex >= 0 && analysisResult ? analysisResult.moves[activeMoveIndex] : null;
  const currentOpening = getCurrentOpening(analysisResult.moves, currentMoveIndex);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 85) return 'text-[#4ade80]';
    if (acc >= 70) return 'text-[#fbbf24]';
    return 'text-[#f87171]';
  };

  const finalEval = analysisResult.moves.length > 0 ? analysisResult.moves[analysisResult.moves.length - 1].eval_after_cp : 0;
  let matchResult = 'Draw';
  let resultColors = 'bg-zinc-500/15 text-zinc-400 border border-zinc-500/30';
  if (finalEval > 300) {
    matchResult = 'White Won';
    resultColors = 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  } else if (finalEval < -300) {
    matchResult = 'Black Won';
    resultColors = 'bg-red-500/15 text-red-400 border border-red-500/30';
  }

  // Material Calc
  const currentFen = activeMoveIndex === -1 ? 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' : (currentMove?.fen_after || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  const boardFen = currentFen.split(' ')[0];
  const fenCounts = { P:0, N:0, B:0, R:0, Q:0, p:0, n:0, b:0, r:0, q:0 };
  for (const char of boardFen) {
    if (fenCounts[char as keyof typeof fenCounts] !== undefined) fenCounts[char as keyof typeof fenCounts]++;
  }
  const capturedWhitePieces = {
    P: 8 - fenCounts.P, N: 2 - fenCounts.N, B: 2 - fenCounts.B, R: 2 - fenCounts.R, Q: 1 - fenCounts.Q
  };
  const capturedBlackPieces = {
    p: 8 - fenCounts.p, n: 2 - fenCounts.n, b: 2 - fenCounts.b, r: 2 - fenCounts.r, q: 1 - fenCounts.q
  };
  
  const whiteMatScore = fenCounts.P*1 + fenCounts.N*3 + fenCounts.B*3 + fenCounts.R*5 + fenCounts.Q*9;
  const blackMatScore = fenCounts.p*1 + fenCounts.n*3 + fenCounts.b*3 + fenCounts.r*5 + fenCounts.q*9;
  const matDiff = whiteMatScore - blackMatScore;

  const renderCaptured = (captured: Record<string, number>, isWhiteCapture: boolean) => {
    const pieces: React.ReactNode[] = [];
    const order = ['q', 'r', 'b', 'n', 'p'];
    const blackSymbols = { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' };
    const whiteSymbols = { q: '♕', r: '♖', b: '♗', n: '♘', p: '♙' };
    const symbols = isWhiteCapture ? blackSymbols : whiteSymbols;
    
    order.forEach(p => {
      const key = isWhiteCapture ? p : p.toUpperCase();
      const count = captured[key as keyof typeof captured] || 0;
      for (let i = 0; i < count; i++) {
        pieces.push(<span key={`${key}-${i}`} className="text-[14px] leading-none">{symbols[p as keyof typeof symbols]}</span>);
      }
    });
    return pieces.length > 0 ? <div className="flex gap-[2px]">{pieces}</div> : <span className="text-zinc-600 text-xs font-sans">No captures yet</span>;
  };

  return (
    <ErrorBoundary>
    <div className="h-screen bg-[#050505] text-gray-100 flex flex-col font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Premium Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex justify-between items-center bg-gray-900/40 backdrop-blur-2xl sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => { reset(); router.push('/'); }} 
            className="p-1.5 hover:bg-zinc-800 rounded-md transition-colors group active:scale-95 border border-transparent hover:border-white/10"
          >
            <Home size={20} className="text-gray-400 group-hover:text-emerald-400" />
          </button>
          <div className="h-8 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
            <div>
              <h1 className="text-xs font-black text-white uppercase tracking-[0.3em]">Analysis Laboratory</h1>
              <div className="flex items-center gap-2 mt-1 group relative cursor-help">
                <div className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </div>
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
              <div className="w-6 h-6 bg-[#f0f0f0] rounded-full flex items-center justify-center font-bold text-[#111111] text-[10px] shadow-sm">W</div>
              <div className="flex flex-col">
                <span className={`text-xs font-black leading-none ${getAccuracyColor(analysisResult.white_accuracy)}`}>{analysisResult.white_accuracy.toFixed(1)}%</span>
                <span className="text-[11px] text-zinc-400 uppercase font-black tracking-widest mt-0.5">White</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-white/10 mx-1" />
            <div className="flex items-center gap-3 pr-2 pl-4 py-1.5 rounded-full hover:bg-white/5 transition-colors cursor-help" title="Black Accuracy">
              <div className="flex flex-col text-right">
                <span className={`text-xs font-black leading-none ${getAccuracyColor(analysisResult.black_accuracy)}`}>{analysisResult.black_accuracy.toFixed(1)}%</span>
                <span className="text-[11px] text-zinc-400 uppercase font-black tracking-widest mt-0.5">Black</span>
              </div>
              <div className="w-6 h-6 bg-[#1e1e1e] ring-1 ring-[#555] rounded-full flex items-center justify-center font-bold text-white text-[10px] shadow-sm">B</div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-1 xl:grid-cols-[280px_minmax(500px,1fr)_400px] p-0 lg:p-6 gap-0 lg:gap-6 overflow-hidden max-w-[1800px] mx-auto w-full items-start relative h-full">
        {/* Left Column: Sidebar (Drawer on < xl screens) */}
        
        {/* Backdrop */}
        {isSidebarOpen && (
           <div 
             className="xl:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity" 
             onClick={() => setIsSidebarOpen(false)}
           />
        )}
        
        <section className={`fixed xl:static z-50 w-full md:w-[400px] xl:w-auto transition-transform duration-300 flex flex-col gap-4 h-full xl:max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar bg-[#050505] xl:bg-transparent p-6 xl:p-0 rounded-t-3xl md:rounded-r-3xl md:rounded-tl-none xl:rounded-none shadow-2xl xl:shadow-none border border-white/10 xl:border-none ${isSidebarOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:-translate-y-0 md:-translate-x-[120%] xl:translate-x-0'} bottom-0 left-0 md:top-0`}>
           <div className="flex xl:hidden items-center justify-between mb-2">
             <h2 className="text-sm font-black text-white uppercase tracking-widest">Match Info</h2>
             <button onClick={() => setIsSidebarOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-white"><X size={18} /></button>
           </div>
           <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl shrink-0">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <LayoutDashboard size={14} /> Match Info
              </h2>
              <div className="space-y-3">
              <div className="flex items-center gap-4 bg-gray-800/50 p-3 rounded-xl border border-white/5 transition-all hover:bg-gray-800">
                <div className="w-10 h-10 bg-[#f0f0f0] rounded-xl flex items-center justify-center text-[#111111] font-black text-sm shadow-md">W</div>
                <div>
                  <div className="font-bold text-gray-200 text-sm">{analysisResult.white_player}</div>
                  <div className="text-xs text-gray-500 font-bold bg-black/30 inline-block px-2 py-0.5 rounded mt-1 border border-white/5">{analysisResult.white_elo} ELO</div>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-800/50 p-3 rounded-xl border border-white/5 transition-all hover:bg-gray-800">
                <div className="w-10 h-10 bg-[#1e1e1e] border border-white rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md">B</div>
                <div>
                  <div className="font-bold text-gray-200 text-sm">{analysisResult.black_player}</div>
                  <div className="text-xs text-gray-500 font-bold bg-black/30 inline-block px-2 py-0.5 rounded mt-1 border border-white/5">{analysisResult.black_elo} ELO</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between bg-gray-800/30 p-2.5 rounded-xl border border-white/5 mt-2">
                <div className="flex items-center gap-3">
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${resultColors}`}>
                    {matchResult}
                  </div>
                  <span className="text-xs text-zinc-400 font-medium">Rapid · Jun 12 2026</span>
                </div>
                <a href="#" target="_blank" rel="noopener noreferrer" className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-zinc-500 hover:text-zinc-300">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
           </div>
           
           {/* Captured Material Strip */}
           <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl shrink-0">
             <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Material</h2>
             <div className="space-y-2 text-sm">
               <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-[#f0f0f0] rounded-sm flex items-center justify-center text-[#111111] font-black text-[8px]">W</div>
                   <div className="text-zinc-300 font-serif">{renderCaptured(capturedBlackPieces, true)}</div>
                 </div>
                 {matDiff > 0 && <span className="text-amber-500 font-black text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">+{matDiff}</span>}
               </div>
               <div className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5">
                 <div className="flex items-center gap-2">
                   <div className="w-4 h-4 bg-[#1e1e1e] ring-1 ring-[#555] rounded-sm flex items-center justify-center text-white font-black text-[8px]">B</div>
                   <div className="text-zinc-400 font-serif">{renderCaptured(capturedWhitePieces, false)}</div>
                 </div>
                 {matDiff < 0 && <span className="text-amber-500 font-black text-xs bg-amber-500/10 px-1.5 py-0.5 rounded">+{Math.abs(matDiff)}</span>}
               </div>
             </div>
           </div>

           <div className="bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-2xl shrink-0">
              <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Opening Setup</h2>
              <div className="relative">
                <button 
                  onClick={() => setIsOpeningOpen(!isOpeningOpen)}
                  onBlur={() => setTimeout(() => setIsOpeningOpen(false), 200)}
                  className="w-full text-left text-sm font-bold text-zinc-300 leading-relaxed bg-zinc-800 p-3 rounded-xl border-l-2 border-l-amber-500 border-y border-r border-white/5 hover:bg-zinc-700 transition-colors flex items-center justify-between group"
                >
                  <span className="flex items-center gap-2 truncate">
                    {currentOpening.eco !== '?' && (
                      <span className="text-amber-400 font-mono text-xs bg-black/20 px-1.5 py-0.5 rounded">{currentOpening.eco}</span>
                    )}
                    <span className="text-zinc-500 mx-1">·</span>
                    <span className="truncate">{currentOpening.name.split(':')[0]}</span>
                  </span>
                </button>

                {isOpeningOpen && (
                  <div className="absolute top-full left-0 mt-2 w-full bg-zinc-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4">
                    <div className="text-xs text-amber-500 font-mono mb-1">{currentOpening.eco !== '?' ? currentOpening.eco : 'ECO'}</div>
                    <div className="font-black text-white text-base mb-2">{currentOpening.name}</div>
                    <div className="text-zinc-400 font-mono text-xs bg-black/50 p-2 rounded mb-2">
                      1. d4 d5 2. Nf3 Nf6
                    </div>
                    <div className="text-xs text-zinc-500">
                      A solid, flexible opening for White
                    </div>
                  </div>
                )}
              </div>
           </div>

           <div className="flex-1 overflow-hidden flex flex-col">
              <LiveEngine />
           </div>
        </section>

        {/* Center Column: Board & Controls */}
        <div className="flex flex-col lg:flex-row xl:contents h-full overflow-y-auto xl:overflow-hidden w-full custom-scrollbar">
          <section className="flex flex-col w-full h-auto lg:h-[calc(100vh-56px)] justify-center mx-auto xl:max-w-none xl:mx-0 relative max-w-[800px] xl:px-4 p-4 lg:p-0 shrink-0">
          
          {/* Hamburger (only below xl) */}
          <button 
            className="xl:hidden absolute top-4 left-0 z-50 p-2.5 bg-gray-900/80 backdrop-blur-md rounded-xl hover:bg-gray-800 transition-colors border border-white/10 shadow-lg"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title="Toggle Match Info"
          >
            <Menu size={20} className="text-gray-300" />
          </button>

          <div className="w-full flex flex-col items-center justify-center relative flex-1 min-h-0" style={{ height: 'calc(100vh - 56px)' }}>
            {/* Board + Eval Row */}
            <div className={`w-full aspect-square flex relative shrink transition-all shadow-2xl rounded-t-xl overflow-hidden border-[6px] border-b-0 border-gray-800 bg-gray-800 min-h-0 ${showBrilliantFlash ? 'shadow-[0_0_0_3px_rgba(6,182,212,0.5)] animate-pulse' : ''}`} style={{ maxWidth: 'calc(100vh - 160px)' }}>
               <div className="w-6 sm:w-8 shrink-0 border-r border-gray-800/50">
                 <EvalBar evalScore={currentMove?.eval_after_cp || 0} isBlunder={currentMove?.classification === 'blunder'} />
               </div>
               <div className="flex-1 relative h-full">
                 <ChessBoard boardOrientation={boardOrientation} />
                 
                 {showBrilliantFlash && (
                    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
                       <div className="bg-black/70 backdrop-blur-sm rounded-xl px-6 py-3 border border-cyan-500/30 shadow-2xl animate-in fade-in duration-150 zoom-in-95">
                         <span className="font-bold text-lg text-[#06b6d4]">✦ Brilliant Move</span>
                       </div>
                    </div>
                 )}
               </div>
            </div>

            {/* Scrubber & Controls Row */}
            <div className="w-full flex flex-col shrink-0" style={{ maxWidth: 'calc(100vh - 160px)' }}>
              
              {/* Progress Scrubber */}
              <div 
                className="w-full h-[3px] bg-zinc-700 cursor-pointer relative"
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  const handleScrub = (clientX: number, target: Element) => {
                    const rect = target.getBoundingClientRect();
                    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
                    const percent = x / rect.width;
                    const totalMoves = analysisResult.moves.length;
                    const targetIndex = Math.min(totalMoves - 1, Math.max(-1, Math.floor(percent * (totalMoves + 1)) - 1));
                    setCurrentMoveIndex(targetIndex);
                  };
                  handleScrub(e.clientX, e.currentTarget);
                  e.currentTarget.onpointermove = (ev: PointerEvent) => handleScrub(ev.clientX, ev.currentTarget as Element);
                }}
                onPointerUp={(e) => {
                  e.currentTarget.releasePointerCapture(e.pointerId);
                  e.currentTarget.onpointermove = null;
                }}
              >
                <div 
                  className="h-full bg-[#fbbf24] transition-all duration-100 ease-out" 
                  style={{ width: `${((currentMoveIndex + 1) / (analysisResult.moves.length || 1)) * 100}%` }}
                />
              </div>

              {/* Bottom Controls Strip */}
              <div className="flex items-center relative bg-gray-900/60 backdrop-blur-xl p-3 border-x border-b border-white/10 shadow-2xl w-full min-h-[64px] rounded-b-xl border-[6px] border-t-0 border-gray-800">
                {/* Center Controls */}
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center gap-1 sm:gap-2 w-max">
                  <button 
                    disabled={currentMoveIndex <= -1}
                    onClick={() => setCurrentMoveIndex(-1)}
                    className="p-2 sm:p-2.5 hover:bg-zinc-800 disabled:opacity-20 rounded-md transition-colors duration-150 active:scale-95"
                    title="Start (Home key)"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button 
                    disabled={currentMoveIndex <= -1}
                    onClick={() => setCurrentMoveIndex(currentMoveIndex - 1)}
                    className="p-2 sm:p-2.5 hover:bg-zinc-800 disabled:opacity-20 rounded-md transition-colors duration-150 active:scale-95"
                    title="Previous (← key)"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  
                  <div className="px-2 sm:px-6 text-center min-w-[80px] sm:min-w-[140px]">
                     <p className="text-lg sm:text-xl font-mono font-black text-white">
                       {currentMoveIndex === -1 ? 'Start' : `Move ${Math.floor(currentMoveIndex / 2) + 1} · ${currentMove?.move_san}`}
                     </p>
                  </div>
                  
                  <button 
                    disabled={currentMoveIndex >= analysisResult.moves.length - 1}
                    onClick={() => setCurrentMoveIndex(currentMoveIndex + 1)}
                    className="p-2 sm:p-2.5 hover:bg-zinc-800 disabled:opacity-20 rounded-md transition-colors duration-150 active:scale-95"
                    title="Next (→ key)"
                  >
                    <ChevronRight size={24} />
                  </button>
                  <button 
                    disabled={currentMoveIndex >= analysisResult.moves.length - 1}
                    onClick={() => setCurrentMoveIndex(analysisResult.moves.length - 1)}
                    className="p-2 sm:p-2.5 hover:bg-zinc-800 disabled:opacity-20 rounded-md transition-colors duration-150 active:scale-95"
                    title="End (End key)"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>

                {/* Right side - Sound, Share, Flip board */}
                <div className="ml-auto flex items-center gap-1 sm:gap-2">
                  <button 
                    onClick={toggleSound}
                    className="p-2 sm:p-2.5 hover:bg-zinc-800 rounded-md transition-colors duration-150 active:scale-95 text-gray-400 hover:text-white"
                    title={soundEnabled ? "Disable sound" : "Enable sound"}
                  >
                    {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                  <button 
                    onClick={handleShare}
                    className="p-2 sm:p-2.5 hover:bg-zinc-800 rounded-md transition-colors duration-150 active:scale-95 text-gray-400 hover:text-white"
                    title="Share position"
                  >
                    <Link2 size={20} />
                  </button>

                  <div className="w-[1px] h-8 bg-white/10 mx-1 hidden sm:block"></div>
                  
                  <button 
                    onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                    className="px-4 py-2.5 bg-gray-800 text-gray-300 font-bold rounded-xl hover:bg-gray-700 transition-all border border-gray-600 shadow-md text-[10px] uppercase tracking-widest hidden sm:flex items-center gap-2 active:scale-95"
                    title="Flip Board (Shortcut: F)"
                  >
                    Flip board
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column: Engine & Move Archive */}
        <section className="w-full flex flex-col h-[500px] lg:h-full lg:max-h-[calc(100vh-120px)] overflow-hidden gap-4 bg-gray-900/20 lg:rounded-2xl border-t lg:border border-white/5 p-2 shrink-0">
          {/* Tabs */}
          <div className="flex items-center text-[10px] sm:text-xs font-bold text-gray-500 border-b border-white/10 shrink-0 px-2 uppercase tracking-widest">
             <button className="flex-1 py-3 hover:text-zinc-100 transition-colors duration-150">Report</button>
             <button 
               onClick={() => setActiveTab('analysis')} 
               className={`flex-1 py-3 transition-colors duration-150 ${activeTab === 'analysis' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-zinc-100'}`}>
               Analysis
             </button>
             <button 
               onClick={() => setActiveTab('coach')} 
               className={`flex-1 py-3 transition-colors duration-150 ${activeTab === 'coach' ? 'text-amber-400 border-b-2 border-amber-400' : 'hover:text-zinc-100'}`}>
               Coach
             </button>
             <button className="flex-1 py-3 hover:text-zinc-100 transition-colors duration-150">Settings</button>
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
        </div>
      </main>

      {/* Brilliant Move Toast */}
      {brilliantIndex !== null && brilliantIndex !== currentMoveIndex && (
        <div className="fixed bottom-6 right-6 bg-emerald-900/90 border border-emerald-400/50 p-4 pr-6 rounded-2xl shadow-[0_0_30px_rgba(52,211,153,0.3)] z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 backdrop-blur-md">
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

      {/* Share Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-500 text-white px-6 py-3 rounded-xl shadow-2xl z-50 font-bold animate-in slide-in-from-bottom-5 fade-in flex items-center gap-2">
          <Link2 size={18} />
          {toastMessage}
        </div>
      )}
    </div>
    </ErrorBoundary>
  );
}

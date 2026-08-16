'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
import { ChessBoard } from '../../components/ChessBoard';
import { EvalBar } from '../../components/EvalBar';
import { BrilliantGem } from '../../components/BrilliantGem';
import { MoveList } from '../../components/MoveList';
import { LiveEngine } from '../../components/LiveEngine';
import { CoachChat } from '../../components/CoachChat';
import { ReportTab } from '../../components/analysis/ReportTab';
import { AnalysisTab } from '../../components/analysis/AnalysisTab';
import { InsightsTab } from '../../components/analysis/InsightsTab';
import { ExportModal } from '../../components/analysis/ExportModal';
import { BlunderTrainerModal } from '../../components/analysis/BlunderTrainerModal';
import { getCurrentOpening } from '../../lib/openings';
import { 
  ChevronLeft, 
  ChevronRight, 
  RotateCw, 
  FileText, 
  BarChart2, 
  Lightbulb, 
  List, 
  Cpu, 
  Bot, 
  ShieldAlert, 
  Share2, 
  Target 
} from 'lucide-react';

export default function AnalyzePage() {
  const { 
    analysisResult, 
    currentMoveIndex, 
    previewMoveIndex,
    setCurrentMoveIndex 
  } = useGameStore();

  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  const [activeTab, setActiveTab] = useState<'analysis' | 'moves' | 'engine' | 'report' | 'coach'>('analysis');
  const [showThreats, setShowThreats] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTrainerOpen, setIsTrainerOpen] = useState(false);
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
      if (e.key === 't' || e.key === 'T') {
        setShowThreats(prev => !prev);
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
  const currentFen = currentMove?.fen_after ? currentMove.fen_after : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  // Dynamic Opening identification
  const currentOpening = getCurrentOpening(analysisResult.moves || [], currentMoveIndex);
  const openingDisplay = currentOpening.name !== 'Starting Position'
    ? `${currentOpening.eco !== '?' ? currentOpening.eco + ' · ' : ''}${currentOpening.name}`
    : (analysisResult.opening || 'Standard Chess Game');

  const blunderCount = (analysisResult.moves || []).filter(m => m.classification === 'blunder' || m.classification === 'mistake').length;

  const handleGoToBrilliant = () => {
    if (brilliantIndex !== null) {
      setCurrentMoveIndex(brilliantIndex);
      setBrilliantIndex(null);
    }
  };

  return (
    <div className="flex-1 bg-[#09090b] text-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Export & Blunder Trainer Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        analysisResult={analysisResult}
        currentFen={currentFen}
      />
      <BlunderTrainerModal
        isOpen={isTrainerOpen}
        onClose={() => setIsTrainerOpen(false)}
        analysisResult={analysisResult}
      />

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        
        {/* CENTER COLUMN: Chessboard & Controls */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 bg-[#0d0d0f] overflow-y-auto">
          <div className="w-full max-w-[620px] flex flex-col items-center">
            
            {/* Top Player (Black) */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.black_player}`} alt="Black player" className="w-7 h-7 rounded-lg bg-zinc-800" />
                <div>
                  <div className="font-bold text-xs text-zinc-200">{analysisResult.black_player}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{analysisResult.black_elo || '1500'} Elo</div>
                </div>
              </div>

              {/* Action Buttons: Threats, Export, Flip */}
              <div className="flex items-center gap-2">
                {blunderCount > 0 && (
                  <button
                    onClick={() => setIsTrainerOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30 transition-all shadow-sm"
                    title="Practice Blunders"
                  >
                    <Target size={14} />
                    <span className="hidden sm:inline">Practice ({blunderCount})</span>
                  </button>
                )}

                <button
                  onClick={() => setShowThreats(t => !t)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    showThreats 
                      ? 'bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]' 
                      : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border-white/10'
                  }`}
                  title="Toggle Threat Visualizer [T]"
                >
                  <ShieldAlert size={14} />
                  <span className="hidden sm:inline">Threats</span>
                </button>

                <button
                  onClick={() => setIsExportOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors"
                  title="Export / Share Game"
                >
                  <Share2 size={14} />
                  <span className="hidden sm:inline">Export</span>
                </button>

                <button
                  onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors"
                  title="Flip Board [F]"
                >
                  <RotateCw size={14} />
                  <span className="hidden sm:inline">Flip</span>
                </button>
              </div>
            </div>

            {/* Board Container */}
            <div className="w-full aspect-square flex relative shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
               <div className="w-7 shrink-0 border-r border-white/10 z-10 bg-zinc-950">
                 <EvalBar evalScore={currentMove?.eval_after_cp || 0} isBlunder={currentMove?.classification === 'blunder'} />
               </div>
               <div className="flex-1 relative h-full">
                 <ChessBoard boardOrientation={boardOrientation} showThreats={showThreats} />
               </div>
            </div>

            {/* Bottom Player (White) */}
            <div className="w-full flex items-center justify-between mt-3 mb-4 px-1">
              <div className="flex items-center gap-3 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                <div className="text-[10px] bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded uppercase tracking-wider">You</div>
                <div>
                  <div className="font-bold text-xs text-emerald-400">{analysisResult.white_player}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">★ {analysisResult.white_elo || '1500'} Elo</div>
                </div>
              </div>

              <div className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <span>Opening:</span>
                <span className="text-white font-bold max-w-[200px] truncate">{openingDisplay}</span>
              </div>
            </div>

            {/* Move Scrubber Bar */}
            <div className="w-full flex items-center bg-zinc-900 rounded-xl border border-white/10 overflow-hidden h-11 shadow-lg">
              <button 
                onClick={() => setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1))}
                className="w-11 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors border-r border-white/5"
                title="Previous Move [←]"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex-1 flex items-center overflow-x-auto custom-scrollbar px-3 gap-2 h-full whitespace-nowrap">
                {analysisResult.moves.map((move, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setCurrentMoveIndex(idx)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                      idx === currentMoveIndex 
                        ? 'bg-emerald-500 text-black shadow-md' 
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                     {idx % 2 === 0 ? `${Math.floor(idx/2)+1}. ` : ''}{move.move_san}
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setCurrentMoveIndex(Math.min(analysisResult.moves.length - 1, currentMoveIndex + 1))}
                className="w-11 h-full flex items-center justify-center bg-emerald-500 hover:bg-emerald-400 text-black transition-colors border-l border-white/5 font-bold"
                title="Next Move [→]"
              >
                <ChevronRight size={18} />
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: 5-TAB WORKSPACE CONTROL CENTER */}
        <div className="w-full lg:w-[460px] h-full bg-[#121214] border-l border-white/10 flex flex-col shadow-2xl shrink-0 z-10 overflow-hidden min-h-0">
          {/* Tab Navigation Header */}
          <div className="flex items-center text-xs font-bold text-zinc-400 border-b border-white/10 bg-zinc-950/60 p-1 gap-1 shrink-0">
             <button 
               onClick={() => setActiveTab('analysis')}
               className={`flex-1 py-2.5 flex justify-center items-center gap-1.5 rounded-lg transition-all ${
                 activeTab === 'analysis' ? 'text-emerald-400 bg-white/10 shadow-sm' : 'hover:text-zinc-200 hover:bg-white/5'
               }`}
               title="Key Moments & Advantage Graph"
             >
               <BarChart2 size={15} />
               <span className="hidden sm:inline">Analysis</span>
             </button>

             <button 
               onClick={() => setActiveTab('moves')}
               className={`flex-1 py-2.5 flex justify-center items-center gap-1.5 rounded-lg transition-all ${
                 activeTab === 'moves' ? 'text-emerald-400 bg-white/10 shadow-sm' : 'hover:text-zinc-200 hover:bg-white/5'
               }`}
               title="Interactive Move List & Variations"
             >
               <List size={15} />
               <span className="hidden sm:inline">Moves</span>
             </button>

             <button 
               onClick={() => setActiveTab('engine')}
               className={`flex-1 py-2.5 flex justify-center items-center gap-1.5 rounded-lg transition-all ${
                 activeTab === 'engine' ? 'text-emerald-400 bg-white/10 shadow-sm' : 'hover:text-zinc-200 hover:bg-white/5'
               }`}
               title="Stockfish 17 Multi-PV Engine"
             >
               <Cpu size={15} />
               <span className="hidden sm:inline">Engine</span>
             </button>

             <button 
               onClick={() => setActiveTab('report')}
               className={`flex-1 py-2.5 flex justify-center items-center gap-1.5 rounded-lg transition-all ${
                 activeTab === 'report' ? 'text-emerald-400 bg-white/10 shadow-sm' : 'hover:text-zinc-200 hover:bg-white/5'
               }`}
               title="Game Report & Phase Accuracy"
             >
               <FileText size={15} />
               <span className="hidden sm:inline">Report</span>
             </button>

             <button 
               onClick={() => setActiveTab('coach')}
               className={`flex-1 py-2.5 flex justify-center items-center gap-1.5 rounded-lg transition-all ${
                 activeTab === 'coach' ? 'text-emerald-400 bg-white/10 shadow-sm' : 'hover:text-zinc-200 hover:bg-white/5'
               }`}
               title="Supercoach AI Chat"
             >
               <Bot size={15} />
               <span className="hidden sm:inline">Coach</span>
             </button>
          </div>
          
          {/* Tab Body */}
          <div className="flex-1 overflow-hidden relative bg-[#121214] flex flex-col min-h-0">
            {activeTab === 'analysis' && <div className="h-full overflow-y-auto custom-scrollbar min-h-0"><AnalysisTab /></div>}
            {activeTab === 'moves' && <MoveList />}
            {activeTab === 'engine' && <LiveEngine />}
            {activeTab === 'report' && <div className="h-full overflow-y-auto custom-scrollbar min-h-0"><ReportTab /></div>}
            {activeTab === 'coach' && <CoachChat />}
          </div>
        </div>
      </div>
      
      {/* Brilliant Move Toast Notification */}
      {brilliantIndex !== null && brilliantIndex !== currentMoveIndex && (
        <div className="fixed bottom-6 right-[480px] bg-emerald-950/90 border border-emerald-500/50 p-4 pr-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 backdrop-blur-md">
          <BrilliantGem />
          <div>
            <h3 className="text-white font-bold text-xs tracking-wide">Brilliant Move Found!</h3>
            <p className="text-[10px] text-emerald-300">Move {Math.floor(brilliantIndex/2)+1}</p>
          </div>
          <button 
            onClick={handleGoToBrilliant} 
            className="ml-2 px-3 py-1.5 bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold text-xs rounded-xl transition-colors shadow-md"
          >
            Jump to Move
          </button>
        </div>
      )}
    </div>
  );
}


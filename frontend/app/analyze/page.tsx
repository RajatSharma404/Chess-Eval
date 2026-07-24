'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '../../store/useGameStore';
import { ChessBoard } from '../../components/ChessBoard';
import { EvalBar } from '../../components/EvalBar';
import { BrilliantGem } from '../../components/BrilliantGem';
import { ChevronLeft, ChevronRight, RotateCw, FileText, BarChart2, Lightbulb, Settings } from 'lucide-react';
import { ReportTab } from '../../components/analysis/ReportTab';
import { AnalysisTab } from '../../components/analysis/AnalysisTab';
import { InsightsTab } from '../../components/analysis/InsightsTab';

export default function AnalyzePage() {
  const { 
    analysisResult, 
    currentMoveIndex, 
    previewMoveIndex,
    setCurrentMoveIndex 
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

  return (
    <div className="flex-1 bg-[#0b0b0d] text-gray-100 flex flex-col font-sans overflow-hidden">
      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        
        {/* CENTER COLUMN: Chessboard */}
        <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 bg-[#0d0d0f]">
          <div className="w-full max-w-[650px] flex flex-col items-center">
            
            {/* Top Player (Black) */}
            <div className="w-full flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-3 bg-zinc-900/80 px-3 py-1.5 rounded-xl border border-white/10 shadow-sm">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${analysisResult.black_player}`} alt="Black player" className="w-7 h-7 rounded-lg bg-zinc-800" />
                <div>
                  <div className="font-bold text-xs text-zinc-200">{analysisResult.black_player}</div>
                  <div className="text-[10px] text-zinc-500 font-mono">{analysisResult.black_elo || '1500'} Elo</div>
                </div>
              </div>

              {/* Flip Board button */}
              <button
                onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-white/10 transition-colors"
                title="Flip Board [F]"
              >
                <RotateCw size={14} />
                <span>Flip</span>
              </button>
            </div>

            {/* Board Container */}
            <div className="w-full aspect-square flex relative shadow-2xl rounded-2xl overflow-hidden border border-white/10 bg-zinc-950">
               <div className="w-7 shrink-0 border-r border-white/10 z-10 bg-zinc-950">
                 <EvalBar evalScore={currentMove?.eval_after_cp || 0} isBlunder={currentMove?.classification === 'blunder'} />
               </div>
               <div className="flex-1 relative h-full">
                 <ChessBoard boardOrientation={boardOrientation} />
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

              <div className="text-xs text-zinc-400 font-mono bg-zinc-900 px-3 py-1.5 rounded-xl border border-white/10">
                Accuracy: {analysisResult.white_accuracy || 85}%
              </div>
            </div>

            {/* Move Scrubber Bar */}
            <div className="w-full flex items-center bg-zinc-900 rounded-xl border border-white/10 overflow-hidden h-11 shadow-lg">
              <button 
                onClick={() => setCurrentMoveIndex(Math.max(-1, currentMoveIndex - 1))}
                className="w-11 h-full flex items-center justify-center bg-white/5 hover:bg-white/10 text-zinc-400 transition-colors border-r border-white/5"
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
              >
                <ChevronRight size={18} />
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: ANALYSIS / REPORT / INSIGHTS TABS */}
        <div className="w-full lg:w-[440px] bg-[#121214] border-l border-white/10 flex flex-col shadow-2xl shrink-0 z-10 overflow-hidden">
          {/* Tab Navigation Header */}
          <div className="flex items-center text-xs font-bold text-zinc-400 border-b border-white/10 bg-zinc-900/50">
             <button 
               onClick={() => setActiveTab('analysis')}
               className={`flex-1 py-3.5 flex justify-center items-center gap-2 transition-colors ${
                 activeTab === 'analysis' ? 'text-emerald-400 bg-white/5 border-b-2 border-emerald-400' : 'hover:text-zinc-200'
               }`}
             >
               <BarChart2 size={16} /> Analysis
             </button>
             <button 
               onClick={() => setActiveTab('report')}
               className={`flex-1 py-3.5 flex justify-center items-center gap-2 transition-colors ${
                 activeTab === 'report' ? 'text-emerald-400 bg-white/5 border-b-2 border-emerald-400' : 'hover:text-zinc-200'
               }`}
             >
               <FileText size={16} /> Report
             </button>
             <button 
               onClick={() => setActiveTab('insights')}
               className={`flex-1 py-3.5 flex justify-center items-center gap-2 transition-colors ${
                 activeTab === 'insights' ? 'text-emerald-400 bg-white/5 border-b-2 border-emerald-400' : 'hover:text-zinc-200'
               }`}
             >
               <Lightbulb size={16} /> Insights
             </button>
          </div>
          
          {/* Tab Body */}
          <div className="flex-1 overflow-y-auto custom-scrollbar relative bg-[#121214]">
            {activeTab === 'analysis' && <AnalysisTab />}
            {activeTab === 'report' && <ReportTab />}
            {activeTab === 'insights' && <InsightsTab />}
          </div>
        </div>
      </div>
      
      {/* Brilliant Move Toast Notification */}
      {brilliantIndex !== null && brilliantIndex !== currentMoveIndex && (
        <div className="fixed bottom-6 right-[460px] bg-emerald-950/90 border border-emerald-500/50 p-4 pr-6 rounded-2xl shadow-[0_0_30px_rgba(16,185,129,0.3)] z-50 flex items-center gap-4 animate-in slide-in-from-bottom-10 backdrop-blur-md">
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

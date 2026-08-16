'use client';

import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { AnalysisResult, Move, useGameStore } from '../../store/useGameStore';
import { soundManager } from '../../lib/sound';
import { 
  X, 
  Target, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  HelpCircle, 
  RotateCcw, 
  Trophy, 
  Sparkles,
  Flame
} from 'lucide-react';

interface BlunderTrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult;
}

export const BlunderTrainerModal: React.FC<BlunderTrainerModalProps> = ({ isOpen, onClose, analysisResult }) => {
  const { soundEnabled } = useGameStore();

  // Find all mistake and blunder positions
  const blunderMoves = (analysisResult.moves || []).filter(
    (m) => m.classification === 'blunder' || m.classification === 'mistake'
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<'unsolved' | 'correct' | 'wrong'>('unsolved');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solvedCount, setSolvedCount] = useState(0);

  if (!isOpen) return null;

  if (blunderMoves.length === 0) {
    return (
      <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-[#121214] border border-white/10 rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
            <Trophy size={32} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white mb-2">Flawless Game!</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              No critical blunders or mistakes were found in this match. Your tactical precision was exceptional!
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 rounded-xl transition-all"
          >
            Close Drill
          </button>
        </div>
      </div>
    );
  }

  const currentMove = blunderMoves[currentIndex % blunderMoves.length];
  const isWhite = currentMove.color === 'white';
  const orientation = isWhite ? 'white' : 'black';

  // Find corresponding AI suggestion if available
  const suggestion = analysisResult.suggestions?.find(
    (s) => s.move_san === currentMove.move_san
  );

  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (status === 'correct') return false;

    const testChess = new Chess(currentMove.fen_before);
    const dropUci = sourceSquare + targetSquare;
    const bestUci = currentMove.best_move_uci.toLowerCase();

    try {
      const move = testChess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (!move) return false;

      const isMatch =
        bestUci.startsWith(dropUci) ||
        (currentMove.best_move_san && move.san === currentMove.best_move_san);

      if (isMatch) {
        setStatus('correct');
        setSolvedCount((c) => c + 1);
        if (soundEnabled) soundManager.playSuccessSound();
        return true;
      } else {
        setStatus('wrong');
        if (soundEnabled) soundManager.playBlunderSound();
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  const handleNext = () => {
    setStatus('unsolved');
    setShowHint(false);
    setShowSolution(false);
    setCurrentIndex((prev) => (prev + 1) % blunderMoves.length);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-white/10 rounded-3xl max-w-4xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 bg-zinc-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Practice Your Mistakes
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Drill {currentIndex + 1} of {blunderMoves.length}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Can you find the engine's best move in the position where you played{' '}
                <span className="text-red-400 font-mono font-bold">{currentMove.move_san}</span>?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Left: Chessboard */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950">
              <Chessboard
                position={currentMove.fen_before}
                boardOrientation={orientation}
                onPieceDrop={handlePieceDrop}
                arePiecesDraggable={status !== 'correct'}
                showBoardNotation={true}
              />
            </div>
          </div>

          {/* Right: Challenge Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded bg-zinc-800 text-zinc-300">
                  Move {currentMove.move_number} · {isWhite ? 'White to Move' : 'Black to Move'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  CP Loss: {(currentMove.cp_loss / 100).toFixed(1)}
                </span>
              </div>

              <div className="p-3.5 bg-red-500/10 border border-red-500/20 rounded-2xl">
                <span className="text-[10px] uppercase font-bold text-red-400 block mb-1">Played in Game:</span>
                <span className="text-sm font-bold text-white">
                  {currentMove.move_san} ({currentMove.classification.toUpperCase()})
                </span>
              </div>

              {/* Status Banner */}
              {status === 'correct' && (
                <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <CheckCircle2 size={18} className="text-emerald-400" />
                    <span>Brilliant! Best Move Found!</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {suggestion?.suggestion_text ||
                      `Playing ${currentMove.best_move_san} preserves maximum initiative and prevents the opponent from capitalizing on your position.`}
                  </p>
                </div>
              )}

              {status === 'wrong' && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2 animate-in shake">
                  <XCircle size={16} className="shrink-0" />
                  <span>Not quite! Try another continuation or use a hint.</span>
                </div>
              )}

              {/* Hint Section */}
              {showHint && (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2 animate-in fade-in">
                  <Lightbulb size={16} className="shrink-0 mt-0.5 text-amber-400" />
                  <span>
                    Look for a piece move originating around square{' '}
                    <strong className="font-mono text-amber-200">{currentMove.best_move_uci.slice(0, 2)}</strong>.
                  </span>
                </div>
              )}

              {/* Solution Section */}
              {showSolution && (
                <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-300 flex items-start gap-2 animate-in fade-in">
                  <Sparkles size={16} className="shrink-0 mt-0.5 text-cyan-400" />
                  <span>
                    Engine recommendation was{' '}
                    <strong className="font-mono text-white text-sm">{currentMove.best_move_san}</strong>.
                  </span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHint(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <Lightbulb size={14} className="text-amber-400" />
                  <span>Hint</span>
                </button>
                <button
                  onClick={() => setShowSolution(true)}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-1.5"
                >
                  <HelpCircle size={14} className="text-cyan-400" />
                  <span>Solution</span>
                </button>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>{currentIndex < blunderMoves.length - 1 ? 'Next Blunder' : 'Loop to First'}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { soundManager } from '../../lib/sound';
import { useGameStore } from '../../store/useGameStore';
import { Zap, Trophy, Lightbulb, CheckCircle2, XCircle, ArrowRight, ShieldCheck, Flame } from 'lucide-react';

interface Puzzle {
  id: string;
  category: 'blunder' | 'checkmate' | 'fork' | 'endgame';
  title: string;
  description: string;
  fen: string;
  turn: 'white' | 'black';
  solutionFrom: string;
  solutionTo: string;
  hint: string;
  explanation: string;
}

const PUZZLES: Puzzle[] = [
  {
    id: 'p1',
    category: 'blunder',
    title: 'Punish the Overextended Queen',
    description: 'Black got greedy and left their Queen unsupported on a weak square. Find the winning knight fork!',
    fen: 'r1bqk2r/pppp1ppp/2n5/4P3/1b2n3/2N2N2/PPP2PPP/R1BQKB1R w KQkq - 1 6',
    turn: 'white',
    solutionFrom: 'c3',
    solutionTo: 'e4',
    hint: 'Look for a capture on e4 that pins or forks black pieces.',
    explanation: 'Nxe4 captures the Knight on e4 and opens powerful lines for White!'
  },
  {
    id: 'p2',
    category: 'checkmate',
    title: 'Smothered Mate Opportunity',
    description: 'White has forced Black into a corner. Can you land the fatal checkmate move?',
    fen: '6k1/5ppp/8/8/8/8/5PPP/1R4K1 w - - 0 1',
    turn: 'white',
    solutionFrom: 'b1',
    solutionTo: 'b8',
    hint: 'Check the back rank of Black\'s king.',
    explanation: 'Rb8# delivers a classic Back-Rank Checkmate because the pawns block Black\'s king!'
  },
  {
    id: 'p3',
    category: 'fork',
    title: 'Royal Knight Fork',
    description: 'White can knight-fork Black\'s King and Rook simultaneously. Find the square!',
    fen: 'r3k2r/pp3ppp/2n5/3p4/8/2N5/PPP2PPP/R3K2R w KQkq - 0 12',
    turn: 'white',
    solutionFrom: 'c3',
    solutionTo: 'd5',
    hint: 'Target the undefended d5 pawn.',
    explanation: 'Nxd5 attacks the pawn and exerts tremendous pressure on Black!'
  },
  {
    id: 'p4',
    category: 'endgame',
    title: 'Lucena Position Advancement',
    description: 'Push your pawn forward to force a promotion or rook trade.',
    fen: '1R6/8/8/3k4/8/8/3P4/3K4 w - - 0 1',
    turn: 'white',
    solutionFrom: 'd2',
    solutionTo: 'd4',
    hint: 'Push your passer pawn as far as possible.',
    explanation: 'd4 advances the passed pawn toward promotion!'
  }
];

export default function TrainPage() {
  const { soundEnabled } = useGameStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPuzzleIdx, setCurrentPuzzleIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState<'unsolved' | 'correct' | 'wrong'>('unsolved');

  const filteredPuzzles = selectedCategory === 'all' 
    ? PUZZLES 
    : PUZZLES.filter(p => p.category === selectedCategory);

  const puzzle = filteredPuzzles[currentPuzzleIdx % filteredPuzzles.length] || PUZZLES[0];
  const chess = new Chess(puzzle.fen);

  const handlePieceDrop = (sourceSquare: string, targetSquare: string) => {
    if (status === 'correct') return false;

    if (sourceSquare === puzzle.solutionFrom && targetSquare === puzzle.solutionTo) {
      setStatus('correct');
      setScore(s => s + 100);
      setStreak(st => st + 1);
      if (soundEnabled) soundManager.playSuccessSound();
      return true;
    } else {
      setStatus('wrong');
      setStreak(0);
      if (soundEnabled) soundManager.playBlunderSound();
      return false;
    }
  };

  const handleNextPuzzle = () => {
    setShowHint(false);
    setStatus('unsolved');
    setCurrentPuzzleIdx(i => i + 1);
  };

  return (
    <div className="flex-1 bg-[#09090b] text-gray-100 p-4 lg:p-8 flex flex-col font-sans max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg">
              <Zap size={20} />
            </span>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-wide">Daily Tactics & Puzzles</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Solve tactical puzzles, blunder recovery drills, and checkmate patterns to build speed and accuracy!
          </p>
        </div>

        {/* Score & Streak Counters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-4 py-2 rounded-2xl shadow-md">
            <Trophy size={18} className="text-amber-400" />
            <div>
              <span className="text-[10px] text-zinc-500 font-bold block uppercase">Score</span>
              <span className="text-sm font-black text-white">{score}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-zinc-900 border border-amber-500/30 px-4 py-2 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.15)]">
            <Flame size={18} className="text-orange-400 animate-pulse" />
            <div>
              <span className="text-[10px] text-orange-400 font-bold block uppercase">Streak</span>
              <span className="text-sm font-black text-orange-300">{streak}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { id: 'all', label: 'All Puzzles' },
          { id: 'blunder', label: 'Blunder Recovery' },
          { id: 'checkmate', label: 'Checkmate Drills' },
          { id: 'fork', label: 'Tactical Forks' },
          { id: 'endgame', label: 'Endgame Precision' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedCategory(cat.id);
              setCurrentPuzzleIdx(0);
              setStatus('unsolved');
              setShowHint(false);
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              selectedCategory === cat.id
                ? 'bg-amber-400 text-black shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Board */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[550px] aspect-square rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-950">
            <Chessboard 
              position={puzzle.fen} 
              boardOrientation={puzzle.turn} 
              onPieceDrop={handlePieceDrop} 
              arePiecesDraggable={status !== 'correct'}
              showBoardNotation={true}
            />
          </div>
        </div>

        {/* Right Column: Puzzle Card & Explanation */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 shadow-xl space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                {puzzle.turn === 'white' ? 'White to move' : 'Black to move'}
              </span>
              <span className="text-xs font-mono text-zinc-500">Puzzle #{puzzle.id}</span>
            </div>

            <h2 className="text-xl font-black text-white">{puzzle.title}</h2>
            <p className="text-xs text-zinc-300 leading-relaxed">{puzzle.description}</p>

            {/* Hint Box */}
            {showHint && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2 animate-in fade-in">
                <Lightbulb size={16} className="shrink-0 mt-0.5 text-amber-400" />
                <span>{puzzle.hint}</span>
              </div>
            )}

            {/* Result Status */}
            {status === 'correct' && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-300 space-y-2 animate-in zoom-in-95">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 size={18} className="text-emerald-400" />
                  <span>Puzzle Solved! (+100 pts)</span>
                </div>
                <p className="text-xs text-zinc-300">{puzzle.explanation}</p>
              </div>
            )}

            {status === 'wrong' && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>Incorrect move! Try again or reveal hint.</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={() => setShowHint(true)}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold border border-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Lightbulb size={16} className="text-amber-400" />
                <span>Get Hint</span>
              </button>

              <button
                onClick={handleNextPuzzle}
                className="w-full sm:w-auto flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                <span>Next Puzzle</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

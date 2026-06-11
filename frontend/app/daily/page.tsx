'use client';
import React, { useState } from 'react';
import { Home, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';

export default function DailyPuzzlePage() {
  const router = useRouter();
  const [game, setGame] = useState(new Chess("r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R b KQkq - 3 3"));
  const [solved, setSolved] = useState(false);
  const [mistake, setMistake] = useState(false);
  const [streak, setStreak] = useState(parseInt(typeof window !== 'undefined' ? localStorage.getItem('streak') || '0' : '0'));

  const makeMove = (sourceSquare: string, targetSquare: string) => {
    if (solved) return false;
    
    try {
      const move = game.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });

      if (move === null) return false;
      
      // Target correct move is Nxe4
      if (move.san === "Nxe4") {
        setSolved(true);
        setMistake(false);
        const newStreak = streak + 1;
        setStreak(newStreak);
        if (typeof window !== 'undefined') localStorage.setItem('streak', newStreak.toString());
        return true;
      } else {
        game.undo();
        setMistake(true);
        setTimeout(() => setMistake(false), 1000);
        return false;
      }
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans flex flex-col items-center justify-center relative">
      <header className="absolute top-8 left-8 flex items-center gap-4">
        <button onClick={() => router.push('/')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <Home size={20} />
        </button>
        <h1 className="text-xl font-black uppercase tracking-widest text-emerald-400">Daily Challenge</h1>
      </header>

      <div className="absolute top-8 right-8 flex items-center gap-2 bg-emerald-900/40 border border-emerald-500/20 px-4 py-2 rounded-xl">
        <Sparkles size={16} className="text-emerald-400" />
        <span className="font-black text-white">{streak} Day Streak</span>
      </div>

      <div className="max-w-md w-full mt-16 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black">Find the Best Move</h2>
          <p className="text-gray-400">Black to move and gain an advantage.</p>
        </div>

        <div className={`rounded-2xl overflow-hidden border-4 transition-colors duration-300 ${solved ? 'border-emerald-500' : mistake ? 'border-red-500' : 'border-white/10 shadow-2xl'}`}>
          <Chessboard 
            position={game.fen()} 
            onPieceDrop={makeMove}
            boardOrientation="black"
            customDarkSquareStyle={{ backgroundColor: "#1e293b" }}
            customLightSquareStyle={{ backgroundColor: "#475569" }}
          />
        </div>

        {solved && (
          <div className="bg-emerald-900/40 p-6 rounded-2xl border border-emerald-500/30 text-center animate-in slide-in-from-bottom-4">
            <h3 className="text-xl font-black text-emerald-400 mb-2">Brilliant!</h3>
            <p className="text-gray-300 text-sm">
              <span className="font-bold text-white">Nxe4</span> is a classic tactical motif. You temporarily sacrifice the knight to eliminate White's central pawn, setting up d5 to regain the piece with a massive center.
            </p>
            <button onClick={() => router.push('/')} className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-xl font-bold uppercase text-sm tracking-widest transition-colors w-full">
              Analyze a Game
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

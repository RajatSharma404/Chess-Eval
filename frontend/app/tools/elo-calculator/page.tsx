'use client';
import React, { useState } from 'react';
import { Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function EloCalculatorPage() {
  const router = useRouter();
  const [myRating, setMyRating] = useState<number>(1200);
  const [oppRating, setOppRating] = useState<number>(1200);

  const expScore = 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
  const kFactor = 32;

  const winChange = Math.round(kFactor * (1 - expScore));
  const drawChange = Math.round(kFactor * (0.5 - expScore));
  const lossChange = Math.round(kFactor * (0 - expScore));

  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 font-sans">
      <header className="flex items-center gap-4 mb-10">
        <button onClick={() => router.push('/')} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
          <Home size={20} />
        </button>
        <h1 className="text-2xl font-black uppercase tracking-widest text-emerald-400">Elo Rating Calculator</h1>
      </header>

      <div className="max-w-3xl mx-auto bg-gray-900/50 p-8 rounded-3xl border border-white/10">
        <h2 className="text-xl font-bold mb-6">Calculate Expected Rating Change</h2>
        
        <div className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Your Rating: {myRating}</label>
            <input 
              type="range" min="100" max="3000" value={myRating} 
              onChange={(e) => setMyRating(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-400 mb-2 uppercase tracking-wider">Opponent Rating: {oppRating}</label>
            <input 
              type="range" min="100" max="3000" value={oppRating} 
              onChange={(e) => setOppRating(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>

          <div className="bg-black/50 p-6 rounded-xl border border-white/5">
            <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Expected Win Probability</h3>
            <div className="text-5xl font-black text-white">{(expScore * 100).toFixed(1)}%</div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-emerald-900/30 p-6 rounded-xl border border-emerald-500/20 text-center">
              <div className="text-gray-400 font-bold uppercase text-xs mb-2">If you Win</div>
              <div className="text-3xl font-black text-emerald-400">+{winChange}</div>
              <div className="text-sm text-gray-500 mt-2">New: {myRating + winChange}</div>
            </div>
            <div className="bg-gray-800/50 p-6 rounded-xl border border-white/10 text-center">
              <div className="text-gray-400 font-bold uppercase text-xs mb-2">If you Draw</div>
              <div className="text-3xl font-black text-white">{drawChange > 0 ? `+${drawChange}` : drawChange}</div>
              <div className="text-sm text-gray-500 mt-2">New: {myRating + drawChange}</div>
            </div>
            <div className="bg-red-900/30 p-6 rounded-xl border border-red-500/20 text-center">
              <div className="text-gray-400 font-bold uppercase text-xs mb-2">If you Lose</div>
              <div className="text-3xl font-black text-red-400">{lossChange}</div>
              <div className="text-sm text-gray-500 mt-2">New: {myRating + lossChange}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

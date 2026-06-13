'use client';
import React, { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import { analyzeGame } from '../lib/api';
import { Search, Loader2, Sparkles, ArrowRight, User } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

function HomeContent() {
  const { gameUrl, setGameUrl, setAnalysisResult, setLoading, setError, isLoading, error, progressStatus, setProgressStatus } = useGameStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'chesscom' | 'lichess' | 'pgn'>('chesscom');
  const [username, setUsername] = useState('');
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [streakDays, setStreakDays] = useState<number[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('mastermind_streak_days');
      if (stored) {
        // Simple logic to reset streak if it's a new week (for production this would be more robust)
        const lastDate = localStorage.getItem('mastermind_last_analysis_date');
        if (lastDate) {
           const daysDiff = (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24);
           if (daysDiff > 7 || new Date().getDay() === 1 && daysDiff > 1) {
              localStorage.removeItem('mastermind_streak_days');
              return;
           }
        }
        setStreakDays(JSON.parse(stored));
      }
    } catch(e) {}
  }, []);

  const updateStreak = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const dayIndex = new Date().getDay(); 
    const adjustedDay = dayIndex === 0 ? 6 : dayIndex - 1; // 0=Mon, 6=Sun
    
    const stored = localStorage.getItem('mastermind_last_analysis_date');
    if (stored !== todayStr) {
      localStorage.setItem('mastermind_last_analysis_date', todayStr);
      let parsed = [];
      try {
        const existing = localStorage.getItem('mastermind_streak_days');
        if (existing) parsed = JSON.parse(existing);
      } catch(e) {}
      if (!parsed.includes(adjustedDay)) {
        const newStreak = [...parsed, adjustedDay];
        setStreakDays(newStreak);
        localStorage.setItem('mastermind_streak_days', JSON.stringify(newStreak));
      }
    }
  };

  const handleAnalyzeGame = async (pgn: string) => {
    setGameUrl(pgn);
    setLoading(true);
    setError(null);
    setProgressStatus("Initializing...");
    updateStreak();
    try {
      const result = await analyzeGame(pgn, (status) => setProgressStatus(status));
      setAnalysisResult(result);
      router.push('/analyze');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressStatus(null);
    }
  };

  const handleAnalyzeForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'pgn' && gameUrl) {
      handleAnalyzeGame(gameUrl);
    } else if (activeTab === 'chesscom' && username) {
      router.push(`/history?user=${username}&platform=chesscom`);
    } else if (activeTab === 'lichess' && username) {
      router.push(`/history?user=${username}&platform=lichess`);
    }
  };

  useEffect(() => {
    const urlParam = searchParams.get('url');
    const pgnParam = searchParams.get('pgn');
    
    if (pgnParam) {
      setActiveTab('pgn');
      setGameUrl(pgnParam);
      handleAnalyzeGame(pgnParam);
    } else if (urlParam) {
      setActiveTab('pgn');
      setGameUrl(urlParam);
      handleAnalyzeGame(urlParam);
    }
  }, [searchParams]);

  return (
    <main className="h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest animate-pulse">Running Analysis...</h2>
            {progressStatus ? (
              <p className="text-emerald-400 font-mono text-lg font-bold bg-emerald-900/20 px-6 py-2 rounded-full border border-emerald-500/20">
                {progressStatus}
              </p>
            ) : (
              <p className="text-gray-400 font-medium max-w-md text-center">
                Please wait while the engine evaluates the game trajectory, accuracy, and tactical blunders.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/20 blur-[150px] rounded-full animate-pulse pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse duration-[5s] pointer-events-none" />

      <div className="max-w-3xl w-full text-center space-y-6 z-10 pt-10 pb-4 flex-1 flex flex-col justify-center">
        <div className="space-y-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 animate-bounce">
            <Sparkles size={12} /> Powered by Stockfish 17 & Gemini 2.0
          </div>
          <img src="/logo.png" alt="MasterMind Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tighter text-white leading-[0.9]">
            MASTER<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">MIND</span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base font-medium max-w-xl mx-auto leading-relaxed">
            Free Chess Game Analysis & Review – Analyze Chess.com, Lichess & PGN Games Online
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-2xl mx-auto mt-4 bg-gray-900/60 p-1 rounded-2xl flex items-center border border-white/10 shadow-xl backdrop-blur-xl">
          <button 
            type="button"
            onClick={() => { setActiveTab('chesscom'); setFetchError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'chesscom' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg viewBox="0 0 100 100" className={`w-4 h-4 ${activeTab === 'chesscom' ? 'fill-black' : 'fill-gray-400'}`}><path d="M96.4,32.2c-0.8-2.6-3.1-4.3-5.8-4.3H74.3c-1.3,0-2.5,0.5-3.4,1.4l-11,11c-0.9,0.9-1.4,2.1-1.4,3.4v16.3c0,1.3,0.5,2.5,1.4,3.4l11,11c0.9,0.9,2.1,1.4,3.4,1.4h16.3c2.7,0,5-1.7,5.8-4.3c0.8-2.6,0.1-5.4-1.8-7.3l-11-11c-0.9-0.9-1.4-2.1-1.4-3.4s0.5-2.5,1.4-3.4l11-11C96.3,37.6,97.1,34.8,96.4,32.2z"/></svg>
            Chess.com
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('lichess'); setFetchError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'lichess' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${activeTab === 'lichess' ? 'bg-black' : 'bg-gray-400'}`}><div className={`w-2 h-2 rotate-45 ${activeTab === 'lichess' ? 'bg-white' : 'bg-[#111]'}`}></div></div>
            Lichess
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('pgn'); setFetchError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'pgn' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            PGN / URL
          </button>
        </div>

        <form onSubmit={handleAnalyzeForm} className="relative group max-w-2xl mx-auto mt-2 shrink-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-cyan-500 to-emerald-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 sm:p-3 flex flex-col sm:flex-row items-center shadow-3xl">
            
            {(activeTab === 'chesscom' || activeTab === 'lichess') ? (
              <div className="flex items-center flex-1 w-full relative">
                <User className="ml-4 text-gray-500 hidden sm:block" size={20} />
                <input 
                  type="text"
                  placeholder={`${activeTab === 'chesscom' ? 'Chess.com' : 'Lichess'} username`}
                  className="bg-transparent border-none focus:ring-0 text-white flex-1 p-3 sm:p-5 text-base sm:text-lg outline-none placeholder:text-gray-600 font-medium w-full"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            ) : (
              <div className="flex items-center flex-1 w-full">
                <Search className="ml-4 text-gray-500 hidden sm:block" size={20} />
                <textarea 
                  rows={gameUrl.includes('[Event') ? 5 : 1}
                  placeholder="Paste PGN or Game URL"
                  className="bg-transparent border-none focus:ring-0 text-white flex-1 p-3 sm:p-5 text-base sm:text-lg outline-none placeholder:text-gray-600 font-medium resize-none overflow-y-auto max-h-40 scrollbar-hide"
                  value={gameUrl}
                  onChange={(e) => setGameUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAnalyzeForm(e);
                    }
                  }}
                />
              </div>
            )}

            <button 
              type="submit"
              className="w-full sm:w-auto mt-2 sm:mt-0 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-400 hover:text-white transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              disabled={isLoading || (activeTab === 'pgn' ? !gameUrl : !username)}
            >
              {activeTab === 'pgn' ? 'Analyze' : 'Fetch Recent Games'}
            </button>
          </div>
          {(error || fetchError) && (
             <p className="absolute -bottom-8 left-0 right-0 text-red-400 text-xs font-bold uppercase tracking-widest text-center animate-pulse">
               {error || fetchError}
             </p>
          )}
        </form>

        {/* Quick Try Links */}
        <div className="flex flex-col items-center justify-center gap-2 mt-4 text-sm shrink-0">
          {(activeTab === 'chesscom' || activeTab === 'lichess') ? (
             <div className="flex items-center gap-4">
               <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Profiles:</span>
               <button type="button" onClick={() => { setUsername('MagnusCarlsen'); setActiveTab('chesscom'); }} className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 decoration-cyan-900">MagnusCarlsen</button>
               <button type="button" onClick={() => { setUsername('GothamChess'); setActiveTab('chesscom'); }} className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 decoration-cyan-900">GothamChess</button>
             </div>
          ) : (
             <div className="flex items-center gap-4">
               <span className="text-gray-500 font-bold uppercase text-[10px] tracking-widest">Famous Game:</span>
               <button type="button" onClick={() => { 
                 const famousPgn = '[Event "FIDE World Cup 2023"]\n[Site "Baku AZE"]\n[Date "2023.08.19"]\n[Round "7.1"]\n[White "Carlsen, M."]\n[Black "Praggnanandhaa, R."]\n[Result "1/2-1/2"]\n[WhiteElo "2835"]\n[BlackElo "2690"]\n\n1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d4 exd4 5. Nxd4 Bb4 6. Bg5 h6 7. Bh4 Bxc3+ 8. bxc3 Ne5 9. e3 d6 10. Be2 Ng6 11. Bg3 Ne4 12. Qc2 Qe7 13. Bd3 Nxg3 14. hxg3 Ne5 15. Rb1 O-O 16. O-O b6 17. Be4 Ba6 18. Bxa8 Rxa8 19. Qa4 Bxc4 20. Rfd1 a5 21. a3 Re8 22. Rb2 g6 23. Rbd2 h5 24. Nc6 Qd7 25. Rd4 b5 26. Nxe5 Rxe5 27. Qxa5 Bb3 28. R1d2 Qc6 29. Qb4 Be6 30. a4 Rc5 31. Rb2 bxa4 32. Qxa4 Qxa4 33. Rxa4 Rxc3 34. Rb7 c5 35. Rb6 d5 36. Ra8+ Kg7 37. Ra7 Kf6 38. Rc7 Rc1+ 39. Kh2 c4 40. Rbb7 Rc2 41. f3 Re2 42. e4 d4 43. Rb4 Rd2 44. g4 hxg4 45. Kg3 gxf3 46. gxf3 g5 47. Rbxc4 Bxc4 48. Rxc4 d3 49. Rd4 Ke6 50. Rd5 f6 51. Kh3 Rd1 52. Kg2 d2 53. Kf2 Rh1 54. Rxd2 Rh2+ 55. Ke3 Rxd2 56. Kxd2 Kd6 1/2-1/2';
                 setGameUrl(famousPgn); 
                 setActiveTab('pgn'); 
               }} className="text-cyan-400 hover:text-cyan-300 font-medium underline underline-offset-4 decoration-cyan-900">
                 Carlsen vs Pragg (World Cup)
               </button>
             </div>
          )}
        </div>

        {/* Weekly Streak Tracker */}
        <div className="mt-8 flex flex-col items-center bg-gray-900/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl inline-block mx-auto">
           <div className="flex items-center gap-2 mb-3">
             <div className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em]">Analysis Streak</div>
             <div className="bg-yellow-500/20 text-yellow-500 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
               🔥 {streakDays.length}
             </div>
           </div>
           <div className="flex gap-2 sm:gap-3">
             {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
               const isActive = streakDays.includes(idx);
               return (
                 <div key={idx} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all duration-500 ${isActive ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-110' : 'bg-gray-800/50 text-gray-500 border border-white/5'}`}>
                   {day}
                 </div>
               )
             })}
           </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-10 border-t border-white/10 pt-6 pb-6 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-gray-500 text-sm z-10 relative">
        <div>© 2026 MasterMind. Powered by Stockfish 17 & Gemini 2.0.</div>
        <div className="flex items-center gap-6">
          <a href="/daily" className="hover:text-emerald-400 transition-colors font-medium">Daily Puzzle</a>
          <a href="/tools/elo-calculator" className="hover:text-emerald-400 transition-colors font-medium">Elo Calculator</a>
          <a href="#" className="hover:text-emerald-400 transition-colors font-medium">Analysis Board</a>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

'use client';
import React, { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import { analyzeGame } from '../lib/api';
import { Search, User, FileText, X, Github, Info, Zap, Brain } from 'lucide-react';
import { AnalysisLoadingScreen } from '../components/AnalysisLoadingScreen';

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
        const lastDate = localStorage.getItem('mastermind_last_analysis_date');
        if (lastDate) {
           const daysDiff = (new Date().getTime() - new Date(lastDate).getTime()) / (1000 * 3600 * 24);
           if (daysDiff > 7 || (new Date().getDay() === 1 && daysDiff > 1)) {
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
      let parsed: number[] = [];
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

  const handleAnalyzeForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const currentDayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <main className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Subtle animated background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none" />

      {/* Existing Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/20 blur-[150px] rounded-full animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse duration-[5s] pointer-events-none z-0" />

      {isLoading && <AnalysisLoadingScreen />}

      <div className="max-w-3xl w-full text-center space-y-8 z-10 pt-16 pb-12 flex-1 flex flex-col justify-center">
        
        {/* HERO SECTION */}
        <div className="space-y-4 flex flex-col items-center relative">
          {/* Animated SVG Knight */}
          <div className="relative w-24 h-24 mb-4 animate-[bounce_3s_infinite]">
            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
            <svg viewBox="0 0 100 100" className="w-full h-full fill-white drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] relative z-10">
              <path d="M50 10 C 60 10, 65 15, 65 25 C 65 30, 60 35, 75 55 C 80 60, 80 75, 80 75 L 75 80 L 25 80 L 20 75 C 20 75, 20 60, 25 55 C 40 35, 35 30, 35 25 C 35 15, 40 10, 50 10 Z M 45 25 C 45 28, 48 30, 50 30 C 52 30, 55 28, 55 25 C 55 22, 52 20, 50 20 C 48 20, 45 22, 45 25 Z" />
              <path d="M25 82 L75 82 L75 90 L25 90 Z" />
            </svg>
          </div>

          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[0.05em] text-white leading-none">
            MASTER<br />
            <span 
              className="text-teal-400 inline-block" 
              style={{ textShadow: '0 0 40px rgba(20,184,166,0.4)' }}
            >
              MIND
            </span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Powered by Stockfish 17 · Understand every move.
          </p>
        </div>

        {/* Glowing HR */}
        <div className="w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent" />

        {/* INTERACTIVE SECTION */}
        <div className="space-y-6 max-w-2xl mx-auto w-full">
          {/* Tab Switcher */}
          <div className="bg-zinc-800 p-1 rounded-xl flex items-center border border-zinc-700 shadow-xl relative overflow-hidden">
            <button 
              type="button"
              onClick={() => { setActiveTab('chesscom'); setFetchError(null); }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'chesscom' ? 'text-white bg-zinc-700 border border-zinc-600 shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
            >
              <span className="text-lg leading-none">♟</span>
              Chess.com
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('lichess'); setFetchError(null); }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'lichess' ? 'text-white bg-zinc-700 border border-zinc-600 shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
            >
              <svg viewBox="0 0 100 100" className={`w-4 h-4 ${activeTab === 'lichess' ? 'fill-white' : 'fill-zinc-400'}`}>
                <div className="w-4 h-4 rounded-sm flex items-center justify-center bg-current"><div className="w-2 h-2 rotate-45 bg-zinc-800"></div></div>
                <path d="M 50 15 C 65 15, 65 30, 75 50 C 85 70, 80 85, 80 85 L 20 85 C 20 85, 15 70, 25 50 C 35 30, 35 15, 50 15 Z" />
              </svg>
              Lichess
            </button>
            <button 
              type="button"
              onClick={() => { setActiveTab('pgn'); setFetchError(null); }}
              className={`flex-1 py-3 px-4 rounded-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 relative z-10 ${activeTab === 'pgn' ? 'text-white bg-zinc-700 border border-zinc-600 shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
            >
              <FileText size={16} />
              PGN / URL
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleAnalyzeForm} className="relative group w-full">
            <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/20 via-cyan-500/20 to-emerald-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition duration-500"></div>
            <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl p-2 flex flex-col sm:flex-row items-center shadow-2xl">
              
              {(activeTab === 'chesscom' || activeTab === 'lichess') ? (
                <div className="flex items-center flex-1 w-full relative">
                  <User className="ml-4 text-zinc-500 hidden sm:block" size={20} />
                  <input 
                    type="text"
                    placeholder={`${activeTab === 'chesscom' ? 'Chess.com' : 'Lichess'} username`}
                    className="bg-transparent border-none focus:ring-0 text-white flex-1 p-3 sm:p-4 text-base outline-none placeholder:text-zinc-600 font-medium w-full"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAnalyzeForm();
                      }
                    }}
                  />
                  {username && (
                    <button type="button" onClick={() => setUsername('')} className="absolute right-4 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <X size={18} />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center flex-1 w-full relative">
                  <Search className="ml-4 text-zinc-500 hidden sm:block mt-4 self-start" size={20} />
                  <textarea 
                    rows={gameUrl.includes('[Event') ? 4 : 1}
                    placeholder="Paste PGN or Game URL"
                    className="bg-transparent border-none focus:ring-0 text-white flex-1 p-3 sm:p-4 text-base outline-none placeholder:text-zinc-600 font-medium resize-none overflow-y-auto max-h-40 scrollbar-hide w-full"
                    value={gameUrl}
                    onChange={(e) => setGameUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAnalyzeForm();
                      }
                    }}
                  />
                  {gameUrl && (
                    <button type="button" onClick={() => setGameUrl('')} className="absolute right-4 top-4 text-zinc-500 hover:text-zinc-300 transition-colors">
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              <button 
                type="submit"
                className="w-full sm:w-auto mt-2 sm:mt-0 bg-amber-400 text-zinc-950 px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-bold text-sm hover:bg-amber-300 transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                disabled={isLoading || (activeTab === 'pgn' ? !gameUrl : !username)}
              >
                {activeTab === 'pgn' ? 'Analyze' : 'Fetch Recent Games'}
              </button>
            </div>
            {(error || fetchError) && (
               <p className="absolute -bottom-6 left-0 right-0 text-red-400 text-xs font-bold uppercase tracking-widest text-center animate-pulse">
                 {error || fetchError}
               </p>
            )}
          </form>

          {/* Quick Try Links */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4 text-sm shrink-0">
            {(activeTab === 'chesscom' || activeTab === 'lichess') ? (
               <div className="flex flex-wrap items-center justify-center gap-3">
                 <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Try:</span>
                 <button type="button" onClick={() => { setUsername('MagnusCarlsen'); setActiveTab('chesscom'); }} className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 hover:text-white hover:border-zinc-400 transition-colors font-medium text-xs">MagnusCarlsen</button>
                 <button type="button" onClick={() => { setUsername('Hikaru'); setActiveTab('chesscom'); }} className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 hover:text-white hover:border-zinc-400 transition-colors font-medium text-xs">Hikaru</button>
                 <button type="button" onClick={() => { setUsername('DanielNaroditsky'); setActiveTab('chesscom'); }} className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 hover:text-white hover:border-zinc-400 transition-colors font-medium text-xs">DanielNaroditsky</button>
               </div>
            ) : (
               <div className="flex flex-wrap items-center justify-center gap-3">
                 <span className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Famous Game:</span>
                 <button type="button" onClick={() => { 
                   const famousPgn = '[Event "FIDE World Cup 2023"]\n[Site "Baku AZE"]\n[Date "2023.08.19"]\n[Round "7.1"]\n[White "Carlsen, M."]\n[Black "Praggnanandhaa, R."]\n[Result "1/2-1/2"]\n[WhiteElo "2835"]\n[BlackElo "2690"]\n\n1. c4 e5 2. Nc3 Nf6 3. Nf3 Nc6 4. d4 exd4 5. Nxd4 Bb4 6. Bg5 h6 7. Bh4 Bxc3+ 8. bxc3 Ne5 9. e3 d6 10. Be2 Ng6 11. Bg3 Ne4 12. Qc2 Qe7 13. Bd3 Nxg3 14. hxg3 Ne5 15. Rb1 O-O 16. O-O b6 17. Be4 Ba6 18. Bxa8 Rxa8 19. Qa4 Bxc4 20. Rfd1 a5 21. a3 Re8 22. Rb2 g6 23. Rbd2 h5 24. Nc6 Qd7 25. Rd4 b5 26. Nxe5 Rxe5 27. Qxa5 Bb3 28. R1d2 Qc6 29. Qb4 Be6 30. a4 Rc5 31. Rb2 bxa4 32. Qxa4 Qxa4 33. Rxa4 Rxc3 34. Rb7 c5 35. Rb6 d5 36. Ra8+ Kg7 37. Ra7 Kf6 38. Rc7 Rc1+ 39. Kh2 c4 40. Rbb7 Rc2 41. f3 Re2 42. e4 d4 43. Rb4 Rd2 44. g4 hxg4 45. Kg3 gxf3 46. gxf3 g5 47. Rbxc4 Bxc4 48. Rxc4 d3 49. Rd4 Ke6 50. Rd5 f6 51. Kh3 Rd1 52. Kg2 d2 53. Kf2 Rh1 54. Rxd2 Rh2+ 55. Ke3 Rxd2 56. Kxd2 Kd6 1/2-1/2';
                   setGameUrl(famousPgn); 
                   setActiveTab('pgn'); 
                 }} className="px-3 py-1 bg-zinc-800 border border-zinc-600 rounded-full text-zinc-300 hover:text-white hover:border-zinc-400 transition-colors font-medium text-xs">
                   Carlsen vs Pragg (World Cup)
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Weekly Streak Tracker */}
        <div className="mt-8 flex flex-col items-center bg-zinc-900/60 backdrop-blur-md border border-zinc-800 p-5 rounded-3xl inline-block mx-auto shadow-lg relative group">
           <div className="flex items-center gap-2 mb-4" title="Analyze a game each day to build your streak">
             <div className="text-[10px] uppercase font-black text-zinc-500 tracking-[0.2em] flex items-center gap-1 cursor-help">
               Analysis Streak <Info size={12} className="opacity-50" />
             </div>
             {streakDays.length > 0 ? (
               <div className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1">
                 🔥 {streakDays.length}
               </div>
             ) : (
               <div className="text-zinc-500 text-[10px] font-medium px-2 py-0.5 rounded italic">
                 Start your streak today
               </div>
             )}
           </div>
           <div className="flex gap-2 sm:gap-3">
             {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => {
               const isActive = streakDays.includes(idx);
               const isToday = currentDayIndex === idx;
               const isPast = idx < currentDayIndex;
               
               let styleClass = '';
               if (isActive) {
                 styleClass = 'bg-amber-500 text-zinc-950 shadow-[0_0_15px_rgba(245,158,11,0.4)] scale-110 border-none';
               } else if (isToday) {
                 styleClass = 'bg-zinc-800 text-zinc-300 border-2 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
               } else if (isPast) {
                 styleClass = 'bg-zinc-700 text-zinc-500 border border-zinc-600';
               } else {
                 styleClass = 'bg-zinc-800/50 text-zinc-600 border border-zinc-700 opacity-50';
               }

               return (
                 <div key={idx} className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-black transition-all duration-500 ${styleClass}`}>
                   {day}
                 </div>
               )
             })}
           </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 bg-zinc-800/50 border border-zinc-700 rounded-2xl overflow-hidden mt-8 max-w-4xl mx-auto shadow-lg backdrop-blur-sm">
          <div className="flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-zinc-700/50 hover:bg-zinc-800 transition-colors">
            <span className="text-3xl mb-2 grayscale">♟</span>
            <div className="text-2xl font-black text-white">12,847</div>
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Games Analyzed</div>
          </div>
          <div className="flex flex-col items-center justify-center p-6 border-b md:border-b-0 md:border-r border-zinc-700/50 hover:bg-zinc-800 transition-colors">
            <Zap className="text-amber-400 mb-2" size={28} />
            <div className="text-2xl font-black text-white">Depth 35+</div>
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">Stockfish 17</div>
          </div>
          <div className="flex flex-col items-center justify-center p-6 hover:bg-zinc-800 transition-colors">
            <Brain className="text-teal-400 mb-2" size={28} />
            <div className="text-2xl font-black text-white">Gemini 2.0</div>
            <div className="text-xs text-zinc-400 font-medium uppercase tracking-wider">AI Coach Insights</div>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-8 pt-8 border-t border-zinc-800 max-w-4xl mx-auto w-full">
          <div className="text-center mb-6">
            <h3 className="text-lg font-bold text-zinc-200">How It Works</h3>
          </div>
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-4">
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 border border-amber-500/30">1</div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Enter Username</div>
                <div className="text-xs text-zinc-400 mt-1">Connect Chess.com or Lichess.</div>
              </div>
            </div>
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 border border-amber-500/30">2</div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Pick a Game</div>
                <div className="text-xs text-zinc-400 mt-1">Select from your recent matches.</div>
              </div>
            </div>
            <div className="flex-1 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 font-black flex items-center justify-center shrink-0 border border-amber-500/30">3</div>
              <div className="text-left">
                <div className="font-bold text-white text-sm">Get Deep Analysis</div>
                <div className="text-xs text-zinc-400 mt-1">Review blunders with AI feedback.</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 pb-6 w-full max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-zinc-500 text-sm z-10 relative">
        <div className="flex items-center gap-2">
          © 2026 MasterMind <span className="hidden md:inline">·</span>
          <span className="opacity-70 text-xs">Powered by Stockfish 17 & Gemini 2.0</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6">
          <a href="/daily" className="hover:text-zinc-200 hover:underline underline-offset-4 decoration-zinc-700 transition-all font-medium">Daily Puzzle</a>
          <a href="/tools/elo-calculator" className="hover:text-zinc-200 hover:underline underline-offset-4 decoration-zinc-700 transition-all font-medium">Elo Calculator</a>
          <a href="#" className="hover:text-zinc-200 hover:underline underline-offset-4 decoration-zinc-700 transition-all font-medium">Analysis Board</a>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-zinc-200 hover:underline underline-offset-4 decoration-zinc-700 transition-all font-medium flex items-center gap-1">
            <Github size={14} /> GitHub
          </a>
        </div>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

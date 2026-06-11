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
  const [fetchingGames, setFetchingGames] = useState(false);
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchChessComGames = async () => {
    if (!username) return;
    setFetchingGames(true);
    setFetchError(null);
    try {
      // Get monthly archives
      const archivesRes = await axios.get(`https://api.chess.com/pub/player/${username}/games/archives`);
      const archives = archivesRes.data.archives;
      if (!archives || archives.length === 0) throw new Error("No games found");
      
      const lastArchive = archives[archives.length - 1];
      const gamesRes = await axios.get(lastArchive);
      
      const games = gamesRes.data.games.reverse().slice(0, 20); // get last 20 games
      
      const formatted = games.map((g: any) => ({
        id: g.url,
        white: g.white.username,
        black: g.black.username,
        result: g.white.result === 'win' ? '1-0' : g.black.result === 'win' ? '0-1' : '1/2-1/2',
        pgn: g.pgn,
        timeClass: g.time_class,
        endTime: g.end_time
      }));
      setRecentGames(formatted);
    } catch (err: any) {
      setFetchError("Failed to fetch Chess.com games. Check username.");
    } finally {
      setFetchingGames(false);
    }
  };

  const fetchLichessGames = async () => {
    if (!username) return;
    setFetchingGames(true);
    setFetchError(null);
    try {
      const res = await axios.get(`https://lichess.org/api/games/user/${username}?max=20&pgnInJson=true`, {
        headers: { Accept: 'application/x-ndjson' }
      });
      // Parse ndjson
      const lines = res.data.split('\n').filter((l: string) => l.trim().length > 0);
      const games = lines.map((l: string) => JSON.parse(l));
      
      const formatted = games.map((g: any) => ({
        id: g.id,
        white: g.players.white.user?.name || "Anonymous",
        black: g.players.black.user?.name || "Anonymous",
        result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
        pgn: g.pgn,
        timeClass: g.perf,
        endTime: g.lastMoveAt ? g.lastMoveAt / 1000 : Date.now() / 1000
      }));
      setRecentGames(formatted);
    } catch (err: any) {
      setFetchError("Failed to fetch Lichess games. Check username.");
    } finally {
      setFetchingGames(false);
    }
  };

  const handleAnalyzeGame = async (pgn: string) => {
    setGameUrl(pgn);
    setLoading(true);
    setError(null);
    setProgressStatus("Initializing...");
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
    } else if (activeTab === 'chesscom') {
      fetchChessComGames();
    } else if (activeTab === 'lichess') {
      fetchLichessGames();
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
    <main className="min-h-screen w-full bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-x-hidden">
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

      <div className="max-w-3xl w-full text-center space-y-6 z-10 pt-20 pb-10">
        <div className="space-y-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2 animate-bounce">
            <Sparkles size={12} /> Powered by Stockfish 17 & Gemini 2.0
          </div>
          <img src="/logo.png" alt="MasterMind Logo" className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]" />
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            MASTER<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">MIND</span>
          </h1>
          <p className="text-gray-400 text-base sm:text-lg font-medium max-w-xl mx-auto leading-relaxed">
            Free Chess Game Analysis & Review – Analyze Chess.com, Lichess & PGN Games Online
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="max-w-2xl mx-auto mt-8 bg-gray-900/60 p-1 rounded-2xl flex items-center border border-white/10 shadow-xl backdrop-blur-xl">
          <button 
            type="button"
            onClick={() => { setActiveTab('chesscom'); setRecentGames([]); setFetchError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'chesscom' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <svg viewBox="0 0 100 100" className={`w-4 h-4 ${activeTab === 'chesscom' ? 'fill-black' : 'fill-gray-400'}`}><path d="M96.4,32.2c-0.8-2.6-3.1-4.3-5.8-4.3H74.3c-1.3,0-2.5,0.5-3.4,1.4l-11,11c-0.9,0.9-1.4,2.1-1.4,3.4v16.3c0,1.3,0.5,2.5,1.4,3.4l11,11c0.9,0.9,2.1,1.4,3.4,1.4h16.3c2.7,0,5-1.7,5.8-4.3c0.8-2.6,0.1-5.4-1.8-7.3l-11-11c-0.9-0.9-1.4-2.1-1.4-3.4s0.5-2.5,1.4-3.4l11-11C96.3,37.6,97.1,34.8,96.4,32.2z"/></svg>
            Chess.com
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('lichess'); setRecentGames([]); setFetchError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'lichess' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <div className={`w-4 h-4 rounded-sm flex items-center justify-center ${activeTab === 'lichess' ? 'bg-black' : 'bg-gray-400'}`}><div className={`w-2 h-2 rotate-45 ${activeTab === 'lichess' ? 'bg-white' : 'bg-[#111]'}`}></div></div>
            Lichess
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab('pgn'); setRecentGames([]); setFetchError(null); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${activeTab === 'pgn' ? 'bg-white text-black shadow-md' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            PGN / URL
          </button>
        </div>

        <form onSubmit={handleAnalyzeForm} className="relative group max-w-2xl mx-auto mt-4">
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
                  className="bg-transparent border-none focus:ring-0 text-white flex-1 p-3 sm:p-5 text-base sm:text-lg outline-none placeholder:text-gray-600 font-medium resize-none overflow-y-auto max-h-40 custom-scrollbar"
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
              className="w-full sm:w-auto mt-2 sm:mt-0 bg-white text-black px-6 sm:px-8 py-3 sm:py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-emerald-400 hover:text-white transition-all flex items-center justify-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={fetchingGames || isLoading || (activeTab === 'pgn' ? !gameUrl : !username)}
            >
              {fetchingGames ? <Loader2 className="w-5 h-5 animate-spin" /> : (activeTab === 'pgn' ? 'Analyze' : 'Fetch Recent Games')}
            </button>
          </div>
          {(error || fetchError) && (
            <p className="absolute -bottom-8 left-0 right-0 text-red-400 text-xs font-bold uppercase tracking-widest text-center animate-pulse">
              {error || fetchError}
            </p>
          )}
        </form>

        {/* Quick Try Links */}
        {(activeTab === 'chesscom' || activeTab === 'lichess') && recentGames.length === 0 && (
           <div className="flex items-center justify-center gap-4 mt-6 text-sm">
             <span className="text-gray-500">Quick Try:</span>
             <button type="button" onClick={() => { setUsername('MagnusCarlsen'); setActiveTab('chesscom'); }} className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 decoration-emerald-900">MagnusCarlsen</button>
             <button type="button" onClick={() => { setUsername('GothamChess'); setActiveTab('chesscom'); }} className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-4 decoration-emerald-900">GothamChess</button>
           </div>
        )}

        {/* Recent Games List */}
        {recentGames.length > 0 && (
          <div className="max-w-2xl mx-auto mt-8 text-left space-y-3">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-3">
              <Sparkles size={16} className="text-emerald-500" />
              Recent Games for {username}
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2 pb-10">
              {recentGames.map((game, i) => (
                <div 
                  key={i}
                  onClick={() => handleAnalyzeGame(game.pgn || game.id)}
                  className="bg-gray-900/50 backdrop-blur-md border border-white/5 p-4 rounded-xl hover:bg-gray-800 hover:border-emerald-500/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-black/50 flex items-center justify-center border border-white/5 group-hover:border-emerald-500/50">
                      {activeTab === 'chesscom' ? (
                        <svg viewBox="0 0 100 100" className="w-5 h-5 fill-[#81b64c]"><path d="M96.4,32.2c-0.8-2.6-3.1-4.3-5.8-4.3H74.3c-1.3,0-2.5,0.5-3.4,1.4l-11,11c-0.9,0.9-1.4,2.1-1.4,3.4v16.3c0,1.3,0.5,2.5,1.4,3.4l11,11c0.9,0.9,2.1,1.4,3.4,1.4h16.3c2.7,0,5-1.7,5.8-4.3c0.8-2.6,0.1-5.4-1.8-7.3l-11-11c-0.9-0.9-1.4-2.1-1.4-3.4s0.5-2.5,1.4-3.4l11-11C96.3,37.6,97.1,34.8,96.4,32.2z"/></svg>
                      ) : (
                        <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center"><div className="w-2 h-2 bg-black rotate-45"></div></div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{game.white}</span>
                        <span className="text-gray-500 text-xs">vs</span>
                        <span className="font-bold text-white text-sm">{game.black}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                          (game.result === '1-0' && game.white.toLowerCase() === username.toLowerCase()) || 
                          (game.result === '0-1' && game.black.toLowerCase() === username.toLowerCase()) 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : game.result === '1/2-1/2' 
                              ? 'bg-gray-500/20 text-gray-400' 
                              : 'bg-red-500/20 text-red-400'
                        }`}>
                          {game.result === '1-0' && game.white.toLowerCase() === username.toLowerCase() ? 'WIN' : 
                           game.result === '0-1' && game.black.toLowerCase() === username.toLowerCase() ? 'WIN' :
                           game.result === '1/2-1/2' ? 'DRAW' : 'LOSS'}
                        </span>
                        <span className="text-gray-500 text-xs">{game.timeClass}</span>
                        <span className="text-gray-600 text-xs">• {formatDistanceToNow(game.endTime * 1000)} ago</span>
                      </div>
                    </div>
                  </div>
                  <button type="button" className="bg-white/5 text-white p-2 rounded-lg group-hover:bg-emerald-500 transition-colors">
                    <ArrowRight size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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

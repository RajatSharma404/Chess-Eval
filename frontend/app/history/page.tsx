'use client';
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2, RefreshCw, Filter, Search, Home, Zap, Star, Wrench, Info, LogIn, ChevronDown, ChevronLeft as Collapse, ChevronRight } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { analyzeGame } from '../../lib/api';
import { AnalysisLoadingScreen } from '../../components/AnalysisLoadingScreen';

type FilterType = 'All' | 'Wins' | 'Losses' | 'Draws' | 'Rapid' | 'Bullet' | 'Blitz';
const PAGE_SIZE = 20;

function HistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get('user') || '';
  const platform = searchParams.get('platform') || 'chesscom';

  const [userProfile, setUserProfile] = useState<any>(null);
  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterType>('All');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination for importing more
  const [archives, setArchives] = useState<string[]>([]);
  const [archiveIndex, setArchiveIndex] = useState<number>(-1);
  const [importing, setImporting] = useState(false);
  const [lichessSince, setLichessSince] = useState<number | null>(null);

  const { setGameUrl, setAnalysisResult, setLoading: setEngineLoading, setProgressStatus, isLoading: engineLoading } = useGameStore();

  const fetchGames = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    setFilter('All');
    setCurrentPage(1);
    try {
      if (platform === 'chesscom') {
        const profileRes = await axios.get(`https://api.chess.com/pub/player/${username}`);
        const statsRes = await axios.get(`https://api.chess.com/pub/player/${username}/stats`).catch(() => ({ data: {} }));
        const rating = statsRes.data.chess_rapid?.last?.rating || statsRes.data.chess_blitz?.last?.rating || 'Unrated';
        
        setUserProfile({
          avatar: profileRes.data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          username: profileRes.data.username || username,
          rating: rating,
        });

        const archivesRes = await axios.get(`https://api.chess.com/pub/player/${username}/games/archives`);
        const arch = archivesRes.data.archives;
        if (!arch || arch.length === 0) {
          setGames([]);
          return;
        }
        
        setArchives(arch);
        // Fetch up to the last 12 archives (1 year) to get a good spread of dates instantly
        const archivesToFetch = arch.slice(-12).reverse();
        setArchiveIndex(arch.length - 1 - archivesToFetch.length);
        
        const gamesPromises = archivesToFetch.map((url: string) => axios.get(url).catch(() => ({ data: { games: [] } })));
        const results = await Promise.all(gamesPromises);
        
        let allFetchedGames: any[] = [];
        results.forEach(res => {
           if (res.data && res.data.games) {
              allFetchedGames = [...allFetchedGames, ...res.data.games.reverse()];
           }
        });
        
        const formatted = allFetchedGames.map((g: any) => ({
          id: g.url,
          white: g.white.username,
          whiteRating: g.white.rating,
          black: g.black.username,
          blackRating: g.black.rating,
          result: g.white.result === 'win' ? '1-0' : g.black.result === 'win' ? '0-1' : '1/2-1/2',
          pgn: g.pgn,
          timeClass: g.time_class,
          endTime: g.end_time,
          rules: g.rules
        }));
        setGames(formatted);
      } else {
        const profileRes = await axios.get(`https://lichess.org/api/user/${username}`);
        setUserProfile({
          avatar: profileRes.data.profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          username: profileRes.data.username,
          rating: profileRes.data.perfs?.rapid?.rating || profileRes.data.perfs?.blitz?.rating || 'Unrated',
        });

        const res = await axios.get(`https://lichess.org/api/games/user/${username}?max=500&pgnInJson=true`, {
          headers: { Accept: 'application/x-ndjson' }
        });
        const lines = res.data.split('\n').filter((l: string) => l.trim().length > 0);
        const parsedGames = lines.map((l: string) => JSON.parse(l));
        
        const formatted = parsedGames.map((g: any) => ({
          id: g.id,
          white: g.players.white.user?.name || "Anonymous",
          whiteRating: g.players.white.rating || 0,
          black: g.players.black.user?.name || "Anonymous",
          blackRating: g.players.black.rating || 0,
          result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
          pgn: g.pgn,
          timeClass: g.perf,
          endTime: g.lastMoveAt ? g.lastMoveAt / 1000 : Date.now() / 1000,
          rules: 'chess'
        }));
        setGames(formatted);
        if (formatted.length > 0) {
          setLichessSince(formatted[formatted.length - 1].endTime * 1000);
        }
      }
    } catch (err: any) {
      setError("Failed to fetch games or profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [username, platform]);

  const handleImportMoreGames = async () => {
    if (importing) return;
    setImporting(true);
    try {
      if (platform === 'chesscom') {
        if (archiveIndex < 0) {
          alert("All games imported!");
          setImporting(false);
          return;
        }
        const archiveUrl = archives[archiveIndex];
        const gamesRes = await axios.get(archiveUrl);
        const fetchedGames = gamesRes.data.games.reverse();
        
        const formatted = fetchedGames.map((g: any) => ({
          id: g.url,
          white: g.white.username,
          whiteRating: g.white.rating,
          black: g.black.username,
          blackRating: g.black.rating,
          result: g.white.result === 'win' ? '1-0' : g.black.result === 'win' ? '0-1' : '1/2-1/2',
          pgn: g.pgn,
          timeClass: g.time_class,
          endTime: g.end_time,
          rules: g.rules
        }));
        
        setGames(prev => [...prev, ...formatted]);
        setArchiveIndex(prev => prev - 1);
      } else {
        if (!lichessSince) return;
        const res = await axios.get(`https://lichess.org/api/games/user/${username}?max=500&pgnInJson=true&until=${lichessSince - 1}`, {
          headers: { Accept: 'application/x-ndjson' }
        });
        const lines = res.data.split('\n').filter((l: string) => l.trim().length > 0);
        if (lines.length === 0) {
          alert("All games imported!");
          setImporting(false);
          return;
        }
        const parsedGames = lines.map((l: string) => JSON.parse(l));
        
        const formatted = parsedGames.map((g: any) => ({
          id: g.id,
          white: g.players.white.user?.name || "Anonymous",
          whiteRating: g.players.white.rating || 0,
          black: g.players.black.user?.name || "Anonymous",
          blackRating: g.players.black.rating || 0,
          result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
          pgn: g.pgn,
          timeClass: g.perf,
          endTime: g.lastMoveAt ? g.lastMoveAt / 1000 : Date.now() / 1000,
          rules: 'chess'
        }));
        
        setGames(prev => [...prev, ...formatted]);
        setLichessSince(formatted[formatted.length - 1].endTime * 1000);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to import more games.");
    } finally {
      setImporting(false);
    }
  };

  const handleAnalyzeGame = async (pgn: string) => {
    setGameUrl(pgn);
    setEngineLoading(true);
    setProgressStatus("Initializing...");
    try {
      const result = await analyzeGame(pgn, (status) => setProgressStatus(status));
      setAnalysisResult(result);
      router.push('/analyze');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setEngineLoading(false);
      setProgressStatus(null);
    }
  };

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const isWhite = g.white.toLowerCase() === username.toLowerCase();
      const isWin = (isWhite && g.result === '1-0') || (!isWhite && g.result === '0-1');
      const isLoss = (isWhite && g.result === '0-1') || (!isWhite && g.result === '1-0');
      const isDraw = g.result === '1/2-1/2';

      switch (filter) {
        case 'Wins': return isWin;
        case 'Losses': return isLoss;
        case 'Draws': return isDraw;
        case 'Rapid': return g.timeClass?.toLowerCase().includes('rapid');
        case 'Blitz': return g.timeClass?.toLowerCase().includes('blitz');
        case 'Bullet': return g.timeClass?.toLowerCase().includes('bullet');
        default: return true;
      }
    });
  }, [games, filter, username]);

  // Group games by date
  const groupedGames = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    filteredGames.forEach(g => {
      const dateStr = format(new Date(g.endTime * 1000), 'MMM d, yyyy');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(g);
    });
    return groups;
  }, [filteredGames]);

  // Streak days placeholder
  const streakDays = [1, 2, 3]; 

  // Recent 10 results
  const recentResults = useMemo(() => {
    return filteredGames.slice(0, 10).map(g => {
      const isWhite = g.white.toLowerCase() === username.toLowerCase();
      const isWin = (isWhite && g.result === '1-0') || (!isWhite && g.result === '0-1');
      const isDraw = g.result === '1/2-1/2';
      return isWin ? 'win' : isDraw ? 'draw' : 'loss';
    });
  }, [filteredGames, username]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex relative overflow-hidden">
      {/* Subtle landing page animated background */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none" />

      {/* Landing page Glow Effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-600/10 blur-[150px] rounded-full animate-pulse duration-[5s] pointer-events-none z-0" />

      {engineLoading && <AnalysisLoadingScreen />}

      {/* SIDEBAR */}
      <div className="w-[260px] bg-zinc-950/80 backdrop-blur-xl border-r border-zinc-800 flex flex-col shrink-0 z-10">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl grayscale opacity-80 text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">♟</span>
            <span className="text-sm font-black tracking-widest text-white mt-1">CHESSIGMA</span>
          </div>
          <Collapse size={18} className="text-zinc-500 hover:text-white cursor-pointer transition-colors" />
        </div>

        <nav className="flex flex-col gap-1 px-3 mt-4 flex-1">
          <a href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <Home size={18} /> Home
          </a>
          <a href="/train" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <div className="flex items-center gap-3">
              <Zap size={18} /> Train
            </div>
            <span className="text-[10px] bg-amber-400/20 text-amber-400 font-bold px-1.5 py-0.5 rounded">NEW</span>
          </a>
          <a href="/supercoach" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <div className="flex items-center gap-3">
              <Star size={18} /> Supercoach
            </div>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
          </a>
          <a href="/history" className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-zinc-800 text-amber-400 text-sm font-medium border border-zinc-700 shadow-md">
            <div className="flex items-center gap-3">
              <Wrench size={18} /> Tools
            </div>
            <ChevronRight size={16} />
          </a>
          <a href="/about" className="flex items-center justify-between px-3 py-2.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50 transition-colors text-sm font-medium">
            <div className="flex items-center gap-3">
              <Info size={18} /> About
            </div>
            <ChevronRight size={16} />
          </a>
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-6 bg-zinc-950/50">
          <div className="flex items-center justify-between text-sm text-zinc-400 font-medium px-2">
             What&apos;s new
             <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
          </div>

          <div className="px-2">
            <div className="flex items-center justify-between mb-3">
               <div className="flex items-center gap-1.5 text-amber-400 font-black">
                 <span className="text-lg">🔥</span> 0
               </div>
               <div className="text-[10px] text-zinc-500 font-bold tracking-widest">DAY STREAK</div>
            </div>
            <div className="flex gap-1.5">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <div key={idx} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${streakDays.includes(idx) ? 'bg-amber-400 text-zinc-950 shadow-[0_0_10px_rgba(251,191,36,0.4)]' : 'border border-zinc-800 text-zinc-600'}`}>
                  {day}
                </div>
              ))}
            </div>
          </div>

          <button className="w-full bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">
            <LogIn size={18} /> Sign in
          </button>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-6 py-10">
          
          {/* Profile Header */}
          {userProfile && (
            <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-4 mb-2">
                <img src={userProfile.avatar} alt="Avatar" className="w-12 h-12 rounded-lg bg-zinc-900 border border-zinc-800 object-cover shadow-xl" />
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  {userProfile.username}
                  <span className="text-xl">🎓</span>
                </h1>
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-sm font-medium cursor-pointer hover:text-white transition-colors">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                Rapid · {userProfile.rating}
                <ChevronDown size={14} className="ml-1 opacity-50" />
              </div>
            </div>
          )}

          {/* Recent Results Blocks */}
          <div className="flex items-center justify-center gap-1.5 mb-8">
             {recentResults.map((res, i) => (
               <div key={i} className={`h-8 w-14 rounded border shadow-sm ${res === 'win' ? 'bg-emerald-900/40 border-emerald-500/50' : res === 'loss' ? 'bg-red-900/40 border-red-500/50' : 'bg-zinc-800/40 border-zinc-600/50'}`}></div>
             ))}
             {/* Fill remaining slots to make 10 if less than 10 games */}
             {Array.from({length: Math.max(0, 10 - recentResults.length)}).map((_, i) => (
               <div key={`empty-${i}`} className="h-8 w-14 rounded bg-zinc-900/30 border border-zinc-800/50"></div>
             ))}
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-center gap-3 mb-10 relative">
             <button onClick={fetchGames} className="bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors text-sm shadow-md">
               <RefreshCw size={16} /> Refresh
             </button>
             <button onClick={handleImportMoreGames} disabled={importing} className="bg-zinc-900/50 border border-zinc-700 text-amber-400 hover:bg-zinc-800 font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors text-sm disabled:opacity-50">
               {importing ? <><Loader2 size={16} className="animate-spin" /> Importing...</> : '+ Import more games'}
             </button>
             <button 
               onClick={() => setIsFilterOpen(!isFilterOpen)}
               className={`border border-zinc-700 font-bold py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors text-sm ${isFilterOpen ? 'bg-zinc-800 text-amber-400' : 'bg-zinc-900/50 text-amber-400 hover:bg-zinc-800'}`}
             >
               <Filter size={16} /> Filters
             </button>

             {/* Filters Dropdown */}
             {isFilterOpen && (
               <div className="absolute top-14 right-0 md:right-auto md:left-1/2 md:-translate-x-1/2 w-80 bg-zinc-900 border border-zinc-700 shadow-2xl rounded-xl z-50 p-5">
                 <div className="flex justify-between items-center mb-6">
                   <h3 className="text-white font-bold">Filter games</h3>
                   <button className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors">Reset</button>
                 </div>
                 
                 <div className="space-y-5">
                   <div className="flex gap-4">
                     <div className="flex-1">
                       <label className="block text-[10px] font-bold text-zinc-500 tracking-wider mb-2">RESULT</label>
                       <div className="flex border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950/50">
                         {['All', 'Wins', 'Losses', 'Draws'].map(f => (
                           <button 
                             key={f} 
                             onClick={() => setFilter(f as FilterType)}
                             className={`flex-1 py-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                           >
                             {f}
                           </button>
                         ))}
                       </div>
                     </div>
                     <div className="w-24">
                       <label className="block text-[10px] font-bold text-zinc-500 tracking-wider mb-2">SORT</label>
                       <button className="w-full border border-zinc-700 rounded-lg py-1.5 text-xs font-medium text-white bg-zinc-950/50 flex items-center justify-center gap-1 hover:bg-zinc-800 transition-colors">
                         ↓ Newest
                       </button>
                     </div>
                   </div>

                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 tracking-wider mb-2">TIME CLASS</label>
                     <div className="flex border border-zinc-700 rounded-lg overflow-hidden bg-zinc-950/50">
                         {['All', 'Bullet', 'Rapid'].map(f => (
                           <button 
                             key={f} 
                             onClick={() => setFilter(f as FilterType)}
                             className={`flex-1 py-2 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors ${filter === f ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-zinc-200'}`}
                           >
                             {f === 'Bullet' && <span className="text-orange-400">⚡</span>}
                             {f === 'Rapid' && <span className="text-emerald-400">⏱</span>}
                             {f}
                           </button>
                         ))}
                     </div>
                   </div>

                   <div>
                     <label className="block text-[10px] font-bold text-zinc-500 tracking-wider mb-2">OPPONENT</label>
                     <div className="relative">
                       <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                       <input type="text" placeholder="Search opponent" className="w-full bg-zinc-950/50 border border-zinc-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:border-amber-400/50 transition-colors" />
                     </div>
                   </div>
                 </div>
               </div>
             )}
          </div>

          {/* Game List */}
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-amber-400" /></div>
          ) : error ? (
             <div className="text-center text-red-400 py-10 font-medium">{error}</div>
          ) : Object.keys(groupedGames).length === 0 ? (
             <div className="text-center text-zinc-500 py-10 font-medium">No games found.</div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedGames).map(([date, dayGames]) => (
                <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <h3 className="text-xs font-bold text-zinc-500 mb-3 ml-1">{date}</h3>
                  <div className="space-y-2">
                    {dayGames.map((game: any, i: number) => {
                      const isWhite = game.white.toLowerCase() === username.toLowerCase();
                      const isWin = (isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1');
                      const isLoss = (isWhite && game.result === '0-1') || (!isWhite && game.result === '1-0');
                      const opponent = isWhite ? game.black : game.white;
                      const oppRating = isWhite ? game.blackRating : game.whiteRating;

                      return (
                        <div 
                          key={i} 
                          onClick={() => handleAnalyzeGame(game.pgn || game.id)}
                          className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800/80 cursor-pointer transition-all overflow-hidden relative group backdrop-blur-sm"
                        >
                          {/* Left Border indicator */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 shadow-[0_0_8px_currentColor] ${isWin ? 'bg-emerald-500 text-emerald-500' : isLoss ? 'bg-red-500 text-red-500' : 'bg-zinc-500 text-zinc-500'}`}></div>
                          
                          <div className="flex items-center gap-4 pl-3">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent}`} alt="opp" className="w-8 h-8 rounded-full bg-zinc-950 border border-zinc-800" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-zinc-200 text-sm">{opponent}</span>
                                <span className="text-zinc-500 text-xs font-medium">{oppRating}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${isWin ? 'bg-emerald-500' : isLoss ? 'bg-red-500' : 'bg-zinc-500'}`}></div>
                                {game.timeClass.includes('bullet') ? <span className="text-orange-400">⚡</span> : <span className="text-emerald-400">⏱</span>} {game.timeClass}
                              </div>
                            </div>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 text-amber-400 text-xs font-bold mr-2">
                            Analyze →
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#050505] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-amber-400" /></div>}>
      <HistoryContent />
    </Suspense>
  );
}

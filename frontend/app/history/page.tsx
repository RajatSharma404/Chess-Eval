'use client';
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { format } from 'date-fns';
import { Loader2, RefreshCw, Filter, Search, Trophy, Swords, Zap, ChevronDown } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const { setGameUrl, setAnalysisResult, setLoading: setEngineLoading, setProgressStatus, isLoading: engineLoading } = useGameStore();

  const fetchGames = async () => {
    if (!username) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setFilter('All');
    try {
      if (platform === 'chesscom') {
        const profileRes = await axios.get(`https://api.chess.com/pub/player/${username}`).catch(() => ({ data: {} }));
        const statsRes = await axios.get(`https://api.chess.com/pub/player/${username}/stats`).catch(() => ({ data: {} }));
        const rating = statsRes.data.chess_rapid?.last?.rating || statsRes.data.chess_blitz?.last?.rating || '1500';
        
        setUserProfile({
          avatar: profileRes.data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          username: profileRes.data.username || username,
          rating: rating,
        });

        const archivesRes = await axios.get(`https://api.chess.com/pub/player/${username}/games/archives`).catch(() => ({ data: { archives: [] } }));
        const arch = archivesRes.data.archives || [];
        if (arch.length === 0) {
          setGames([]);
          return;
        }
        
        const archivesToFetch = arch.slice(-6).reverse();
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
          timeClass: g.time_class || 'rapid',
          endTime: g.end_time || Date.now() / 1000,
        }));
        setGames(formatted);
      } else {
        const profileRes = await axios.get(`https://lichess.org/api/user/${username}`).catch(() => ({ data: {} }));
        setUserProfile({
          avatar: profileRes.data.profile?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
          username: profileRes.data.username || username,
          rating: profileRes.data.perfs?.rapid?.rating || profileRes.data.perfs?.blitz?.rating || '1500',
        });

        const res = await axios.get(`https://lichess.org/api/games/user/${username}?max=100&pgnInJson=true`, {
          headers: { Accept: 'application/x-ndjson' }
        }).catch(() => ({ data: '' }));

        const lines = res.data.split('\n').filter(Boolean);
        const parsedGames = lines.map((l: string) => {
          try { return JSON.parse(l); } catch { return null; }
        }).filter(Boolean);

        const formatted = parsedGames.map((g: any) => ({
          id: g.id,
          white: g.players?.white?.user?.name || 'White',
          whiteRating: g.players?.white?.rating || '?',
          black: g.players?.black?.user?.name || 'Black',
          blackRating: g.players?.black?.rating || '?',
          result: g.winner === 'white' ? '1-0' : g.winner === 'black' ? '0-1' : '1/2-1/2',
          pgn: g.pgn,
          timeClass: g.speed || 'rapid',
          endTime: Math.floor((g.createdAt || Date.now()) / 1000),
        }));
        setGames(formatted);
      }
    } catch (err: any) {
      setError('Could not fetch game history. Please check the username and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [username, platform]);

  const filteredGames = useMemo(() => {
    return games.filter(g => {
      const isWhite = g.white.toLowerCase() === username.toLowerCase();
      const isWin = (isWhite && g.result === '1-0') || (!isWhite && g.result === '0-1');
      const isLoss = (isWhite && g.result === '0-1') || (!isWhite && g.result === '1-0');
      const isDraw = g.result === '1/2-1/2';
      const opponent = isWhite ? g.black : g.white;

      if (searchQuery && !opponent.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      if (filter === 'Wins') return isWin;
      if (filter === 'Losses') return isLoss;
      if (filter === 'Draws') return isDraw;
      if (filter === 'Bullet') return g.timeClass.includes('bullet');
      if (filter === 'Blitz') return g.timeClass.includes('blitz');
      if (filter === 'Rapid') return g.timeClass.includes('rapid');
      return true;
    });
  }, [games, filter, searchQuery, username]);

  const stats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let draws = 0;

    games.forEach(g => {
      const isWhite = g.white.toLowerCase() === username.toLowerCase();
      if ((isWhite && g.result === '1-0') || (!isWhite && g.result === '0-1')) wins++;
      else if ((isWhite && g.result === '0-1') || (!isWhite && g.result === '1-0')) losses++;
      else draws++;
    });

    const total = wins + losses + draws;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;
    return { wins, losses, draws, total, winRate };
  }, [games, username]);

  const handleAnalyzeGame = async (pgn: string) => {
    setGameUrl(pgn);
    setEngineLoading(true);
    setProgressStatus("Analyzing game...");
    try {
      const result = await analyzeGame(pgn, (status) => setProgressStatus(status));
      setAnalysisResult(result);
      router.push('/analyze');
    } catch (err: any) {
      alert("Error parsing PGN for analysis: " + err.message);
    } finally {
      setEngineLoading(false);
      setProgressStatus(null);
    }
  };

  return (
    <div className="flex-1 bg-[#09090b] text-gray-100 p-4 lg:p-8 font-sans max-w-6xl mx-auto w-full">
      {engineLoading && <AnalysisLoadingScreen />}

      {/* Header & Stats Banner */}
      {userProfile && (
        <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <img src={userProfile.avatar} alt="Avatar" className="w-16 h-16 rounded-2xl bg-zinc-800 border border-white/10 shadow-md object-cover" />
              <div>
                <h1 className="text-2xl font-black text-white flex items-center gap-2">
                  {userProfile.username}
                  <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded capitalize font-mono">
                    {platform}
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 font-mono mt-1">
                  Rating: <span className="text-emerald-400 font-bold">{userProfile.rating}</span>
                </p>
              </div>
            </div>

            {/* Performance Summary Bar */}
            <div className="flex items-center gap-4 bg-zinc-950/60 p-4 rounded-xl border border-white/5 w-full md:w-auto justify-around">
              <div className="text-center px-3">
                <span className="text-[10px] text-zinc-500 font-bold block uppercase">Total Games</span>
                <span className="text-lg font-black text-white">{stats.total}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center px-3">
                <span className="text-[10px] text-emerald-400 font-bold block uppercase">Wins</span>
                <span className="text-lg font-black text-emerald-400">{stats.wins}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center px-3">
                <span className="text-[10px] text-red-400 font-bold block uppercase">Losses</span>
                <span className="text-lg font-black text-red-400">{stats.losses}</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="text-center px-3">
                <span className="text-[10px] text-amber-400 font-bold block uppercase">Win Rate</span>
                <span className="text-lg font-black text-amber-300">{stats.winRate}%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Search by opponent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['All', 'Wins', 'Losses', 'Draws', 'Rapid', 'Blitz'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as FilterType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                filter === f
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
          <button
            onClick={fetchGames}
            className="p-2 rounded-xl bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white transition-colors ml-2"
            title="Refresh Games"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Games List */}
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>
      ) : error ? (
        <div className="text-center text-red-400 py-12 font-medium bg-red-500/10 border border-red-500/20 rounded-2xl p-6">{error}</div>
      ) : filteredGames.length === 0 ? (
        <div className="text-center text-zinc-500 py-16 font-medium">No games match your search or filter.</div>
      ) : (
        <div className="space-y-3">
          {filteredGames.map((game: any, idx: number) => {
            const isWhite = game.white.toLowerCase() === username.toLowerCase();
            const isWin = (isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1');
            const isLoss = (isWhite && game.result === '0-1') || (!isWhite && game.result === '1-0');
            const opponent = isWhite ? game.black : game.white;
            const oppRating = isWhite ? game.blackRating : game.whiteRating;

            return (
              <div
                key={idx}
                onClick={() => handleAnalyzeGame(game.pgn || game.id)}
                className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/10 cursor-pointer transition-all relative overflow-hidden group shadow-md"
              >
                {/* Result Accent Line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isWin ? 'bg-emerald-500' : isLoss ? 'bg-red-500' : 'bg-zinc-500'}`} />

                <div className="flex items-center gap-4 pl-2">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${opponent}`} alt="Opponent" className="w-10 h-10 rounded-xl bg-zinc-950 border border-white/10 object-cover" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{opponent}</span>
                      <span className="text-xs text-zinc-500 font-mono">({oppRating})</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                      <span className={`font-extrabold uppercase text-[10px] px-1.5 py-0.2 rounded ${isWin ? 'bg-emerald-500/20 text-emerald-400' : isLoss ? 'bg-red-500/20 text-red-400' : 'bg-zinc-800 text-zinc-400'}`}>
                        {isWin ? 'Win' : isLoss ? 'Loss' : 'Draw'}
                      </span>
                      <span className="capitalize text-zinc-500 font-mono text-[11px]">{game.timeClass}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-400 font-bold group-hover:text-emerald-400 transition-colors">
                    Analyze →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>}>
      <HistoryContent />
    </Suspense>
  );
}

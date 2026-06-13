'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import axios from 'axios';
import { formatDistanceToNow, format } from 'date-fns';
import { Loader2, Share2, RefreshCw, Download, Settings, ChevronRight, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { analyzeGame } from '../../lib/api';

function HistoryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = searchParams.get('user') || '';
  const platform = searchParams.get('platform') || 'chesscom';

  const [games, setGames] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [availableMonths, setAvailableMonths] = useState<{label: string, value: string}[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [importing, setImporting] = useState(false);
  const [fetchingMonths, setFetchingMonths] = useState(false);
  
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [importProgress, setImportProgress] = useState<{current: number, total: number} | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { setGameUrl, setAnalysisResult, setLoading: setEngineLoading, setProgressStatus, progressStatus, isLoading: engineLoading } = useGameStore();

  const fetchGames = async () => {
    if (!username) return;
    setLoading(true);
    setError(null);
    try {
      if (platform === 'chesscom') {
        const archivesRes = await axios.get(`https://api.chess.com/pub/player/${username}/games/archives`);
        const archives = archivesRes.data.archives;
        if (!archives || archives.length === 0) throw new Error("No games found");
        
        const lastArchive = archives[archives.length - 1];
        const gamesRes = await axios.get(lastArchive);
        
        const fetchedGames = gamesRes.data.games.reverse().slice(0, 20);
        
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
        setGames(formatted);
      } else {
        const res = await axios.get(`https://lichess.org/api/games/user/${username}?max=20&pgnInJson=true`, {
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
      }
    } catch (err: any) {
      setError("Failed to fetch games.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGames();
  }, [username, platform]);

  useEffect(() => {
    if (!selectedMonth || !isImportModalOpen) {
       setPreviewCount(null);
       return;
    }
    let isCancelled = false;
    const fetchPreview = async () => {
      setIsFetchingPreview(true);
      try {
        if (platform === 'chesscom') {
          const res = await axios.get(selectedMonth);
          if (!isCancelled) setPreviewCount(res.data.games ? res.data.games.length : 0);
        } else {
          // Lichess doesn't easily expose count without downloading everything.
          // We'll just skip precise preview for Lichess or set a placeholder.
          if (!isCancelled) setPreviewCount(null); 
        }
      } catch (err) {
        if (!isCancelled) setPreviewCount(null);
      } finally {
        if (!isCancelled) setIsFetchingPreview(false);
      }
    };
    const timeout = setTimeout(fetchPreview, 300);
    return () => { clearTimeout(timeout); isCancelled = true; };
  }, [selectedMonth, platform, isImportModalOpen]);

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

  const handleOpenImportModal = async () => {
    setIsImportModalOpen(true);
    setFetchingMonths(true);
    setError(null);
    setImportProgress(null);
    setPreviewCount(null);
    try {
      if (platform === 'chesscom') {
        const archivesRes = await axios.get(`https://api.chess.com/pub/player/${username}/games/archives`);
        const arch = archivesRes.data.archives || [];
        const options = arch.reverse().map((url: string) => {
          const parts = url.split('/');
          const year = parts[parts.length - 2];
          const month = parts[parts.length - 1];
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return {
            label: format(date, 'MMMM yyyy'),
            value: url
          };
        });
        setAvailableMonths(options);
        if (options.length > 0) setSelectedMonth(options[0].value);
      } else {
        const options = [];
        const now = new Date();
        for(let i=0; i<24; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          options.push({
            label: format(d, 'MMMM yyyy'),
            value: `${d.getFullYear()}-${d.getMonth()}`
          });
        }
        setAvailableMonths(options);
        if (options.length > 0) setSelectedMonth(options[0].value);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch available months.");
    } finally {
      setFetchingMonths(false);
    }
  };

  const handleImportGames = async () => {
    if (!username || !selectedMonth) return;
    setImporting(true);
    setError(null);
    setLoading(true);
    try {
      let fetchedGames = [];
      if (platform === 'chesscom') {
        const gamesRes = await axios.get(selectedMonth);
        fetchedGames = gamesRes.data.games.reverse();
      } else {
        const [yearStr, monthStr] = selectedMonth.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        
        const since = new Date(year, month, 1).getTime();
        const until = new Date(year, month + 1, 0, 23, 59, 59, 999).getTime();

        const res = await axios.get(`https://lichess.org/api/games/user/${username}?max=100&pgnInJson=true&since=${since}&until=${until}`, {
          headers: { Accept: 'application/x-ndjson' }
        });
        const lines = res.data.split('\n').filter((l: string) => l.trim().length > 0);
        fetchedGames = lines.map((l: string) => JSON.parse(l));
      }

      setImportProgress({ current: 0, total: fetchedGames.length });
      
      const formatted = [];
      for (let idx = 0; idx < fetchedGames.length; idx++) {
         const g = fetchedGames[idx];
         if (platform === 'chesscom') {
           formatted.push({
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
           });
         } else {
           formatted.push({
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
           });
         }
         
         if (idx % 5 === 0 || idx === fetchedGames.length - 1) {
            setImportProgress({ current: idx + 1, total: fetchedGames.length });
            await new Promise(r => setTimeout(r, 10)); // tiny artificial delay for UI update
         }
      }

      setGames(formatted);
      setIsImportModalOpen(false);
    } catch (err: any) {
      setError("Failed to import games.");
    } finally {
      setImporting(false);
      setLoading(false);
      setImportProgress(null);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showToast("Link copied!");
    setIsShareOpen(false);
  };


  return (
    <div className="min-h-screen bg-[#111] text-gray-300 p-8 font-sans relative">
      {engineLoading && (
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
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-medium text-white flex items-center gap-2">
            Chess history of <span className="bg-yellow-600/20 text-yellow-500 px-2 py-0.5 rounded text-lg">{username}</span>
          </h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button onClick={() => setIsShareOpen(!isShareOpen)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium">
                <Share2 size={16} /> Share
              </button>
              {isShareOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsShareOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                    <button onClick={copyLink} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      Copy Link
                    </button>
                    <button onClick={() => { window.open('https://twitter.com/intent/tweet?text=Check out my MasterMind chess history!', '_blank'); setIsShareOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      Share to X / Twitter
                    </button>
                    <button onClick={() => { window.open('https://discord.com', '_blank'); setIsShareOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors">
                      Share to Discord
                    </button>
                  </div>
                </>
              )}
            </div>
            <button onClick={fetchGames} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-sm font-medium">
              <RefreshCw size={16} /> Refresh
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-gray-400 font-medium">
              Showing 1-{games.length} of {games.length} games
            </div>
            <button onClick={handleOpenImportModal} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10 transition-colors text-sm font-bold">
              <Download size={16} /> Import Games
            </button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-yellow-500" />
            </div>
          ) : error ? (
            <div className="py-20 text-center text-red-400">{error}</div>
          ) : (
            <div className="w-full">
              {/* Table Header */}
              <div className="grid grid-cols-[auto_1fr_2fr_1fr_1fr_auto] gap-4 items-center pb-4 border-b border-white/5 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="w-10 flex justify-center"><Settings size={14} /></div>
                <div>Date</div>
                <div>Players</div>
                <div>Time</div>
                <div>Result</div>
                <div className="w-10"></div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-white/5">
                {games.map((game, i) => {
                  const isWhite = game.white.toLowerCase() === username.toLowerCase();
                  const isWin = (isWhite && game.result === '1-0') || (!isWhite && game.result === '0-1');
                  const isDraw = game.result === '1/2-1/2';
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => handleAnalyzeGame(game.pgn || game.id)}
                      className="grid grid-cols-[auto_1fr_2fr_1fr_1fr_auto] gap-4 items-center py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                    >
                      {/* Icon */}
                      <div className="w-10 flex justify-center">
                        <div className="w-6 h-6 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-gray-500 bg-[#222]">
                          ?
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-sm">
                        <div className="text-gray-200 font-medium">{format(new Date(game.endTime * 1000), 'MMM d')}</div>
                        <div className="text-gray-500 text-xs">{format(new Date(game.endTime * 1000), 'yyyy')}</div>
                      </div>

                      {/* Players */}
                      <div className="space-y-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-gray-200 shrink-0" />
                          <span className={`font-medium ${isWhite ? 'text-yellow-500' : 'text-gray-300'}`}>
                            {game.white} <span className="text-gray-500 font-normal">({game.whiteRating})</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-gray-500 shrink-0" />
                          <span className={`font-medium ${!isWhite ? 'text-yellow-500' : 'text-gray-300'}`}>
                            {game.black} <span className="text-gray-500 font-normal">({game.blackRating})</span>
                          </span>
                        </div>
                      </div>

                      {/* Time */}
                      <div className="text-sm">
                        <div className="flex items-center gap-1.5 text-gray-300">
                          <span className="text-orange-400">⚡</span>
                          {game.timeClass}
                        </div>
                      </div>

                      {/* Result */}
                      <div>
                        <div className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          isWin ? 'bg-green-500/20 text-green-400' : isDraw ? 'bg-gray-500/20 text-gray-300' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isWin ? '✓ Win' : isDraw ? '= Draw' : '✗ Loss'}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase font-medium mt-1 pl-1">Rated</div>
                      </div>

                      {/* Action */}
                      <div className="w-10 flex justify-center">
                        <div className="w-8 h-8 rounded bg-yellow-600/20 text-yellow-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ChevronRight size={16} />
                        </div>
                        <div className="w-8 h-8 opacity-50 flex items-center justify-center filter sepia text-xl">
                          ♟
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
          <div className="bg-gray-900 border border-white/10 rounded-3xl w-full max-w-md p-6 shadow-[0_0_50px_rgba(234,179,8,0.05)] relative animate-in fade-in zoom-in-95 duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
            <button 
              onClick={() => setIsImportModalOpen(false)}
              className="absolute top-5 right-5 text-gray-500 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-full z-10"
            >
              <X size={18} />
            </button>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-inner ${platform === 'chesscom' ? 'bg-green-600' : 'bg-white'}`}>
                  {platform === 'chesscom' ? (
                    <svg viewBox="0 0 100 100" className="w-4 h-4 fill-white"><path d="M96.4,32.2c-0.8-2.6-3.1-4.3-5.8-4.3H74.3c-1.3,0-2.5,0.5-3.4,1.4l-11,11c-0.9,0.9-1.4,2.1-1.4,3.4v16.3c0,1.3,0.5,2.5,1.4,3.4l11,11c0.9,0.9,2.1,1.4,3.4,1.4h16.3c2.7,0,5-1.7,5.8-4.3c0.8-2.6,0.1-5.4-1.8-7.3l-11-11c-0.9-0.9-1.4-2.1-1.4-3.4s0.5-2.5,1.4-3.4l11-11C96.3,37.6,97.1,34.8,96.4,32.2z"/></svg>
                  ) : (
                    <div className="w-5 h-5 bg-black rounded-sm flex items-center justify-center"><div className="w-2.5 h-2.5 bg-white rotate-45"></div></div>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-black text-white leading-tight">Import Games</h2>
                  <p className="text-xs text-gray-400 font-medium">for <span className="text-yellow-500">{username}</span></p>
                </div>
              </div>
              
              {fetchingMonths ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <Loader2 className="w-8 h-8 animate-spin text-yellow-500" />
                  <p className="text-gray-400 text-sm font-medium tracking-wide">Fetching metadata...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-bold text-gray-300">Select Month</label>
                      <div className="text-[10px] uppercase tracking-widest font-bold text-gray-500">Archive</div>
                    </div>
                    
                    {/* Quick Select Chips */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {availableMonths.slice(0, 4).map((m, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedMonth(m.value)}
                          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all border ${selectedMonth === m.value ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50' : 'bg-white/5 text-gray-400 border-transparent hover:bg-white/10 hover:text-gray-200'}`}
                        >
                          {i === 0 ? 'This Month' : i === 1 ? 'Last Month' : m.label}
                        </button>
                      ))}
                    </div>

                    <select 
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="w-full bg-[#111] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 appearance-none font-medium shadow-inner"
                    >
                      <option disabled value="">Select a specific month...</option>
                      {availableMonths.map((m, i) => (
                        <option key={i} value={m.value}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Preview Count */}
                  <div className="h-6 flex items-center justify-center">
                    {isFetchingPreview ? (
                      <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                        <Loader2 className="w-3 h-3 animate-spin" /> Calculating...
                      </div>
                    ) : previewCount !== null ? (
                      <div className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        ~{previewCount} games found for selected month
                      </div>
                    ) : (
                      <div className="text-xs font-medium text-gray-500">Select a month to preview</div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => setIsImportModalOpen(false)}
                      disabled={importing}
                      className="flex-1 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleImportGames}
                      disabled={importing || !selectedMonth}
                      className="flex-[2] relative overflow-hidden bg-yellow-500 hover:bg-yellow-400 text-black font-black py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      {importing && importProgress ? (
                        <>
                          <div 
                            className="absolute inset-y-0 left-0 bg-yellow-600/30 transition-all duration-200" 
                            style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                          />
                          <span className="relative z-10 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Importing {importProgress.current}/{importProgress.total}...
                          </span>
                        </>
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          <Download size={18} className="group-hover:-translate-y-0.5 transition-transform" />
                          Import Games
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-800 border border-white/10 text-white px-6 py-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span className="font-bold text-sm tracking-wide">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#111] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-yellow-500" /></div>}>
      <HistoryContent />
    </Suspense>
  );
}

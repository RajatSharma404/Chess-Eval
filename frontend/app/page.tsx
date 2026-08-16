'use client';
import React, { useEffect, Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import { analyzeGame } from '../lib/api';
import { Search, User, FileText, Upload, Sparkles, Trophy, Flame, ChevronRight, Zap } from 'lucide-react';
import { AnalysisLoadingScreen } from '../components/AnalysisLoadingScreen';

const MASTER_GAMES = [
  {
    id: 'kasparov-topalov',
    title: 'Garry Kasparov vs. Veselin Topalov',
    subtitle: 'Wijk aan Zee (1999) · "Pearl of Wijk aan Zee"',
    desc: 'Features Kasparov\'s immortal rook sacrifice 24. Rxd4!! and a 15-move king hunt.',
    pgn: `[Event "Wijk aan Zee"]
[Site "Wijk aan Zee NED"]
[Date "1999.01.20"]
[Round "4"]
[White "Kasparov, Garry"]
[Black "Topalov, Veselin"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6 Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4 15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1 d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+ Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+ Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8 Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0`
  },
  {
    id: 'fischer-spassky',
    title: 'Bobby Fischer vs. Boris Spassky',
    subtitle: 'World Championship (1972) · Game 6',
    desc: 'Fischer plays 1. c4 for the first time in his life, crafting a flawless positional masterpiece.',
    pgn: `[Event "World Championship Match"]
[Site "Reykjavik ISL"]
[Date "1972.07.23"]
[Round "6"]
[White "Fischer, Robert James"]
[Black "Spassky, Boris V"]
[Result "1-0"]

1. c4 e6 2. Nf3 d5 3. d4 Nf6 4. Nc3 Be7 5. Bg5 O-O 6. e3 h6 7. Bh4 b6 8. cxd5 Nxd5 9. Bxe7 Qxe7 10. Nxd5 exd5 11. Rc1 Be6 12. Qa4 c5 13. Qa3 Rc8 14. Bb5 a6 15. dxc5 bxc5 16. O-O Ra7 17. Be2 Nd7 18. Nd4 Qf8 19. Nxe6 fxe6 20. e4 d4 21. f4 Qe7 22. e5 Rb8 23. Bc4 Kh8 24. Qh3 Nf8 25. b3 a5 26. f5 exf5 27. Rxf5 Nh7 28. Rcf1 Qd8 29. Qg3 Re7 30. h4 Rbb7 31. e6 Rbc7 32. Qe5 Qe8 33. a4 Qd8 34. R1f2 Qe8 35. R2f3 Qd8 36. Bd3 Qe8 37. Qe4 Nf6 38. Rxf6 gxf6 39. Rxf6 Kg8 40. Bc4 Kh8 41. Qf4 1-0`
  }
];

function HomeContent() {
  const { 
    gameUrl, 
    setGameUrl, 
    setAnalysisResult, 
    setLoading, 
    setError, 
    isLoading, 
    error, 
    progressStatus, 
    setProgressStatus,
    setAnalysisAbortController 
  } = useGameStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'chesscom' | 'lichess' | 'pgn'>('chesscom');
  const [username, setUsername] = useState('');
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('mastermind_saved_username');
      const savedPlatform = localStorage.getItem('mastermind_saved_platform');
      if (savedUser) setUsername(savedUser);
      if (savedPlatform === 'chesscom' || savedPlatform === 'lichess') {
        setActiveTab(savedPlatform as 'chesscom' | 'lichess');
      }
    } catch(e) {}
  }, []);

  const handleAnalyzeGame = async (pgn: string) => {
    const controller = new AbortController();
    setAnalysisAbortController(controller);
    setGameUrl(pgn);
    setLoading(true);
    setError(null);
    setProgressStatus("Initializing Stockfish 17 AVX2 engine...");
    try {
      const result = await analyzeGame(pgn, (status) => setProgressStatus(status), controller.signal);
      setAnalysisResult(result);
      router.push('/analyze');
    } catch (err: any) {
      if (err?.name === 'AbortError' || err?.message === 'Analysis cancelled' || controller.signal.aborted) {
        return;
      }
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressStatus(null);
      setAnalysisAbortController(null);
    }
  };

  const handleAnalyzeForm = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (activeTab === 'pgn' && gameUrl) {
      handleAnalyzeGame(gameUrl);
    } else if (activeTab === 'chesscom' && username) {
      localStorage.setItem('mastermind_saved_username', username);
      localStorage.setItem('mastermind_saved_platform', 'chesscom');
      router.push(`/history?user=${username}&platform=chesscom`);
    } else if (activeTab === 'lichess' && username) {
      localStorage.setItem('mastermind_saved_username', username);
      localStorage.setItem('mastermind_saved_platform', 'lichess');
      router.push(`/history?user=${username}&platform=lichess`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setGameUrl(content);
          handleAnalyzeGame(content);
        }
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    const pgnParam = searchParams.get('pgn');
    if (pgnParam) {
      setActiveTab('pgn');
      setGameUrl(pgnParam);
      handleAnalyzeGame(pgnParam);
    }
  }, [searchParams]);

  return (
    <main className="flex-1 w-full bg-[#09090b] flex flex-col items-center justify-center p-4 lg:p-8 relative overflow-hidden font-sans">
      
      {/* Background Mesh Grid */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/20 blur-[150px] rounded-full animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse duration-[5s] pointer-events-none z-0" />

      {isLoading && <AnalysisLoadingScreen />}

      <div className="max-w-4xl w-full text-center space-y-8 z-10 pt-8 pb-12 flex-1 flex flex-col justify-center">
        
        {/* HERO HEADER */}
        <div className="space-y-4 flex flex-col items-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <Sparkles size={14} />
            <span>Stockfish 17 (WASM) & Google Gemini 2.0 AI</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none">
            CHESS<span className="text-emerald-400">EVAL</span>
          </h1>
          <p className="text-zinc-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Professional-grade chess analysis, non-destructive game branching, and natural language AI coaching right in your browser.
          </p>
        </div>

        {/* INPUT TABS & FORM */}
        <div className="bg-zinc-900/80 border border-white/10 p-2 sm:p-4 rounded-3xl shadow-2xl backdrop-blur-xl max-w-2xl mx-auto w-full">
          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-1.5 bg-black/40 p-1.5 rounded-2xl mb-4 border border-white/5">
            {[
              { id: 'chesscom', label: 'Chess.com' },
              { id: 'lichess', label: 'Lichess' },
              { id: 'pgn', label: 'PGN Direct / File' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleAnalyzeForm} className="space-y-4">
            {activeTab !== 'pgn' ? (
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder={`Enter ${activeTab === 'chesscom' ? 'Chess.com' : 'Lichess'} Username...`}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  placeholder="Paste raw PGN text here..."
                  value={gameUrl}
                  onChange={(e) => setGameUrl(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/10 rounded-2xl p-3.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 h-28 resize-none font-mono"
                />

                {/* File Dropzone */}
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-3 cursor-pointer bg-white/5 hover:bg-emerald-500/5 transition-all">
                  <Upload size={18} className="text-emerald-400 mb-1" />
                  <span className="text-xs text-zinc-300 font-semibold">Or upload .pgn file</span>
                  <input type="file" accept=".pgn" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] text-sm uppercase tracking-wider"
            >
              <span>{activeTab === 'pgn' ? 'Analyze Game Now' : 'Fetch & Review Games'}</span>
              <ChevronRight size={18} />
            </button>
          </form>
        </div>

        {/* MASTER GAMES SHOWCASE */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
              <Trophy size={16} className="text-emerald-400" />
              <span>Master Game Showcase</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">One-click evaluation</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {MASTER_GAMES.map((mg) => (
              <button
                key={mg.id}
                onClick={() => handleAnalyzeGame(mg.pgn)}
                className="p-5 rounded-2xl bg-zinc-900/60 border border-white/10 hover:border-emerald-500/50 hover:bg-zinc-900 transition-all text-left group shadow-lg flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-black text-sm text-white group-hover:text-emerald-400 transition-colors mb-1">
                    {mg.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-emerald-400/90 mb-2">{mg.subtitle}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{mg.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-bold text-emerald-400">
                  <span>Analyze Game</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </div>
              </button>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b] flex items-center justify-center" />}>
      <HomeContent />
    </Suspense>
  );
}

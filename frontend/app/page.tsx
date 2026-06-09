'use client';
import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '../store/useGameStore';
import { analyzeGame } from '../lib/api';
import { Search, Loader2, Play, Sparkles } from 'lucide-react';

function HomeContent() {
  const { gameUrl, setGameUrl, setAnalysisResult, setLoading, setError, isLoading, error, progressStatus, setProgressStatus } = useGameStore();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleAnalyze = async (e?: React.FormEvent | string) => {
    let targetUrl = gameUrl;
    
    if (typeof e === 'string') {
      targetUrl = e;
    } else if (e && typeof e !== 'string' && 'preventDefault' in e) {
      e.preventDefault();
    }

    if (!targetUrl) return;

    setGameUrl(targetUrl);
    setLoading(true);
    setError(null);
    setProgressStatus("Initializing...");

    try {
      const result = await analyzeGame(targetUrl, (status) => setProgressStatus(status));
      setAnalysisResult(result);
      router.push('/analyze');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgressStatus(null);
    }
  };

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam) {
      handleAnalyze(urlParam);
    }
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
          <div className="flex flex-col items-center gap-6">
            <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            <h2 className="text-2xl font-black text-white uppercase tracking-widest animate-pulse">Running Stockfish 17 Analysis...</h2>
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

      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-cyan-600/10 blur-[150px] rounded-full animate-pulse duration-[5s]" />

      <div className="max-w-3xl w-full text-center space-y-12 z-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-4 animate-bounce">
            <Sparkles size={12} /> Powered by Stockfish 17
          </div>
          <h1 className="text-7xl sm:text-8xl font-black tracking-tighter text-white leading-[0.9]">
            MASTER<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-cyan-400">MIND</span>
          </h1>
          <p className="text-gray-400 text-lg sm:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Elevate your game with professional-grade analysis and AI-driven tactical insights.
          </p>
        </div>

        <form onSubmit={handleAnalyze} className="relative group max-w-2xl mx-auto">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-cyan-500 to-emerald-600 rounded-3xl blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200 animate-gradient-xy"></div>
          <div className="relative bg-gray-900/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-3 flex flex-col sm:flex-row items-center shadow-3xl">
            <div className="flex items-center flex-1 w-full">
              <Search className="ml-4 text-gray-500 hidden sm:block" size={20} />
              <textarea 
                rows={1}
                placeholder="Paste Lichess/Chess.com URL or Raw PGN"
                className="bg-transparent border-none focus:ring-0 text-white flex-1 p-5 text-lg outline-none placeholder:text-gray-600 font-medium resize-none whitespace-nowrap overflow-hidden"
                value={gameUrl}
                onChange={(e) => setGameUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAnalyze(e as any);
                  }
                }}
              />
            </div>
            <button 
              disabled={isLoading || !gameUrl}
              className="w-full sm:w-auto bg-white text-black font-black py-5 px-10 rounded-xl transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            >
              {isLoading ? <Loader2 className="animate-spin" /> : <>ANALYZE <Play size={16} fill="black" /></>}
            </button>
          </div>
          {error && (
            <p className="mt-6 text-red-400 text-sm font-bold animate-shake uppercase tracking-widest">{error}</p>
          )}
        </form>

        <div className="flex flex-wrap items-center justify-center gap-10 opacity-30 mt-8 mb-4">
           <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all cursor-default">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><div className="w-4 h-4 bg-black rotate-45"></div></div>
              <span className="text-white font-black text-sm uppercase tracking-widest">Lichess</span>
           </div>
           <div className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all cursor-default">
              <svg viewBox="0 0 100 100" className="w-8 h-8 fill-[#81b64c]"><path d="M96.4,32.2c-0.8-2.6-3.1-4.3-5.8-4.3H74.3c-1.3,0-2.5,0.5-3.4,1.4l-11,11c-0.9,0.9-1.4,2.1-1.4,3.4v16.3c0,1.3,0.5,2.5,1.4,3.4l11,11c0.9,0.9,2.1,1.4,3.4,1.4h16.3c2.7,0,5-1.7,5.8-4.3c0.8-2.6,0.1-5.4-1.8-7.3l-11-11c-0.9-0.9-1.4-2.1-1.4-3.4s0.5-2.5,1.4-3.4l11-11C96.3,37.6,97.1,34.8,96.4,32.2z"/></svg>
              <span className="text-[#81b64c] font-black text-sm uppercase tracking-widest">Chess.com</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto mt-8 text-left relative z-10">
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl hover:border-white/10 transition-colors">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-3 opacity-90">
              <div className="w-5 h-5 bg-white rounded flex items-center justify-center"><div className="w-2 h-2 bg-black rotate-45"></div></div>
              How to get Lichess PGN
            </h3>
            <ul className="space-y-3 text-gray-400 font-medium text-sm">
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">1.</span> Open your completed game</li>
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">2.</span> Click the "Analysis Board" button</li>
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">3.</span> Scroll down and click "Share & export"</li>
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">4.</span> Copy the text in the "PGN" box and paste it above</li>
            </ul>
          </div>
          <div className="bg-gray-900/40 backdrop-blur-xl border border-white/5 rounded-2xl p-6 shadow-2xl hover:border-white/10 transition-colors">
            <h3 className="text-sm font-black text-white uppercase tracking-[0.2em] mb-4 flex items-center gap-3 opacity-90">
               <svg viewBox="0 0 100 100" className="w-5 h-5 fill-[#81b64c]"><path d="M96.4,32.2c-0.8-2.6-3.1-4.3-5.8-4.3H74.3c-1.3,0-2.5,0.5-3.4,1.4l-11,11c-0.9,0.9-1.4,2.1-1.4,3.4v16.3c0,1.3,0.5,2.5,1.4,3.4l11,11c0.9,0.9,2.1,1.4,3.4,1.4h16.3c2.7,0,5-1.7,5.8-4.3c0.8-2.6,0.1-5.4-1.8-7.3l-11-11c-0.9-0.9-1.4-2.1-1.4-3.4s0.5-2.5,1.4-3.4l11-11C96.3,37.6,97.1,34.8,96.4,32.2z"/></svg>
              How to get Chess.com PGN
            </h3>
            <ul className="space-y-3 text-gray-400 font-medium text-sm">
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">1.</span> Open your completed game</li>
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">2.</span> Click the "Share" icon on the right panel</li>
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">3.</span> Select the "PGN" tab at the top of the popup</li>
              <li className="flex items-start gap-3"><span className="text-emerald-500 font-black">4.</span> Copy the entire PGN text and paste it above</li>
            </ul>
          </div>
        </div>
      </div>
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

import React from 'react';
import { Home, Github, Mail, Shield, Zap, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 font-sans flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050505_100%)] pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-600/10 blur-[150px] rounded-full animate-pulse pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-teal-600/10 blur-[150px] rounded-full animate-pulse duration-[5s] pointer-events-none z-0" />

      {/* Navbar */}
      <header className="border-b border-white/5 px-6 py-4 flex items-center justify-between bg-zinc-950/40 backdrop-blur-2xl sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/history" className="p-2 hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-white/10 text-zinc-400 hover:text-white">
            <ChevronLeft size={20} />
          </Link>
          <div className="h-6 w-[1px] bg-white/10" />
          <div className="flex items-center gap-3">
            <span className="text-2xl grayscale opacity-80 text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.5)]">♟</span>
            <span className="text-sm font-black tracking-widest text-white mt-1">CHESSEVAL</span>
          </div>
        </div>
        <Link href="/" className="text-sm font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2">
          <Home size={16} /> Home
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 px-6 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
              About <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-500 drop-shadow-[0_0_20px_rgba(20,184,166,0.4)]">ChessEval</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              We are revolutionizing chess analysis by combining the raw power of Stockfish 17 with the natural language intelligence of Google Gemini 2.0.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-900/80 transition-colors duration-300">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <Zap size={24} className="text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Client-Side Evaluation</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                Our platform runs the world's most powerful chess engine directly in your browser using WebAssembly. This means zero latency, unparalleled speed, and complete privacy for your analysis sessions.
              </p>
            </div>

            <div className="bg-zinc-900/50 backdrop-blur-md border border-zinc-800 rounded-2xl p-8 hover:bg-zinc-900/80 transition-colors duration-300">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                <Shield size={24} className="text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Privacy First</h3>
              <p className="text-zinc-400 leading-relaxed text-sm">
                We believe your games belong to you. Your imported games are processed securely, and our architecture is designed to minimize server footprint, ensuring your data remains yours.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
            <h2 className="text-2xl font-bold text-white mb-6 relative z-10">Powered by the Best</h2>
            <div className="flex flex-wrap justify-center gap-4 relative z-10">
              <span className="px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-300 shadow-sm">Next.js 15</span>
              <span className="px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-300 shadow-sm">Stockfish 17 WASM</span>
              <span className="px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-300 shadow-sm">Google Gemini 2.0</span>
              <span className="px-4 py-2 rounded-full bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-300 shadow-sm">Tailwind CSS</span>
            </div>
          </div>

          <div className="mt-20 border-t border-zinc-800 pt-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <a href="https://github.com/RajatSharma404/Chess-Eval" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium">
                <Github size={20} /> GitHub
              </a>
              <a href="mailto:support@chesseval.com" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors font-medium">
                <Mail size={20} /> Contact Support
              </a>
            </div>
            <div className="text-zinc-500 text-sm">
              © 2026 ChessEval. All rights reserved.
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}

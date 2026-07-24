'use client';

import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useGameStore, CoachPersona } from '../../store/useGameStore';
import { Chessboard } from 'react-chessboard';
import { 
  Sparkles, 
  Send, 
  User, 
  Bot, 
  Loader2, 
  Zap, 
  ShieldAlert, 
  Trophy, 
  Swords, 
  HelpCircle,
  RotateCcw
} from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function SupercoachPage() {
  const { gameUrl, coachPersona, setCoachPersona, analysisResult } = useGameStore();

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: "Welcome to **Supercoach AI**! Select a coach persona above, paste a FEN or load your game, and ask me anything about tactics, plans, or positional concepts!"
    }
  ]);
  const [input, setInput] = useState('');
  const [customFen, setCustomFen] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const personas: { id: CoachPersona; name: string; title: string; desc: string; icon: any; color: string }[] = [
    {
      id: 'magnus',
      name: 'GM Magnus',
      title: 'Precision & Rigor',
      desc: 'Direct, sharp evaluation of tactical errors and concrete calculation.',
      icon: Trophy,
      color: 'emerald'
    },
    {
      id: 'anna',
      name: 'Coach Anna',
      title: 'Supportive & Clear',
      desc: 'Encouraging lessons, structural rules of thumb, and clear analogies.',
      icon: Sparkles,
      color: 'teal'
    },
    {
      id: 'tal',
      name: 'Mikhail Tal',
      title: 'Sacrifices & Attacks',
      desc: 'Focuses on initiative, piece activity, dynamic play, and king attacks.',
      icon: Swords,
      color: 'orange'
    },
    {
      id: 'capablanca',
      name: 'GM Capablanca',
      title: 'Positional Simplicity',
      desc: 'Master of pawn structures, piece coordination, and effortless endgames.',
      icon: ShieldAlert,
      color: 'cyan'
    }
  ];

  const quickQuestions = [
    "What was the single biggest mistake in this game?",
    "How can I improve my piece activity in the middlegame?",
    "What pawn structure plan should I follow here?",
    "Can you spot any missed tactical combinations?"
  ];

  const currentFen = customFen || (analysisResult?.moves.length ? analysisResult.moves[analysisResult.moves.length - 1].fen_after : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (customMsg?: string) => {
    const textToSend = customMsg || input.trim();
    if (!textToSend || isLoading) return;

    if (!customMsg) setInput('');
    setMessages(prev => [...prev, { role: 'user', content: textToSend }]);
    setIsLoading(true);

    try {
      const historyToSend = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      
      const res = await axios.post('/api/coach', {
        message: `${textToSend}\n\nCurrent Board FEN: ${currentFen}`,
        pgn: gameUrl,
        history: historyToSend,
        persona: coachPersona
      });

      setMessages(prev => [...prev, { role: 'model', content: res.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "I encountered an issue getting a response. Please check your Gemini API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#09090b] text-gray-100 p-4 lg:p-8 flex flex-col font-sans max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg">
              <Sparkles size={20} />
            </span>
            <h1 className="text-2xl lg:text-3xl font-black text-white tracking-wide">Supercoach AI Studio</h1>
          </div>
          <p className="text-xs text-zinc-400">
            Interactive grandmaster analysis powered by Gemini 2.0. Pick your coach personality and inspect any position!
          </p>
        </div>

        {/* FEN Quick Input */}
        <div className="flex items-center gap-2 bg-zinc-900 border border-white/10 p-1.5 rounded-xl w-full md:w-auto">
          <input
            type="text"
            placeholder="Paste custom FEN..."
            value={customFen}
            onChange={(e) => setCustomFen(e.target.value)}
            className="bg-transparent text-xs px-3 py-1.5 text-zinc-200 focus:outline-none w-full md:w-64 font-mono"
          />
          {customFen && (
            <button
              onClick={() => setCustomFen('')}
              className="p-1.5 text-zinc-400 hover:text-white"
              title="Reset FEN"
            >
              <RotateCcw size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Persona Selection Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {personas.map((p) => {
          const Icon = p.icon;
          const isSelected = coachPersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setCoachPersona(p.id)}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]'
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl bg-white/5 ${isSelected ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="font-extrabold text-sm text-white">{p.name}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] bg-emerald-500 text-black font-black px-1.5 py-0.5 rounded uppercase">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] font-semibold text-emerald-400/90 mb-1">{p.title}</p>
                <p className="text-[11px] text-zinc-400 leading-snug">{p.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[500px]">
        {/* Left Column: Interactive Mini Board & Presets */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Position Preview Board */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold text-zinc-300">Position Preview</span>
              <span className="text-[10px] text-emerald-400 font-mono">Stockfish WASM Active</span>
            </div>
            <div className="w-full aspect-square rounded-xl overflow-hidden shadow-inner border border-white/10">
              <Chessboard position={currentFen} arePiecesDraggable={false} showBoardNotation={true} />
            </div>
          </div>

          {/* Quick Question Chips */}
          <div className="bg-zinc-900/80 border border-white/10 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 mb-2">
              <HelpCircle size={14} className="text-emerald-400" />
              <span>Suggested Queries</span>
            </div>
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="w-full text-left text-xs p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/10 hover:text-emerald-300 border border-white/5 transition-all text-zinc-300"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: AI Chat Box */}
        <div className="lg:col-span-8 bg-zinc-900/80 border border-white/10 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 bg-zinc-950/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Bot size={18} />
              </div>
              <div>
                <span className="font-extrabold text-sm text-white capitalize">{coachPersona} Coach</span>
                <span className="text-[10px] text-zinc-400 block">Powered by Gemini 2.0 Flash</span>
              </div>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-[500px] custom-scrollbar">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex gap-3 max-w-[90%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap shadow-md ${
                  msg.role === 'user'
                    ? 'bg-cyan-950/40 text-cyan-100 border border-cyan-500/30 rounded-tr-none'
                    : 'bg-zinc-800/80 text-zinc-200 border border-white/10 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Loader2 size={16} className="animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-zinc-800/80 border border-white/10 text-zinc-400 text-xs flex items-center gap-2">
                  <span>Calculating tactical insights...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Box */}
          <div className="p-4 border-t border-white/10 bg-zinc-950/60">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={`Ask ${coachPersona} coach about moves, plans, or tactics...`}
                className="w-full bg-zinc-900 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-2 p-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg disabled:opacity-40 transition-colors"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

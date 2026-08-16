import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { useGameStore, CoachPersona } from '../store/useGameStore';
import { Send, Bot, User, Loader2, Sparkles, Trophy, Swords, ShieldAlert } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const CoachChat: React.FC = () => {
  const { gameUrl, coachPersona, setCoachPersona, analysisResult, currentMoveIndex } = useGameStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: "Hello! I'm your AI Coach. I've analyzed your game. What would you like to explore about this position or game?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMove = currentMoveIndex >= 0 && analysisResult && currentMoveIndex < analysisResult.moves.length 
    ? analysisResult.moves[currentMoveIndex] 
    : null;

  const scrollToBottom = () => {
    if (messagesEndRef.current && messagesEndRef.current.parentElement) {
      const container = messagesEndRef.current.parentElement;
      container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const historyToSend = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const contextPrompt = currentMove 
        ? `[Position: Move ${currentMove.move_number} · Played: ${currentMove.move_san} · Best was: ${currentMove.best_move_san} · FEN: ${currentMove.fen_after}]\n${userMessage}`
        : userMessage;
      
      const res = await axios.post('/api/coach', {
        message: contextPrompt,
        pgn: gameUrl,
        history: historyToSend,
        persona: coachPersona
      });

      setMessages(prev => [...prev, { role: 'model', content: res.data.response }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error communicating with the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#121214] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
      <div className="bg-zinc-950/70 border-b border-white/10 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-emerald-400" />
          <span className="font-extrabold text-xs uppercase tracking-wider text-emerald-400 capitalize">
            {coachPersona} AI Coach
          </span>
        </div>

        {/* Persona Pill Selector */}
        <div className="flex gap-1 bg-white/5 p-0.5 rounded-lg border border-white/10">
          {(['magnus', 'anna', 'tal', 'capablanca'] as CoachPersona[]).map((p) => (
            <button
              key={p}
              onClick={() => setCoachPersona(p)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize transition-all ${
                coachPersona === p
                  ? 'bg-emerald-500 text-black shadow'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
              {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
            </div>
            <div className={`p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === 'user' ? 'bg-cyan-900/30 text-cyan-50 border border-cyan-500/20 rounded-tr-sm' : 'bg-white/5 text-gray-300 border border-white/5 rounded-tl-sm'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%]">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-emerald-500/20 text-emerald-400">
              <Loader2 size={12} className="animate-spin" />
            </div>
            <div className="p-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-sm text-gray-500 text-sm flex items-center gap-2">
              <span className="animate-pulse">Thinking</span>
              <span className="flex gap-0.5">
                <span className="animate-bounce delay-100">.</span>
                <span className="animate-bounce delay-200">.</span>
                <span className="animate-bounce delay-300">.</span>
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-white/5 border-t border-white/5">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about your game..."
            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 resize-none h-12 scrollbar-hide"
            rows={1}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-2 p-1.5 bg-emerald-500 text-black rounded-lg hover:bg-emerald-400 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 transition-colors"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

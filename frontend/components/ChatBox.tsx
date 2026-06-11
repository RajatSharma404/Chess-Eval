import React, { useState, useRef, useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Send, Loader2, Bot, User } from 'lucide-react';
import axios from 'axios';

export default function ChatBox() {
  const { currentMoveIndex, analysisResult } = useGameStore();
  const [messages, setMessages] = useState<{role: 'user'|'bot', content: string}[]>([{
    role: 'bot',
    content: "Hi, I'm Tommy, your AI Coach! Ask me anything about this game or the current position."
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const moveData = analysisResult?.moves[currentMoveIndex];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await axios.post('/api/chat', {
        messages: [...messages, { role: 'user', content: userMsg }],
        fen: moveData?.fen_after || "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
        moveData: moveData
      });
      
      setMessages(prev => [...prev, { role: 'bot', content: res.data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'bot', content: "Sorry, I'm having trouble connecting to my brain right now." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/40 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl mt-4">
      <div className="bg-emerald-900/50 p-3 border-b border-emerald-500/20 flex items-center gap-3">
        <Bot className="text-emerald-400" size={20} />
        <h3 className="text-white font-bold tracking-widest uppercase text-sm">Supercoach Tommy</h3>
        <span className="ml-auto text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded uppercase font-black tracking-widest">Beta</span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-cyan-600/50' : 'bg-emerald-600/50'}`}>
              {msg.role === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-xl p-3 text-sm font-medium leading-relaxed ${msg.role === 'user' ? 'bg-cyan-500/20 text-white rounded-tr-none' : 'bg-emerald-500/10 text-gray-200 border border-emerald-500/10 rounded-tl-none'}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-emerald-600/50">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-emerald-500/10 rounded-xl rounded-tl-none p-3 border border-emerald-500/10">
              <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
        <input 
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Tommy about this position..."
          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
        />
        <button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}

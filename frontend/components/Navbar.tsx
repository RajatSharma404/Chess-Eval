'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameStore, BoardTheme } from '../store/useGameStore';
import { 
  Home, 
  BarChart2, 
  Zap, 
  Sparkles, 
  History, 
  Info, 
  Volume2, 
  VolumeX, 
  Palette, 
  Keyboard,
  X
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { soundEnabled, toggleSound, boardTheme, setBoardTheme } = useGameStore();

  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Analyze', href: '/analyze', icon: BarChart2 },
    { label: 'Train', href: '/train', icon: Zap, badge: 'NEW' },
    { label: 'Supercoach', href: '/supercoach', icon: Sparkles },
    { label: 'History', href: '/history', icon: History },
    { label: 'About', href: '/about', icon: Info },
  ];

  const themes: { id: BoardTheme; name: string; lightColor: string; darkColor: string }[] = [
    { id: 'emerald', name: 'Emerald Glass', lightColor: '#e2e8f0', darkColor: '#059669' },
    { id: 'wood', name: 'Classic Wood', lightColor: '#f0d9b5', darkColor: '#b58863' },
    { id: 'cyber', name: 'Cyber Neon', lightColor: '#1e293b', darkColor: '#06b6d4' },
    { id: 'slate', name: 'Midnight Slate', lightColor: '#334155', darkColor: '#0f172a' },
  ];

  return (
    <>
      <header className="w-full bg-[#0d0d0e]/90 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-4 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <span className="text-xl">♟</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black tracking-widest text-white">CHESSIGMA</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-400/80 font-mono tracking-wider">AI EVAL & ENGINE</span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/5 border border-white/10 p-1 rounded-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,0.2)]'
                    : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1 py-0.2 rounded font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={soundEnabled ? 'Mute Sound Effects' : 'Enable Sound Effects'}
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-zinc-800/80 border-white/10 text-zinc-500 hover:text-white'
            }`}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          {/* Theme Selector */}
          <button
            onClick={() => setShowThemeModal(!showThemeModal)}
            title="Board Themes"
            className="p-2 rounded-lg bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-all flex items-center gap-1.5 text-xs font-medium"
          >
            <Palette size={16} className="text-teal-400" />
            <span className="hidden sm:inline capitalize">{boardTheme}</span>
          </button>

          {/* Keyboard Shortcuts */}
          <button
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard Shortcuts"
            className="p-2 rounded-lg bg-zinc-800/80 border border-white/10 text-zinc-400 hover:text-white hover:bg-zinc-700/80 transition-all"
          >
            <Keyboard size={16} />
          </button>
        </div>
      </header>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette size={18} className="text-teal-400" />
                <h3 className="text-sm font-bold text-white">Choose Board Theme</h3>
              </div>
              <button 
                onClick={() => setShowThemeModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {themes.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setBoardTheme(t.id);
                    setShowThemeModal(false);
                  }}
                  className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                    boardTheme === t.id
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden grid grid-cols-2 grid-rows-2 border border-white/20 shadow-inner">
                    <div style={{ backgroundColor: t.lightColor }} />
                    <div style={{ backgroundColor: t.darkColor }} />
                    <div style={{ backgroundColor: t.darkColor }} />
                    <div style={{ backgroundColor: t.lightColor }} />
                  </div>
                  <span className="text-xs font-semibold text-zinc-200">{t.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121214] border border-white/10 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard size={18} className="text-emerald-400" />
                <h3 className="text-base font-bold text-white">Keyboard Shortcuts</h3>
              </div>
              <button 
                onClick={() => setShowShortcutsModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { key: '← / →', desc: 'Step Previous / Next move' },
                { key: 'Home / End', desc: 'Jump to Game Start / Game End' },
                { key: 'F', desc: 'Flip Board orientation (White / Black)' },
                { key: 'Space', desc: 'Toggle Auto-Play presentation' },
                { key: 'Esc', desc: 'Close dialogs / Modals' },
              ].map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/5">
                  <span className="text-zinc-400">{shortcut.desc}</span>
                  <kbd className="px-2 py-1 bg-zinc-800 border border-white/15 rounded text-emerald-400 font-mono font-bold">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

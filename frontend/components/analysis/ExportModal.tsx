'use client';

import React, { useState } from 'react';
import { AnalysisResult } from '../../store/useGameStore';
import { X, Copy, Download, Check, Share2, FileText, Code } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult;
  currentFen: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  analysisResult,
  currentFen,
}) => {
  const [copiedType, setCopiedType] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  // Generate Annotated PGN with evaluation comments and NAGs
  const generateAnnotatedPgn = () => {
    let pgn = `[Event "ChessEval Game Analysis"]\n`;
    pgn += `[Site "ChessEval Platform"]\n`;
    pgn += `[Date "${new Date().toISOString().slice(0, 10)}"]\n`;
    pgn += `[White "${analysisResult.white_player}"]\n`;
    pgn += `[Black "${analysisResult.black_player}"]\n`;
    pgn += `[WhiteElo "${analysisResult.white_elo || '1500'}"]\n`;
    pgn += `[BlackElo "${analysisResult.black_elo || '1500'}"]\n`;
    pgn += `[Opening "${analysisResult.opening || 'Custom Opening'}"]\n`;
    pgn += `[WhiteAccuracy "${analysisResult.white_accuracy}%"]\n`;
    pgn += `[BlackAccuracy "${analysisResult.black_accuracy}%"]\n\n`;

    analysisResult.moves.forEach((m, idx) => {
      const isWhite = idx % 2 === 0;
      if (isWhite) {
        pgn += `${Math.floor(idx / 2) + 1}. `;
      }
      pgn += `${m.move_san} `;

      // NAG glyphs
      let nag = '';
      if (m.classification === 'brilliant') nag = '$3 ';
      else if (m.classification === 'great') nag = '$1 ';
      else if (m.classification === 'inaccuracy') nag = '$6 ';
      else if (m.classification === 'mistake') nag = '$2 ';
      else if (m.classification === 'blunder') nag = '$4 ';

      const evalStr = (m.eval_after_cp / 100).toFixed(2);
      pgn += `${nag}{ [%eval ${evalStr}] } `;

      if (!isWhite && idx < analysisResult.moves.length - 1) {
        pgn += '\n';
      }
    });

    return pgn.trim();
  };

  const handleDownloadPgn = () => {
    const pgnText = generateAnnotatedPgn();
    const blob = new Blob([pgnText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${analysisResult.white_player}_vs_${analysisResult.black_player}_annotated.pgn`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121214] border border-white/10 rounded-3xl max-w-lg w-full shadow-2xl p-6 space-y-6 animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Share2 size={20} />
            </div>
            <div>
              <h2 className="text-base font-black text-white">Export & Share Game</h2>
              <p className="text-xs text-zinc-400">Copy position FEN, raw PGN, or download annotated PGN.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors border border-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Export Options */}
        <div className="space-y-4 text-xs">
          {/* Current FEN */}
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-white/5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <Code size={14} className="text-teal-400" /> Current Position (FEN)
              </span>
              <button
                onClick={() => handleCopy(currentFen, 'fen')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
              >
                {copiedType === 'fen' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedType === 'fen' ? 'Copied!' : 'Copy FEN'}</span>
              </button>
            </div>
            <p className="font-mono text-[11px] text-zinc-500 truncate bg-zinc-900/80 p-2 rounded-lg border border-white/5 select-all">
              {currentFen}
            </p>
          </div>

          {/* Annotated PGN */}
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-zinc-300 flex items-center gap-1.5">
                <FileText size={14} className="text-emerald-400" /> Annotated PGN
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopy(generateAnnotatedPgn(), 'pgn')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold transition-all"
                >
                  {copiedType === 'pgn' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copiedType === 'pgn' ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownloadPgn}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold transition-all"
                >
                  <Download size={12} />
                  <span>Download .pgn</span>
                </button>
              </div>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Includes engine evaluation comments, accuracy scores, and tactical NAG glyphs for import into ChessBase, Lichess, or Chess.com.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors text-xs"
        >
          Done
        </button>
      </div>
    </div>
  );
};

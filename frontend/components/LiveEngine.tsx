'use client';
import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { StockfishEngine } from '../lib/engine';
import { Settings, FastForward } from 'lucide-react';
import { Chess } from 'chess.js';

let sharedEngine: StockfishEngine | null = null;

export function LiveEngine() {
  const { analysisResult, currentMoveIndex } = useGameStore();
  const [engineLines, setEngineLines] = useState<any[]>([]);
  const [evalCp, setEvalCp] = useState<number>(0);
  const [isMate, setIsMate] = useState<boolean>(false);
  const [depth, setDepth] = useState<number>(0);
  const [engineOn, setEngineOn] = useState(true);
  
  useEffect(() => {
    if (!sharedEngine) {
      sharedEngine = new StockfishEngine();
    }
    
    return () => {
      // Don't quit engine on unmount so we can reuse it, just stop analysis
      sharedEngine?.stopAnalysis();
    };
  }, []);

  useEffect(() => {
    if (!engineOn || !sharedEngine || !analysisResult) {
      sharedEngine?.stopAnalysis();
      return;
    }

    const currentFen = currentMoveIndex >= 0 
      ? analysisResult.moves[currentMoveIndex].fen_after 
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    // Figure out whose turn it is to format CP correctly
    const chess = new Chess(currentFen);
    const isWhiteTurn = chess.turn() === 'w';

    sharedEngine.startContinuousAnalysis(currentFen, (lines, bestEvalCp, currentDepth) => {
      setDepth(currentDepth);
      // Engine eval is always relative to the side to move
      setEvalCp(isWhiteTurn ? bestEvalCp : -bestEvalCp);
      
      let bestMate = false;
      if (lines.length > 0 && lines[0]) {
        bestMate = lines[0].isMate;
      }
      setIsMate(bestMate);
      
      // Convert moves to SAN for display
      const formattedLines = lines.map(line => {
        const tempChess = new Chess(currentFen);
        const sanMoves = [];
        let firstMoveSan = '';
        let firstMovePiece = 'p';

        for (let i = 0; i < Math.min(line.pv.length, 6); i++) {
          const moveUci = line.pv[i];
          try {
            const moveObj = tempChess.move({
              from: moveUci.substring(0, 2),
              to: moveUci.substring(2, 4),
              promotion: moveUci.length === 5 ? moveUci[4] : undefined
            });
            if (i === 0) {
              firstMoveSan = moveObj ? moveObj.san : moveUci;
              firstMovePiece = moveObj ? moveObj.piece : 'p';
            }
            sanMoves.push(moveObj ? moveObj.san : moveUci);
          } catch (e) {
            // Invalid move in PV (rare but possible during rapid updates)
            if (i === 0) {
              firstMoveSan = moveUci;
              firstMovePiece = 'p'; // fallback
            }
            sanMoves.push(moveUci);
            break;
          }
        }

        return {
          ...line,
          firstMoveSan,
          firstMovePiece,
          sanMoves: sanMoves.join(' '),
          displayScore: isWhiteTurn ? line.scoreCp : -line.scoreCp
        };
      });

      setEngineLines(formattedLines);
    });

  }, [currentMoveIndex, engineOn, analysisResult]);

  const formatScore = (cp: number, mate?: boolean) => {
    if (mate) {
      return cp > 0 ? `M${cp}` : `-M${Math.abs(cp)}`;
    }
    const score = cp / 100;
    return score > 0 ? `+${score.toFixed(2)}` : score.toFixed(2);
  };

  const getPieceIcon = (piece: string) => {
    switch (piece.toLowerCase()) {
      case 'n': return '♞';
      case 'b': return '♝';
      case 'r': return '♜';
      case 'q': return '♛';
      case 'k': return '♚';
      default: return '♟';
    }
  };

  return (
    <div className="flex-none flex flex-col bg-[#111] rounded-xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex items-center text-sm font-bold text-gray-500 border-b border-white/10">
        <button className="flex-1 py-4 hover:text-gray-300 transition-colors">Report</button>
        <button className="flex-1 py-4 text-yellow-500 border-b-2 border-yellow-500">Analysis</button>
        <button className="flex-1 py-4 hover:text-gray-300 transition-colors">Coach</button>
        <button className="flex-1 py-4 hover:text-gray-300 transition-colors">Settings</button>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        {/* Engine Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            {/* Toggle */}
            <button 
              onClick={() => setEngineOn(!engineOn)}
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors ${engineOn ? 'bg-yellow-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${engineOn ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className="text-2xl font-black text-white">
              {formatScore(evalCp, isMate)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-yellow-500 font-bold text-sm">Depth {depth}</div>
              <div className="text-gray-500 text-[10px] font-bold">SF 17.1 Lite</div>
            </div>
            <Settings className="text-gray-500 hover:text-white cursor-pointer transition-colors" size={20} />
          </div>
        </div>

        {/* Follow Best Line Button */}
        <button className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors mb-6 shadow-lg shadow-yellow-500/20 active:scale-95">
          <FastForward size={18} /> Follow Best Line
        </button>

        {/* Engine Lines */}
        <div className="space-y-4">
          {engineLines.map((line, idx) => (
            <div key={idx} className="flex items-center gap-3 text-sm group cursor-pointer">
              <div className={`w-6 h-6 flex items-center justify-center font-bold text-lg ${idx === 0 ? 'text-yellow-500' : 'text-yellow-500/70'}`}>
                {getPieceIcon(line.firstMovePiece)}
              </div>
              <div className="font-bold text-white w-8">
                {line.firstMoveSan}
              </div>
              <div className={`px-2 py-0.5 rounded text-xs font-bold ${line.displayScore > 0 ? 'bg-white text-black' : 'bg-black text-white border border-gray-600'}`}>
                {formatScore(line.displayScore, line.isMate)}
              </div>
              <div className="text-gray-400 font-medium truncate flex-1 group-hover:text-white transition-colors">
                {line.sanMoves.split(' ').slice(1).join(' ')}
              </div>
            </div>
          ))}
          {engineLines.length === 0 && engineOn && (
            <div className="text-center text-gray-500 py-4 font-bold animate-pulse">Calculating lines...</div>
          )}
        </div>
      </div>
    </div>
  );
}

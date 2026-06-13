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

    const currentMove = currentMoveIndex >= 0 && currentMoveIndex < analysisResult.moves.length 
      ? analysisResult.moves[currentMoveIndex] 
      : null;
      
    const currentFen = currentMove?.fen_after 
      ? currentMove.fen_after 
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
        let sanSequence = '';
        let firstMoveSan = '';
        let firstMovePiece = 'p';
        const pvMoves: any[] = [];

        for (let i = 0; i < Math.min(line.pv.length, 10); i++) {
          const moveUci = line.pv[i];
          const isWhite = tempChess.turn() === 'w';
          const moveNumStr = isWhite ? `${tempChess.moveNumber()}. ` : (i === 0 ? `${tempChess.moveNumber()}... ` : '');
          
          try {
            const moveObj = tempChess.move({
              from: moveUci.substring(0, 2),
              to: moveUci.substring(2, 4),
              promotion: moveUci.length === 5 ? moveUci[4] : undefined
            });
            const san = moveObj ? moveObj.san : moveUci;
            if (i === 0) {
              firstMoveSan = san;
              firstMovePiece = moveObj ? moveObj.piece : 'p';
            }
            sanSequence += moveNumStr + san + ' ';
            pvMoves.push({
              move_san: san,
              fen_after: tempChess.fen(),
              move_uci: moveUci
            });
          } catch (e) {
            if (i === 0) {
              firstMoveSan = moveUci;
              firstMovePiece = 'p';
            }
            sanSequence += moveNumStr + moveUci + ' ';
            break;
          }
        }

        return {
          ...line,
          firstMoveSan,
          firstMovePiece,
          sanSequence: sanSequence.trim(),
          pvMoves,
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

  const handleLineClick = (line: any) => {
    if (!analysisResult) return;
    const baseMoves = analysisResult.moves.slice(0, currentMoveIndex + 1);
    const newMoves = [...baseMoves];
    
    // Convert pvMoves to the Move interface format roughly
    line.pvMoves.forEach((m: any, i: number) => {
      newMoves.push({
        move_number: 0,
        color: i % 2 === 0 ? 'white' : 'black',
        move_san: m.move_san,
        move_uci: m.move_uci,
        fen_before: '',
        fen_after: m.fen_after,
        eval_before_cp: 0,
        eval_after_cp: line.displayScore * 100,
        cp_loss: 0,
        classification: 'book',
        best_move_san: '',
        best_move_uci: ''
      } as any);
    });
    
    useGameStore.getState().branchGame(newMoves, baseMoves.length);
  };

  return (
    <div className="flex-none flex flex-col bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      {/* Tabs */}
      <div className="flex items-center text-sm font-bold text-gray-500 border-b border-white/10 bg-black/20">
        <button className="flex-1 py-4 hover:text-gray-300 transition-colors">Report</button>
        <button className="flex-1 py-4 text-yellow-400 border-b-2 border-yellow-400">Analysis</button>
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
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors shadow-inner ${engineOn ? 'bg-yellow-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${engineOn ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className="text-2xl font-black text-white drop-shadow-md">
              {formatScore(evalCp, isMate)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-right">
            <div>
              <div className="text-yellow-400 font-bold text-sm">Depth {depth}</div>
              <div className="text-cyan-400 text-[10px] font-black tracking-wider uppercase">Stockfish 17 (AVX2)</div>
            </div>
            <Settings className="text-gray-400 hover:text-white cursor-pointer transition-colors hover:rotate-90 duration-300" size={20} />
          </div>
        </div>

        {/* Follow Best Line Button */}
        <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all mb-6 shadow-[0_0_15px_rgba(234,179,8,0.3)] hover:shadow-[0_0_25px_rgba(234,179,8,0.5)] active:scale-[0.98]">
          <FastForward size={18} /> Follow Best Line
        </button>

        {/* Engine Lines */}
        <div className="space-y-2">
          {engineLines.map((line, idx) => (
            <div 
              key={idx} 
              onClick={() => handleLineClick(line)}
              className="flex items-start gap-3 text-sm group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-all border border-transparent hover:border-white/10"
            >
              <div className={`w-6 h-6 flex items-center justify-center font-black text-lg mt-0.5 drop-shadow-md ${idx === 0 ? 'text-yellow-400' : 'text-cyan-400/80'}`}>
                {getPieceIcon(line.firstMovePiece)}
              </div>
              <div className="font-black text-white w-8 mt-1">
                {line.firstMoveSan}
              </div>
              <div className={`px-2 py-0.5 mt-0.5 rounded text-[10px] font-black shadow-sm ${line.displayScore > 0 ? 'bg-white text-black' : 'bg-gray-800 text-white border border-gray-600'}`}>
                {formatScore(line.displayScore, line.isMate)}
              </div>
              <div className="text-gray-400 font-medium flex-1 group-hover:text-cyan-50 transition-colors text-xs leading-relaxed line-clamp-1 group-hover:line-clamp-none">
                {line.sanSequence.split(' ').slice(1).join(' ')}
              </div>
            </div>
          ))}
          {engineLines.length === 0 && engineOn && (
            <div className="text-center text-cyan-400 py-6 font-black tracking-widest text-xs uppercase animate-pulse">Calculating lines...</div>
          )}
        </div>
      </div>
    </div>
  );
}

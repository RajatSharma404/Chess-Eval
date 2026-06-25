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
    <div className="flex-1 w-full flex flex-col bg-gray-900/50 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl min-h-0">

      <div className="p-4 flex-1 flex flex-col min-h-0">
        {/* Engine Header */}
        <div className="flex flex-col mb-4">
          <div className="flex items-center gap-4 mb-2">
            {/* Toggle */}
            <button 
              onClick={() => setEngineOn(!engineOn)}
              className={`w-12 h-6 rounded-full flex items-center p-1 transition-colors shadow-inner ${engineOn ? 'bg-amber-500' : 'bg-gray-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow ${engineOn ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
            <span className={`text-[2rem] font-black drop-shadow-md leading-none ${evalCp > 30 ? 'text-white' : evalCp < -30 ? 'text-zinc-400' : 'text-zinc-300'}`}>
              {formatScore(evalCp, isMate)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 font-bold">Depth {depth}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-emerald-400 font-black tracking-wider uppercase">Stockfish 17 (AVX2)</span>
            </div>
            <Settings className="text-gray-400 hover:text-white cursor-pointer transition-colors hover:rotate-90 duration-300" size={16} />
          </div>
        </div>

        {/* Follow Best Line Button */}
        <button 
          onClick={() => {
            if (engineLines.length > 0) handleLineClick(engineLines[0]);
          }}
          title="Press Space"
          className="w-full bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-all mb-4 shadow-[0_0_15px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] active:scale-[0.98] group relative"
        >
          <FastForward size={18} /> Follow Best Line
          <span className="absolute right-4 text-[10px] font-bold bg-black/20 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">SPACE</span>
        </button>

        {/* Engine Lines */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative pr-2">
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide font-black mb-3 sticky top-0 bg-[#161a22] z-10 py-1">Top Engine Moves</div>
          {engineLines.length > 0 ? engineLines.map((line, idx) => (
            <div 
              key={idx} 
              onClick={() => handleLineClick(line)}
              className="flex items-center gap-3 text-sm group cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-lg transition-all border border-transparent hover:border-white/10 relative"
            >
              <div className="w-6 h-6 flex items-center justify-center font-black text-lg drop-shadow-md text-zinc-400">
                {getPieceIcon(line.firstMovePiece)}
              </div>
              <div className="font-black text-white w-8">
                {line.firstMoveSan}
              </div>
              <div className="px-2 py-0.5 rounded-full text-[10px] font-black shadow-sm bg-zinc-700 text-white min-w-[42px] text-center">
                {formatScore(line.displayScore, line.isMate)}
              </div>
              
              <div className="relative flex-1 min-w-0">
                <div className="text-gray-400 font-medium truncate text-xs transition-colors group-hover:text-white">
                  {line.sanSequence.split(' ').slice(1).join(' ')}
                </div>
                {/* Tooltip */}
                <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block z-50">
                  <div className="bg-zinc-900 border border-white/10 shadow-xl rounded-lg p-3 text-xs text-zinc-300 w-max max-w-xs whitespace-pre-wrap font-medium">
                    <span className="font-bold text-white mr-2">{line.firstMoveSan}</span>
                    {line.sanSequence.split(' ').slice(1).join(' ')}
                  </div>
                </div>
              </div>
            </div>
          )) : engineOn ? (
            <div className="animate-pulse space-y-3 py-2">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center gap-3 p-2 -mx-2">
                   <div className="w-6 h-6 bg-gray-700 rounded-full" />
                   <div className="w-8 h-4 bg-gray-700 rounded" />
                   <div className="w-[42px] h-5 bg-gray-700 rounded-full" />
                   <div className="flex-1 h-4 bg-gray-700 rounded" />
                 </div>
               ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

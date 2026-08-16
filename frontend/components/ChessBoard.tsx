import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from '../store/useGameStore';
import { soundManager } from '../lib/sound';

export const ChessBoard: React.FC<{ boardOrientation: 'white' | 'black'; showThreats?: boolean }> = ({ 
  boardOrientation, 
  showThreats = false 
}) => {
  const { 
    analysisResult, 
    currentMoveIndex, 
    previewMoveIndex, 
    activeVariation,
    setActiveVariation,
    addVariation,
    appendVariationMove,
    setCurrentMoveIndex,
    soundEnabled, 
    boardTheme 
  } = useGameStore();

  let fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
  let currentMove: any = null;

  if (activeVariation && analysisResult) {
    const parentMove = analysisResult.moves[activeVariation.parentMoveIndex];
    const variationList = parentMove?.variations?.[activeVariation.variationIndex];
    const varMove = variationList?.[activeVariation.moveIndex];
    if (varMove) {
      fen = varMove.fen_after;
      currentMove = varMove;
    }
  } else {
    const activeMoveIndex = previewMoveIndex !== null ? previewMoveIndex : currentMoveIndex;
    if (activeMoveIndex >= 0 && analysisResult && activeMoveIndex < analysisResult.moves.length) {
      currentMove = analysisResult.moves[activeMoveIndex];
      fen = currentMove.fen_after;
    }
  }

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Play audio sound on move step change
  useEffect(() => {
    if (!mounted || !soundEnabled || !currentMove) return;

    if (currentMove.classification === 'blunder') {
      soundManager.playBlunderSound();
    } else if (currentMove.move_san?.includes('+') || currentMove.move_san?.includes('#')) {
      soundManager.playCheckSound();
    } else if (currentMove.move_san?.includes('x')) {
      soundManager.playCaptureSound();
    } else {
      soundManager.playMoveSound();
    }
  }, [currentMove, soundEnabled, mounted]);

  if (!mounted) return <div className="w-[500px] aspect-square bg-gray-800 rounded-xl animate-pulse" />;

  const getThemeStyles = () => {
    switch (boardTheme) {
      case 'wood':
        return {
          customDarkSquareStyle: { backgroundColor: '#b58863' },
          customLightSquareStyle: { backgroundColor: '#f0d9b5' },
        };
      case 'cyber':
        return {
          customDarkSquareStyle: { backgroundColor: '#0f172a' },
          customLightSquareStyle: { backgroundColor: '#1e293b' },
        };
      case 'slate':
        return {
          customDarkSquareStyle: { backgroundColor: '#1e293b' },
          customLightSquareStyle: { backgroundColor: '#475569' },
        };
      case 'emerald':
      default:
        return {
          customDarkSquareStyle: { backgroundColor: '#059669' },
          customLightSquareStyle: { backgroundColor: '#e2e8f0' },
        };
    }
  };

  const getSquareStyles = () => {
    const styles: any = {};
    if (currentMove && currentMove.move_uci && currentMove.move_uci.length >= 4) {
      const colorMap: any = {
        brilliant: 'rgba(6, 182, 212, 0.65)',
        best: 'rgba(34, 197, 94, 0.65)',
        good: 'rgba(134, 239, 172, 0.5)',
        inaccuracy: 'rgba(251, 191, 36, 0.65)',
        mistake: 'rgba(249, 115, 22, 0.65)',
        blunder: 'rgba(239, 68, 68, 0.65)',
      };
      
      const sourceSquare = currentMove.move_uci.slice(0, 2);
      const targetSquare = currentMove.move_uci.slice(2, 4);
      
      styles[sourceSquare] = { backgroundColor: 'rgba(251, 191, 36, 0.3)' };
      styles[targetSquare] = { backgroundColor: colorMap[currentMove.classification] || 'rgba(251, 191, 36, 0.5)' };
    }

    // Threat visualization: find attacked squares
    if (showThreats) {
      try {
        const testChess = new Chess(fen);
        const activeColor = testChess.turn();
        const opponentColor = activeColor === 'w' ? 'b' : 'w';
        
        // Find hanging/attacked pieces of the active side
        const board = testChess.board();
        board.forEach((row) => {
          row.forEach((piece) => {
            if (piece && piece.color === activeColor) {
              const square = piece.square;
              if (testChess.isAttacked(square, opponentColor)) {
                styles[square] = {
                  ...styles[square],
                  boxShadow: 'inset 0 0 0 3px #ef4444, 0 0 10px rgba(239, 68, 68, 0.5)',
                };
              }
            }
          });
        });
      } catch (e) {}
    }

    return styles;
  };

  const customArrows = () => {
    const arrows: any[] = [];

    if (currentMove) {
      const best = currentMove.best_move_uci;
      const played = currentMove.move_uci;

      if (['blunder', 'mistake', 'inaccuracy'].includes(currentMove.classification)) {
        if (played && played.length >= 4) {
          arrows.push([played.slice(0, 2), played.slice(2, 4), 'rgba(239, 68, 68, 0.85)']);
        }
        if (best && best.length >= 4) {
          arrows.push([best.slice(0, 2), best.slice(2, 4), 'rgba(16, 185, 129, 0.85)']);
        }
      }

      const activeMoveIndex = previewMoveIndex !== null ? previewMoveIndex : currentMoveIndex;
      const suggestion = analysisResult?.suggestions?.find(s => s.move_index === activeMoveIndex);
      if (suggestion?.arrow && suggestion.arrow.length === 2) {
        const [from, to] = suggestion.arrow;
        if ((from + to) !== played?.slice(0, 4) && (from + to) !== best?.slice(0, 4)) {
          arrows.push([from, to, 'rgba(168, 85, 247, 0.85)']);
        }
      }
    }

    return arrows;
  };

  const handlePieceDrop = (sourceSquare: string, targetSquare: string, piece: string) => {
    if (!analysisResult) return false;
    
    const chess = new Chess(fen);
    
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      });
      
      if (!move) return false;

      if (soundEnabled) {
        if (move.captured) soundManager.playCaptureSound();
        else soundManager.playMoveSound();
      }

      const moveUci = sourceSquare + targetSquare + (move.promotion || '');

      // Case 1: Already inside an active variation branch
      if (activeVariation) {
        const parentMove = analysisResult.moves[activeVariation.parentMoveIndex];
        const currentVar = parentMove?.variations?.[activeVariation.variationIndex] || [];
        const nextVarMoveIndex = activeVariation.moveIndex + 1;

        if (currentVar[nextVarMoveIndex] && currentVar[nextVarMoveIndex].move_uci === moveUci) {
          setActiveVariation({
            ...activeVariation,
            moveIndex: nextVarMoveIndex
          });
          return true;
        }

        const newVarMove: any = {
          move_number: Math.floor((activeVariation.parentMoveIndex + nextVarMoveIndex + 1) / 2) + 1,
          color: move.color === 'w' ? 'white' : 'black',
          move_san: move.san,
          move_uci: moveUci,
          fen_before: fen,
          fen_after: chess.fen(),
          eval_before_cp: 0,
          eval_after_cp: 0,
          cp_loss: 0,
          classification: 'good',
          best_move_san: '',
          best_move_uci: ''
        };

        appendVariationMove(activeVariation.parentMoveIndex, activeVariation.variationIndex, newVarMove);
        return true;
      }

      // Case 2: Move matches the next move in mainline
      const nextMainlineMove = analysisResult.moves[currentMoveIndex + 1];
      if (nextMainlineMove && nextMainlineMove.move_uci === moveUci) {
        setCurrentMoveIndex(currentMoveIndex + 1);
        return true;
      }

      // Case 3: Create a new variation branch under currentMoveIndex
      const parentIndex = Math.max(0, currentMoveIndex);
      const newMove: any = {
        move_number: Math.floor((parentIndex + 1) / 2) + 1,
        color: move.color === 'w' ? 'white' : 'black',
        move_san: move.san,
        move_uci: moveUci,
        fen_before: fen,
        fen_after: chess.fen(),
        eval_before_cp: 0,
        eval_after_cp: 0,
        cp_loss: 0,
        classification: 'good',
        best_move_san: '',
        best_move_uci: ''
      };

      addVariation(parentIndex, [newMove]);
      return true;
    } catch (e) {
      return false;
    }
  };

  const files = boardOrientation === 'white' ? ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] : ['h', 'g', 'f', 'e', 'd', 'c', 'b', 'a'];
  const ranks = boardOrientation === 'white' ? ['8', '7', '6', '5', '4', '3', '2', '1'] : ['1', '2', '3', '4', '5', '6', '7', '8'];

  const themeStyles = getThemeStyles();

  return (
    <div className="w-full h-full flex flex-col relative">
      <div className="w-full aspect-square relative z-10">
        {/* Ranks (Left) */}
        <div className="absolute left-0 top-0 bottom-6 w-6 flex flex-col justify-around text-[11px] font-bold text-zinc-500 text-center pointer-events-none">
          {ranks.map(r => <div key={r} className="flex-1 flex items-center justify-center">{r}</div>)}
        </div>
        
        {/* Board */}
        <div className="absolute left-6 right-0 top-0 bottom-6 rounded-xl overflow-hidden shadow-2xl border border-white/10">
          <Chessboard 
            position={fen} 
            boardOrientation={boardOrientation}
            customSquareStyles={getSquareStyles()}
            customDarkSquareStyle={themeStyles.customDarkSquareStyle}
            customLightSquareStyle={themeStyles.customLightSquareStyle}
            customArrows={customArrows() as any}
            arePiecesDraggable={true}
            onPieceDrop={handlePieceDrop}
            showBoardNotation={false}
          />
        </div>

        {/* Files (Bottom) */}
        <div className="absolute bottom-0 left-6 right-0 h-6 flex justify-around text-[11px] font-bold text-zinc-500 pointer-events-none">
          {files.map(f => <div key={f} className="flex-1 flex items-center justify-center">{f}</div>)}
        </div>
      </div>
    </div>
  );
};

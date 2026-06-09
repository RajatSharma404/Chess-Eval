import React, { useState } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from '../store/useGameStore';

export const ChessBoard: React.FC = () => {
  const { analysisResult, currentMoveIndex, branchGame } = useGameStore();
  const [boardOrientation, setBoardOrientation] = useState<'white' | 'black'>('white');
  
  const currentMove = currentMoveIndex >= 0 ? analysisResult?.moves[currentMoveIndex] : null;
  const fen = currentMove ? currentMove.fen_after : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-[500px] aspect-square bg-gray-800 rounded-xl" />;

  const getSquareStyles = () => {
    if (!currentMove) return {};
    const styles: any = {};
    const colorMap: any = {
      brilliant: 'rgba(2, 132, 199, 0.6)',
      best: 'rgba(34, 197, 94, 0.6)',
      good: 'rgba(132, 204, 22, 0.6)',
      inaccuracy: 'rgba(234, 179, 8, 0.6)',
      mistake: 'rgba(249, 115, 22, 0.6)',
      blunder: 'rgba(239, 68, 68, 0.6)',
    };
    
    const targetSquare = currentMove.move_uci.slice(2, 4);
    styles[targetSquare] = { backgroundColor: colorMap[currentMove.classification] || 'transparent' };
    return styles;
  };

  const customArrows = () => {
    if (!currentMove || !['blunder', 'mistake', 'inaccuracy'].includes(currentMove.classification)) return [];
    const best = currentMove.best_move_uci;
    const played = currentMove.move_uci;
    
    const arrows: any[] = [];
    if (played) {
      arrows.push([played.slice(0, 2), played.slice(2, 4), 'rgba(239, 68, 68, 0.8)']); // Red for the mistake
    }
    if (best) {
      arrows.push([best.slice(0, 2), best.slice(2, 4), 'rgba(16, 185, 129, 0.8)']); // Green for best move
    }

    const suggestion = analysisResult?.suggestions?.find(s => s.move_index === currentMoveIndex);
    if (suggestion?.arrow && suggestion.arrow.length === 2) {
        // Only push if it differs from best and played
        const [from, to] = suggestion.arrow;
        if ((from + to) !== played.slice(0,4) && (from + to) !== best?.slice(0,4)) {
            arrows.push([from, to, 'rgba(168, 85, 247, 0.8)']); // Purple for AI insight
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
      
      if (move) {
        const previousMoves = analysisResult.moves.slice(0, currentMoveIndex + 1);
        const evalScore = currentMove ? currentMove.eval_after_cp : 0; 
        
        const newMove: any = {
          move_number: Math.floor(previousMoves.length / 2) + 1,
          color: chess.turn() === 'w' ? 'black' : 'white',
          move_san: move.san,
          move_uci: sourceSquare + targetSquare,
          fen_before: fen,
          fen_after: chess.fen(),
          eval_before_cp: evalScore,
          eval_after_cp: evalScore, 
          cp_loss: 0,
          classification: 'good',
          best_move_san: '',
          best_move_uci: ''
        };
        
        const newMoves = [...previousMoves, newMove];
        branchGame(newMoves, newMoves.length - 1);
        return true;
      }
    } catch (e) {
      return false;
    }
    return false;
  };

  return (
    <div className="flex flex-col gap-6 items-center w-full">
      <div className="w-full max-w-[700px] aspect-square shadow-2xl rounded-xl overflow-hidden border-8 border-gray-800 bg-gray-800">
        <Chessboard 
          position={fen} 
          boardOrientation={boardOrientation}
          customSquareStyles={getSquareStyles()}
          customArrows={customArrows() as any}
          arePiecesDraggable={true}
          onPieceDrop={handlePieceDrop}
        />
      </div>
      <button 
        onClick={() => setBoardOrientation(o => o === 'white' ? 'black' : 'white')}
        className="px-6 py-2 bg-gray-800 text-gray-300 font-bold rounded-lg hover:bg-gray-700 transition-all border border-gray-700 shadow-lg text-xs uppercase tracking-widest"
      >
        Flip Board
      </button>
    </div>
  );
};

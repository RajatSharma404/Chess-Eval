import { Chess } from 'chess.js';
import { StockfishEngine } from './engine';

function winProb(cp: number): number {
  const capped = Math.max(-10000, Math.min(10000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * capped)) - 1);
}

function calculateAccuracy(avgWinProbLoss: number): number {
  if (avgWinProbLoss <= 0) return 100.0;
  const accuracy = 103.1668 * Math.exp(-0.04354 * avgWinProbLoss) - 3.1669;
  return Math.max(0, Math.min(100, accuracy));
}

function classifyMove(cpLoss: number, isBest: boolean, isCapture: boolean): string {
  if (isBest) {
    if (isCapture && cpLoss === 0) return 'best';
    return 'best';
  }
  if (cpLoss < 50) return 'good';
  if (cpLoss < 100) return 'inaccuracy';
  if (cpLoss < 300) return 'mistake';
  return 'blunder';
}

export async function analyzeGameLocal(pgn: string, onProgress: (status: string) => void): Promise<any> {
  const chess = new Chess();
  chess.loadPgn(pgn);
  
  const history = chess.history({ verbose: true });
  const totalMoves = history.length;
  
  const engine = new StockfishEngine();
  const testChess = new Chess();
  
  const movesAnalysis = [];
  const whiteCpl: number[] = [];
  const blackCpl: number[] = [];
  
  onProgress("Initializing WebAssembly Engine...");
  
  for (let i = 0; i < totalMoves; i++) {
    onProgress(`Analyzing move ${i + 1}/${totalMoves}...`);
    
    const fenBefore = testChess.fen();
    const move = history[i];
    
    // Evaluate before move
    const infoBefore = await engine.analyzePosition(fenBefore, 12); // lower depth for browser speed
    const evalBeforeCp = infoBefore.evalCp || 0;
    const bestMoveUci = infoBefore.bestMove;
    
    testChess.move(move);
    const fenAfter = testChess.fen();
    
    // Evaluate after move
    let evalAfterCp = 0;
    if (testChess.isGameOver()) {
      if (testChess.isCheckmate()) {
        evalAfterCp = (i % 2 === 0) ? 10000 : -10000; // White just moved (i%2==0) and mated black
      } else {
        evalAfterCp = 0; // Draw
      }
    } else {
      const infoAfter = await engine.analyzePosition(fenAfter, 12);
      evalAfterCp = infoAfter.evalCp || 0;
    }
    
    const evalBeforeRel = i % 2 === 0 ? evalBeforeCp : -evalBeforeCp;
    const evalAfterRel = i % 2 === 0 ? -evalAfterCp : evalAfterCp;
    
    let cpLoss = Math.max(0, evalBeforeRel - evalAfterRel);
    let wpLoss = Math.max(0, winProb(evalBeforeRel) - winProb(evalAfterRel));
    
    const isBest = bestMoveUci === move.from + move.to || bestMoveUci === move.from + move.to + (move.promotion || '');
    if (isBest) {
      cpLoss = 0;
      wpLoss = 0;
    }
    const classification = classifyMove(cpLoss, isBest, 'captured' in move);
    
    movesAnalysis.push({
      move_number: Math.floor(i / 2) + 1,
      color: i % 2 === 0 ? 'white' : 'black',
      move_san: move.san,
      move_uci: move.from + move.to + (move.promotion || ''),
      fen_before: fenBefore,
      fen_after: fenAfter,
      eval_before_cp: evalBeforeCp,
      eval_after_cp: i % 2 === 0 ? -evalAfterCp : evalAfterCp, // keep it white's perspective
      best_move_uci: bestMoveUci,
      best_move_san: bestMoveUci, // approximate
      cp_loss: cpLoss,
      classification
    });
    
    if (i % 2 === 0) whiteCpl.push(wpLoss);
    else blackCpl.push(wpLoss);
  }
  
  engine.quit();
  
  const whiteAcc = calculateAccuracy(whiteCpl.reduce((a, b) => a + b, 0) / (whiteCpl.length || 1));
  const blackAcc = calculateAccuracy(blackCpl.reduce((a, b) => a + b, 0) / (blackCpl.length || 1));
  
  onProgress("Generating AI suggestions...");
  
  // Generate suggestions via Next.js API
  let suggestions = [];
  const criticalMoves = movesAnalysis.filter(m => m.classification === 'blunder' || m.classification === 'mistake').slice(0, 3);
  
  for (const m of criticalMoves) {
    try {
      const res = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fenBefore: m.fen_before,
          playedMoveSan: m.move_san,
          bestMoveSan: m.best_move_san,
          evalCpAfter: m.eval_after_cp,
          cpLoss: m.cp_loss
        })
      });
      const data = await res.json();
      suggestions.push({
        move_index: movesAnalysis.indexOf(m),
        move_san: m.move_san,
        suggestion_text: data.explanation || data.suggestion_text,
        arrow: data.arrow
      });
    } catch (e) {
      console.error(e);
    }
  }

  return {
    opening: "Custom Opening",
    white_accuracy: whiteAcc,
    black_accuracy: blackAcc,
    critical_move_index: 0,
    moves: movesAnalysis,
    suggestions: suggestions
  };
}

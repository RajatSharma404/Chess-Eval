import { Chess } from 'chess.js';
import { StockfishEngine } from './engine';
import { AnalysisProgress, Move } from '../store/useGameStore';
import { getGameOpening } from './openings';

function winProb(cp: number): number {
  const capped = Math.max(-10000, Math.min(10000, cp));
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * capped)) - 1);
}

function calculateAccuracy(avgWinProbLoss: number): number {
  if (avgWinProbLoss <= 0) return 100.0;
  const accuracy = 103.1668 * Math.exp(-0.04354 * avgWinProbLoss) - 3.1669;
  return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
}

function classifyMove(cpLoss: number, isBest: boolean, isCapture: boolean): string {
  if (isBest || cpLoss <= 10) return 'best';
  if (cpLoss <= 40) return 'good';
  if (cpLoss <= 90) return 'inaccuracy';
  if (cpLoss <= 250) return 'mistake';
  return 'blunder';
}

function uciToSan(fen: string, uci: string | null): string {
  if (!uci || uci.length < 4) return '';
  try {
    const tempChess = new Chess(fen);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const promotion = uci.length > 4 ? uci[4] : undefined;
    const moveObj = tempChess.move({ from, to, promotion });
    return moveObj ? moveObj.san : uci;
  } catch (e) {
    return uci;
  }
}

export async function analyzeGameLocal(pgn: string, onProgress: (progress: AnalysisProgress | string) => void): Promise<any> {
  const chess = new Chess();
  chess.loadPgn(pgn);
  
  const headers = chess.header();
  const whitePlayer = headers['White'] || 'White Player';
  const blackPlayer = headers['Black'] || 'Black Player';
  const whiteElo = headers['WhiteElo'] || '1500';
  const blackElo = headers['BlackElo'] || '1500';
  let openingName = headers['Opening'] || headers['ECO'] || '';
  
  const history = chess.history({ verbose: true });
  const totalMoves = history.length;
  
  const engine = new StockfishEngine();
  const testChess = new Chess();
  
  const movesAnalysis: Move[] = [];
  const whiteWpLosses: number[] = [];
  const blackWpLosses: number[] = [];
  
  onProgress({ status: "Initializing Chess Engine..." });
  
  // Single-pass evaluation: evaluate initial position once
  let currentFen = testChess.fen();
  let currentEngineInfo = await engine.analyzePosition(currentFen, 12);
  
  for (let i = 0; i < totalMoves; i++) {
    const currentLine = history.slice(Math.max(0, i - 4), i + 1).map(m => m.san).join(' ');
    onProgress({
      status: `Analyzing move ${i + 1}/${totalMoves}...`,
      currentMove: i + 1,
      totalMoves,
      currentLine: `...${currentLine}`
    });
    
    const fenBefore = currentFen;
    const move = history[i];
    const isWhiteTurn = i % 2 === 0;
    
    const infoBefore = currentEngineInfo;
    const evalBeforeSide = infoBefore?.evalCp ?? 0;
    const bestMoveUci = infoBefore?.bestMove || '';
    const bestMoveSan = uciToSan(fenBefore, bestMoveUci);
    
    // Play move
    testChess.move(move);
    const fenAfter = testChess.fen();
    
    let evalAfterSide = 0;
    let evalAfterWhite = 0;
    
    if (testChess.isGameOver()) {
      if (testChess.isCheckmate()) {
        // Player who just moved delivered checkmate
        evalAfterSide = 10000;
        evalAfterWhite = isWhiteTurn ? 10000 : -10000;
        currentEngineInfo = { bestMove: null, evalCp: -10000 };
      } else {
        // Stalemate or draw
        evalAfterSide = 0;
        evalAfterWhite = 0;
        currentEngineInfo = { bestMove: null, evalCp: 0 };
      }
    } else {
      currentEngineInfo = await engine.analyzePosition(fenAfter, 12);
      // In fenAfter, it is the opponent's turn.
      // So currentEngineInfo.evalCp is the OPPONENT'S evaluation.
      // Therefore, the evaluation for the player who just moved is -currentEngineInfo.evalCp.
      const oppEval = currentEngineInfo?.evalCp ?? 0;
      evalAfterSide = -oppEval;
      evalAfterWhite = isWhiteTurn ? -oppEval : oppEval;
    }
    
    currentFen = fenAfter;
    
    const moveUci = move.from + move.to + (move.promotion || '');
    const isBest = (bestMoveUci === moveUci);
    
    let cpLoss = isBest ? 0 : Math.max(0, evalBeforeSide - evalAfterSide);
    let wpLoss = isBest ? 0 : Math.max(0, winProb(evalBeforeSide) - winProb(evalAfterSide));
    
    const classification = classifyMove(cpLoss, isBest, 'captured' in move && !!move.captured);
    
    movesAnalysis.push({
      move_number: Math.floor(i / 2) + 1,
      color: isWhiteTurn ? 'white' : 'black',
      move_san: move.san,
      move_uci: moveUci,
      fen_before: fenBefore,
      fen_after: fenAfter,
      eval_before_cp: isWhiteTurn ? evalBeforeSide : -evalBeforeSide,
      eval_after_cp: evalAfterWhite,
      best_move_uci: bestMoveUci,
      best_move_san: bestMoveSan || bestMoveUci,
      cp_loss: cpLoss,
      classification
    });
    
    if (isWhiteTurn) whiteWpLosses.push(wpLoss);
    else blackWpLosses.push(wpLoss);
  }
  
  engine.quit();
  
  // Detect opening if missing from PGN header
  if (!openingName || openingName === 'Custom Opening') {
    const detected = getGameOpening(movesAnalysis);
    openingName = detected && detected.name !== 'Starting Position' ? detected.name : 'Standard Chess Game';
  }
  
  const whiteAcc = calculateAccuracy(whiteWpLosses.reduce((a, b) => a + b, 0) / (whiteWpLosses.length || 1));
  const blackAcc = calculateAccuracy(blackWpLosses.reduce((a, b) => a + b, 0) / (blackWpLosses.length || 1));
  
  onProgress({
    status: "Generating AI suggestions...",
    currentMove: totalMoves,
    totalMoves,
    isComplete: true
  });
  
  // Generate suggestions via Next.js API
  const suggestions = [];
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
    opening: openingName,
    white_player: whitePlayer,
    black_player: blackPlayer,
    white_elo: whiteElo,
    black_elo: blackElo,
    white_accuracy: whiteAcc,
    black_accuracy: blackAcc,
    critical_move_index: 0,
    moves: movesAnalysis,
    suggestions: suggestions
  };
}

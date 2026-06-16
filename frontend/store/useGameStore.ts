import { create } from 'zustand';

export interface Move {
  move_number: number;
  color: 'white' | 'black';
  move_san: string;
  move_uci: string;
  fen_before: string;
  fen_after: string;
  eval_before_cp: number;
  eval_after_cp: number;
  cp_loss: number;
  classification: string;
  best_move_san: string;
  best_move_uci: string;
  top_3_moves?: { move_san: string, cp: number }[];
}

export interface Suggestion {
  move_index: number;
  move_san: string;
  suggestion_text: string;
  arrow?: string[];
}

export interface AnalysisResult {
  opening: string;
  white_player: string;
  black_player: string;
  white_elo: string;
  black_elo: string;
  white_accuracy: number;
  black_accuracy: number;
  critical_move_index: number;
  moves: Move[];
  suggestions: Suggestion[];
}

interface GameState {
  gameUrl: string;
  analysisResult: AnalysisResult | null;
  originalAnalysisResult: AnalysisResult | null;
  currentMoveIndex: number;
  isLoading: boolean;
  error: string | null;
  progressStatus: string | null;
  setGameUrl: (url: string) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setCurrentMoveIndex: (index: number) => void;
  setLoading: (loading: boolean) => void;
  setProgressStatus: (status: string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  branchGame: (newMoves: Move[], newIndex: number) => void;
  restoreMainline: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameUrl: '',
  analysisResult: null,
  originalAnalysisResult: null,
  currentMoveIndex: -1,
  isLoading: false,
  progressStatus: null,
  error: null,
  setGameUrl: (url) => set({ gameUrl: url }),
  setAnalysisResult: (result) => set({ analysisResult: result, originalAnalysisResult: result, currentMoveIndex: -1 }),
  setCurrentMoveIndex: (index) => set({ currentMoveIndex: index }),
  setLoading: (loading) => set({ isLoading: loading }),
  setProgressStatus: (status) => set({ progressStatus: status }),
  setError: (error) => set({ error }),
  reset: () => set({ gameUrl: '', analysisResult: null, originalAnalysisResult: null, currentMoveIndex: -1, error: null, progressStatus: null }),
  branchGame: (newMoves, newIndex) => set((state) => ({
    analysisResult: state.analysisResult ? { ...state.analysisResult, moves: newMoves } : null,
    originalAnalysisResult: state.originalAnalysisResult || state.analysisResult,
    currentMoveIndex: newIndex
  })),
  restoreMainline: () => set((state) => ({
    analysisResult: state.originalAnalysisResult,
    currentMoveIndex: state.originalAnalysisResult ? state.originalAnalysisResult.moves.length - 1 : -1
  }))
}));

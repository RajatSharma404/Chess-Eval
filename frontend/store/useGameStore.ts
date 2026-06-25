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
  variations?: Move[][];
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

export interface AnalysisProgress {
  status: string;
  currentMove?: number;
  totalMoves?: number;
  currentLine?: string;
  isComplete?: boolean;
}

interface GameState {
  gameUrl: string;
  analysisResult: AnalysisResult | null;
  originalAnalysisResult: AnalysisResult | null;
  currentMoveIndex: number;
  previewMoveIndex: number | null;
  isLoading: boolean;
  error: string | null;
  progressStatus: AnalysisProgress | null;
  setGameUrl: (url: string) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setCurrentMoveIndex: (index: number) => void;
  setPreviewMoveIndex: (index: number | null) => void;
  setLoading: (loading: boolean) => void;
  setProgressStatus: (status: AnalysisProgress | string | null) => void;
  setError: (error: string | null) => void;
  reset: () => void;
  branchGame: (newMoves: Move[], newIndex: number) => void;
  addVariation: (moveIndex: number, variation: Move[]) => void;
  restoreMainline: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  gameUrl: '',
  analysisResult: null,
  originalAnalysisResult: null,
  currentMoveIndex: -1,
  previewMoveIndex: null,
  isLoading: false,
  progressStatus: null,
  error: null,
  setGameUrl: (url) => set({ gameUrl: url }),
  setAnalysisResult: (result) => set({ analysisResult: result, originalAnalysisResult: result, currentMoveIndex: -1, previewMoveIndex: null }),
  setCurrentMoveIndex: (index) => set({ currentMoveIndex: index, previewMoveIndex: null }),
  setPreviewMoveIndex: (index) => set({ previewMoveIndex: index }),
  setLoading: (loading) => set({ isLoading: loading }),
  setProgressStatus: (status) => {
    if (typeof status === 'string') {
      set({ progressStatus: { status } });
    } else {
      set({ progressStatus: status });
    }
  },
  setError: (error) => set({ error }),
  reset: () => set({ gameUrl: '', analysisResult: null, originalAnalysisResult: null, currentMoveIndex: -1, error: null, progressStatus: null }),
  branchGame: (newMoves, newIndex) => set((state) => ({
    analysisResult: state.analysisResult ? { ...state.analysisResult, moves: newMoves } : null,
    originalAnalysisResult: state.originalAnalysisResult || state.analysisResult,
    currentMoveIndex: newIndex
  })),
  addVariation: (moveIndex, variation) => set((state) => {
    if (!state.analysisResult) return state;
    const newMoves = [...state.analysisResult.moves];
    const move = newMoves[moveIndex];
    if (move) {
      newMoves[moveIndex] = {
        ...move,
        variations: [...(move.variations || []), variation]
      };
    }
    return {
      analysisResult: { ...state.analysisResult, moves: newMoves }
    };
  }),
  restoreMainline: () => set((state) => ({
    analysisResult: state.originalAnalysisResult,
    currentMoveIndex: state.originalAnalysisResult ? state.originalAnalysisResult.moves.length - 1 : -1
  }))
}));

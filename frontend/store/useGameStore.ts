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

export interface ActiveVariation {
  parentMoveIndex: number;
  variationIndex: number;
  moveIndex: number;
}

export type BoardTheme = 'emerald' | 'wood' | 'cyber' | 'slate';
export type CoachPersona = 'magnus' | 'anna' | 'tal' | 'capablanca';

interface GameState {
  gameUrl: string;
  analysisResult: AnalysisResult | null;
  originalAnalysisResult: AnalysisResult | null;
  currentMoveIndex: number;
  previewMoveIndex: number | null;
  activeVariation: ActiveVariation | null;
  isLoading: boolean;
  error: string | null;
  progressStatus: AnalysisProgress | null;
  analysisAbortController: AbortController | null;
  
  // Customization & Media
  soundEnabled: boolean;
  boardTheme: BoardTheme;
  isPlaying: boolean;
  playbackSpeed: number;
  coachPersona: CoachPersona;

  setGameUrl: (url: string) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setCurrentMoveIndex: (index: number) => void;
  setPreviewMoveIndex: (index: number | null) => void;
  setActiveVariation: (v: ActiveVariation | null) => void;
  setLoading: (loading: boolean) => void;
  setProgressStatus: (status: AnalysisProgress | string | null) => void;
  setAnalysisAbortController: (ctrl: AbortController | null) => void;
  cancelAnalysis: () => void;
  setError: (error: string | null) => void;
  reset: () => void;
  branchGame: (newMoves: Move[], newIndex: number) => void;
  addVariation: (moveIndex: number, variation: Move[]) => void;
  appendVariationMove: (parentMoveIndex: number, variationIndex: number, move: Move) => void;
  deleteVariation: (parentMoveIndex: number, variationIndex: number) => void;
  restoreMainline: () => void;
  
  toggleSound: () => void;
  setBoardTheme: (theme: BoardTheme) => void;
  setIsPlaying: (playing: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  setCoachPersona: (persona: CoachPersona) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  gameUrl: '',
  analysisResult: null,
  originalAnalysisResult: null,
  currentMoveIndex: -1,
  previewMoveIndex: null,
  activeVariation: null,
  isLoading: false,
  progressStatus: null,
  analysisAbortController: null,
  error: null,
  
  soundEnabled: true,
  boardTheme: 'emerald',
  isPlaying: false,
  playbackSpeed: 1,
  coachPersona: 'magnus',

  setGameUrl: (url) => set({ gameUrl: url }),
  setAnalysisResult: (result) => set({ 
    analysisResult: result, 
    originalAnalysisResult: result, 
    currentMoveIndex: -1, 
    previewMoveIndex: null,
    activeVariation: null 
  }),
  setCurrentMoveIndex: (index) => set({ currentMoveIndex: index, previewMoveIndex: null, activeVariation: null }),
  setPreviewMoveIndex: (index) => set({ previewMoveIndex: index }),
  setActiveVariation: (v) => set({ activeVariation: v }),
  setLoading: (loading) => set({ isLoading: loading }),
  setProgressStatus: (status) => {
    if (typeof status === 'string') {
      set({ progressStatus: { status } });
    } else {
      set({ progressStatus: status });
    }
  },
  setAnalysisAbortController: (ctrl) => set({ analysisAbortController: ctrl }),
  cancelAnalysis: () => {
    const { analysisAbortController } = get();
    if (analysisAbortController) {
      analysisAbortController.abort();
    }
    set({
      isLoading: false,
      progressStatus: null,
      analysisAbortController: null,
    });
  },
  setError: (error) => set({ error }),
  reset: () => set({ 
    gameUrl: '', 
    analysisResult: null, 
    originalAnalysisResult: null, 
    currentMoveIndex: -1, 
    activeVariation: null,
    error: null, 
    progressStatus: null 
  }),
  branchGame: (newMoves, newIndex) => set((state) => ({
    analysisResult: state.analysisResult ? { ...state.analysisResult, moves: newMoves } : null,
    originalAnalysisResult: state.originalAnalysisResult || state.analysisResult,
    currentMoveIndex: newIndex,
    activeVariation: null
  })),
  addVariation: (moveIndex, variation) => set((state) => {
    if (!state.analysisResult) return state;
    const newMoves = [...state.analysisResult.moves];
    const targetIdx = moveIndex >= 0 ? moveIndex : 0;
    const move = newMoves[targetIdx];
    if (move) {
      const existing = move.variations || [];
      const varUci = variation[0]?.move_uci;
      const existingIdx = existing.findIndex(v => v[0]?.move_uci === varUci);
      
      let finalVarIndex = existing.length;
      if (existingIdx !== -1) {
        finalVarIndex = existingIdx;
      } else {
        newMoves[targetIdx] = {
          ...move,
          variations: [...existing, variation]
        };
      }
      return {
        analysisResult: { ...state.analysisResult, moves: newMoves },
        activeVariation: { parentMoveIndex: targetIdx, variationIndex: finalVarIndex, moveIndex: variation.length - 1 }
      };
    }
    return state;
  }),
  appendVariationMove: (parentMoveIndex, variationIndex, move) => set((state) => {
    if (!state.analysisResult) return state;
    const newMoves = [...state.analysisResult.moves];
    const parentMove = newMoves[parentMoveIndex];
    if (parentMove && parentMove.variations && parentMove.variations[variationIndex]) {
      const varList = [...parentMove.variations];
      varList[variationIndex] = [...varList[variationIndex], move];
      newMoves[parentMoveIndex] = {
        ...parentMove,
        variations: varList
      };
      return {
        analysisResult: { ...state.analysisResult, moves: newMoves },
        activeVariation: {
          parentMoveIndex,
          variationIndex,
          moveIndex: varList[variationIndex].length - 1
        }
      };
    }
    return state;
  }),
  deleteVariation: (parentMoveIndex, variationIndex) => set((state) => {
    if (!state.analysisResult) return state;
    const newMoves = [...state.analysisResult.moves];
    const parentMove = newMoves[parentMoveIndex];
    if (parentMove && parentMove.variations) {
      const varList = parentMove.variations.filter((_, idx) => idx !== variationIndex);
      newMoves[parentMoveIndex] = {
        ...parentMove,
        variations: varList
      };
      return {
        analysisResult: { ...state.analysisResult, moves: newMoves },
        activeVariation: null
      };
    }
    return state;
  }),
  restoreMainline: () => set((state) => ({
    analysisResult: state.originalAnalysisResult,
    currentMoveIndex: state.originalAnalysisResult ? state.originalAnalysisResult.moves.length - 1 : -1,
    activeVariation: null
  })),

  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
  setBoardTheme: (theme) => set({ boardTheme: theme }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  setCoachPersona: (persona) => set({ coachPersona: persona })
}));

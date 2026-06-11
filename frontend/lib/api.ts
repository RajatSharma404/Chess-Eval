import { AnalysisResult } from '../store/useGameStore';
import { analyzeGameLocal } from './analyzer';

export function analyzeGame(url: string, onProgress: (status: string) => void): Promise<AnalysisResult> {
  return analyzeGameLocal(url, onProgress);
}


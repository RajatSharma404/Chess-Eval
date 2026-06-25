import { AnalysisResult, AnalysisProgress } from '../store/useGameStore';
import { analyzeGameLocal } from './analyzer';

export function analyzeGame(url: string, onProgress: (status: AnalysisProgress | string) => void): Promise<AnalysisResult> {
  return analyzeGameLocal(url, onProgress);
}

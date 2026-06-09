import { AnalysisResult } from '../store/useGameStore';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function analyzeGame(url: string, onProgress: (status: string) => void): Promise<AnalysisResult> {
  return new Promise((resolve, reject) => {
    const wsUrl = API_URL.replace('http', 'ws') + '/ws/analyze';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      ws.send(JSON.stringify({ game_url: url }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'progress') {
        if (data.status) onProgress(data.status);
      } else if (data.type === 'complete') {
        ws.close();
        resolve(data.analysis);
      } else if (data.type === 'error') {
        ws.close();
        reject(new Error(data.message));
      }
    };

    ws.onerror = (err) => {
      ws.close();
      reject(new Error('WebSocket connection error'));
    };
  });
}

export class StockfishEngine {
  private abortController: AbortController | null = null;
  private currentEventSource: EventSource | null = null;

  constructor() {}

  public analyzePosition(fen: string, depth: number = 15): Promise<any> {
    return new Promise((resolve) => {
      let bestMove: string | null = null;
      let evalCp: number | null = null;
      
      this.abortController = new AbortController();
      
      fetch(`/api/engine?fen=${encodeURIComponent(fen)}&depth=${depth}&mode=single`, {
        signal: this.abortController.signal
      }).then(async (response) => {
        if (!response.body) return resolve({ bestMove, evalCp: 0 });
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const rawLine of lines) {
            if (!rawLine.startsWith('data: ')) continue;
            const line = rawLine.replace('data: ', '').trim();
            
            if (line.startsWith('info depth')) {
              const pvMatch = line.match(/pv\s+([a-h1-8]{4,5})/);
              const cpMatch = line.match(/cp\s+(-?\d+)/);
              const mateMatch = line.match(/mate\s+(-?\d+)/);
              const multipvMatch = line.match(/multipv\s+(\d+)/);

              if (pvMatch) {
                const mv = pvMatch[1];
                let score = 0;
                if (cpMatch) score = parseInt(cpMatch[1], 10);
                else if (mateMatch) score = parseInt(mateMatch[1], 10) * 10000;

                if (!multipvMatch || multipvMatch[1] === '1') {
                  bestMove = mv;
                  evalCp = score;
                }
              }
            } else if (line.startsWith('bestmove')) {
              resolve({ bestMove, evalCp: evalCp || 0 });
              this.abortController?.abort();
              return;
            }
          }
        }
        resolve({ bestMove, evalCp: evalCp || 0 });
      }).catch((e) => {
        resolve({ bestMove, evalCp: 0 });
      });
      
      setTimeout(() => {
        this.abortController?.abort();
        resolve({ bestMove, evalCp: evalCp || 0 });
      }, 10000);
    });
  }

  public startContinuousAnalysis(fen: string, onUpdate: (lines: any[], bestEvalCp: number, depth: number) => void) {
    this.stopAnalysis();
    
    let lines: any[] = [];
    let bestEvalCp = 0;
    let currentDepth = 0;

    const es = new EventSource(`/api/engine?fen=${encodeURIComponent(fen)}&mode=continuous`);
    this.currentEventSource = es;
    
    es.onmessage = (event) => {
      const line = event.data;
      if (!line) return;

      if (line.startsWith('info depth')) {
        const depthMatch = line.match(/depth\s+(\d+)/);
        const multipvMatch = line.match(/multipv\s+(\d+)/);
        const scoreCpMatch = line.match(/cp\s+(-?\d+)/);
        const scoreMateMatch = line.match(/mate\s+(-?\d+)/);
        const pvMatch = line.match(/pv\s+(.+)/);

        if (depthMatch && multipvMatch && pvMatch) {
          const depth = parseInt(depthMatch[1], 10);
          const multipv = parseInt(multipvMatch[1], 10);
          currentDepth = depth;

          let score = 0;
          let isMate = false;
          if (scoreCpMatch) {
            score = parseInt(scoreCpMatch[1], 10);
          } else if (scoreMateMatch) {
            score = parseInt(scoreMateMatch[1], 10);
            isMate = true;
          }

          if (multipv === 1) bestEvalCp = score;

          const pvMoves = pvMatch[1].trim().split(/\s+/);
          
          lines[multipv - 1] = {
            multipv,
            scoreCp: score,
            isMate,
            pv: pvMoves
          };

          if (lines.filter(Boolean).length >= 1) {
            onUpdate([...lines].filter(Boolean), bestEvalCp, currentDepth);
          }
        }
      }
    };
  }

  public stopAnalysis() {
    if (this.currentEventSource) {
      this.currentEventSource.close();
      this.currentEventSource = null;
    }
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public quit() {
    this.stopAnalysis();
  }
}

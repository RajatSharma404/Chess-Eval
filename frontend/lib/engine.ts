export class StockfishEngine {
  private worker: Worker;
  private isReady: boolean = false;
  private messageQueue: string[] = [];

  constructor() {
    this.worker = new Worker('/stockfish.js');
    this.worker.onmessage = this.onMessage.bind(this);
    this.worker.postMessage('uci');
  }

  private onMessage(event: MessageEvent) {
    const line = event.data;
    if (line === 'uciok') {
      this.isReady = true;
      this.messageQueue.forEach((msg) => this.worker.postMessage(msg));
      this.messageQueue = [];
    }
  }

  public analyzePosition(fen: string, depth: number = 15): Promise<any> {
    return new Promise((resolve) => {
      let topMoves: any[] = [];
      let bestMove: string | null = null;
      let evalCp: number | null = null;

      const handler = (event: MessageEvent) => {
        const line = event.data;
        if (line.startsWith('info depth')) {
          // Parse info line
          const pvMatch = line.match(/pv\s+([a-h1-8]{4,5})/);
          const cpMatch = line.match(/cp\s+(-?\d+)/);
          const mateMatch = line.match(/mate\s+(-?\d+)/);
          const multipvMatch = line.match(/multipv\s+(\d+)/);

          if (pvMatch) {
            const mv = pvMatch[1];
            let score = 0;
            if (cpMatch) score = parseInt(cpMatch[1], 10);
            else if (mateMatch) score = parseInt(mateMatch[1], 10) * 10000; // approximation

            if (!multipvMatch || multipvMatch[1] === '1') {
              bestMove = mv;
              evalCp = score;
            }
          }
        } else if (line.startsWith('bestmove')) {
          this.worker.removeEventListener('message', handler);
          resolve({ bestMove, evalCp });
        }
      };
      
      // Safety timeout (e.g. 10 seconds)
      setTimeout(() => {
        this.worker.removeEventListener('message', handler);
        resolve({ bestMove, evalCp: evalCp || 0 });
      }, 10000);

      this.worker.addEventListener('message', handler);
      
      const commands = [
        'setoption name MultiPV value 3',
        `position fen ${fen}`,
        `go depth ${depth}`
      ];

      commands.forEach((cmd) => {
        if (this.isReady) {
          this.worker.postMessage(cmd);
        } else {
          this.messageQueue.push(cmd);
        }
      });
    });
  }

  private currentContinuousHandler: ((event: MessageEvent) => void) | null = null;

  public startContinuousAnalysis(fen: string, onUpdate: (lines: any[], bestEvalCp: number, depth: number) => void) {
    this.stopAnalysis(); // stop any ongoing analysis
    
    let lines: any[] = [];
    let bestEvalCp = 0;
    let currentDepth = 0;

    const handler = (event: MessageEvent) => {
      const line = typeof event.data === 'string' ? event.data.trim() : '';
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

          // Only trigger update if we have collected the lines for this depth
          // or occasionally to keep UI responsive
          if (lines.filter(Boolean).length >= 1) {
            onUpdate([...lines].filter(Boolean), bestEvalCp, currentDepth);
          }
        }
      }
    };

    this.currentContinuousHandler = handler;
    this.worker.addEventListener('message', handler);

    const commands = [
      'stop',
      'setoption name MultiPV value 3',
      `position fen ${fen}`,
      `go infinite`
    ];

    commands.forEach((cmd) => {
      if (this.isReady) {
        this.worker.postMessage(cmd);
      } else {
        this.messageQueue.push(cmd);
      }
    });
  }

  public stopAnalysis() {
    if (this.currentContinuousHandler) {
      this.worker.removeEventListener('message', this.currentContinuousHandler);
      this.currentContinuousHandler = null;
    }
    if (this.isReady) {
      this.worker.postMessage('stop');
    }
  }

  public quit() {
    this.worker.postMessage('quit');
  }
}

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

  public quit() {
    this.worker.postMessage('quit');
  }
}
